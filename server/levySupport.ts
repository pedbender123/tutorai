import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
import db from './db.js';
import { buildSupportPrompt } from './promptBuilder.js';
import { getActiveKey, calcCredits, getThinkingConfig } from './providers/registry.js';
import { getUserCreditLimit } from './ai.js';
import { config } from './config.js';
import { checkLevyQuota, recordLevyCredits, logQuotaEvent, getQuotaSummary } from './quota.js';
import { checkEmailVerified } from './emailVerification.js';
import { getModelQueue, retryWithFallback, isRPDExhausted, incrementRPD, wouldExceedTPM, recordTPM } from './limiter.js';

// Cheaper than the previous gemini-2.5-flash default: ~2x less per message on real
// tool-use tests, correct/coherent responses, no reliability issues (unlike 2.5-flash-lite,
// which returned empty responses after a function call in testing).
const LEVY_MODEL = 'gemini-3.1-flash-lite';
const LEVY_FREE_LIMIT_KEY = 'gemini-3.1-flash-lite:free';

export interface SupportMessage {
  role: 'user' | 'model';
  content: string;
}

// Sem PII — texto fixo, seguro pra persistir/exibir sem qualquer substituição de tag.
export const LEVY_GREETING = 'Oi! Sou o Levy, o guia pedagógico da Scaffl. Mais do que responder, eu te ajudo a pensar — me conte onde você travou.';

interface UserSupportContext {
  hasInstitution: boolean;
  labProjects: Array<{ id: string; title: string; updatedAt: string }>;
  locale?: string;
}

// Nunca busca o nome real do usuário ou da instituição aqui — o prompt (ver
// PII_TAGS em promptBuilder.ts) só recebe booleanos, nunca os valores.
function getUserSupportContext(userId: string): UserSupportContext {
  const user = db.prepare('SELECT locale FROM users WHERE id = ?').get(userId) as { locale?: string } | undefined;

  const hasInstitution = !!db.prepare(
    'SELECT 1 FROM user_institutions WHERE userId = ? LIMIT 1'
  ).get(userId);

  const projects = db.prepare(
    'SELECT id, title, updatedAt FROM lab_projects WHERE userId = ? ORDER BY updatedAt DESC LIMIT 15'
  ).all(userId) as Array<{ id: string; title: string; updatedAt: string }>;

  return {
    hasInstitution,
    labProjects: projects,
    locale: user?.locale,
  };
}

const READ_TOOL_DECLS = [
  {
    name: 'listar_projetos_lab',
    description: 'Lista os projetos do Lab do usuário com título, id e data de atualização. Use para responder perguntas sobre os simuladores do usuário.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'listar_atividades',
    description: 'Lista as atividades/tarefas com título, descrição e prazo de entrega da sala do usuário.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'consultar_cotas',
    description: 'Retorna o consumo atual e os limites de cota do usuário: requisições do Lab (hoje e na semana) e créditos do Levy (esta semana). Use sempre que o usuário perguntar sobre saldo, cotas, limites, quantas mensagens restam ou quando sua cota renova.',
    parameters: { type: 'OBJECT', properties: {} },
  },
];

const WRITE_TOOL_DECLS = [
  ...READ_TOOL_DECLS,
  {
    name: 'criar_projeto_lab',
    description: 'Cria um novo projeto no Lab do usuário. Use quando o usuário pedir explicitamente para criar um simulador ou projeto. Retorna o id e a URL do projeto criado.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Título do projeto a ser criado.' },
      },
      required: ['title'],
    },
  },
];

