import { NextRequest, NextResponse } from "next/server";
import { getTemplateById, updateTemplate, deleteTemplate } from "@/lib/queries/templates";
import { templateUpdateSchema } from "@/lib/validators";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = templateUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容に誤りがあります", details: parsed.error.issues }, { status: 400 });
    }
    const template = updateTemplate(id, parsed.data);
    if (!template) {
      return NextResponse.json({ error: "テンプレートが見つからないか、システムテンプレートです" }, { status: 404 });
    }
    return NextResponse.json(template);
  } catch (error) {
    return NextResponse.json({ error: "テンプレートの更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteTemplate(id);
    if (!deleted) {
      return NextResponse.json({ error: "テンプレートが見つからないか、システムテンプレートです" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "テンプレートの削除に失敗しました" }, { status: 500 });
  }
}
