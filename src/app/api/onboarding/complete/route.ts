import { NextRequest, NextResponse } from "next/server";
import { getDefaultUser, updateUser } from "@/lib/queries/users";
import { createClient } from "@/lib/queries/clients";
import { onboardingSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const user = getDefaultUser();
    const body = await request.json();
    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容に誤りがあります", details: parsed.error.issues }, { status: 400 });
    }

    // Update user profile
    updateUser(user.id, {
      name: parsed.data.name,
      specialty: parsed.data.specialty,
      onboarding_completed: 1,
    } as never);

    // Create first client if provided
    if (parsed.data.client_name) {
      createClient(user.id, {
        name: parsed.data.client_name,
        email: parsed.data.client_email || null,
      } as never);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "オンボーディングの完了に失敗しました" }, { status: 500 });
  }
}
