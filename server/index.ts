import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';
import * as auth from './auth.js';
import * as ai from './ai.js';
import { runSimAgent } from './labAI.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { compressProjectContext } from './labContextCompressor.js';
import { getUserCreditLimit } from './ai.js';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Global Rate Limiter: 10 requests per minute
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 10,
  message: { error: 'Limite de requisições excedido. Tente novamente em um minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => 'global_app_limiter', // Global limit for the whole app
});
// Middleware for Admin only
const requireAdmin = (req: any, res: express.Response, next: express.NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
  }
  next();
};

// Helper to get user's institution IDs
const getUserInstitutionIds = (userId: string): string[] => {
  const rows = db.prepare('SELECT institutionId FROM user_institutions WHERE userId = ?').all(userId) as { institutionId: string }[];
  return rows.map(r => r.institutionId);
};

// Auth Routes
app.post('/api/auth/register', auth.register);
app.post('/api/auth/login', auth.login);
app.get('/api/auth/me', auth.authenticate, (req: any, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Calculate aggregate monthly credits (chat + lab, last 30 days)
  const chatCredits = db.prepare(`SELECT SUM(creditsUsed) as total FROM messages WHERE userId = ? AND createdAt >= DATETIME('now', '-30 days')`).get(req.user.id) as { total: number };
  const labCredits = db.prepare(`SELECT SUM(creditsUsed) as total FROM lab_messages WHERE userId = ? AND createdAt >= DATETIME('now', '-30 days')`).get(req.user.id) as { total: number };
  user.creditsMonthly = (chatCredits?.total || 0) + (labCredits?.total || 0);

  user.institutions = getUserInstitutionIds(user.id);
  delete user.password;
  res.json(user);
});
app.patch('/api/auth/user', auth.authenticate, auth.updateUserData);

// Admin: Management Routes
app.get('/api/admin/institutions', auth.authenticate, requireAdmin, (req, res) => {
  const institutions = db.prepare('SELECT * FROM institutions ORDER BY name ASC').all();
  res.json(institutions);
});

app.post('/api/admin/institutions', auth.authenticate, requireAdmin, (req, res) => {
  const { name, domain } = req.body;
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO institutions (id, name, domain) VALUES (?, ?, ?)').run(id, name, domain);
  res.json({ id, name, domain });
});

app.post('/api/admin/users', auth.authenticate, requireAdmin, auth.register);

app.get('/api/admin/users', auth.authenticate, requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, isAdmin, createdAt FROM users').all() as any[];
  for (const u of users) {
    u.institutions = getUserInstitutionIds(u.id);
  }
  res.json(users);
});

