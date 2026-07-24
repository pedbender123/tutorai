import { GoogleGenerativeAI } from '@google/generative-ai';
import { getActiveKey } from './providers/registry.js';

// Título automático gerado a partir da primeira mensagem do usuário — modelo
// free-tier barato, best-effort: qualquer falha mantém o título padrão "Conversa com X".
const TITLE_MODEL = 'gemini-3.5-flash-lite';

export async function generateChatTitle(firstMessage: string, locale?: string): Promise<string | null> {
  try {
    const { key } = getActiveKey('google-free');
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: TITLE_MODEL }, { timeout: 15_000 });
    const langHint = locale === 'en' ? 'English' : locale === 'es' ? 'español' : 'português do Brasil';
    const prompt = `Gere um título curto (3 a 6 palavras, sem aspas, sem ponto final) em ${langHint} que resuma o assunto desta mensagem inicial de um chat:\n\n"${firstMessage.slice(0, 500)}"\n\nResponda APENAS com o título, nada mais.`;

    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    const text = result.response.text().trim().replace(/^["“”']|["“”']$/g, '').replace(/\.$/, '');
    if (!text || text.length > 80) return null;
    return text;
  } catch (err: any) {
    console.warn('[ChatTitler] falha ao gerar título automático:', err?.message ?? err);
    return null;
  }
}