function executeToolCall(name: string, args: any, userId: string): any {
  if (name === 'listar_projetos_lab') {
    return db.prepare(
      'SELECT id, title, updatedAt FROM lab_projects WHERE userId = ? ORDER BY updatedAt DESC LIMIT 20'
    ).all(userId);
  }

  if (name === 'listar_atividades') {
    const classrooms = db.prepare(
      'SELECT classroomId FROM user_classrooms WHERE userId = ?'
    ).all(userId) as { classroomId: string }[];
    if (classrooms.length === 0) return [];
    const ph = classrooms.map(() => '?').join(', ');
    return db.prepare(`
      SELECT a.id, a.title, a.description, a.dueDate
      FROM activities a
      JOIN activity_classrooms ac ON a.id = ac.activityId
      WHERE ac.classroomId IN (${ph})
      ORDER BY a.dueDate ASC
    `).all(...classrooms.map(c => c.classroomId));
  }

  if (name === 'consultar_cotas') {
    const summary = getQuotaSummary(userId);
    // Single shared credit pool for Lab + Levy + chat normal.
    return {
      tier: summary.tier,
      creditos: {
        semana: { usado: summary.credits.week,  limite: summary.credits.weeklyLimit,  restante: summary.credits.weeklyLimit  - summary.credits.week },
        mes:    { usado: summary.credits.month, limite: summary.credits.monthlyLimit, restante: summary.credits.monthlyLimit - summary.credits.month },
        renovacao: { semanal: 'segunda-feira UTC', mensal: 'dia 1 do mês (UTC)' },
      },
    };
  }

  if (name === 'criar_projeto_lab') {
    const title = ((args?.title as string) || 'Novo Projeto').slice(0, 120);

    // Respect project limit
    const { projectLimit } = getUserCreditLimit(userId);
    const { cnt } = db.prepare(
      'SELECT COUNT(*) as cnt FROM lab_projects WHERE userId = ?'
    ).get(userId) as { cnt: number };
    if (cnt >= projectLimit) {
      return { error: `Limite de ${projectLimit} projetos atingido para este plano.` };
    }

    const instRow = db.prepare(
      'SELECT institutionId FROM user_institutions WHERE userId = ? LIMIT 1'
    ).get(userId) as { institutionId: string } | undefined;
    const institutionId = instRow?.institutionId ?? null;
    const isPublic = institutionId ? 1 : 0;

    const id = crypto.randomUUID();
    db.prepare(
      'INSERT INTO lab_projects (id, userId, institutionId, title, isPublic) VALUES (?, ?, ?, ?, ?)'
    ).run(id, userId, institutionId, title, isPublic);

    return { id, title, url: `/lab/${id}` };
  }

  return { error: 'Ferramenta desconhecida.' };
}

