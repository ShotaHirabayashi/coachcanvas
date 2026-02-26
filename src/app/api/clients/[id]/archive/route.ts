import { NextRequest, NextResponse } from "next/server";
import { archiveClient } from "@/lib/queries/clients";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = archiveClient(id);
    if (!client) {
      return NextResponse.json({ error: "クライアントが見つかりません" }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json({ error: "ステータスの変更に失敗しました" }, { status: 500 });
  }
}
