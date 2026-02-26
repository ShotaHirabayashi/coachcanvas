import { NextRequest, NextResponse } from "next/server";
import { upsertNote } from "@/lib/queries/notes";
import { noteSchema } from "@/lib/validators";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = noteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容に誤りがあります", details: parsed.error.issues }, { status: 400 });
    }
    const note = upsertNote(id, parsed.data.content, parsed.data.template_id);
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: "ノートの保存に失敗しました" }, { status: 500 });
  }
}