app.post('/api/admin/users/:userId/institutions', auth.authenticate, requireAdmin, (req, res) => {
  const { userId } = req.params;
  const { institutionId } = req.body;
  try {
    db.prepare('INSERT INTO user_institutions (userId, institutionId) VALUES (?, ?)').run(userId, institutionId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Vínculo já existe ou instituição inválida.' });
  }
});

app.delete('/api/admin/users/:userId/institutions/:institutionId', auth.authenticate, requireAdmin, (req, res) => {
  const { userId, institutionId } = req.params;
  db.prepare('DELETE FROM user_institutions WHERE userId = ? AND institutionId = ?').run(userId, institutionId);
  res.json({ success: true });
});

// Admin: Classrooms Management
app.get('/api/admin/institutions/:institutionId/classrooms', auth.authenticate, requireAdmin, (req, res) => {
  const { institutionId } = req.params;
  const classrooms = db.prepare('SELECT * FROM classrooms WHERE institutionId = ? ORDER BY name ASC').all(institutionId);
  res.json(classrooms);
});

app.post('/api/admin/institutions/:institutionId/classrooms', auth.authenticate, requireAdmin, (req, res) => {
  const { institutionId } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome da sala é obrigatório' });
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO classrooms (id, name, institutionId) VALUES (?, ?, ?)').run(id, name, institutionId);
  res.json({ id, name, institutionId });
});

app.patch('/api/admin/classrooms/:classroomId', auth.authenticate, requireAdmin, (req, res) => {
  const { classroomId } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome da sala é obrigatório' });
  db.prepare('UPDATE classrooms SET name = ? WHERE id = ?').run(name, classroomId);
  res.json({ id: classroomId, name });
});

app.delete('/api/admin/classrooms/:classroomId', auth.authenticate, requireAdmin, (req, res) => {
  const { classroomId } = req.params;
  db.prepare('DELETE FROM classrooms WHERE id = ?').run(classroomId);
  res.json({ success: true });
});

// Public: Get invite info
app.get('/api/auth/invite/:inviteCode', (req, res) => {
  const { inviteCode } = req.params;
  const classroom = db.prepare('SELECT c.name as className, i.name as instName FROM classrooms c JOIN institutions i ON c.institutionId = i.id WHERE c.id = ?').get(inviteCode) as any;
  if (!classroom) return res.status(404).json({ error: 'Código de convite inválido ou sala não encontrada.' });
  res.json(classroom);
});

// Personas Routes (Filtered by user institutions)
app.get('/api/personas', auth.authenticate, (req: any, res) => {
  // Admins see everything; regular users see public + their institutions
  if (req.user.isAdmin) {
    const personas = db.prepare(`
      SELECT p.*, i.name as institutionName
      FROM personas p
      LEFT JOIN institutions i ON p.institutionId = i.id
      ORDER BY p.createdAt DESC
    `).all();
    return res.json(personas);
  }

  const instIds = getUserInstitutionIds(req.user.id);
  let where = 'p.institutionId IS NULL';
  if (instIds.length > 0) {
    const placeholders = instIds.map(() => '?').join(',');
    where += ` OR p.institutionId IN (${placeholders})`;
  }

  const personas = db.prepare(`
    SELECT p.*, i.name as institutionName
    FROM personas p
    LEFT JOIN institutions i ON p.institutionId = i.id
    WHERE ${where}
    ORDER BY p.createdAt DESC
  `).all(...instIds);
  res.json(personas);
});

app.post('/api/personas', auth.authenticate, requireAdmin, (req: any, res) => {
  const { nome, descricao, saudacao, documentoPedagogico, isGenerico, institutionId, imageUrl } = req.body;
  if (!isGenerico && !institutionId) return res.status(400).json({ error: 'Instituição é obrigatória para este tipo de persona.' });

  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO personas (id, userId, institutionId, nome, descricao, saudacao, documentoPedagogico, isGenerico, imageUrl)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, isGenerico ? null : institutionId, nome, descricao, saudacao, documentoPedagogico, isGenerico ? 1 : 0, imageUrl || '');

  const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(id);
  res.json(persona);
});

app.put('/api/personas/:id', auth.authenticate, requireAdmin, (req: any, res) => {
  const { id } = req.params;
  const { nome, descricao, saudacao, documentoPedagogico, isGenerico, institutionId, imageUrl } = req.body;
  db.prepare(`
    UPDATE personas
    SET nome = ?, descricao = ?, saudacao = ?, documentoPedagogico = ?, isGenerico = ?, institutionId = ?, imageUrl = ?
    WHERE id = ?
  `).run(nome, descricao, saudacao, documentoPedagogico, isGenerico ? 1 : 0, isGenerico ? null : (institutionId || null), imageUrl || '', id);
  const persona = db.prepare(`
    SELECT p.*, i.name as institutionName
    FROM personas p LEFT JOIN institutions i ON p.institutionId = i.id
    WHERE p.id = ?
  `).get(id);
  res.json(persona);
});

app.delete('/api/personas/:id', auth.authenticate, (req: any, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM personas WHERE id = ? AND userId = ?').run(id, req.user.id);
  res.json({ success: true });
});

// Disciplinas Routes (Filtered by user institutions)
app.get('/api/disciplinas', auth.authenticate, (req: any, res) => {
  let disciplinas: any[];

  if (req.user.isAdmin) {
    // Admins see all disciplinas
    disciplinas = db.prepare(`
      SELECT d.*, i.name as institutionName
      FROM disciplinas d
      LEFT JOIN institutions i ON d.institutionId = i.id
      ORDER BY d.createdAt DESC
    `).all() as any[];
  } else {
    const instIds = getUserInstitutionIds(req.user.id);
    if (instIds.length === 0) return res.json([]);

    const placeholders = instIds.map(() => '?').join(',');
    disciplinas = db.prepare(`
      SELECT d.*, i.name as institutionName
      FROM disciplinas d
      LEFT JOIN institutions i ON d.institutionId = i.id
      WHERE d.institutionId IN (${placeholders})
      ORDER BY d.createdAt DESC
    `).all(...instIds) as any[];
  }

  for (const d of disciplinas) {
    const professors = db.prepare('SELECT personaId FROM persona_disciplina WHERE disciplinaId = ?').all(d.id) as { personaId: string }[];
    d.professores_vinculados = professors.map(p => p.personaId);
  }

  res.json(disciplinas);
});

