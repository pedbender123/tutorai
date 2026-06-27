import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
import db from './db.js';
import { buildSupportPrompt } from './promptBuilder.js';
import { getActiveKey, calcCredits, getUserCreditLimit } from './providers/registry.js';
import { config } from './config.js';
import { checkPetrusQuota, recordPetrusCredits, logQuotaEvent } from './quota.js';

export interface SupportMessage {
  role: 'user' | 'model';
  content: string;
}

interface UserSupportContext {
  name: string;
  institution?: string;
  labProjects: Array<{ id: string; title: string; updatedAt: string }>;
}

function getUserSupportContext(userId: string): UserSupportContext {
  const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined;

  const instRow = db.prepare(`
    SELECT i.name FROM institutions i
    JOIN user_institutions ui ON i.id = ui.institutionId
    WHERE ui.userId = ? LIMIT 1
  `).get(userId) as { name: string } | undefined;

  const projects = db.prepare(
    'SELECT id, title, updatedAt FROM lab_projects WHERE userId = ? ORDER BY updatedAt DESC LIMIT 15'
  ).all(userId) as Array<{ id: string; title: string; updatedAt: string }>;

  return {
    name: user?.name || 'Usuário',
    institution: instRow?.name,
    labProjects: projects,
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
): Promise<{ text: string; creditsUsed: number }> {
  if (config.isCloud) {
    const quotaCheck = checkPetrusQuota(userId);
    if (!quotaCheck.allowed) throw new Error(quotaCheck.reason ?? 'Limite de créditos atingido.');
  }

  const ctx = getUserSupportContext(userId);
  const systemInstruction = buildSupportPrompt({
    userName: ctx.name,
    institution: ctx.institution,
    labProjects: ctx.labProjects,
    labProjectCount: ctx.labProjects.length,
    agenticMode,
  });

  const { key: googleKey } = getActiveKey('google');
  const genAI = new GoogleGenerativeAI(googleKey);
  const model = genAI.getGenerativeModel(
    {
      model: 'gemini-2.5-flash',
      systemInstruction,
      tools: [{ functionDeclarations: agenticMode ? WRITE_TOOL_DECLS : READ_TOOL_DECLS }],
    },
    { timeout: 60_000 },
  );

  const contents: any[] = history.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));
  contents.push({ role: 'user', parts: [{ text: newMessage }] });

  let result = await model.generateContent({ contents });
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
  const inputTok  = response.usageMetadata?.promptTokenCount    ?? Math.ceil(newMessage.length / 4);
  const outputTok = response.usageMetadata?.candidatesTokenCount ?? Math.ceil(text.length / 4);
  const cachedTok = (response.usageMetadata as any)?.cachedContentTokenCount ?? 0;
  const creditsUsed = calcCredits('gemini-2.5-flash', inputTok, cachedTok, outputTok);

  if (config.isCloud) {
    recordPetrusCredits(userId, creditsUsed);
    logQuotaEvent({ userId, surface: 'petrus', event: 'request', model: 'gemini-2.5-flash', credits: creditsUsed });
  }

  return { text, creditsUsed };
}
