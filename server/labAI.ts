import { GoogleGenerativeAI } from '@google/generative-ai';
import { LabProject } from './labAgent.types.js';
import { compileBlocksToHtml, Block } from './labBlockCompiler.js';

const MODEL = 'gemini-2.5-flash';
const TIMEOUT_MS = 300_000;

// Flash 2.5: $0.30/M normal in, $0.03/M cached in, $2.50/M out (Dólar a R$ 5,50, 1M créditos = R$ 1,00)
const CREDIT_RATE = { input: 1_650_000, input_cached: 165_000, output: 13_750_000 };

const SYSTEM_PROMPT = `Você é o Mini-Agente de Código do laboratório de simulações físicas do SCAFFL.
Agora, os simuladores são construídos de forma modular, baseados em BLOCOS representados por um JSON.

Sua missão é criar ou modificar a estrutura de blocos do simulador chamando as ferramentas (tools) adequadas para gerenciar a lista de blocos do laboratório.

BLOCOS DISPONÍVEIS E SEUS SCHEMAS DE DADOS:
1. Bloco de Controles ('controls'):
   - Cria controles interativos (sliders, botões, checkbox) que alimentam o estado reativo da simulação.
   - O campo 'fields' é uma lista de objetos:
     { "id": "gravity", "type": "slider", "label": "Gravidade", "min": 0, "max": 20, "step": 0.1, "value": 9.8 }
     { "id": "angle", "type": "slider", "label": "Ângulo", "min": 0, "max": 90, "step": 1, "value": 45 }
     { "id": "start-btn", "type": "button", "label": "Disparar", "value": "fire" }

2. Bloco de Visualização Canvas ('canvas'):
   - Renderiza um elemento Canvas HTML5 isolado.
   - O campo 'jsCode' deve conter o código JavaScript que manipula o canvas.
   - Regras do Canvas JS:
     * O elemento canvas pode ser obtido via document.querySelector('canvas') ou criado localmente. No ambiente real, a plataforma injeta o canvas e expõe a variável 'canvas' e o seu contexto 'ctx' no escopo global.
     * Para escutar mudanças nos controles, adicione um listener ao evento 'sim-state-change'. O detalhe do evento contém o estado atual dos sliders:
       window.addEventListener('sim-state-change', (e) => {
         const state = e.detail; // state.gravity, state.angle, etc.
         // atualize variáveis locais e redesenhe
       });
     * Crie uma lógica de animação fluida usando requestAnimationFrame para atualizar a física e desenhar a animação.
     * Mantenha o visual moderno e limpo, com cores harmoniosas e animações suaves a 60 FPS.

3. Bloco de Gráficos ('chart'):
   - Plota gráficos em tempo real da simulação.
   - Você deve informar as variáveis de controle/física que deseja plotar:
     * 'xAxisKey': A variável do estado da simulação correspondente ao Eixo X (ex: 'time').
     * 'yAxisKey': A variável do estado correspondente ao Eixo Y (ex: 'positionY', 'velocity', 'energy').

4. Bloco de Texto/Markdown ('markdown'):
   - Blocos de texto rico explicando a física/química por trás da simulação, roteiros experimentais ou perguntas norteadoras.
   - O campo 'content' suporta Markdown.

DIRETRIZES DE ESTILO VISUAL:
- A interface dos blocos (cards, sliders, gráficos) é renderizada de forma linda pelo React nativo da plataforma.
- No bloco 'canvas', você deve desenhar elementos visualmente atraentes: use cores contrastantes, vetores de força suaves (flechas indicando velocidade/aceleração), rastros de trajetória com opacidade gradual (efeito rastro de projétil) e animações responsivas e fluidas.

REGRAS DE CONDUTA RÍGIDAS:
1. Use APENAS as ferramentas declaradas para criar/modificar blocos. Não responda com texto puro no primeiro turno.
2. Você pode chamar múltiplas ferramentas consecutivamente se precisar adicionar ou modificar mais de um bloco.
3. Não tente reescrever um bloco inteiro de controles se o usuário pediu apenas para adicionar um slider. Use as tools cirurgicamente.
4. Responda apenas com UMA frase curta e técnica após executar as chamadas de ferramentas.`;