app.post('/api/disciplinas', auth.authenticate, requireAdmin, (req: any, res) => {
  const { nome, conteudo, professores_vinculados, institutionId } = req.body;
  if (!institutionId) return res.status(400).json({ error: 'Instituição é obrigatória.' });

  const id = crypto.randomUUID();
  
  const insert = db.transaction(() => {
    db.prepare('INSERT INTO disciplinas (id, userId, institutionId, nome, conteudo) VALUES (?, ?, ?, ?, ?)').run(id, req.user.id, institutionId, nome, conteudo);
    if (professores_vinculados && Array.isArray(professores_vinculados)) {
      const stmt = db.prepare('INSERT INTO persona_disciplina (personaId, disciplinaId) VALUES (?, ?)');
      for (const pId of professores_vinculados) {
        stmt.run(pId, id);
      }
    }
  });
  insert();
  
  const disciplina = db.prepare('SELECT * FROM disciplinas WHERE id = ?').get(id) as any;
  disciplina.professores_vinculados = professores_vinculados;
  res.json(disciplina);
});

app.put('/api/disciplinas/:id', auth.authenticate, requireAdmin, (req: any, res) => {
  const { id } = req.params;
  const { nome, conteudo, professores_vinculados = [] } = req.body;
  
  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE disciplinas 
      SET nome = ?, conteudo = ?
      WHERE id = ? AND userId = ?
    `).run(nome, conteudo, id, req.user.id);

    db.prepare('DELETE FROM persona_disciplina WHERE disciplinaId = ?').run(id);
    const insertVinculo = db.prepare('INSERT INTO persona_disciplina (personaId, disciplinaId) VALUES (?, ?)');
    for (const pId of professores_vinculados) {
      insertVinculo.run(pId, id);
    }
  });

  transaction();

  const disciplina = db.prepare('SELECT * FROM disciplinas WHERE id = ?').get(id);
  res.json({ ...disciplina as any, professores_vinculados });
});

app.delete('/api/disciplinas/:id', auth.authenticate, (req: any, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM disciplinas WHERE id = ? AND userId = ?').run(id, req.user.id);
  res.json({ success: true });
});

// Chat Routes
app.get('/api/chats', auth.authenticate, (req: any, res) => {
  const chats = db.prepare('SELECT * FROM chats WHERE userId = ? ORDER BY updatedAt DESC').all(req.user.id);
  res.json(chats);
});

app.post('/api/chats', auth.authenticate, (req: any, res) => {
  const { professorId, disciplinaId } = req.body;

  if (!professorId) {
    return res.status(400).json({ error: 'professorId é obrigatório.' });
  }

  // Find persona in DB
  const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(professorId) as any;
  if (!persona) {
    return res.status(404).json({ error: `Professor "${professorId}" não encontrado.` });
  }

  const chatId = crypto.randomUUID();
  const title = `Conversa com ${persona.nome}`;

  db.prepare(`
    INSERT INTO chats (id, userId, title, persona, personaDbId, disciplinaId)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(chatId, req.user.id, title, professorId, persona.id, disciplinaId || null);

  // Insert greeting
  const greetingId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO messages (id, chatId, userId, role, content)
    VALUES (?, ?, ?, ?, ?)
  `).run(greetingId, chatId, req.user.id, 'model', persona.saudacao);

  const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId);
  res.json({ chat, greetingMessage: db.prepare('SELECT * FROM messages WHERE id = ?').get(greetingId) });
});

app.get('/api/chats/:chatId/messages', auth.authenticate, (req: any, res) => {
  const { chatId } = req.params;
  const messages = db.prepare('SELECT * FROM messages WHERE chatId = ? AND userId = ? ORDER BY createdAt ASC').all(chatId, req.user.id);
  res.json(messages);
});

app.post('/api/chats/:chatId/messages', auth.authenticate, limiter, async (req: any, res) => {
  const { chatId } = req.params;
  const { content, provider = 'google' } = req.body;
  const userId = req.user.id;

  try {
    const chat = db.prepare('SELECT * FROM chats WHERE id = ? AND userId = ?').get(chatId, userId) as any;
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    // Store user message
    const userMsgId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO messages (id, chatId, userId, role, content)
      VALUES (?, ?, ?, ?, ?)
    `).run(userMsgId, chatId, userId, 'user', content);

    // Get previous messages for context (excluding the one just inserted)
    const history = db.prepare('SELECT role, content FROM messages WHERE chatId = ? ORDER BY createdAt ASC').all(chatId) as any[];

    // Call AI with chatId to let it fetch persona/disciplina from DB
    const response = await ai.generateChatResponse(history.slice(0, -1), content, chatId, userId, provider);

    // Store model response
    const modelMsgId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO messages (id, chatId, userId, role, content, tokensUsed, creditsUsed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(modelMsgId, chatId, userId, 'model', response.text, response.tokensUsed, response.creditsUsed);

    // Update chat updatedAt
    db.prepare('UPDATE chats SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(chatId);

    res.json({
      userMessage: db.prepare('SELECT * FROM messages WHERE id = ?').get(userMsgId),
      modelMessage: db.prepare('SELECT * FROM messages WHERE id = ?').get(modelMsgId)
    });
  } catch (err: any) {
    console.error(err);
    const errorMessage = err.message.includes('Limite') ? err.message : 'Falha ao gerar resposta do tutor.';
    res.status(500).json({ error: errorMessage });
  }
});

