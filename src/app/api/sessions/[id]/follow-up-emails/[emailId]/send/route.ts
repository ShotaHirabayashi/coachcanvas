import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getEmailById } from "@/lib/queries/follow-up-emails";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; emailId: string }> }
) {
  try {
    const { emailId } = await params;
    const existing = getEmailById(emailId);
    if (!existing) {
      return NextResponse.json({ error: "メールが見つかりません" }, { status: 404 });
    }
    const email = sendEmail(emailId);
    return NextResponse.json(email);
  } catch (error) {
    return NextResponse.json({ error: "メールの送信に失敗しました" }, { status: 500 });
  }
}
