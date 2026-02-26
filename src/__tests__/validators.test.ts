import { describe, it, expect } from "vitest";
import {
  userSchema,
  userUpdateSchema,
  clientSchema,
  sessionSchema,
  noteSchema,
  templateSchema,
  goalScoreSchema,
  searchSchema,
  followUpEmailUpdateSchema,
  onboardingSchema,
} from "@/lib/validators";

describe("userSchema", () => {
  it("accepts valid user data", () => {
    const result = userSchema.safeParse({
      name: "テストコーチ",
      email: "coach@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = userSchema.safeParse({
      name: "",
      email: "coach@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = userSchema.safeParse({
      name: "コーチ",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("userUpdateSchema", () => {
  it("accepts partial updates", () => {
    const result = userUpdateSchema.safeParse({ name: "新しい名前" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = userUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("clientSchema", () => {
  it("accepts valid client", () => {
    const result = clientSchema.safeParse({ name: "田中太郎" });
    expect(result.success).toBe(true);
  });

  it("accepts client with all fields", () => {
    const result = clientSchema.safeParse({
      name: "田中太郎",
      email: "tanaka@example.com",
      phone: "090-1234-5678",
      company: "株式会社テスト",
      goals: "キャリアアップ",
      contract_total_sessions: 12,
      contract_fee: 50000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = clientSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("allows empty string for email", () => {
    const result = clientSchema.safeParse({ name: "テスト", email: "" });
    expect(result.success).toBe(true);
  });
});

describe("sessionSchema", () => {
  it("accepts valid session", () => {
    const result = sessionSchema.safeParse({
      client_id: "abc123",
      scheduled_at: "2025-01-15T10:00:00",
    });
    expect(result.success).toBe(true);
  });

  it("accepts session with optional fields", () => {
    const result = sessionSchema.safeParse({
      client_id: "abc123",
      scheduled_at: "2025-01-15T10:00:00",
      duration_minutes: 60,
      template_id: "tpl-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing client_id", () => {
    const result = sessionSchema.safeParse({
      scheduled_at: "2025-01-15T10:00:00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid duration", () => {
    const result = sessionSchema.safeParse({
      client_id: "abc123",
      scheduled_at: "2025-01-15T10:00:00",
      duration_minutes: 500,
    });
    expect(result.success).toBe(false);
  });
});

describe("noteSchema", () => {
  it("accepts valid note", () => {
    const result = noteSchema.safeParse({ content: "セッションノート内容" });
    expect(result.success).toBe(true);
  });
});

describe("templateSchema", () => {
  it("accepts valid template", () => {
    const result = templateSchema.safeParse({
      name: "テンプレート名",
      content: "テンプレート内容",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = templateSchema.safeParse({
      name: "",
      content: "内容",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = templateSchema.safeParse({
      name: "テンプレ",
      content: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("goalScoreSchema", () => {
  it("accepts valid score", () => {
    const result = goalScoreSchema.safeParse({
      goal_label: "目標達成度",
      score: 7,
    });
    expect(result.success).toBe(true);
  });

  it("rejects score below 1", () => {
    const result = goalScoreSchema.safeParse({
      goal_label: "目標",
      score: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects score above 10", () => {
    const result = goalScoreSchema.safeParse({
      goal_label: "目標",
      score: 11,
    });
    expect(result.success).toBe(false);
  });
});

describe("searchSchema", () => {
  it("accepts valid search", () => {
    const result = searchSchema.safeParse({ q: "田中" });
    expect(result.success).toBe(true);
  });

  it("rejects empty query", () => {
    const result = searchSchema.safeParse({ q: "" });
    expect(result.success).toBe(false);
  });

  it("applies defaults", () => {
    const result = searchSchema.safeParse({ q: "テスト" });
    if (result.success) {
      expect(result.data.type).toBe("all");
      expect(result.data.limit).toBe(20);
    }
  });
});

describe("followUpEmailUpdateSchema", () => {
  it("accepts valid email data", () => {
    const result = followUpEmailUpdateSchema.safeParse({
      subject: "件名",
      body: "本文",
      recipient_email: "client@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid recipient email", () => {
    const result = followUpEmailUpdateSchema.safeParse({
      subject: "件名",
      body: "本文",
      recipient_email: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("onboardingSchema", () => {
  it("accepts valid onboarding data", () => {
    const result = onboardingSchema.safeParse({
      name: "コーチ名",
      specialty: "life",
    });
    expect(result.success).toBe(true);
  });

  it("accepts with optional client info", () => {
    const result = onboardingSchema.safeParse({
      name: "コーチ名",
      specialty: "business",
      client_name: "クライアント名",
      client_email: "client@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid specialty", () => {
    const result = onboardingSchema.safeParse({
      name: "コーチ名",
      specialty: "invalid",
    });
    expect(result.success).toBe(false);
  });
});
