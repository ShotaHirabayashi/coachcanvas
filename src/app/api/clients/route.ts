import { NextRequest, NextResponse } from "next/server";
import { getClients, createClient, getActiveClientCount } from "@/lib/queries/clients";
import { getDefaultUser } from "@/lib/queries/users";
import { clientSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const user = getDefaultUser();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");

    const result = getClients(user.id, { search, status, page, limit });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "クライアント一覧の取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getDefaultUser();
    const body = await request.json();
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容に誤りがあります", details: parsed.error.issues }, { status: 400 });
    }

    // Free plan limit check
    if (user.plan === "free") {
      const count = getActiveClientCount(user.id);
      if (count >= 3) {
        return NextResponse.json({
          error: "無料プランではクライアント3名まで登録できます",
          code: "PLAN_LIMIT",
        }, { status: 403 });
      }
    }

    const client = createClient(user.id, parsed.data);
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "クライアントの作成に失敗しました" }, { status: 500 });
  }
}
