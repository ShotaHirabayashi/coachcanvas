import { NextRequest, NextResponse } from "next/server";
import { getSessions, createSession } from "@/lib/queries/sessions";
import { getDefaultUser } from "@/lib/queries/users";
import { sessionSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const user = getDefaultUser();
    const { searchParams } = new URL(request.url);
    const client_id = searchParams.get("client_id") || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const status = searchParams.get("status") || undefined;
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");

    const result = getSessions(user.id, { client_id, from, to, status, page, limit });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "セッション一覧の取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getDefaultUser();
    const body = await request.json();
    const parsed = sessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容に誤りがあります", details: parsed.error.issues }, { status: 400 });
    }
    const session = createSession(user.id, parsed.data);
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "セッションの作成に失敗しました" }, { status: 500 });
  }
}
