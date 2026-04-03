import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import db from './db.js';
import { buildSystemPromptV3 } from './promptBuilder.js';

// Clients will be initialized inside the function to ensure env vars are loaded
let genAI: GoogleGenerativeAI | null = null;
let openai: OpenAI | null = null;

// Global state for traffic shaping (5 RPM / 250k TPM for Gemini)
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 12000;
let tokenHistory: { timestamp: number, tokens: number }[] = [];
const TPM_LIMIT = 250000;
const TPM_WINDOW_MS = 60000;

// Flash/Pro 2.5: $0.15/$1.25 in / $0.60/$10.00 out → 825/6875 in / 3300/55000 out créditos/M tokens
const FLASH_RATE = { input: 825, output: 3_300 };
const PRO_RATE  = { input: 6_875, output: 55_000 };
// GPT desabilitado temporariamente
// const GPT_RATE = 1.3;

/** Limites por tier: sem instituição = free, com instituição = base */
export function getUserCreditLimit(userId: string): { creditLimit: number; projectLimit: number } {
  const rows = db.prepare('SELECT institutionId FROM user_institutions WHERE userId = ?').all(userId) as { institutionId: string }[];
  return rows.length > 0
    ? { creditLimit: 1_000_000, projectLimit: 10 }
    : { creditLimit: 100_000,   projectLimit: 5  };
}

/**
 * Internal function to generate response from selected provider
 */
