import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/queries/search";
import { getDefaultUser } from "@/lib/queries/users";

export async function GET(request: NextRequest) {
  try {
    const user = getDefaultUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    if (!q || q.trim().length === 0) {
      return NextResponse.json({ clients: [], sessions: [] });
    }
    const type = searchParams.get("type") || "all";
    const limit = Number(searchParams.get("limit") || "20");

    const result = search(user.id, q.trim(), type, limit);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "検索に失敗しました" }, { status: 500 });
  }
}
