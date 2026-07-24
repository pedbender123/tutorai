import { LabProject } from './labAgent.types.js';
import { getProvider, getProviderById, getDefaultModel, calcCredits, getThinkingConfig } from './providers/registry.js';
import { getModelQueue, retryWithFallback, isRPDExhausted, incrementRPD, wouldExceedTPM, recordTPM } from './limiter.js';
import { logQuotaEvent } from './quota.js';

interface ChainStep {
  modelId: string;     // real API model id sent to Google
  free?: boolean;       // true = try the free-tier key/quota for this step
  limitKey?: string;    // RPD/RPM/TPM tracking key (defaults to modelId) — kept distinct
                        // from modelId so a paid attempt of the same model isn't wrongly
                        // rate-limited by the free bucket's counters.
}

// Lab writer chain: Gemini 3.5 Flash-Lite is primary (won a blind quality eval against
// 2.5 Flash among real professors/colleagues, at ~half the cost on typical tasks).
// Free-tier quota for it (per AI Studio: 15 RPM / 500 RPD / 250k TPM) is tried first to
// save money, falling back to the paid key for the same model, then to 2.5 Flash as a
// final paid safety net on 429/503/timeout.
const LAB_CHAIN: ChainStep[] = [
  { modelId: 'gemini-3.5-flash-lite', free: true, limitKey: 'gemini-3.5-flash-lite:free' },
  { modelId: 'gemini-3.5-flash-lite' },
];
const PAID_FALLBACK = 'gemini-2.5-flash';

const LOCALE_UI_TEXT_LABELS: Record<string, string> = {
  pt: 'português do Brasil',
  en: 'English',
  es: 'español',
};

function buildLabWriterSystemPrompt(locale?: string): string {
  const label = LOCALE_UI_TEXT_LABELS[locale ?? 'pt'] ?? LOCALE_UI_TEXT_LABELS.pt;
  return `Você é a IA Escritora de Simuladores Científicos do Scaffl.
Sua missão é gerar um código HTML5 autocontido (incluindo HTML, Tailwind CSS para estilos e JavaScript para física/lógica no Canvas) com base nas ideias dos estudantes.

DIRETRIZES DE DESIGN E QUALIDADE (MANDATÓRIAS):
1. Visual Moderno e Premium: Use um tema escuro (background: #0b0f19), com cores vibrantes em gradientes de neon (azul ciano, esmeralda, violeta, rosa quente, âmbar).
2. Canvas Dinâmico: Desenhe elementos de física ou química usando HTML5 Canvas. A animação deve ser a 60 FPS com requestAnimationFrame.
3. Interatividade e Controles: Forneça controles claros em Tailwind (como sliders deslizantes, botões de ação e cards translúcidos de glassmorphism). O estado da simulação deve mudar instantaneamente conforme o usuário mexe nos controles.
4. Partículas e Efeitos Visuais: Adicione efeitos como rastro nas partículas (motion trail) com opacidade gradual, brilhos nas colisões e vetores simples de força se aplicável.
5. Código Seguro e Autocontido: Responda APENAS com o código HTML completo e válido dentro de um bloco de código markdown. Não inclua conversas ou textos explicativos fora do código.
6. Idioma da interface do simulador: todo texto visível pro aluno (rótulos, botões, títulos) dentro do HTML gerado deve estar em ${label}. As instruções acima (em português) são só pra você, não mude a linguagem do seu raciocínio, só do texto que aparece na tela.`;
}

export interface SimAgentResult {
  explanation: string;
  htmlContent: string;
  projectContext: string;
  codeIndex: Record<string, any>;
  editPlan: null;
  editScope: string;
  patchedFunctions: string[];
  tokensUsed: number;
  tokensIn: number;
  tokensOut: number;
  creditsUsed: number;
  modelUsed: string;
  usedFree: boolean;
}