async function _generateChatResponse(
  history: { role: 'user' | 'model'; content: string }[],
  newMessage: string,
  chatId: string,
  userId: string,
  provider: 'google' | 'gpt' = 'google',
  overrideSystemPrompt?: string
) {
  // Initialize Google
  if (!genAI) {
    const key = (process.env.GEMINI_API_KEY || '').trim();
    if (!key) throw new Error('GEMINI_API_KEY não configurada no servidor.');
    genAI = new GoogleGenerativeAI(key);
  }

  // Initialize OpenAI if needed
  if (provider === 'gpt' && !openai) {
    const key = (process.env.OPENAI_API_KEY || '').trim();
    if (!key) throw new Error('OPENAI_API_KEY não configurada no servidor. Por favor, adicione ao seu arquivo .env.');
    openai = new OpenAI({ apiKey: key });
  }

  // 1. Token Limit: 50k per request (approximate)
  const historyText = history.map(m => m.content).join(' ');
  const estimatedInputTokens = Math.ceil((historyText.length + newMessage.length) / 4);
  if (estimatedInputTokens > 50000) {
    throw new Error('Limite de 50k tokens por requisição excedido.');
  }

  // 2. Monthly Credit Limit: 1M credits per user (last 30 days) — soma chat + lab
  const monthlyChat = db.prepare(`
    SELECT SUM(creditsUsed) as total FROM messages
    WHERE userId = ? AND createdAt >= DATETIME('now', '-30 days')
  `).get(userId) as { total: number };
  const monthlyLab = db.prepare(`
    SELECT SUM(creditsUsed) as total FROM lab_messages
    WHERE userId = ? AND createdAt >= DATETIME('now', '-30 days')
  `).get(userId) as { total: number };
  const currentMonthlyTotal = (monthlyChat?.total || 0) + (monthlyLab?.total || 0);
  const { creditLimit } = getUserCreditLimit(userId);
  if (currentMonthlyTotal > creditLimit) {
    const limitLabel = creditLimit >= 1_000_000 ? '1M' : '100k';
    throw new Error(`Limite mensal de ${limitLabel} créditos atingido.`);
  }

  // Build system prompt — usa override se fornecido, senão busca persona do chat
  let systemInstruction: string;
  if (overrideSystemPrompt) {
    systemInstruction = overrideSystemPrompt;
  } else {
    // 0. Fetch Chat, Persona and Disciplina data
    const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId) as any;
    if (!chat) throw new Error('Chat não encontrado.');

    const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(chat.personaDbId) as any;
    if (!persona) throw new Error('Persona não encontrada.');

    let disciplina = null;
    if (chat.disciplinaId) {
      disciplina = db.prepare('SELECT * FROM disciplinas WHERE id = ?').get(chat.disciplinaId) as any;
    }

    systemInstruction = buildSystemPromptV3(
      persona.nome,
      persona.documentoPedagogico,
      persona.isGenerico === 1,
      disciplina ? { nome: disciplina.nome, conteudo: disciplina.conteudo } : undefined
    );
  }

  try {
    let text = '';
    let tokensUsed = 0;
    let inputTokFinal = 0;
    let outputTokFinal = 0;

    if (provider === 'google') {
      // Traffic Shaping for Gemini
      const cleanTokenHistory = () => {
        const now = Date.now();
        tokenHistory = tokenHistory.filter(h => now - h.timestamp < TPM_WINDOW_MS);
      };
      const getTPMUsage = () => {
        cleanTokenHistory();
        return tokenHistory.reduce((sum, h) => sum + h.tokens, 0);
      };

      let tpmUsage = getTPMUsage();
      while (tpmUsage + estimatedInputTokens > TPM_LIMIT) {
        const oldest = tokenHistory[0];
        const waitTime = TPM_WINDOW_MS - (Date.now() - oldest.timestamp) + 100;
        console.log(`[AI] TPM Limit reached. Waiting ${Math.ceil(waitTime/1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        tpmUsage = getTPMUsage();
      }

      const timeSinceLast = Date.now() - lastRequestTime;
      if (timeSinceLast < MIN_INTERVAL_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL_MS - timeSinceLast));
      }
      lastRequestTime = Date.now();

      const model = genAI.getGenerativeModel(
        { model: 'gemini-2.5-flash', systemInstruction },
        { timeout: 60_000 } // 60s for standard chat
      );
      const contents = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      contents.push({ role: 'user', parts: [{ text: newMessage }] });

      const result = await model.generateContent({ contents });
      const response = await result.response;
      text = response.text();
      inputTokFinal  = response.usageMetadata?.promptTokenCount    ?? Math.ceil((historyText.length + newMessage.length) / 4);
      outputTokFinal = response.usageMetadata?.candidatesTokenCount ?? Math.ceil(text.length / 4);
      tokensUsed = inputTokFinal + outputTokFinal;
      tokenHistory.push({ timestamp: Date.now(), tokens: tokensUsed });

    } else {
      // OpenAI GPT-4o-mini
      const messages: any[] = [{ role: 'system', content: systemInstruction }];
      history.forEach(m => messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
      messages.push({ role: 'user', content: newMessage });

      const completion = await openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
      });

      text = completion.choices[0].message.content || '';
      tokensUsed = completion.usage?.total_tokens || Math.ceil((newMessage.length + text.length) / 4);
    }

    // Para GPT, estimar split 40/60 input/output pois não temos separado
    if (provider !== 'google') {
      inputTokFinal  = Math.ceil(tokensUsed * 0.4);
      outputTokFinal = Math.ceil(tokensUsed * 0.6);
    }
    const isPro = provider === 'gpt'; // No momento apenas GPT é tarifado fixo ou Pro
    const creditsUsed = provider === 'google'
      ? Math.ceil((inputTokFinal * FLASH_RATE.input + outputTokFinal * FLASH_RATE.output) / 1_000_000)
      : Math.ceil(tokensUsed * 1.3); // GPT-4o-mini fallback
    console.log(`[AI] Request completed. Chat: ${chatId}, Provider: ${provider}, Credits: ${creditsUsed}`);

    return { text, tokensUsed, creditsUsed };

  } catch (error: any) {
    console.error('AI Error:', error);
    if (error.status === 429) throw new Error('Limite de cota atingido. Tente em alguns segundos.');
    throw error;
  }
}

let geminiQueue: Promise<any> = Promise.resolve();

export async function generateChatResponse(
  history: { role: 'user' | 'model'; content: string }[],
  newMessage: string,
  chatId: string,
  userId: string,
  provider: 'google' | 'gpt' = 'google',
  overrideSystemPrompt?: string
) {
  const result = await (geminiQueue = geminiQueue
    .catch(() => {})
    .then(() => _generateChatResponse(history, newMessage, chatId, userId, provider, overrideSystemPrompt)));
  return result;
}
