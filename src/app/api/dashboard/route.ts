import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/queries/dashboard";
import { getDefaultUser } from "@/lib/queries/users";

export async function GET() {
  try {
    const user = getDefaultUser();
    const data = getDashboardData(user.id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "ダッシュボードデータの取得に失敗しました" }, { status: 500 });
  }
}
