import { getDb } from "@/lib/db";

export interface DashboardData {
  upcoming_sessions: {
    id: string;
    client_id: string;
    client_name: string;
    scheduled_at: string;
    duration_minutes: number | null;
    session_number: number | null;
    has_note: number;
  }[];
  pending_followup_count: number;
  recent_sessions: {
    id: string;
    client_id: string;
    client_name: string;
    scheduled_at: string;
    status: string;
    has_summary: number;
  }[];
  stats: {
    total_clients: number;
    sessions_this_month: number;
    ai_usage_count: number;
    ai_usage_limit: number;
  };
}

export function getDashboardData(userId: string): DashboardData {
  const db = getDb();

  const upcoming_sessions = db.prepare(`
    SELECT s.id, s.client_id, c.name as client_name, s.scheduled_at, s.duration_minutes, s.session_number,
      (CASE WHEN sn.id IS NOT NULL THEN 1 ELSE 0 END) as has_note
    FROM sessions s
    JOIN clients c ON c.id = s.client_id
    LEFT JOIN session_notes sn ON sn.session_id = s.id
    WHERE s.user_id = ? AND s.status = 'scheduled' AND s.scheduled_at >= datetime('now', '-1 day')
    ORDER BY s.scheduled_at ASC
    LIMIT 5
  `).all(userId) as DashboardData["upcoming_sessions"];

  const pending = db.prepare(`
    SELECT COUNT(*) as count FROM sessions s
    WHERE s.user_id = ? AND s.status = 'completed'
    AND NOT EXISTS (
      SELECT 1 FROM follow_up_emails fe WHERE fe.session_id = s.id AND fe.status = 'sent'
    )
  `).get(userId) as { count: number };

  const recent_sessions = db.prepare(`
    SELECT s.id, s.client_id, c.name as client_name, s.scheduled_at, s.status,
      (CASE WHEN ai.id IS NOT NULL THEN 1 ELSE 0 END) as has_summary
    FROM sessions s
    JOIN clients c ON c.id = s.client_id
    LEFT JOIN (SELECT DISTINCT session_id, id FROM ai_summaries) ai ON ai.session_id = s.id
    WHERE s.user_id = ?
    ORDER BY s.scheduled_at DESC
    LIMIT 3
  `).all(userId) as DashboardData["recent_sessions"];

  const totalClients = db.prepare(
    "SELECT COUNT(*) as count FROM clients WHERE user_id = ? AND deleted_at IS NULL"
  ).get(userId) as { count: number };

  const sessionsThisMonth = db.prepare(`
    SELECT COUNT(*) as count FROM sessions
    WHERE user_id = ? AND scheduled_at >= date('now', 'start of month')
  `).get(userId) as { count: number };

  const user = db.prepare("SELECT ai_usage_count, plan FROM users WHERE id = ?").get(userId) as {
    ai_usage_count: number;
    plan: string;
  } | undefined;

  return {
    upcoming_sessions,
    pending_followup_count: pending.count,
    recent_sessions,
    stats: {
      total_clients: totalClients.count,
      sessions_this_month: sessionsThisMonth.count,
      ai_usage_count: user?.ai_usage_count || 0,
      ai_usage_limit: user?.plan === "free" ? 5 : 999,
    },
  };
}
