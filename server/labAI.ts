import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildCodeIndex } from './codeIndexer.js';
import { LabProject } from './labAgent.types.js';

const MODEL = 'gemini-2.5-flash';
const TIMEOUT_MS = 300_000;

// Flash 2.5: $0.30/M normal in, $0.03/M cached in, $2.50/M out (Dólar a R$ 5,50, 1M créditos = R$ 1,00)
const CREDIT_RATE = { input: 1_650_000, input_cached: 165_000, output: 13_750_000 };

const SYSTEM_PROMPT = `Você é o Mini-Agente de Código do laboratório de simulações físicas do SCAFFL.
Sua missão é estritamente técnica: criar ou modificar o código de simuladores interativos em HTML/JS/CSS.

REGRAS DE CONDUTA E EXECUÇÃO RÍGIDAS (SEM EXCEÇÃO):
1. SEM CRIATIVIDADE OU INOVAÇÃO NÃO SOLICITADA: Você é um executor técnico. Limite-se estritamente ao que foi pedido pelo usuário. Não adicione funcionalidades extras, recursos visuais decorativos supérfluos ou lógica secundária não requisitada explicitamente.
2. SEM TEXTO OU TEORIA NO SIMULADOR: Não coloque explicações teóricas, blocos de texto explicativo sobre física/química ou documentação conceitual longa dentro da interface HTML da simulação. O simulador deve conter apenas os elementos visuais da simulação (Canvas, inputs, botões) e os scripts necessários para executá-lo.
3. FLUXO OBRIGATÓRIO DE FERRAMENTAS: Você NUNCA deve responder com texto puro ou explicações conversacionais no primeiro turno. Ao receber o pedido do usuário, você deve IMEDIATAMENTE chamar uma ferramenta de escrita ('rewriteFullCode' para novos simuladores, ou 'patchCode' para edições cirúrgicas pontuais).
4. RESPOSTA FINAL DE APENAS UMA FRASE: Quando as ferramentas terminarem e você for emitir sua resposta final (texto de conclusão da chamada), responda com no máximo UMA frase curta e extremamente objetiva (ex: "Simulador criado com sucesso." ou "Modificações de interface aplicadas."). É terminantemente proibido dar justificativas longas, explicações pedagógicas extensas ou tutoriais conceituais. Economize tokens de output ao máximo!
5. EXPLICAÇÃO DAS FERRAMENTAS CURTA: O campo 'explanation' das ferramentas ('rewriteFullCode' ou 'patchCode') deve conter no máximo uma frase técnica curta e objetiva explicando a mudança.
6. Quando usar 'patchCode', a string informada no campo 'find' deve existir EXATAMENTE no código atual, caractere por caractere (respeitando espaços e quebras de linha).`;

