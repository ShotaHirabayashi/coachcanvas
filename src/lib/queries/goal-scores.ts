import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";

export interface GoalScore {
  id: string;
  client_id: string;
  session_id: string | null;
  goal_label: string;
  score: number;
  note: string | null;
  created_at: string;
}

export function getGoalScores(clientId: string): GoalScore[] {
  const db = getDb();
  return db.prepare(
    "SELECT * FROM goal_scores WHERE client_id = ? ORDER BY created_at ASC"
  ).all(clientId) as GoalScore[];
}

export function createGoalScore(
  clientId: string,
  data: { goal_label: string; score: number; session_id?: string; note?: string }
): GoalScore {
  const db = getDb();
  const id = nanoid();
  db.prepare(`
    INSERT INTO goal_scores (id, client_id, session_id, goal_label, score, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, clientId, data.session_id || null, data.goal_label, data.score, data.note || null);
  return db.prepare("SELECT * FROM goal_scores WHERE id = ?").get(id) as GoalScore;
}
