import { NextRequest, NextResponse } from "next/server";
import { getNoteBySessionId } from "@/lib/queries/notes";
import { createSummary } from "@/lib/queries/ai-summaries";
import { getDefaultUser, checkAiUsageLimit, incrementAiUsage } from "@/lib/queries/users";
import { generateSummary } from "@/lib/ai";
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

    // Get note content
    const note = getNoteBySessionId(id);
    if (!note || !note.content || note.content.trim().length < 10) {
      return NextResponse.json({
        error: "AI要約を生成するには、ノートに十分な内容を入力してください",
      }, { status: 400 });
    }

    // Generate summary (mock)
    const result = generateSummary(note.content);
    const summary = createSummary(id, result);

    // Record AI usage
    incrementAiUsage(user.id);
    const db = getDb();
    db.prepare(
      "INSERT INTO ai_usage_logs (id, user_id, feature, session_id) VALUES (?, ?, ?, ?)"
    ).run(nanoid(), user.id, "summary", id);

    return NextResponse.json(summary, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "AI要約の生成に失敗しました" }, { status: 500 });
  }
}