const TOOLS_CONFIG = [{
  functionDeclarations: [
    {
      name: "addBlock",
      description: "Adiciona um novo bloco à simulação (controls, canvas, chart, markdown).",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", description: "O tipo do bloco: 'controls', 'canvas', 'chart', 'markdown'" },
          title: { type: "string", description: "O título visível do bloco." },
          config: {
            type: "object",
            description: "Campos de configuração do bloco dependendo do tipo (fields para 'controls', jsCode para 'canvas', xAxisKey e yAxisKey para 'chart', content para 'markdown').",
            properties: {
              fields: {
                type: "array",
                description: "Apenas para 'controls'. Lista de campos de controle.",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "ID único do parâmetro no estado da simulação (ex: gravity, angle)." },
                    type: { type: "string", description: "Tipo do controle: 'slider', 'button', 'checkbox', 'select'" },
                    label: { type: "string", description: "Rótulo amigável exibido ao aluno." },
                    min: { type: "number", description: "Apenas para slider. Valor mínimo." },
                    max: { type: "number", description: "Apenas para slider. Valor máximo." },
                    step: { type: "number", description: "Apenas para slider. Incremento." },
                    value: { type: "string", description: "Valor inicial ou valor do botão." },
                    options: { type: "array", description: "Apenas para select. Lista de opções textuais.", items: { type: "string" } }
                  },
                  required: ["id", "type", "label", "value"]
                }
              },
              jsCode: { type: "string", description: "Apenas para 'canvas'. Código JS executável da simulação." },
              xAxisKey: { type: "string", description: "Apenas para 'chart'. Eixo X." },
              yAxisKey: { type: "string", description: "Apenas para 'chart'. Eixo Y." },
              content: { type: "string", description: "Apenas para 'markdown'. Conteúdo textual." }
            }
          }
        },
        required: ["type", "title", "config"]
      }
    },
    {
      name: "updateBlockContent",
      description: "Atualiza o conteúdo/configuração de um bloco existente.",
      parameters: {
        type: "object",
        properties: {
          blockId: { type: "string", description: "O ID do bloco a ser atualizado." },
          title: { type: "string", description: "Opcional. Novo título do bloco." },
          config: {
            type: "object",
            description: "Campos atualizados do bloco. Envie apenas as chaves que deseja modificar."
          }
        },
        required: ["blockId", "config"]
      }
    },
    {
      name: "deleteBlock",
      description: "Remove um bloco da simulação.",
      parameters: {
        type: "object",
        properties: {
          blockId: { type: "string", description: "O ID do bloco a ser excluído." }
        },
        required: ["blockId"]
      }
    }
  ]
}];

function getGenAI(): GoogleGenerativeAI {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) throw new Error('GEMINI_API_KEY não configurada no servidor.');
  return new GoogleGenerativeAI(key);
}

function calcCredits(inputTokens: number, cachedTokens: number, outputTokens: number): number {
  const normalInput = Math.max(0, inputTokens - cachedTokens);
  return Math.ceil(
    (normalInput  * CREDIT_RATE.input  / 1_000_000) +
    (cachedTokens * CREDIT_RATE.input_cached / 1_000_000) +
    (outputTokens * CREDIT_RATE.output / 1_000_000)
  );
}

export interface SimAgentResult {
  explanation: string;
  htmlContent: string;
  projectContext: string; // JSON de blocos atualizado
  codeIndex: Record<string, any>;
  editPlan: null;
  editScope: string;
  patchedFunctions: string[];
  tokensUsed: number;
  creditsUsed: number;
}

