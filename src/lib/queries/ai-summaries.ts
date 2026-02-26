import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";

export interface AISummary {
  id: string;
  session_id: string;
  summary_text: string;
  action_items: string | null;
  next_agenda: string | null;
  model: string;
  version: number;
  created_at: string;
}

export function getSummariesBySessionId(sessionId: string): AISummary[] {
  const db = getDb();
  return db.prepare(
    "SELECT * FROM ai_summaries WHERE session_id = ? ORDER BY version DESC"
  ).all(sessionId) as AISummary[];
}

export function getLatestSummary(sessionId: string): AISummary | undefined {
  const db = getDb();
  return db.prepare(
    "SELECT * FROM ai_summaries WHERE session_id = ? ORDER BY version DESC LIMIT 1"
  ).get(sessionId) as AISummary | undefined;
}

export function createSummary(
  sessionId: string,
  data: { summaryText: string; actionItems: string; nextAgenda: string; model: string }
): AISummary {
  const db = getDb();
  const id = nanoid();

  const lastVersion = db.prepare(
    "SELECT MAX(version) as max_ver FROM ai_summaries WHERE session_id = ?"
  ).get(sessionId) as { max_ver: number | null };
  const version = (lastVersion.max_ver || 0) + 1;

  db.prepare(`
    INSERT INTO ai_summaries (id, session_id, summary_text, action_items, next_agenda, model, version)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, sessionId, data.summaryText, data.actionItems, data.nextAgenda, data.model, version);

  return db.prepare("SELECT * FROM ai_summaries WHERE id = ?").get(id) as AISummary;
}

export function updateSummary(
  id: string,
  data: { summary_text?: string; action_items?: string; next_agenda?: string }
): AISummary | undefined {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.summary_text !== undefined) { fields.push("summary_text = ?"); values.push(data.summary_text); }
  if (data.action_items !== undefined) { fields.push("action_items = ?"); values.push(data.action_items); }
  if (data.next_agenda !== undefined) { fields.push("next_agenda = ?"); values.push(data.next_agenda); }

  if (fields.length === 0) return db.prepare("SELECT * FROM ai_summaries WHERE id = ?").get(id) as AISummary | undefined;
  values.push(id);

  db.prepare(`UPDATE ai_summaries SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return db.prepare("SELECT * FROM ai_summaries WHERE id = ?").get(id) as AISummary | undefined;
}
