import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";

export interface Session {
  id: string;
  client_id: string;
  user_id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  session_number: number | null;
  created_at: string;
  updated_at: string;
}

export interface SessionWithDetails extends Session {
  client_name: string;
  client_email: string | null;
  has_note: number;
  has_summary: number;
  has_follow_up: number;
}

export function getSessions(
  userId: string,
  options: { client_id?: string; from?: string; to?: string; status?: string; page?: number; limit?: number } = {}
): { sessions: SessionWithDetails[]; total: number } {
  const db = getDb();
  const { client_id, from, to, status, page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  let where = "s.user_id = ?";
  const params: (string | number)[] = [userId];

  if (client_id) {
    where += " AND s.client_id = ?";
    params.push(client_id);
  }
  if (from) {
    where += " AND s.scheduled_at >= ?";
    params.push(from);
  }
  if (to) {
    where += " AND s.scheduled_at <= ?";
    params.push(to);
  }
  if (status) {
    where += " AND s.status = ?";
    params.push(status);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM sessions s WHERE ${where}`).get(...params) as { count: number };

  const sessions = db.prepare(`
    SELECT s.*,
      c.name as client_name,
      c.email as client_email,
      (CASE WHEN sn.id IS NOT NULL THEN 1 ELSE 0 END) as has_note,
      (CASE WHEN ai.id IS NOT NULL THEN 1 ELSE 0 END) as has_summary,
      (CASE WHEN fe.id IS NOT NULL THEN 1 ELSE 0 END) as has_follow_up
    FROM sessions s
    JOIN clients c ON c.id = s.client_id
    LEFT JOIN session_notes sn ON sn.session_id = s.id
    LEFT JOIN (SELECT DISTINCT session_id, id FROM ai_summaries) ai ON ai.session_id = s.id
    LEFT JOIN (SELECT DISTINCT session_id, id FROM follow_up_emails) fe ON fe.session_id = s.id
    WHERE ${where}
    ORDER BY s.scheduled_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as SessionWithDetails[];

  return { sessions, total: total.count };
}

export function getSessionById(id: string): SessionWithDetails | undefined {
  const db = getDb();
  return db.prepare(`
    SELECT s.*,
      c.name as client_name,
      c.email as client_email,
      (CASE WHEN sn.id IS NOT NULL THEN 1 ELSE 0 END) as has_note,
      (CASE WHEN ai.id IS NOT NULL THEN 1 ELSE 0 END) as has_summary,
      (CASE WHEN fe.id IS NOT NULL THEN 1 ELSE 0 END) as has_follow_up
    FROM sessions s
    JOIN clients c ON c.id = s.client_id
    LEFT JOIN session_notes sn ON sn.session_id = s.id
    LEFT JOIN (SELECT DISTINCT session_id, id FROM ai_summaries) ai ON ai.session_id = s.id
    LEFT JOIN (SELECT DISTINCT session_id, id FROM follow_up_emails) fe ON fe.session_id = s.id
    WHERE s.id = ?
  `).get(id) as SessionWithDetails | undefined;
}

export function createSession(
  userId: string,
  data: { client_id: string; scheduled_at: string; duration_minutes?: number; template_id?: string }
): Session {
  const db = getDb();
  const id = nanoid();

  // Auto-increment session_number per client
  const lastSession = db.prepare(
    "SELECT MAX(session_number) as max_num FROM sessions WHERE client_id = ?"
  ).get(data.client_id) as { max_num: number | null };
  const sessionNumber = (lastSession.max_num || 0) + 1;

  db.prepare(`
    INSERT INTO sessions (id, client_id, user_id, scheduled_at, duration_minutes, session_number)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.client_id, userId, data.scheduled_at, data.duration_minutes || null, sessionNumber);

  // Create empty note if template provided
  if (data.template_id) {
    const template = db.prepare("SELECT content FROM templates WHERE id = ?").get(data.template_id) as { content: string } | undefined;
    if (template) {
      const noteId = nanoid();
      db.prepare(`
        INSERT INTO session_notes (id, session_id, template_id, content, plain_text)
        VALUES (?, ?, ?, ?, ?)
      `).run(noteId, id, data.template_id, template.content, template.content);
    }
  }

  return db.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as Session;
}

export function updateSession(id: string, data: Partial<Session>): Session | undefined {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.scheduled_at !== undefined) { fields.push("scheduled_at = ?"); values.push(data.scheduled_at); }
  if (data.duration_minutes !== undefined) { fields.push("duration_minutes = ?"); values.push(data.duration_minutes); }
  if (data.status !== undefined) { fields.push("status = ?"); values.push(data.status); }

  if (fields.length === 0) return getSessionById(id);
  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE sessions SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getSessionById(id);
}

export function deleteSession(id: string): void {
  const db = getDb();
  db.prepare("DELETE FROM follow_up_emails WHERE session_id = ?").run(id);
  db.prepare("DELETE FROM ai_summaries WHERE session_id = ?").run(id);
  db.prepare("DELETE FROM ai_usage_logs WHERE session_id = ?").run(id);
  db.prepare("DELETE FROM goal_scores WHERE session_id = ?").run(id);
  db.prepare("DELETE FROM session_notes WHERE session_id = ?").run(id);
  db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
}

export function getSessionsByClientId(clientId: string, limit = 10): SessionWithDetails[] {
  const db = getDb();
  return db.prepare(`
    SELECT s.*,
      c.name as client_name,
      c.email as client_email,
      (CASE WHEN sn.id IS NOT NULL THEN 1 ELSE 0 END) as has_note,
      (CASE WHEN ai.id IS NOT NULL THEN 1 ELSE 0 END) as has_summary,
      (CASE WHEN fe.id IS NOT NULL THEN 1 ELSE 0 END) as has_follow_up
    FROM sessions s
    JOIN clients c ON c.id = s.client_id
    LEFT JOIN session_notes sn ON sn.session_id = s.id
    LEFT JOIN (SELECT DISTINCT session_id, id FROM ai_summaries) ai ON ai.session_id = s.id
    LEFT JOIN (SELECT DISTINCT session_id, id FROM follow_up_emails) fe ON fe.session_id = s.id
    WHERE s.client_id = ?
    ORDER BY s.scheduled_at DESC
    LIMIT ?
  `).all(clientId, limit) as SessionWithDetails[];
}
