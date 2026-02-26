import { getDb } from "@/lib/db";

export interface User {
  id: string;
  email: string;
  name: string;
  title: string | null;
  specialty: string | null;
  plan: string;
  ai_usage_count: number;
  ai_usage_reset_at: string | null;
  timezone: string;
  onboarding_completed: number;
  email_signature: string | null;
  created_at: string;
  updated_at: string;
}

export function getDefaultUser(): User {
  const db = getDb();
  const user = db.prepare("SELECT * FROM users LIMIT 1").get() as User | undefined;
  if (!user) throw new Error("No default user found");
  return user;
}

export function getUserById(id: string): User | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export function updateUser(
  id: string,
  data: Partial<User>
): User | undefined {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  const allowedFields = ["name", "email", "title", "specialty", "timezone", "email_signature", "onboarding_completed"];
  for (const field of allowedFields) {
    if (field in data) {
      fields.push(`${field} = ?`);
      values.push((data as Record<string, unknown>)[field] ?? null);
    }
  }

  if (fields.length === 0) return getUserById(id);
  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getUserById(id);
}

export function incrementAiUsage(userId: string): { count: number; limit: number } {
  const db = getDb();
  const user = getUserById(userId);
  if (!user) throw new Error("User not found");

  // Check if we need to reset the monthly counter
  const now = new Date();
  if (user.ai_usage_reset_at) {
    const resetAt = new Date(user.ai_usage_reset_at);
    if (now >= resetAt) {
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      db.prepare(
        "UPDATE users SET ai_usage_count = 1, ai_usage_reset_at = ? WHERE id = ?"
      ).run(nextReset, userId);
      return { count: 1, limit: user.plan === "free" ? 5 : 999 };
    }
  } else {
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    db.prepare("UPDATE users SET ai_usage_reset_at = ? WHERE id = ?").run(nextReset, userId);
  }

  db.prepare("UPDATE users SET ai_usage_count = ai_usage_count + 1 WHERE id = ?").run(userId);
  const updated = getUserById(userId)!;
  return { count: updated.ai_usage_count, limit: user.plan === "free" ? 5 : 999 };
}

export function checkAiUsageLimit(userId: string): { allowed: boolean; count: number; limit: number } {
  const db = getDb();
  const user = getUserById(userId);
  if (!user) return { allowed: false, count: 0, limit: 0 };

  const limit = user.plan === "free" ? 5 : 999;

  // Check if counter needs reset
  if (user.ai_usage_reset_at) {
    const resetAt = new Date(user.ai_usage_reset_at);
    if (new Date() >= resetAt) {
      return { allowed: true, count: 0, limit };
    }
  }

  return { allowed: user.ai_usage_count < limit, count: user.ai_usage_count, limit };
}