const TOOLS_CONFIG = [{
  functionDeclarations: [
    {
      name: "viewCode",
      description: "Retorna o código HTML completo atual da simulação pedagógica.",
      parameters: { type: "object", properties: {} }
    },
    {
      name: "patchCode",
      description: "Aplica uma ou mais substituições cirúrgicas de texto (find e replace) no código HTML atual. Use esta ferramenta preferencialmente para modificações específicas ou pontuais.",
      parameters: {
        type: "object",
        properties: {
          replacements: {
            type: "array",
            description: "Lista de substituições. Cada item deve conter o texto exato a ser procurado e o novo texto.",
            items: {
              type: "object",
              properties: {
                find: { type: "string", description: "O trecho exato de código atualmente existente que você deseja substituir. Deve corresponder caractere por caractere (respeitando espaços e quebras de linha)." },
                replace: { type: "string", description: "O novo trecho de código que substituirá o trecho 'find'." }
              },
              required: ["find", "replace"]
            }
          },
          explanation: { type: "string", description: "Breve explicação didática de quais mudanças estão sendo feitas e o porquê." }
        },
        required: ["replacements", "explanation"]
      }
    },
    {
      name: "rewriteFullCode",
      description: "Reescreve o código HTML completo da simulação. Use apenas se for a primeira criação da simulação ou se as mudanças forem massivas.",
      parameters: {
        type: "object",
        properties: {
          htmlContent: { type: "string", description: "O novo conteúdo HTML completo." },
          explanation: { type: "string", description: "Breve explicação didática das mudanças estruturais realizadas." }
        },
        required: ["htmlContent", "explanation"]
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

  const fnNames = Object.keys(project.codeIndex);
  const infoParts: string[] = [];

  if (project.projectContext) infoParts.push(`Contexto pedagógico do projeto:\n${project.projectContext}`);
  if (fnNames.length > 0) infoParts.push(`Funções mapeadas no código atual: ${fnNames.join(', ')}`);
  
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

  let currentHtml = project.htmlContent;
  let explanation = 'Simulação updated.';
  let editScope = 'surgical';
  let patchedFunctions: string[] = [];
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

  while (loopCount < maxIterations) {
    console.log(`[Lab Agent] Iteration ${loopCount + 1}/${maxIterations}...`);
    const functionCalls = typeof response.response.functionCalls === 'function'
      ? response.response.functionCalls()
      : (response.response as any).functionCalls;
    if (!functionCalls || functionCalls.length === 0) {
      const hasCodeChanged = currentHtml !== project.htmlContent;
      if (!hasCodeChanged) {
        console.log(`[Lab Agent] No tool called and code hasn't changed. Prompting agent to write (mode ANY)...`);
        response = await chat.sendMessage("Nenhuma ferramenta de escrita ('rewriteFullCode' ou 'patchCode') foi executada para modificar o simulador. Por favor, execute a ferramenta de escrita apropriada para aplicar as mudanças pedidas.", {
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
      console.log(`[Lab Agent] Execution completed successfully. Explanation: ${explanation}`);
      break;
    }

    const call = functionCalls[0];
    let functionResponse: any;
    console.log(`[Lab Agent] Agent requested tool call: ${call.name}`, call.args);

    if (call.name === 'viewCode') {
      functionResponse = { code: currentHtml };
    } 
    else if (call.name === 'patchCode') {
      const args = call.args as any;
      const replacements = args.replacements as Array<{ find: string, replace: string }>;
      explanation = args.explanation || explanation;
      
      let tempHtml = currentHtml;
      let allFound = true;
      const failedFinds: string[] = [];

      for (const rep of replacements) {
        if (tempHtml.includes(rep.find)) {
          tempHtml = tempHtml.replace(rep.find, rep.replace);
        } else {
          allFound = false;
          failedFinds.push(rep.find);
        }
      }

      if (allFound) {
        currentHtml = tempHtml;
        editScope = 'surgical';
        functionResponse = { success: true, message: 'Substituições cirúrgicas aplicadas com sucesso.' };
      } else {
        functionResponse = { 
          success: false, 
          error: `As seguintes buscas 'find' não foram localizadas exatamente no código atual: ${JSON.stringify(failedFinds)}. Certifique-se de que a string de busca em 'find' é idêntica à do código atual.`
        };
      }
    } 
    else if (call.name === 'rewriteFullCode') {
      const args = call.args as any;
      currentHtml = args.htmlContent;
      explanation = args.explanation || explanation;
      editScope = 'full_rewrite';
      functionResponse = { success: true, message: 'Código reescrito com sucesso.' };
    }

    console.log(`[Lab Agent] Tool Execution Result:`, functionResponse);

    // Envia o feedback da execução da ferramenta de volta ao chat, permitindo AUTO nos turnos seguintes
    response = await chat.sendMessage([{
      functionResponse: {
        name: call.name,
        response: functionResponse
      }
    }], {
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

  // Mapeamos as funções modificadas caso tenha sido cirúrgico
  if (editScope === 'surgical') {
    // Apenas listamos todas as chaves mapeadas no index atual
    patchedFunctions = Object.keys(buildCodeIndex(currentHtml));
  }

  return {
    explanation,
    htmlContent: currentHtml,
    codeIndex: buildCodeIndex(currentHtml),
    editPlan: null,
    editScope,
    patchedFunctions,
    tokensUsed: totalInputTokens + totalOutputTokens,
    creditsUsed: calcCredits(totalInputTokens, totalCachedTokens, totalOutputTokens),
  };
}
