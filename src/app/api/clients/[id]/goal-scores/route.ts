import { NextRequest, NextResponse } from "next/server";
import { getGoalScores, createGoalScore } from "@/lib/queries/goal-scores";
import { goalScoreSchema } from "@/lib/validators";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scores = getGoalScores(id);
    return NextResponse.json(scores);
  } catch (error) {
    return NextResponse.json({ error: "目標スコアの取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = goalScoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容に誤りがあります", details: parsed.error.issues }, { status: 400 });
    }
    const score = createGoalScore(id, parsed.data);
    return NextResponse.json(score, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "目標スコアの記録に失敗しました" }, { status: 500 });
  }
}
