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

export async function runSimAgent(params: {
  project: LabProject;
  userMessage: string;
  recentMessages: Array<{ role: string; content: string }>;
  modelToUse?: string;
  userImageUrl?: string;
}): Promise<SimAgentResult> {
  const { project, userMessage, recentMessages, userImageUrl } = params;

  // 1. Carregar ou inicializar a árvore de blocos a partir do projectContext
  let activeBlocks: Block[] = [];
  try {
    activeBlocks = JSON.parse(project.projectContext || '[]');
  } catch (e) {
    activeBlocks = [];
  }

  // 2. Mapear informações de contexto para a IA
  const infoParts: string[] = [];
  infoParts.push(`Os blocos atuais da simulação são:\n${JSON.stringify(activeBlocks, null, 2)}`);
  
  if (recentMessages.length > 0) {
    const history = recentMessages
      .slice(-6)
      .map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content.slice(0, 300)}`)
      .join('\n');
    infoParts.push(`Histórico recente do Lab:\n${history}`);
  }

  const systemInstruction = SYSTEM_PROMPT;
  const genAI = getGenAI();

  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction,
    tools: TOOLS_CONFIG,
  }, { timeout: TIMEOUT_MS });

  let explanation = 'Simulação atualizada.';
  let editScope = 'surgical';
  let totalInputTokens = 0;
  let totalCachedTokens = 0;
  let totalOutputTokens = 0;

  const userPrompt = `${infoParts.join('\n\n')}\n\nInstrução do Usuário: "${userMessage}"`;

  const chat = model.startChat({
    tools: TOOLS_CONFIG,
    toolConfig: {
      functionCallingConfig: {
        mode: 'ANY'
      }
    } as any
  });

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

  let response = await chat.sendMessage(promptParts);

  totalInputTokens += response.response.usageMetadata?.promptTokenCount ?? 0;
  totalCachedTokens += (response.response.usageMetadata as any)?.cachedContentTokenCount ?? 0;
  totalOutputTokens += response.response.usageMetadata?.candidatesTokenCount ?? 0;

  let loopCount = 0;
  const maxIterations = 5;

  // Executor local das ferramentas dentro do loop do chat
  const handleLocalToolExecution = (name: string, args: any) => {
    console.log(`[Lab Agent] Executing tool locally: ${name}`, JSON.stringify(args, null, 2));

    if (name === "addBlock") {
      const newId = `${args.type}-${activeBlocks.length + 1}`;
      const newBlock: Block = {
        id: newId,
        type: args.type,
        title: args.title,
        ...args.config
      };
      activeBlocks.push(newBlock);
      editScope = 'full_rewrite'; // Trata como modificação estrutural
      return { success: true, message: `Bloco '${args.title}' adicionado com ID: ${newId}` };
    }

    if (name === "updateBlockContent") {
      const block = activeBlocks.find(b => b.id === args.blockId);
      if (!block) {
        return { success: false, error: `Bloco com ID ${args.blockId} não encontrado.` };
      }
      if (args.title) block.title = args.title;
      if (args.config) {
        Object.assign(block, args.config);
      }
      editScope = 'surgical'; // Trata como modificação pontual
      return { success: true, message: `Bloco ${args.blockId} atualizado com sucesso.` };
    }

    if (name === "deleteBlock") {
      const index = activeBlocks.findIndex(b => b.id === args.blockId);
      if (index === -1) {
        return { success: false, error: `Bloco com ID ${args.blockId} não encontrado.` };
      }
      const removed = activeBlocks.splice(index, 1);
      editScope = 'full_rewrite';
      return { success: true, message: `Bloco ${args.blockId} (${removed[0].title}) excluído.` };
    }

    return { error: `Ferramenta ${name} desconhecida.` };
  };

  while (loopCount < maxIterations) {
    console.log(`[Lab Agent] Iteration ${loopCount + 1}/${maxIterations}...`);
    const functionCalls = typeof response.response.functionCalls === 'function'
      ? response.response.functionCalls()
      : (response.response as any).functionCalls;

    if (!functionCalls || functionCalls.length === 0) {
      const hasBlocksChanged = activeBlocks.length > 0;
      if (!hasBlocksChanged) {
        console.log(`[Lab Agent] No tool called and blocks are empty. Prompting agent to call tools...`);
        response = await chat.sendMessage("Nenhuma ferramenta foi executada para modificar os blocos do laboratório. Por favor, chame as ferramentas necessárias para compor o simulador.", {
          toolConfig: {
            functionCallingConfig: {
              mode: 'ANY'
            }
          }
        } as any);
        
        totalInputTokens += response.response.usageMetadata?.promptTokenCount ?? 0;
        totalCachedTokens += (response.response.usageMetadata as any)?.cachedContentTokenCount ?? 0;
        totalOutputTokens += response.response.usageMetadata?.candidatesTokenCount ?? 0;
        
        loopCount++;
        continue;
      }
      explanation = response.response.text();
      console.log(`[Lab Agent] Execution completed successfully.`);
      break;
    }

    // Executa todas as chamadas retornadas pelo Gemini em paralelo
    console.log(`[Lab Agent] Agent requested ${functionCalls.length} tool calls.`);
    const functionResponses = functionCalls.map((call: any) => {
      const toolResult = handleLocalToolExecution(call.name, call.args);
      return {
        functionResponse: {
          name: call.name,
          response: toolResult
        }
      };
    });

    // Envia o feedback de todas as execuções juntas de volta ao chat
    response = await chat.sendMessage(functionResponses, {
      toolConfig: {
        functionCallingConfig: {
          mode: 'AUTO'
        }
      }
    } as any);

    totalInputTokens += response.response.usageMetadata?.promptTokenCount ?? 0;
    totalCachedTokens += (response.response.usageMetadata as any)?.cachedContentTokenCount ?? 0;
    totalOutputTokens += response.response.usageMetadata?.candidatesTokenCount ?? 0;

    loopCount++;
  }

  // 3. Compilar a árvore de blocos atualizada para HTML autocontido
  const compiledHtml = compileBlocksToHtml(activeBlocks);

  return {
    explanation,
    htmlContent: compiledHtml,
    projectContext: JSON.stringify(activeBlocks),
    codeIndex: {}, // Mapeamento legado vazio para não quebrar rotas
    editPlan: null,
    editScope,
    patchedFunctions: [],
    tokensUsed: totalInputTokens + totalOutputTokens,
    creditsUsed: calcCredits(totalInputTokens, totalCachedTokens, totalOutputTokens),
  };
}
