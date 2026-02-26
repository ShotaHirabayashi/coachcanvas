import { getDb } from "@/lib/db";

export interface SearchResult {
  clients: {
    id: string;
    name: string;
    email: string | null;
    company: string | null;
    status: string;
  }[];
  sessions: {
    id: string;
    client_name: string;
    scheduled_at: string;
    snippet: string;
  }[];
}

export function search(userId: string, query: string, type: string = "all", limit: number = 20): SearchResult {
  const db = getDb();
  const result: SearchResult = { clients: [], sessions: [] };

  if (type === "all" || type === "clients") {
    const term = `%${query}%`;
    result.clients = db.prepare(`
      SELECT id, name, email, company, status
      FROM clients
      WHERE user_id = ? AND deleted_at IS NULL AND (name LIKE ? OR email LIKE ? OR company LIKE ?)
      LIMIT ?
    `).all(userId, term, term, term, limit) as SearchResult["clients"];
  }

  if (type === "all" || type === "sessions") {
    // Try FTS first, fall back to LIKE
    try {
      const ftsQuery = query.replace(/['"]/g, "").trim();
      if (ftsQuery) {
        result.sessions = db.prepare(`
          SELECT s.id, c.name as client_name, s.scheduled_at,
            substr(sn.plain_text, 1, 200) as snippet
          FROM session_notes_fts fts
          JOIN session_notes sn ON sn.rowid = fts.rowid
          JOIN sessions s ON s.id = sn.session_id
          JOIN clients c ON c.id = s.client_id
          WHERE s.user_id = ? AND session_notes_fts MATCH ?
          ORDER BY rank
          LIMIT ?
        `).all(userId, ftsQuery, limit) as SearchResult["sessions"];
      }
    } catch {
      // Fallback to LIKE search
      const term = `%${query}%`;
      result.sessions = db.prepare(`
        SELECT s.id, c.name as client_name, s.scheduled_at,
          substr(sn.plain_text, 1, 200) as snippet
        FROM session_notes sn
        JOIN sessions s ON s.id = sn.session_id
        JOIN clients c ON c.id = s.client_id
        WHERE s.user_id = ? AND sn.plain_text LIKE ?
        ORDER BY s.scheduled_at DESC
        LIMIT ?
      `).all(userId, term, limit) as SearchResult["sessions"];
    }
  }

  return result;
}
