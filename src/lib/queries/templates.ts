import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";

export interface Template {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  content: string;
  category: string | null;
  is_system: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function getTemplates(userId?: string): Template[] {
  const db = getDb();
  return db.prepare(
    "SELECT * FROM templates WHERE is_system = 1 OR user_id = ? ORDER BY sort_order, name"
  ).all(userId || "") as Template[];
}

export function getTemplateById(id: string): Template | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM templates WHERE id = ?").get(id) as Template | undefined;
}

export function createTemplate(
  userId: string,
  data: { name: string; description?: string; content: string; category?: string }
): Template {
  const db = getDb();
  const id = nanoid();
  db.prepare(`
    INSERT INTO templates (id, user_id, name, description, content, category, is_system)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(id, userId, data.name, data.description || null, data.content, data.category || null);
  return db.prepare("SELECT * FROM templates WHERE id = ?").get(id) as Template;
}

export function updateTemplate(
  id: string,
  data: { name?: string; description?: string; content?: string; category?: string }
): Template | undefined {
  const db = getDb();
  const template = getTemplateById(id);
  if (!template || template.is_system) return undefined;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description); }
  if (data.content !== undefined) { fields.push("content = ?"); values.push(data.content); }
  if (data.category !== undefined) { fields.push("category = ?"); values.push(data.category); }

  if (fields.length === 0) return template;
  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE templates SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getTemplateById(id);
}

export function deleteTemplate(id: string): boolean {
  const db = getDb();
  const template = getTemplateById(id);
  if (!template || template.is_system) return false;
  db.prepare("DELETE FROM templates WHERE id = ?").run(id);
  return true;
}
