import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'tutorai.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS institutions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT UNIQUE, -- e.g. @ucs.br
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    isAdmin INTEGER DEFAULT 0,
    themeMode TEXT DEFAULT 'dark',
    accentColor TEXT DEFAULT 'blue',
    tokensProfessor INTEGER DEFAULT 0,
    lastResetProfessor TEXT,
    tokensTutor INTEGER DEFAULT 0,
    lastResetTutor TEXT,
    tokensColega INTEGER DEFAULT 0,
    lastResetColega TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_institutions (
    userId TEXT NOT NULL,
    institutionId TEXT NOT NULL,
    PRIMARY KEY (userId, institutionId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (institutionId) REFERENCES institutions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS personas (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    institutionId TEXT, -- NULL means public (Tutor Genérico)
    nome TEXT NOT NULL,
    descricao TEXT DEFAULT '',
    saudacao TEXT DEFAULT '',
    documentoPedagogico TEXT DEFAULT '',
    isGenerico INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (institutionId) REFERENCES institutions(id)
  );

  CREATE TABLE IF NOT EXISTS disciplinas (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    institutionId TEXT NOT NULL,
    nome TEXT NOT NULL,
    conteudo TEXT DEFAULT '',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (institutionId) REFERENCES institutions(id)
  );

  CREATE TABLE IF NOT EXISTS persona_disciplina (
    personaId TEXT NOT NULL,
    disciplinaId TEXT NOT NULL,
    PRIMARY KEY (personaId, disciplinaId),
    FOREIGN KEY (personaId) REFERENCES personas(id) ON DELETE CASCADE,
    FOREIGN KEY (disciplinaId) REFERENCES disciplinas(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    title TEXT NOT NULL,
    persona TEXT NOT NULL,
    personaDbId TEXT,
    disciplinaId TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chatId TEXT NOT NULL,
    userId TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    tokensUsed INTEGER DEFAULT 0,
    creditsUsed INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatId) REFERENCES chats(id),
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS lab_projects (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    institutionId TEXT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    htmlContent TEXT DEFAULT '',
    isPublic INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS lab_messages (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    userId TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    tokensUsed INTEGER DEFAULT 0,
    creditsUsed INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES lab_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id)
  );
`);

// Create classrooms table
db.exec(`
  CREATE TABLE IF NOT EXISTS classrooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    institutionId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institutionId) REFERENCES institutions(id) ON DELETE CASCADE
  );
`);

// Migration: add classroomId to users table if not exists
const userCols = db.prepare("PRAGMA table_info(users)").all() as any[];
const classroomIdCol = userCols.find((c: any) => c.name === 'classroomId');
if (!classroomIdCol) {
  db.exec(`ALTER TABLE users ADD COLUMN classroomId TEXT REFERENCES classrooms(id) ON DELETE SET NULL;`);
}

// Migration: make lab_projects.institutionId nullable (recreate if still NOT NULL)
const labCols = db.prepare("PRAGMA table_info(lab_projects)").all() as any[];
const instCol = labCols.find((c: any) => c.name === 'institutionId');
if (instCol && instCol.notnull === 1) {
  db.exec(`
    PRAGMA foreign_keys=off;
    CREATE TABLE lab_projects_new (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      institutionId TEXT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      htmlContent TEXT DEFAULT '',
      isPublic INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
    INSERT INTO lab_projects_new SELECT * FROM lab_projects;
    DROP TABLE lab_projects;
    ALTER TABLE lab_projects_new RENAME TO lab_projects;
    PRAGMA foreign_keys=on;
  `);
}

// Add imageUrl to personas if not already present
const personaCols = db.prepare("PRAGMA table_info(personas)").all() as any[];
if (!personaCols.find((c: any) => c.name === 'imageUrl')) {
  db.exec("ALTER TABLE personas ADD COLUMN imageUrl TEXT DEFAULT ''");
}

// Security test tables
db.exec(`
  CREATE TABLE IF NOT EXISTS security_test_runs (
    id TEXT PRIMARY KEY,
    totalTests INTEGER DEFAULT 0,
    passed INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    warnings INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS security_test_results (
    id TEXT PRIMARY KEY,
    runId TEXT NOT NULL,
    testId TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    details TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (runId) REFERENCES security_test_runs(id) ON DELETE CASCADE
  );
`);

// SimAgent migration: add new columns idempotently
import { runSimAgentMigration } from './migrations/add_simagent_columns.js';
runSimAgentMigration(db);

// Seed Initial Data
import { DEFAULT_PERSONAS } from './defaultPersonas.js';

// Ensure system user exists
db.prepare(`
  INSERT OR IGNORE INTO users (id, name, email, password, role, isAdmin)
  VALUES (?, ?, ?, ?, ?, ?)
`).run('system', 'System', 'system@scafi.edu', 'internal', 'admin', 1);

// Seed Institution (UCS)
db.prepare(`
  INSERT OR IGNORE INTO institutions (id, name, domain)
  VALUES (?, ?, ?)
`).run('ucs', 'UCS - Universidade de Caxias do Sul', '@ucs.br');

const insertPersona = db.prepare(`
  INSERT OR IGNORE INTO personas (id, userId, institutionId, nome, descricao, saudacao, documentoPedagogico, isGenerico)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const p of DEFAULT_PERSONAS) {
  // Tutor Genérico is public (institutionId = null), Agostinho is UCS
  const instId = p.id === 'tutor-generico' ? null : 'ucs';
  insertPersona.run(p.id, 'system', instId, p.nome, p.descricao, p.saudacao, p.documentoPedagogico, p.isGenerico ? 1 : 0);
}

export default db;
