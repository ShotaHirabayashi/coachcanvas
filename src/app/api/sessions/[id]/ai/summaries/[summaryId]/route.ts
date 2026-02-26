import { NextRequest, NextResponse } from "next/server";
import { updateSummary } from "@/lib/queries/ai-summaries";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; summaryId: string }> }
) {
  try {
    const { summaryId } = await params;
    const body = await request.json();
    const summary = updateSummary(summaryId, body);
    if (!summary) {
      return NextResponse.json({ error: "AI要約が見つかりません" }, { status: 404 });
    }
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json({ error: "AI要約の更新に失敗しました" }, { status: 500 });
  }
}
