import { describe, it, expect } from "vitest";
import { generateSummary, generateFollowUp } from "@/lib/ai";

describe("generateSummary", () => {
  it("returns summary with required fields", () => {
    const result = generateSummary("# テーマ\n目標設定\n振り返り");
    expect(result.summaryText).toContain("セッション要約");
    expect(result.summaryText).toContain("テーマ");
    expect(result.actionItems).toBeTruthy();
    expect(result.nextAgenda).toContain("次回のアジェンダ案");
    expect(result.model).toBe("mock");
  });

  it("handles empty note content", () => {
    const result = generateSummary("");
    expect(result.summaryText).toContain("セッション要約");
    expect(result.model).toBe("mock");
  });

  it("extracts topics from note content", () => {
    const result = generateSummary("キャリア目標の再確認\nスキルアップ計画");
    expect(result.summaryText).toContain("キャリア目標の再確認");
  });

  it("returns parseable action items JSON", () => {
    const result = generateSummary("テスト内容");
    const items = JSON.parse(result.actionItems);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toHaveProperty("item");
    expect(items[0]).toHaveProperty("done");
  });
});

describe("generateFollowUp", () => {
  it("returns email with subject and body", () => {
    const result = generateFollowUp(
      "本日のテーマ\n目標振り返り",
      "田中太郎",
      "要約テキスト"
    );
    expect(result.subject).toContain("セッション振り返り");
    expect(result.body).toContain("田中太郎");
    expect(result.body).toContain("要約テキスト");
  });

  it("includes client name in body", () => {
    const result = generateFollowUp("内容", "山田花子", "要約");
    expect(result.body).toContain("山田花子様");
  });

  it("handles empty note content", () => {
    const result = generateFollowUp("", "テスト", "要約");
    expect(result.subject).toBeTruthy();
    expect(result.body).toBeTruthy();
  });
});
