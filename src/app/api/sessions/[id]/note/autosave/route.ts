import { NextRequest, NextResponse } from "next/server";
import { autosaveNote } from "@/lib/queries/notes";
import { autosaveSchema } from "@/lib/validators";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = autosaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容に誤りがあります" }, { status: 400 });
    }
    const note = autosaveNote(id, parsed.data.content);
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: "自動保存に失敗しました" }, { status: 500 });
  }
}
