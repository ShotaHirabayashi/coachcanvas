export interface AISummaryResult {
  summaryText: string;
  actionItems: string;
  nextAgenda: string;
  model: string;
}

export interface FollowUpEmailResult {
  subject: string;
  body: string;
}

export function generateSummary(noteContent: string): AISummaryResult {
  const lines = noteContent.split("\n").filter((l) => l.trim());
  const bulletPoints = lines
    .slice(0, 5)
    .map((l) => l.replace(/^[-*#]\s*/, "").trim())
    .filter(Boolean);

  const topic1 = bulletPoints[0] || "セッションの振り返り";
  const topic2 = bulletPoints[1] || "中長期目標の進捗確認";
  const topic3 = bulletPoints[2] || "新たな気づきの整理";

  return {
    summaryText: `## セッション要約

### 主な話題
- ${topic1}
- ${topic2}
- ${topic3}

### 気づき・洞察
- クライアントは前回からの進捗について報告し、新たな視点を得ることができました
- 現在の課題に対する具体的なアプローチが明確になりました
- 自身の強みを活かした行動計画について前向きな姿勢が見られました

### 全体的な印象
セッション全体を通じて、クライアントは積極的に自己開示を行い、深い内省が見られました。次回のセッションでは、今回設定したアクションアイテムの振り返りと、さらなる目標の具体化が期待されます。`,
    actionItems: JSON.stringify([
      { item: topic1 + "について振り返りを行う", done: false },
      { item: "前回のアクションアイテムの進捗を確認する", done: false },
      { item: topic2 + "に取り組む", done: false },
    ]),
    nextAgenda: `## 次回のアジェンダ案

- 今回のアクションアイテムの振り返り
- ${topic2}
- ${topic3}
- 中長期目標に向けた次のステップの検討`,
    model: "mock",
  };
}

export function generateFollowUp(
  noteContent: string,
  clientName: string,
  summaryText: string
): FollowUpEmailResult {
  const lines = noteContent.split("\n").filter((l) => l.trim());
  const mainTopic = lines[0]?.replace(/^[-*#]\s*/, "").trim() || "本日のテーマ";

  return {
    subject: "【セッション振り返り】本日のセッションありがとうございました",
    body: `${clientName}様

お疲れさまでした。本日のセッションの振り返りをお送りいたします。

━━━━━━━━━━━━━━━━━━━━

${summaryText}

━━━━━━━━━━━━━━━━━━━━

次回のセッションまでに、上記のアクションアイテムに取り組んでいただければ幸いです。

何かご不明な点やご質問がございましたら、お気軽にご連絡ください。

引き続きよろしくお願いいたします。`,
  };
}