async function _callModel(params: {
  project: LabProject;
  userMessage: string;
  recentMessages: Array<{ role: string; content: string }>;
  step: ChainStep;
  userImageUrl?: string;
  locale?: string;
}): Promise<SimAgentResult> {
  const { project, userMessage, recentMessages, step, userImageUrl, locale } = params;
  const { modelId, free } = step;
  const limitKey = step.limitKey ?? modelId;

  const currentHtml = project.htmlContent || '';
  const historyParts: string[] = [];
  if (recentMessages?.length > 0) {
    for (const m of recentMessages.slice(-4)) {
      historyParts.push(`${m.role === 'user' ? 'Usuário' : 'IA'}: ${m.content.slice(0, 500)}`);
    }
  }

  let userPrompt = '';
  if (currentHtml) {
    userPrompt += `Código HTML atual do simulador:\n\`\`\`html\n${currentHtml}\n\`\`\`\n\n`;
  }
  if (historyParts.length > 0) {
    userPrompt += `Histórico recente do Lab:\n${historyParts.join('\n')}\n\n`;
  }
  userPrompt += `Modificação solicitada pelo aluno: "${userMessage}"`;

  let imageBase64: string | undefined;
  if (userImageUrl) {
    imageBase64 = userImageUrl.includes('base64,')
      ? userImageUrl.split('base64,')[1]
      : userImageUrl;
  }

  console.log(`[Lab Agent] Calling ${modelId}${free ? ' (free key)' : ''}...`);

  const queue = getModelQueue(limitKey);
  const provider = free ? getProviderById('google-free') : getProvider(modelId);
  const chatResult = await queue.enqueue(() =>
    provider.chat({
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt: buildLabWriterSystemPrompt(locale),
      modelId,
      imageBase64,
      imageMimeType: 'image/jpeg',
      thinkingConfig: getThinkingConfig(modelId),
    })
  );

  if (free) recordTPM(limitKey, chatResult.inputTokens + chatResult.outputTokens);

  const rawText = chatResult.text;
  let cleanedHtml = rawText;
  const htmlMatch = rawText.match(/```html([\s\S]*?)```/);
  if (htmlMatch) {
    cleanedHtml = htmlMatch[1].trim();
  } else if (rawText.includes('<html')) {
    cleanedHtml = rawText.trim();
  }

  // Free-key calls cost nothing for real — don't price them at the paid rate.
  const creditsUsed = free ? 0 : calcCredits(modelId, chatResult.inputTokens, chatResult.cachedTokens, chatResult.outputTokens);
  const tokensIn = chatResult.inputTokens;
  const tokensOut = chatResult.outputTokens;

  console.log(
    `[Lab Agent] Done. Model: ${modelId}${free ? ' (free)' : ''}, in=${tokensIn}, cached=${chatResult.cachedTokens}, out=${tokensOut}, credits=${creditsUsed}`
  );

  return {
    explanation: 'Simulador atualizado com sucesso.',
    htmlContent: cleanedHtml,
    projectContext: '[]',
    codeIndex: {},
    editPlan: null,
    editScope: 'surgical',
    patchedFunctions: [],
    tokensUsed: tokensIn + tokensOut,
    tokensIn,
    tokensOut,
    creditsUsed,
    modelUsed: modelId,
    usedFree: !!free,
  };
}

export async function runSimAgent(params: {
  project: LabProject;
  userMessage: string;
  recentMessages: Array<{ role: string; content: string }>;
  modelToUse?: string;
  userImageUrl?: string;
  userId?: string;
  locale?: string;
}): Promise<SimAgentResult> {
  const { userId } = params;

  // Build effective chain: requested override → full LAB_CHAIN with RPD/TPM pre-filter
  const requestedModel = params.modelToUse;

  let chain: ChainStep[];
  if (requestedModel) {
    // Explicit override: try requested → Flash (both paid, no free-key attempt)
    chain = requestedModel === PAID_FALLBACK
      ? [{ modelId: PAID_FALLBACK }]
      : [{ modelId: requestedModel }, { modelId: PAID_FALLBACK }];
  } else {
    // Standard chain: skip free-key steps whose RPD/TPM is exhausted for now
    chain = [];
    const roughInputTokens = Math.ceil(((params.project.htmlContent?.length ?? 0) + params.userMessage.length) / 4);
    for (const step of LAB_CHAIN) {
      const limitKey = step.limitKey ?? step.modelId;
      if (step.free && (isRPDExhausted(limitKey) || wouldExceedTPM(limitKey, roughInputTokens))) {
        console.log(`[Lab Agent] ${limitKey} RPD/TPM exhausted for now, skipping`);
        logQuotaEvent({ userId, surface: 'lab', event: 'rpd_skip', model: step.modelId });
      } else {
        chain.push(step);
      }
    }
    chain.push({ modelId: PAID_FALLBACK });
  }

  const startedWithFree = chain[0]?.free === true;
  const factories = chain.map((step) => () => _callModel({ ...params, step }));

  const result = await retryWithFallback(factories, (fromIndex, err) => {
    const fromStep = chain[fromIndex];
    const toStep = chain[fromIndex + 1];
    console.warn(`[Lab Agent] ${fromStep.modelId}${fromStep.free ? ' (free)' : ''} failed (${(err as any)?.status ?? (err as any)?.message}), falling back to ${toStep?.modelId}`);
    logQuotaEvent({ userId, surface: 'lab', event: '429', model: fromStep.modelId });
  });

  // Increment RPD for the free bucket only when it actually served the request
  if (result.usedFree) incrementRPD('gemini-3.5-flash-lite:free');

  // Full instrumentation: model served, tokens, spill flag
  logQuotaEvent({
    userId,
    surface: 'lab',
    event: 'request',
    model: result.modelUsed,
    tokensIn:  result.tokensIn,
    tokensOut: result.tokensOut,
    credits:   result.creditsUsed,
    wasSpill:  startedWithFree && !result.usedFree,
  });

  return result;
}
