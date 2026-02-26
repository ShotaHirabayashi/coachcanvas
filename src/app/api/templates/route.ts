import { NextRequest, NextResponse } from "next/server";
import { getTemplates, createTemplate } from "@/lib/queries/templates";
import { getDefaultUser } from "@/lib/queries/users";
import { templateSchema } from "@/lib/validators";

export async function GET() {
  try {
    const user = getDefaultUser();
    const templates = getTemplates(user.id);
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: "テンプレート一覧の取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getDefaultUser();
    const body = await request.json();
    const parsed = templateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容に誤りがあります", details: parsed.error.issues }, { status: 400 });
    }
    const template = createTemplate(user.id, parsed.data);
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "テンプレートの作成に失敗しました" }, { status: 500 });
  }
}
