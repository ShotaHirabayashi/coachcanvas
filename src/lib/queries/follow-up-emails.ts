import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";

export interface FollowUpEmail {
  id: string;
  session_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  status: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export function getEmailsBySessionId(sessionId: string): FollowUpEmail[] {
  const db = getDb();
  return db.prepare(
    "SELECT * FROM follow_up_emails WHERE session_id = ? ORDER BY created_at DESC"
  ).all(sessionId) as FollowUpEmail[];
}

export function getEmailById(id: string): FollowUpEmail | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM follow_up_emails WHERE id = ?").get(id) as FollowUpEmail | undefined;
}

export function createEmail(
  sessionId: string,
  data: { recipient_email: string; subject: string; body: string }
): FollowUpEmail {
  const db = getDb();
  const id = nanoid();
  db.prepare(`
    INSERT INTO follow_up_emails (id, session_id, recipient_email, subject, body)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, sessionId, data.recipient_email, data.subject, data.body);
  return db.prepare("SELECT * FROM follow_up_emails WHERE id = ?").get(id) as FollowUpEmail;
}

export function updateEmail(
  id: string,
  data: { subject?: string; body?: string; recipient_email?: string }
): FollowUpEmail | undefined {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.subject !== undefined) { fields.push("subject = ?"); values.push(data.subject); }
  if (data.body !== undefined) { fields.push("body = ?"); values.push(data.body); }
  if (data.recipient_email !== undefined) { fields.push("recipient_email = ?"); values.push(data.recipient_email); }

  if (fields.length === 0) return getEmailById(id);
  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE follow_up_emails SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getEmailById(id);
}

export function sendEmail(id: string): FollowUpEmail | undefined {
  const db = getDb();
  // MVP: just mark as sent
  db.prepare(
    "UPDATE follow_up_emails SET status = 'sent', sent_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
  ).run(id);
  return getEmailById(id);
}

export function deleteEmail(id: string): void {
  const db = getDb();
  db.prepare("DELETE FROM follow_up_emails WHERE id = ?").run(id);
}

export function getPendingFollowUpCount(userId: string): number {
  const db = getDb();
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM sessions s
    WHERE s.user_id = ? AND s.status = 'completed'
    AND NOT EXISTS (
      SELECT 1 FROM follow_up_emails fe WHERE fe.session_id = s.id AND fe.status = 'sent'
    )
  `).get(userId) as { count: number };
  return result.count;
}
