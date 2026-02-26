import { NextRequest, NextResponse } from "next/server";
import { getEmailsBySessionId } from "@/lib/queries/follow-up-emails";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const emails = getEmailsBySessionId(id);
    return NextResponse.json(emails);
  } catch (error) {
    return NextResponse.json({ error: "メール一覧の取得に失敗しました" }, { status: 500 });
  }
}
