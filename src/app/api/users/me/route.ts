import { NextRequest, NextResponse } from "next/server";
import { getDefaultUser, updateUser } from "@/lib/queries/users";
import { userUpdateSchema } from "@/lib/validators";

export async function GET() {
  try {
    const user = getDefaultUser();
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "ユーザー情報の取得に失敗しました" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = getDefaultUser();
    const body = await request.json();
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容に誤りがあります", details: parsed.error.issues }, { status: 400 });
    }
    const updated = updateUser(user.id, parsed.data);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "ユーザー情報の更新に失敗しました" }, { status: 500 });
  }
}
