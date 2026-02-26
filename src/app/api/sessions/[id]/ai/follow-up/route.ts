import { NextRequest, NextResponse } from "next/server";
import { getSessionById } from "@/lib/queries/sessions";
import { getNoteBySessionId } from "@/lib/queries/notes";
import { getLatestSummary } from "@/lib/queries/ai-summaries";
import { createEmail } from "@/lib/queries/follow-up-emails";
import { getDefaultUser, checkAiUsageLimit, incrementAiUsage } from "@/lib/queries/users";
import { generateFollowUp } from "@/lib/ai";
import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getDefaultUser();

    // Check AI usage limit
    const usage = checkAiUsageLimit(user.id);
    if (!usage.allowed) {
      return NextResponse.json({
        error: "今月のAI利用回数に達しました",
        code: "AI_LIMIT",
        count: usage.count,
        limit: usage.limit,
      }, { status: 403 });
    }

    const session = getSessionById(id);
    if (!session) {
      return NextResponse.json({ error: "セッションが見つかりません" }, { status: 404 });
    }

    const note = getNoteBySessionId(id);
    const summary = getLatestSummary(id);
    const noteContent = note?.content || "";
    const summaryText = summary?.summary_text || "";

    const result = generateFollowUp(noteContent, session.client_name, summaryText);
    const recipientEmail = session.client_email || "client@example.com";

    const email = createEmail(id, {
      recipient_email: recipientEmail,
      subject: result.subject,
      body: result.body,
    });

    // Record AI usage
    incrementAiUsage(user.id);
    const db = getDb();
    db.prepare(
      "INSERT INTO ai_usage_logs (id, user_id, feature, session_id) VALUES (?, ?, ?, ?)"
    ).run(nanoid(), user.id, "follow_up", id);

    return NextResponse.json(email, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "フォローアップメールの生成に失敗しました" }, { status: 500 });
  }
}
