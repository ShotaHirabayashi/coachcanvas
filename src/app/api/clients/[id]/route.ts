import { NextRequest, NextResponse } from "next/server";
import { getClientById, updateClient, deleteClient } from "@/lib/queries/clients";
import { getSessionsByClientId } from "@/lib/queries/sessions";
import { clientUpdateSchema } from "@/lib/validators";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getClientById(id);
    if (!client) {
      return NextResponse.json({ error: "クライアントが見つかりません" }, { status: 404 });
    }
    const sessions = getSessionsByClientId(id, 5);
    return NextResponse.json({ ...client, recent_sessions: sessions });
  } catch (error) {
    return NextResponse.json({ error: "クライアント情報の取得に失敗しました" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = clientUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容に誤りがあります", details: parsed.error.issues }, { status: 400 });
    }
    const client = updateClient(id, parsed.data);
    if (!client) {
      return NextResponse.json({ error: "クライアントが見つかりません" }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json({ error: "クライアント情報の更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getClientById(id);
    if (!client) {
      return NextResponse.json({ error: "クライアントが見つかりません" }, { status: 404 });
    }
    deleteClient(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "クライアントの削除に失敗しました" }, { status: 500 });
  }
}
