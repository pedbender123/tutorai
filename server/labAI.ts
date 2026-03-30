import { generateChatResponse } from './ai.js';
import db from './db.js';

const LAB_SYSTEM_PROMPT = `Você é um especialista em criar simulações educacionais interativas em HTML/CSS/JavaScript puro.

REGRAS ABSOLUTAS:
- Gere SEMPRE um arquivo HTML completo e autocontido. Zero dependências externas. Zero CDN. Zero bibliotecas.
- Use apenas HTML, CSS e JavaScript vanilla.
- Toda resposta que cria ou modifica a simulação DEVE terminar com exatamente um bloco de código assim:
  \`\`\`html
  <!DOCTYPE html>
  ...
  \`\`\`
- O HTML deve ser completo e funcionar como arquivo standalone.
- Ao receber feedback ou pedido de modificação, edite o HTML existente — não recomece do zero.
- Descreva em linguagem natural e simples o que foi feito ANTES do bloco HTML. Nunca exiba o código ao aluno como tema principal da resposta.
- Foco pedagógico: a simulação deve ensinar conceitos de forma interativa e visual.
- Interface limpa, moderna, responsiva. Use cores, animações suaves e controles intuitivos.
- Quando o aluno não especificar detalhes, tome decisões criativas que maximizem o valor pedagógico.

FORMATO DE RESPOSTA OBRIGATÓRIO:
1. Texto explicando o que foi criado/modificado (linguagem natural, entusiasmada)
2. Bloco \`\`\`html ... \`\`\` com o HTML completo`;

/**
 * Extrai o bloco HTML da resposta da IA e retorna texto limpo + HTML separados.
 */
function extractHtml(rawResponse: string): { text: string; html: string | null } {
  const htmlMatch = rawResponse.match(/```html\s*([\s\S]*?)```/i);
  if (!htmlMatch) {
    return { text: rawResponse, html: null };
  }
  const html = htmlMatch[1].trim();
  const text = rawResponse.replace(/```html\s*[\s\S]*?```/i, '').trim();
  return { text, html };
}

export async function generateLabResponse(
  projectId: string,
  userId: string,
  userMessage: string
): Promise<{ text: string; htmlContent: string | null; tokensUsed: number; creditsUsed: number }> {
  // Busca histórico de mensagens do projeto
  const rawHistory = db.prepare(
    `SELECT role, content FROM lab_messages WHERE projectId = ? ORDER BY createdAt ASC`
  ).all(projectId) as { role: string; content: string }[];

  const history = rawHistory.map(m => ({
    role: m.role === 'user' ? 'user' : 'model' as 'user' | 'model',
    content: m.content
  }));

  // Busca HTML atual para incluir no contexto se existir
  const project = db.prepare(`SELECT htmlContent FROM lab_projects WHERE id = ?`).get(projectId) as { htmlContent: string } | undefined;
  const currentHtml = project?.htmlContent || '';

  // Se já tem HTML, injeta como contexto inicial para o modelo não perder o código
  let effectiveMessage = userMessage;
  if (currentHtml && history.length > 0) {
    effectiveMessage = `${userMessage}\n\n[Código HTML atual do projeto para referência:\n\`\`\`html\n${currentHtml}\n\`\`\`]`;
  }

  const result = await generateChatResponse(
    history,
    effectiveMessage,
    // Passa um chatId fictício — o labAI não usa chatId para buscar persona (não tem)
    // Precisamos de uma abordagem diferente: usar overrideSystemPrompt
    projectId,
    userId,
    'google',
    LAB_SYSTEM_PROMPT
  );

  const { text, html } = extractHtml(result.text);
  return { text, htmlContent: html, tokensUsed: result.tokensUsed, creditsUsed: result.creditsUsed };
}
