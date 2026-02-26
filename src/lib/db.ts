import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const IS_VERCEL = !!process.env.VERCEL;
const DB_PATH = IS_VERCEL
  ? "/tmp/coachcanvas.db"
  : path.join(process.cwd(), "data", "coachcanvas.db");

const SCHEMA_SQL = `
-- ユーザー（コーチ）
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  title TEXT,
  specialty TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  ai_usage_count INTEGER NOT NULL DEFAULT 0,
  ai_usage_reset_at TEXT,
  timezone TEXT DEFAULT 'Asia/Tokyo',
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  email_signature TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

-- クライアント
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  goals TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  contract_start_date TEXT,
  contract_end_date TEXT,
  contract_total_sessions INTEGER,
  contract_fee INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- セッションテンプレート（sessionsより先に作成：外部キー参照のため）
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT,
  is_system INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- セッション
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  scheduled_at TEXT NOT NULL,
  duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled',
  session_number INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at ON sessions(scheduled_at);

-- セッションノート
CREATE TABLE IF NOT EXISTS session_notes (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE REFERENCES sessions(id),
  template_id TEXT REFERENCES templates(id),
  content TEXT,
  plain_text TEXT,
  is_draft INTEGER NOT NULL DEFAULT 1,
  auto_saved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- AI要約
CREATE TABLE IF NOT EXISTS ai_summaries (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  summary_text TEXT NOT NULL,
  action_items TEXT,
  next_agenda TEXT,
  model TEXT NOT NULL DEFAULT 'mock',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_summaries_session_id ON ai_summaries(session_id);

-- フォローアップメール
CREATE TABLE IF NOT EXISTS follow_up_emails (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_follow_up_emails_session_id ON follow_up_emails(session_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_emails_status ON follow_up_emails(status);

-- AI利用ログ
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  feature TEXT NOT NULL,
  session_id TEXT REFERENCES sessions(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);

-- 目標進捗スコア
CREATE TABLE IF NOT EXISTS goal_scores (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  session_id TEXT REFERENCES sessions(id),
  goal_label TEXT NOT NULL,
  score INTEGER NOT NULL CHECK(score >= 1 AND score <= 10),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_goal_scores_client_id ON goal_scores(client_id);

-- 全文検索（FTS5）
CREATE VIRTUAL TABLE IF NOT EXISTS session_notes_fts USING fts5(
  plain_text,
  content='session_notes',
  content_rowid='rowid'
);
`;

function createDatabase(): Database.Database {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(DB_PATH);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  db.exec(SCHEMA_SQL);

  // Seed default data if empty
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCount.count === 0) {
    seedDatabase(db);
  }

  return db;
}

function seedDatabase(db: Database.Database) {
  const { nanoid } = require("nanoid") as { nanoid: () => string };
  const userId = nanoid();

  db.prepare(`
    INSERT INTO users (id, email, name, title, specialty, plan, onboarding_completed)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, "coach@example.com", "デフォルトコーチ", "プロコーチ", "life", "free", 0);

  const templates = [
    {
      id: nanoid(),
      name: "ライフコーチング",
      description: "ライフコーチングセッション用テンプレート",
      category: "life",
      content: `## セッション記録

### 今日のテーマ
-

### クライアントの状態・気づき
-

### 話し合った内容
-

### アクションアイテム
-

### 次回に向けて
- `,
    },
    {
      id: nanoid(),
      name: "ビジネスコーチング",
      description: "ビジネスコーチングセッション用テンプレート",
      category: "business",
      content: `## セッション記録

### 今日の議題
-

### ビジネス課題の整理
-

### 戦略・アクションプラン
-

### KPI・目標の進捗
-

### 次回のアジェンダ
- `,
    },
    {
      id: nanoid(),
      name: "キャリアコーチング",
      description: "キャリアコーチングセッション用テンプレート",
      category: "career",
      content: `## セッション記録

### 今日のテーマ
-

### キャリアの現状分析
-

### 強み・価値観の深掘り
-

### アクションステップ
-

### 次回までの課題
- `,
    },
  ];

  const insertTemplate = db.prepare(`
    INSERT INTO templates (id, user_id, name, description, content, category, is_system, sort_order)
    VALUES (?, NULL, ?, ?, ?, ?, 1, ?)
  `);

  templates.forEach((t, i) => {
    insertTemplate.run(t.id, t.name, t.description, t.content, t.category, i);
  });
}

// Singleton pattern with HMR support
const globalForDb = globalThis as unknown as { __db?: Database.Database };

export function getDb(): Database.Database {
  if (!globalForDb.__db) {
    globalForDb.__db = createDatabase();
  }
  return globalForDb.__db;
}
