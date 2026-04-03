import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildCodeIndex, patchHtmlWithFunctions } from './codeIndexer.js';
import { runFlashAnalyst } from './labFlashAnalyst.js';
import { determineTurnType } from './labTurnRouter.js';
import { LabProject, EditPlan } from './labAgent.types.js';
import {
  LAB_CREATION_SYSTEM_PROMPT,
  LAB_SURGICAL_SYSTEM_PROMPT,
  buildFullRewriteUserMessage,
} from './labPrompts.js';

// 5 minutos — necessário para gerações complexas
const REQUEST_TIMEOUT_MS = 300_000;

// Preços USD/M tokens → R$ (USD * 5.5) → créditos (1M créditos = R$1)
// Flash: $0.15 in / $0.60 out per M tokens
// Pro:   $1.25 in / $10.00 out per M tokens
const CREDIT_RATES: Record<string, { input: number; output: number }> = {
  'gemini-2.5-flash': { input: 825_000,   output: 3_300_000  }, // 1M créditos = R$1
  'gemini-2.5-pro':   { input: 6_875_000, output: 55_000_000 },
};

function calcCredits(model: string, inputTokens: number, outputTokens: number): number {
  const rates = CREDIT_RATES[model] ?? CREDIT_RATES['gemini-2.5-flash'];
  return Math.ceil(
    (inputTokens  * rates.input  / 1_000_000) +
    (outputTokens * rates.output / 1_000_000)
  );
}

function getGenAI(): GoogleGenerativeAI {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) throw new Error('GEMINI_API_KEY não configurada no servidor.');
  return new GoogleGenerativeAI(key);
}

export interface SimAgentResult {
  explanation: string;
  htmlContent: string;
  codeIndex: Record<string, any>;
  editPlan: EditPlan | null;
  editScope: string;
  patchedFunctions: string[];
  tokensUsed: number;
  creditsUsed: number;
}

export async function runSimAgent(params: {
  project: LabProject;
  userMessage: string;
  recentMessages: Array<{ role: string; content: string }>;
  modelToUse?: string;
}): Promise<SimAgentResult> {
  const { project, userMessage, recentMessages, modelToUse: requestedModel } = params;
  const turnType = determineTurnType(project);
  const reqOpts = { timeout: REQUEST_TIMEOUT_MS };

  // ───────────────────────────────────────────
  // STAGE 1: Analyst (Flash)
  // ───────────────────────────────────────────
  const { plan: editPlan, inputTokens: flashIn, outputTokens: flashOut } =
    await runFlashAnalyst({
      genAI: getGenAI(),
      projectContext: project.projectContext,
      codeIndex: project.codeIndex,
      recentMessages,
      userMessage,
      timeout: REQUEST_TIMEOUT_MS,
    });

  let totalCredits = calcCredits('gemini-2.5-flash', flashIn, flashOut);
  let totalTokens = flashIn + flashOut;

  // ───────────────────────────────────────────
  // STAGE 2: Coder (Requested Model or Auto)
  // ───────────────────────────────────────────
  const modelToUse = requestedModel || (turnType === 'creation' ? 'gemini-2.5-pro' : 'gemini-2.5-flash');
  const model = getGenAI().getGenerativeModel(
    { 
      model: modelToUse, 
      systemInstruction: editPlan.editScope === 'surgical' ? LAB_SURGICAL_SYSTEM_PROMPT : LAB_CREATION_SYSTEM_PROMPT 
    },
    reqOpts
  );

  let coderPrompt = '';
  if (editPlan.editScope === 'surgical') {
    const chunksText = Object.entries(editPlan.extractedCode)
      .map(([name, code]) => `### Função atual: ${name}\n\`\`\`javascript\n${code}\n\`\`\``)
      .join('\n\n');

    coderPrompt = `## Intenção do usuário\n${editPlan.userIntent}\n\n## Funções a modificar\n${chunksText}\n\n## Instruções\n${editPlan.editInstructions}\n\nRetorne os blocos \`\`\`javascript:nomeDaFuncao modificados.`;
  } else {
    coderPrompt = buildFullRewriteUserMessage(editPlan, project.projectContext);
  }

  const result = await model.generateContent(coderPrompt);
  const responseText = result.response.text();
  
  const coderIn  = result.response.usageMetadata?.promptTokenCount    ?? 0;
  const coderOut = result.response.usageMetadata?.candidatesTokenCount ?? 0;
  
  totalTokens += coderIn + coderOut;
  totalCredits += calcCredits(modelToUse, coderIn, coderOut);

  // ───────────────────────────────────────────
  // STAGE 3: Post-Processing & Sanity Check
  // ───────────────────────────────────────────
  let finalHtml = project.htmlContent;
  let finalExplanation = '';
  let patchedFunctions: string[] = [];

  if (editPlan.editScope === 'surgical') {
    const fnBlockRegex = /```javascript:(\w+)\n([\s\S]*?)\n```/g;
    const newFunctions: { [name: string]: string } = {};
    let match;
    while ((match = fnBlockRegex.exec(responseText)) !== null) {
      newFunctions[match[1]] = match[2];
    }
    finalHtml = patchHtmlWithFunctions(project.htmlContent, project.codeIndex, newFunctions);
    patchedFunctions = Object.keys(newFunctions);
    finalExplanation = responseText.split('```')[0].trim() || `Modificadas: ${patchedFunctions.join(', ')}.`;
  } else {
    const htmlMatch = responseText.match(/```html\n([\s\S]*?)\n```/);
    finalHtml = htmlMatch ? htmlMatch[1] : project.htmlContent;
    finalExplanation = responseText.split('```')[0].trim();
  }

  // Remove excess reasoning text to save tokens in DB
  finalExplanation = finalExplanation
    .replace(/RACIOCÍNIO:[\s\S]*?VISUAL & UX:[\s\S]*?CÓDIGO:/, '')
    .replace(/\*\*RACIOCÍNIO ESTRUTURADO\*\*[\s\S]*?\*\*AUTO-REVISÃO\*\*[\s\S]*?/, '')
    .trim();

  return {
    explanation: finalExplanation || 'Simulação atualizada.',
    htmlContent: finalHtml,
    codeIndex: buildCodeIndex(finalHtml),
    editPlan,
    editScope: editPlan.editScope,
    patchedFunctions,
    tokensUsed: totalTokens,
    creditsUsed: totalCredits,
  };
}