// ==================== LAB ROUTES ====================

// GET /api/lab/projects — Meus projetos + projetos públicos da instituição
app.get('/api/lab/projects', auth.authenticate, (req: any, res) => {
  const userId = req.user.id;
  // Busca instituições do usuário
  const userInstitutions = db.prepare(
    `SELECT institutionId FROM user_institutions WHERE userId = ?`
  ).all(userId) as { institutionId: string }[];
  const instIds = userInstitutions.map(r => r.institutionId);

  let projects: any[];
  if (instIds.length === 0) {
    // Sem instituição: só projetos próprios
    projects = db.prepare(`
      SELECT p.*, u.name as authorName,
             (SELECT AVG(stars) FROM lab_project_ratings WHERE projectId = p.id) as avgStars,
             p.feedback_creator as feedbackCreator
      FROM lab_projects p
      JOIN users u ON p.userId = u.id
      WHERE p.userId = ?
      ORDER BY p.updatedAt DESC
    `).all(userId) as any[];
  } else {
    const placeholders = instIds.map(() => '?').join(',');
    projects = db.prepare(`
      SELECT p.*, u.name as authorName,
             (SELECT AVG(stars) FROM lab_project_ratings WHERE projectId = p.id) as avgStars,
             p.feedback_creator as feedbackCreator
      FROM lab_projects p
      JOIN users u ON u.id = p.userId
      WHERE p.userId = ? OR (p.isPublic = 1 AND p.institutionId IN (${placeholders}))
      ORDER BY p.updatedAt DESC
    `).all(userId, ...instIds) as any[];
  }

  res.json(projects);
});

