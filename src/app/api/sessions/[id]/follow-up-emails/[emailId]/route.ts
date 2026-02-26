import { NextRequest, NextResponse } from "next/server";
import { getEmailById, updateEmail, deleteEmail } from "@/lib/queries/follow-up-emails";
import { followUpEmailUpdateSchema } from "@/lib/validators";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; emailId: string }> }
) {
  try {
    const { emailId } = await params;
    const body = await request.json();
    const parsed = followUpEmailUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容に誤りがあります", details: parsed.error.issues }, { status: 400 });
    }
    const email = updateEmail(emailId, parsed.data);
    if (!email) {
      return NextResponse.json({ error: "メールが見つかりません" }, { status: 404 });
    }
    return NextResponse.json(email);
  } catch (error) {
    return NextResponse.json({ error: "メールの更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; emailId: string }> }
) {
  try {
    const { emailId } = await params;
    const email = getEmailById(emailId);
    if (!email) {
      return NextResponse.json({ error: "メールが見つかりません" }, { status: 404 });
    }
    deleteEmail(emailId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "メールの削除に失敗しました" }, { status: 500 });
  }
}