export async function generateSupportResponse(
  userId: string,
  history: SupportMessage[],
  newMessage: string,
  agenticMode: boolean,
): Promise<{ text: string; creditsUsed: number; quotaCredits: number }> {
  if (config.isCloud) {
    const verifyCheck = checkEmailVerified(userId);
    if (!verifyCheck.allowed) throw new Error(verifyCheck.reason);

    const quotaCheck = checkLevyQuota(userId);
    if (!quotaCheck.allowed) throw new Error(quotaCheck.reason ?? 'Limite de créditos atingido.');
  }

  const ctx = getUserSupportContext(userId);
  const systemInstruction = buildSupportPrompt({
    hasInstitution: ctx.hasInstitution,
    labProjects: ctx.labProjects,
    labProjectCount: ctx.labProjects.length,
    locale: ctx.locale,
    agenticMode,
  });

  const baseContents: any[] = history.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));
  baseContents.push({ role: 'user', parts: [{ text: newMessage }] });

  async function attempt(free: boolean): Promise<{ text: string; creditsUsed: number; quotaCredits: number; tokensIn: number; tokensOut: number; usedFree: boolean }> {
    const keyProvider = free ? 'google-free' : 'google';
    const { key: googleKey } = getActiveKey(keyProvider);
    const genAI = new GoogleGenerativeAI(googleKey);
    const model = genAI.getGenerativeModel(
      {
        model: LEVY_MODEL,
        systemInstruction,
        tools: [{ functionDeclarations: agenticMode ? WRITE_TOOL_DECLS : READ_TOOL_DECLS }],
        generationConfig: { thinkingConfig: getThinkingConfig(LEVY_MODEL) } as any,
      },
      { timeout: 60_000 },
    );

    const contents = baseContents.map(c => ({ ...c, parts: [...c.parts] }));

    const queue = getModelQueue(free ? LEVY_FREE_LIMIT_KEY : LEVY_MODEL);
    let result = await queue.enqueue(() => model.generateContent({ contents }));
    let response = await result.response;
    let functionCalls = response.functionCalls();
    let limitCount = 0;

    while (functionCalls && functionCalls.length > 0 && limitCount < 5) {
      limitCount++;
      const toolParts = functionCalls.map(({ name, args }) => ({
        functionResponse: {
          name,
          response: { result: executeToolCall(name, args, userId) },
        },
      }));

      contents.push({ role: 'model', parts: response.candidates?.[0]?.content?.parts || [] });
      contents.push({ role: 'user', parts: toolParts });

      result = await model.generateContent({ contents });
      response = await result.response;
      functionCalls = response.functionCalls();
    }

    const text = response.text();
    const inputTok = response.usageMetadata?.promptTokenCount ?? Math.ceil(newMessage.length / 4);
    // Thought tokens are billed as output too — must be included or credits undercount real spend.
    const candidatesTok = response.usageMetadata?.candidatesTokenCount ?? Math.ceil(text.length / 4);
    const thoughtsTok = (response.usageMetadata as any)?.thoughtsTokenCount ?? 0;
    const outputTok = candidatesTok + thoughtsTok;
    const cachedTok = (response.usageMetadata as any)?.cachedContentTokenCount ?? 0;
    // quotaCredits = valor equivalente na tarifa paga — consome a cota pessoal do
    // usuário mesmo em chamadas gratuitas (senão a cota nunca seria atingida via chave
    // free). creditsUsed é o custo real em R$ (0 quando free), mostrado por mensagem.
    const quotaCredits = calcCredits(LEVY_MODEL, inputTok, cachedTok, outputTok);
    const creditsUsed = free ? 0 : quotaCredits;

    if (free) recordTPM(LEVY_FREE_LIMIT_KEY, inputTok + outputTok);

    return { text, creditsUsed, quotaCredits, tokensIn: inputTok, tokensOut: outputTok, usedFree: free };
  }

  // Try the free-tier key first (15 RPM / 500 RPD / 250k TPM per AI Studio), unless
  // it's already exhausted for now, falling back to the paid key on 429/503/timeout.
  const roughInputTokens = Math.ceil((newMessage.length + history.reduce((n, m) => n + m.content.length, 0)) / 4);
  const canTryFree = !isRPDExhausted(LEVY_FREE_LIMIT_KEY) && !wouldExceedTPM(LEVY_FREE_LIMIT_KEY, roughInputTokens);

  const factories = canTryFree ? [() => attempt(true), () => attempt(false)] : [() => attempt(false)];
  const outcome = await retryWithFallback(factories, (fromIndex, err) => {
    console.warn(`[Levy] free-key attempt failed (${(err as any)?.status ?? (err as any)?.message}), falling back to paid key`);
  });

  if (outcome.usedFree) incrementRPD(LEVY_FREE_LIMIT_KEY);

  if (config.isCloud) {
    // Cota pessoal consome o valor equivalente (quotaCredits), não o custo real em R$.
    recordLevyCredits(userId, outcome.quotaCredits);
    logQuotaEvent({ userId, surface: 'levy', event: 'request', model: LEVY_MODEL, tokensIn: outcome.tokensIn, tokensOut: outcome.tokensOut, credits: outcome.creditsUsed, usedFree: outcome.usedFree });
  }

  return { text: outcome.text, creditsUsed: outcome.creditsUsed, quotaCredits: outcome.quotaCredits };
}