// POST /api/lab/projects — Criar novo projeto
app.post('/api/lab/projects', auth.authenticate, (req: any, res) => {
  const userId = req.user.id;
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title é obrigatório.' });

  // Checar limite de projetos do tier do usuário
  const { projectLimit } = getUserCreditLimit(userId);
  const projectCount = (db.prepare(`SELECT COUNT(*) as cnt FROM lab_projects WHERE userId = ?`).get(userId) as { cnt: number }).cnt;
  if (projectCount >= projectLimit) {
    return res.status(403).json({ error: `Limite de ${projectLimit} projetos atingido para o seu plano.` });
  }

  // Usuário sem instituição: projeto pessoal (não público)
  const userInstIds = getUserInstitutionIds(userId);
  const institutionId = userInstIds[0] || null;
  const isPublic = institutionId ? 1 : 0;

  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO lab_projects (id, userId, institutionId, title, isPublic) VALUES (?, ?, ?, ?, ?)`
  ).run(id, userId, institutionId, title, isPublic);

  const project = db.prepare(`SELECT lp.*, u.name as authorName FROM lab_projects lp JOIN users u ON u.id = lp.userId WHERE lp.id = ?`).get(id);
  res.status(201).json(project);
});

// GET /api/lab/projects/:id — Projeto + mensagens
app.get('/api/lab/projects/:id', auth.authenticate, (req: any, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const project = db.prepare(`
    SELECT p.*, u.name as authorName,
           (SELECT AVG(stars) FROM lab_project_ratings WHERE projectId = p.id) as avgStars,
           p.feedback_creator as feedbackCreator
    FROM lab_projects p 
    JOIN users u ON u.id = p.userId 
    WHERE p.id = ?
  `).get(id) as any;
  if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });

  // Verifica acesso: dono ou mesma instituição (público)
  const isOwner = project.userId === userId;
  const hasInstitution = db.prepare(
    `SELECT 1 FROM user_institutions WHERE userId = ? AND institutionId = ?`
  ).get(userId, project.institutionId);
  if (!isOwner && (!project.isPublic || !hasInstitution)) {
    return res.status(403).json({ error: 'Acesso negado.' });
  }

  const messages = db.prepare(
    `SELECT * FROM lab_messages WHERE projectId = ? ORDER BY createdAt ASC`
  ).all(id);

  res.json({ ...project, messages });
});

// PUT /api/lab/projects/:id/title — Renomear projeto
app.put('/api/lab/projects/:id/title', auth.authenticate, (req: any, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title é obrigatório.' });

  const project = db.prepare(`SELECT userId FROM lab_projects WHERE id = ?`).get(id) as any;
  if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });
  if (project.userId !== userId) return res.status(403).json({ error: 'Acesso negado.' });

  db.prepare(`UPDATE lab_projects SET title = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`).run(title, id);
  res.json({ ok: true });
});

// DELETE /api/lab/projects/:id — Deletar projeto
app.delete('/api/lab/projects/:id', auth.authenticate, (req: any, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const project = db.prepare(`SELECT userId FROM lab_projects WHERE id = ?`).get(id) as any;
  if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });
  if (project.userId !== userId && !req.user.isAdmin) return res.status(403).json({ error: 'Acesso negado.' });

  db.prepare(`DELETE FROM lab_projects WHERE id = ?`).run(id);
  res.json({ ok: true });
});

app.post('/api/lab/projects/:id/messages', auth.authenticate, limiter, async (req: any, res) => {
  const userId = req.user.id;
  const { id: projectId } = req.params;
  const { content, modelToUse } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content é obrigatório.' });

  const rawProject = db.prepare(`
    SELECT id, userId, institutionId, title, description, htmlContent, isPublic,
           code_index as codeIndex, project_context as projectContext, turn_count as turnCount,
           createdAt, updatedAt
    FROM lab_projects WHERE id = ?
  `).get(projectId) as any;

  if (!rawProject) return res.status(404).json({ error: 'Projeto não encontrado.' });
  if (rawProject.userId !== userId) return res.status(403).json({ error: 'Apenas o dono pode editar o projeto.' });

  const project = {
    ...rawProject,
    codeIndex: JSON.parse(rawProject.codeIndex || '{}'),
    projectContext: rawProject.projectContext || '',
    turnCount: rawProject.turnCount || 0,
  };

  const recentMessages = (db.prepare(`
    SELECT role, content FROM lab_messages
    WHERE projectId = ?
    ORDER BY createdAt DESC LIMIT 8
  `).all(projectId) as any[]).reverse();

  // Salva mensagem do usuário
  const userMsgId = crypto.randomUUID();
  db.prepare(
    `INSERT INTO lab_messages (id, projectId, userId, role, content) VALUES (?, ?, ?, 'user', ?)`
  ).run(userMsgId, projectId, userId, content.trim());

  try {
    const agentResult = await runSimAgent({
      project,
      userMessage: content.trim(),
      recentMessages,
      modelToUse,
    });

    // Salva resposta do assistente
    const assistantMsgId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO lab_messages (id, projectId, userId, role, content, tokensUsed, creditsUsed, edit_plan, edit_scope, patched_functions)
      VALUES (?, ?, ?, 'assistant', ?, ?, ?, ?, ?, ?)
    `).run(
      assistantMsgId,
      projectId,
      userId,
      agentResult.explanation,
      agentResult.tokensUsed,
      agentResult.creditsUsed,
      agentResult.editPlan ? JSON.stringify(agentResult.editPlan) : null,
      agentResult.editScope,
      JSON.stringify(agentResult.patchedFunctions),
    );

    // Atualiza projeto com novo HTML, codeIndex e incrementa turnCount
    db.prepare(`
      UPDATE lab_projects
      SET htmlContent = ?,
          code_index = ?,
          turn_count = turn_count + 1,
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      agentResult.htmlContent,
      JSON.stringify(agentResult.codeIndex),
      projectId,
    );

    res.json({
      userMessage: db.prepare(`SELECT * FROM lab_messages WHERE id = ?`).get(userMsgId),
      assistantMessage: db.prepare(`SELECT * FROM lab_messages WHERE id = ?`).get(assistantMsgId),
      htmlContent: agentResult.htmlContent,
      editScope: agentResult.editScope,
      patchedFunctions: agentResult.patchedFunctions,
    });

    // Comprimir contexto de forma assíncrona, sem bloquear resposta
    const genAIForCompressor = new GoogleGenerativeAI((process.env.GEMINI_API_KEY || '').trim());
    compressProjectContext({ genAI: genAIForCompressor, projectId, db }).catch(console.error);

  } catch (err: any) {
    console.error(err);
    db.prepare(`DELETE FROM lab_messages WHERE id = ?`).run(userMsgId);
    const errorMessage = err.message?.includes('Limite') ? err.message : 'Falha ao gerar resposta do Lab Agent.';
    res.status(500).json({ error: errorMessage });
  }
});

// POST /api/lab/projects/:id/rate — Avaliar com estrelas (1-5)
app.post('/api/lab/projects/:id/rate', auth.authenticate, (req: any, res) => {
  const { id: projectId } = req.params;
  const { stars } = req.body;
  const userId = req.user.id;

  if (typeof stars !== 'number' || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'Estrelas devem ser entre 1 e 5.' });
  }

  const project = db.prepare('SELECT userId FROM lab_projects WHERE id = ?').get(projectId) as any;
  if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });
  if (project.userId === userId) return res.status(400).json({ error: 'Você não pode avaliar seu próprio projeto.' });

  db.prepare(`
    INSERT INTO lab_project_ratings (projectId, userId, stars)
    VALUES (?, ?, ?)
    ON CONFLICT(projectId, userId) DO UPDATE SET stars = excluded.stars
  `).run(projectId, userId, stars);

  res.json({ ok: true });
});

// POST /api/lab/projects/:id/feedback — Feedback do criador (like/dislike)
app.post('/api/lab/projects/:id/feedback', auth.authenticate, (req: any, res) => {
  const { id: projectId } = req.params;
  const { type } = req.body; // 'like' | 'dislike'
  const userId = req.user.id;

  const project = db.prepare('SELECT userId FROM lab_projects WHERE id = ?').get(projectId) as any;
  if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });
  if (project.userId !== userId) return res.status(403).json({ error: 'Apenas o dono pode dar feedback de objetivo.' });

  const value = type === 'like' ? 1 : -1;
  db.prepare('UPDATE lab_projects SET feedback_creator = ? WHERE id = ?').run(value, projectId);

  res.json({ ok: true });
});

// ==================== SECURITY ROUTES (Admin only) ====================

app.get('/api/admin/security/runs', auth.authenticate, requireAdmin, (req, res) => {
  const runs = db.prepare(
    'SELECT * FROM security_test_runs ORDER BY createdAt DESC LIMIT 20'
  ).all();
  res.json(runs);
});

app.get('/api/admin/security/runs/:runId', auth.authenticate, requireAdmin, (req, res) => {
  const { runId } = req.params;
  const run = db.prepare('SELECT * FROM security_test_runs WHERE id = ?').get(runId);
  if (!run) return res.status(404).json({ error: 'Run not found' });
  const results = db.prepare(
    'SELECT * FROM security_test_results WHERE runId = ? ORDER BY severity ASC'
  ).all(runId);
  res.json({ ...run as any, results });
});

// Serve static files in production
const __dirname = dirname(fileURLToPath(import.meta.url));
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../client/dist')));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
