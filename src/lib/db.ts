import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "coachcanvas.db");
const SCHEMA_PATH = path.join(process.cwd(), "src", "lib", "schema.sql");

function createDatabase(): Database.Database {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(DB_PATH);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  db.exec(schema);

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