async function _runSimAgentInternal(params: {
  project: LabProject;
  userMessage: string;
  recentMessages: Array<{ role: string; content: string }>;
  modelToUse?: string;
  userImageUrl?: string;
}): Promise<SimAgentResult> {
  const { project, userMessage, recentMessages, userImageUrl } = params;

  const currentHtml = project.htmlContent || '';

  // Constrói o histórico curto de mensagens para contextualizar as edições
  const historyParts: string[] = [];
  if (recentMessages && recentMessages.length > 0) {
    const recent = recentMessages.slice(-4);
    for (const m of recent) {
      historyParts.push(`${m.role === 'user' ? 'Usuário' : 'IA'}: ${m.content.slice(0, 500)}`);
    }
  }

  // Prepara o prompt de input do escritor
  let userPrompt = '';
  if (currentHtml) {
    userPrompt += `Código HTML atual do simulador:\n\`\`\`html\n${currentHtml}\n\`\`\`\n\n`;
  }
  if (historyParts.length > 0) {
    userPrompt += `Histórico recente do Lab:\n${historyParts.join('\n')}\n\n`;
  }
  userPrompt += `Modificação solicitada pelo aluno: "${userMessage}"`;

  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: `Você é a IA Escritora de Simuladores Científicos do Scaffl.
Sua missão é gerar um código HTML5 autocontido (incluindo HTML, Tailwind CSS para estilos e JavaScript para física/lógica no Canvas) com base nas ideias dos estudantes.

DIRETRIZES DE DESIGN E QUALIDADE (MANDATÓRIAS):
1. Visual Moderno e Premium: Use um tema escuro (background: #0b0f19), com cores vibrantes em gradientes de neon (azul ciano, esmeralda, violeta, rosa quente, âmbar).
2. Canvas Dinâmico: Desenhe elementos de física ou química usando HTML5 Canvas. A animação deve ser a 60 FPS com requestAnimationFrame.
3. Interatividade e Controles: Forneça controles claros em Tailwind (como sliders deslizantes, botões de ação e cards translúcidos de glassmorphism). O estado da simulação deve mudar instantaneamente conforme o usuário mexe nos controles.
4. Partículas e Efeitos Visuais: Adicione efeitos como rastro nas partículas (motion trail) com opacidade gradual, brilhos nas colisões e vetores simples de força se aplicável.
5. Código Seguro e Autocontido: Responda APENAS com o código HTML completo e válido dentro de um bloco de código markdown. Não inclua conversas ou textos explicativos fora do código.`
  }, { timeout: TIMEOUT_MS });

  const promptParts: any[] = [];
  if (userImageUrl) {
    const base64Data = userImageUrl.includes('base64,')
      ? userImageUrl.split('base64,')[1]
      : userImageUrl;
    promptParts.push({
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      }
    });
  }
  promptParts.push(userPrompt);

  console.log(`[Lab Agent - Nova Versão] Chamando ${MODEL} de forma direta e otimizada...`);
  const response = await model.generateContent(promptParts);
  const rawText = response.response.text();

  // Limpeza de marcações markdown da resposta
  let cleanedHtml = rawText;
  const htmlMatch = rawText.match(/```html([\s\S]*?)```/);
  if (htmlMatch) {
    cleanedHtml = htmlMatch[1].trim();
  } else if (rawText.includes('<html')) {
    cleanedHtml = rawText.trim();
  }

  const inputTokens = response.response.usageMetadata?.promptTokenCount ?? 0;
  const cachedTokens = (response.response.usageMetadata as any)?.cachedContentTokenCount ?? 0;
  const outputTokens = response.response.usageMetadata?.candidatesTokenCount ?? 0;

  // Cálculo real dos créditos do Gemini 2.5 Flash
  const normalInput = Math.max(0, inputTokens - cachedTokens);
  const creditsUsed = Math.ceil(
    (normalInput  * CREDIT_RATE.input  / 1_000_000) +
    (cachedTokens * CREDIT_RATE.input_cached / 1_000_000) +
    (outputTokens * CREDIT_RATE.output / 1_000_000)
  );

  console.log(`[Lab Agent - Nova Versão] Sucesso! Tokens: In=${inputTokens}, Out=${outputTokens} | Créditos: ${creditsUsed}`);

  return {
    explanation: 'Simulador atualizado com sucesso.',
    htmlContent: cleanedHtml,
    projectContext: '[]',
    codeIndex: {},
    editPlan: null,
    editScope: 'surgical',
    patchedFunctions: [],
    tokensUsed: inputTokens + outputTokens,
    creditsUsed,
  };
}

let labAgentQueue: Promise<any> = Promise.resolve();

export async function runSimAgent(params: {
  project: LabProject;
  userMessage: string;
  recentMessages: Array<{ role: string; content: string }>;
  modelToUse?: string;
  userImageUrl?: string;
}): Promise<SimAgentResult> {
  const result = await (labAgentQueue = labAgentQueue
    .catch(() => {})
    .then(() => _runSimAgentInternal(params)));
  return result;
}
