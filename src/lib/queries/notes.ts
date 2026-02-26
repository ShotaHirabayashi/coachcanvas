import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";
import { stripMarkdown } from "@/lib/utils";

export interface SessionNote {
  id: string;
  session_id: string;
  template_id: string | null;
  content: string | null;
  plain_text: string | null;
  is_draft: number;
  auto_saved_at: string | null;
  created_at: string;
  updated_at: string;
}

export function getNoteBySessionId(sessionId: string): SessionNote | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM session_notes WHERE session_id = ?").get(sessionId) as SessionNote | undefined;
}

export function upsertNote(sessionId: string, content: string, templateId?: string): SessionNote {
  const db = getDb();
  const plainText = stripMarkdown(content);
  const existing = getNoteBySessionId(sessionId);

  if (existing) {
    db.prepare(`
      UPDATE session_notes
      SET content = ?, plain_text = ?, template_id = COALESCE(?, template_id), updated_at = datetime('now')
      WHERE session_id = ?
    `).run(content, plainText, templateId || null, sessionId);

    // Update FTS
    db.prepare("DELETE FROM session_notes_fts WHERE rowid = (SELECT rowid FROM session_notes WHERE id = ?)").run(existing.id);
    db.prepare("INSERT INTO session_notes_fts(rowid, plain_text) SELECT rowid, plain_text FROM session_notes WHERE id = ?").run(existing.id);
  } else {
    const id = nanoid();
    db.prepare(`
      INSERT INTO session_notes (id, session_id, template_id, content, plain_text)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, sessionId, templateId || null, content, plainText);

    // Insert into FTS
    db.prepare("INSERT INTO session_notes_fts(rowid, plain_text) SELECT rowid, plain_text FROM session_notes WHERE id = ?").run(id);
  }

  return getNoteBySessionId(sessionId) as SessionNote;
}

export function autosaveNote(sessionId: string, content: string): SessionNote {
  const db = getDb();
  const plainText = stripMarkdown(content);
  const existing = getNoteBySessionId(sessionId);

  if (existing) {
    db.prepare(`
      UPDATE session_notes SET content = ?, plain_text = ?, auto_saved_at = datetime('now'), updated_at = datetime('now')
      WHERE session_id = ?
    `).run(content, plainText, sessionId);

    db.prepare("DELETE FROM session_notes_fts WHERE rowid = (SELECT rowid FROM session_notes WHERE id = ?)").run(existing.id);
    db.prepare("INSERT INTO session_notes_fts(rowid, plain_text) SELECT rowid, plain_text FROM session_notes WHERE id = ?").run(existing.id);
  } else {
    const id = nanoid();
    db.prepare(`
      INSERT INTO session_notes (id, session_id, content, plain_text, auto_saved_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(id, sessionId, content, plainText);

    db.prepare("INSERT INTO session_notes_fts(rowid, plain_text) SELECT rowid, plain_text FROM session_notes WHERE id = ?").run(id);
  }

  return getNoteBySessionId(sessionId) as SessionNote;
}
