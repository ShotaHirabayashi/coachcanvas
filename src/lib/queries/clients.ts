import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  goals: string | null;
  notes: string | null;
  status: string;
  contract_start_date: string | null;
  contract_end_date: string | null;
  contract_total_sessions: number | null;
  contract_fee: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ClientWithStats extends Client {
  session_count: number;
  last_session_date: string | null;
  next_session_date: string | null;
}

export function getClients(
  userId: string,
  options: { search?: string; status?: string; page?: number; limit?: number } = {}
): { clients: ClientWithStats[]; total: number } {
  const db = getDb();
  const { search, status = "active", page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  let where = "c.user_id = ? AND c.deleted_at IS NULL";
  const params: (string | number)[] = [userId];

  if (status && status !== "all") {
    where += " AND c.status = ?";
    params.push(status);
  }

  if (search) {
    where += " AND (c.name LIKE ? OR c.email LIKE ?)";
    const term = `%${search}%`;
    params.push(term, term);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM clients c WHERE ${where}`).get(...params) as { count: number };

  const clients = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM sessions s WHERE s.client_id = c.id) as session_count,
      (SELECT MAX(s.scheduled_at) FROM sessions s WHERE s.client_id = c.id AND s.status = 'completed') as last_session_date,
      (SELECT MIN(s.scheduled_at) FROM sessions s WHERE s.client_id = c.id AND s.status = 'scheduled' AND s.scheduled_at >= datetime('now')) as next_session_date
    FROM clients c
    WHERE ${where}
    ORDER BY c.updated_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as ClientWithStats[];

  return { clients, total: total.count };
}

export function getClientById(id: string): ClientWithStats | undefined {
  const db = getDb();
  return db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM sessions s WHERE s.client_id = c.id) as session_count,
      (SELECT MAX(s.scheduled_at) FROM sessions s WHERE s.client_id = c.id AND s.status = 'completed') as last_session_date,
      (SELECT MIN(s.scheduled_at) FROM sessions s WHERE s.client_id = c.id AND s.status = 'scheduled' AND s.scheduled_at >= datetime('now')) as next_session_date
    FROM clients c
    WHERE c.id = ? AND c.deleted_at IS NULL
  `).get(id) as ClientWithStats | undefined;
}

export function getActiveClientCount(userId: string): number {
  const db = getDb();
  const result = db.prepare(
    "SELECT COUNT(*) as count FROM clients WHERE user_id = ? AND deleted_at IS NULL"
  ).get(userId) as { count: number };
  return result.count;
}

export function createClient(userId: string, data: Partial<Client>): Client {
  const db = getDb();
  const id = nanoid();
  db.prepare(`
    INSERT INTO clients (id, user_id, name, email, phone, company, goals, notes, contract_start_date, contract_end_date, contract_total_sessions, contract_fee)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, userId, data.name, data.email || null, data.phone || null,
    data.company || null, data.goals || null, data.notes || null,
    data.contract_start_date || null, data.contract_end_date || null,
    data.contract_total_sessions || null, data.contract_fee || null
  );
  return getClientById(id) as Client;
}

export function updateClient(id: string, data: Partial<Client>): Client | undefined {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  const allowedFields = ["name", "email", "phone", "company", "goals", "notes", "status",
    "contract_start_date", "contract_end_date", "contract_total_sessions", "contract_fee"];

  for (const field of allowedFields) {
    if (field in data) {
      fields.push(`${field} = ?`);
      values.push((data as Record<string, unknown>)[field] ?? null);
    }
  }

  if (fields.length === 0) return getClientById(id);

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE clients SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getClientById(id);
}

export function deleteClient(id: string): void {
  const db = getDb();
  db.prepare("UPDATE clients SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(id);
}

export function archiveClient(id: string): Client | undefined {
  const db = getDb();
  const client = getClientById(id);
  if (!client) return undefined;
  const newStatus = client.status === "active" ? "archived" : "active";
  db.prepare("UPDATE clients SET status = ?, updated_at = datetime('now') WHERE id = ?").run(newStatus, id);
  return getClientById(id);
}
