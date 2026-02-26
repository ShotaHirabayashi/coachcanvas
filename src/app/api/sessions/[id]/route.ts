import { NextRequest, NextResponse } from "next/server";
import { getSessionById, updateSession, deleteSession } from "@/lib/queries/sessions";
import { getNoteBySessionId } from "@/lib/queries/notes";
import { getLatestSummary } from "@/lib/queries/ai-summaries";
import { getEmailsBySessionId } from "@/lib/queries/follow-up-emails";
import { sessionUpdateSchema } from "@/lib/validators";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getSessionById(id);
    if (!session) {
      return NextResponse.json({ error: "セッションが見つかりません" }, { status: 404 });
    }
    const note = getNoteBySessionId(id);
    const summary = getLatestSummary(id);
    const emails = getEmailsBySessionId(id);

    // Get previous session context
    const { getDb } = await import("@/lib/db");
    const db = getDb();
    const prevSession = db.prepare(`
      SELECT s.id FROM sessions s
      WHERE s.client_id = ? AND s.scheduled_at < ? AND s.id != ?
      ORDER BY s.scheduled_at DESC LIMIT 1
    `).get(session.client_id, session.scheduled_at, id) as { id: string } | undefined;

    let previousSummary = null;
    if (prevSession) {
      previousSummary = getLatestSummary(prevSession.id);
    }

    return NextResponse.json({
      ...session,
      note,
      summary,
      emails,
      previous_summary: previousSummary,
    });
  } catch (error) {
    return NextResponse.json({ error: "セッション情報の取得に失敗しました" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = sessionUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容に誤りがあります", details: parsed.error.issues }, { status: 400 });
    }
    const session = updateSession(id, parsed.data);
    if (!session) {
      return NextResponse.json({ error: "セッションが見つかりません" }, { status: 404 });
    }
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: "セッション情報の更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getSessionById(id);
    if (!session) {
      return NextResponse.json({ error: "セッションが見つかりません" }, { status: 404 });
    }
    deleteSession(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "セッションの削除に失敗しました" }, { status: 500 });
  }
}
