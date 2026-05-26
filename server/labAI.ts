import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildCodeIndex, patchHtmlWithFunctions } from './codeIndexer.js';
import { LabProject } from './labAgent.types.js';

const MODEL = 'gemini-2.5-flash';
const TIMEOUT_MS = 300_000;
// Flash 2.5: $0.15 in / $0.60 out per M tokens → créditos (1M créditos = R$1 a USD 5.5)
const CREDIT_RATE = { input: 825_000, output: 3_300_000 };

const SYSTEM_PROMPT = `You are a code editor for educational HTML simulators.

When the user requests a change, choose naturally:

**Targeted edit** (tweaking physics values, fixing a bug, adjusting behavior, small visual change):
Return ONLY the modified functions, one block each:
\`\`\`javascript:functionName
// modified code
\`\`\`
Briefly explain the change before the code blocks.

**Structural change** (new layout section, new canvas, major redesign, first creation):
Return a complete standalone HTML file:
\`\`\`html
<!DOCTYPE html>...
\`\`\`

Code structure: CONFIG → STATE → PHYSICS/LOGIC → UI → RENDER → CORE loop.
Keep simulations physically accurate, visually clean, and interactive.`;

function getGenAI(): GoogleGenerativeAI {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) throw new Error('GEMINI_API_KEY não configurada no servidor.');
  return new GoogleGenerativeAI(key);
}

function calcCredits(inputTokens: number, outputTokens: number): number {
  return Math.ceil(
    (inputTokens  * CREDIT_RATE.input  / 1_000_000) +
    (outputTokens * CREDIT_RATE.output / 1_000_000)
  );
}

export interface SimAgentResult {
  explanation: string;
  htmlContent: string;
  codeIndex: Record<string, any>;
  editPlan: null;
  editScope: string;
  patchedFunctions: string[];
  tokensUsed: number;
  creditsUsed: number;
}

export async function runSimAgent(params: {
  project: LabProject;
  userMessage: string;
  recentMessages: Array<{ role: string; content: string }>;
  modelToUse?: string; // ignored — always Flash
}): Promise<SimAgentResult> {
  const { project, userMessage, recentMessages } = params;

  const fnNames = Object.keys(project.codeIndex);
  const parts: string[] = [];

  if (project.projectContext) parts.push(`Project context:\n${project.projectContext}`);
  if (fnNames.length > 0) parts.push(`Existing functions: ${fnNames.join(', ')}`);
  if (recentMessages.length > 0) {
    const history = recentMessages
      .slice(-6)
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 250)}`)
      .join('\n');
    parts.push(`Recent conversation:\n${history}`);
  }
  parts.push(`User: ${userMessage}`);

  const userPrompt = parts.join('\n\n');

  const model = getGenAI().getGenerativeModel(
    { model: MODEL, systemInstruction: SYSTEM_PROMPT },
    { timeout: TIMEOUT_MS }
  );

  const result = await model.generateContent(userPrompt);
  const responseText = result.response.text();
  const inputTokens  = result.response.usageMetadata?.promptTokenCount    ?? 0;
  const outputTokens = result.response.usageMetadata?.candidatesTokenCount ?? 0;

  // Parse: surgical function blocks take priority
  const fnBlockRegex = /```javascript:(\w+)\n([\s\S]*?)\n```/g;
  const newFunctions: Record<string, string> = {};
  let match;
  while ((match = fnBlockRegex.exec(responseText)) !== null) {
    newFunctions[match[1]] = match[2];
  }

  let finalHtml = project.htmlContent;
  let editScope = 'full_rewrite';
  let patchedFunctions: string[] = [];

  if (Object.keys(newFunctions).length > 0) {
    finalHtml = patchHtmlWithFunctions(project.htmlContent, project.codeIndex, newFunctions);
    patchedFunctions = Object.keys(newFunctions);
    editScope = 'surgical';
  } else {
    const htmlMatch = responseText.match(/```html\n([\s\S]*?)\n```/);
    if (htmlMatch) finalHtml = htmlMatch[1];
  }

  const explanation = responseText.split('```')[0].trim() || 'Simulação atualizada.';

  return {
    explanation,
    htmlContent: finalHtml,
    codeIndex: buildCodeIndex(finalHtml),
    editPlan: null,
    editScope,
    patchedFunctions,
    tokensUsed: inputTokens + outputTokens,
    creditsUsed: calcCredits(inputTokens, outputTokens),
  };
}
