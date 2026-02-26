import { NextRequest, NextResponse } from "next/server";
import { getSummariesBySessionId } from "@/lib/queries/ai-summaries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const summaries = getSummariesBySessionId(id);
    return NextResponse.json(summaries);
  } catch (error) {
    return NextResponse.json({ error: "AI要約履歴の取得に失敗しました" }, { status: 500 });
  }
}
