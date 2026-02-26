"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Check } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const steps = [
  { id: 1, title: "プロフィール設定" },
  { id: 2, title: "最初のクライアント" },
  { id: 3, title: "AI要約を体験" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    specialty: "life",
    client_name: "",
    client_email: "",
  });
  const [demoSummary, setDemoSummary] = useState("");

  const handleComplete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast("オンボーディングが完了しました！");
        router.push("/dashboard");
      } else {
        toast("エラーが発生しました", "error");
      }
    } catch {
      toast("エラーが発生しました", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSummary = () => {
    setDemoSummary(`## セッション要約（デモ）

### 主な話題
- クライアントの現状とゴールの確認
- 行動パターンの分析と気づき
- 次のステップの検討

### 気づき・洞察
- クライアントは自身の強みを活かした行動計画に前向きな姿勢を示しました
- 現在の課題に対する具体的なアプローチが明確になりました

### アクションアイテム
- [ ] 週に1回の振り返りジャーナルを始める
- [ ] 次回までに3つの具体的な行動目標を設定する`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step > s.id
                  ? "bg-indigo-600 text-white"
                  : step === s.id
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}>
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              {s.id < steps.length && (
                <div className={`w-12 h-0.5 ${step > s.id ? "bg-indigo-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="py-8">
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">プロフィール設定</h2>
                  <p className="text-sm text-gray-500 mt-1">まずはあなたのことを教えてください</p>
                </div>
                <Input
                  id="name"
                  label="お名前"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="山田太郎"
                />
                <Select
                  id="specialty"
                  label="専門分野"
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  options={[
                    { value: "life", label: "ライフコーチング" },
                    { value: "business", label: "ビジネスコーチング" },
                    { value: "career", label: "キャリアコーチング" },
                    { value: "other", label: "その他" },
                  ]}
                />
                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={() => router.push("/dashboard")}>スキップ</Button>
                  <Button onClick={() => setStep(2)} disabled={!form.name.trim()}>次へ</Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">最初のクライアント</h2>
                  <p className="text-sm text-gray-500 mt-1">クライアントを1名登録しましょう（後からでもOK）</p>
                </div>
                <Input
                  id="client_name"
                  label="クライアント名"
                  value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                  placeholder="クライアントの名前"
                />
                <Input
                  id="client_email"
                  label="メールアドレス（任意）"
                  type="email"
                  value={form.client_email}
                  onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                  placeholder="client@example.com"
                />
                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={() => setStep(3)}>スキップ</Button>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setStep(1)}>戻る</Button>
                    <Button onClick={() => setStep(3)}>次へ</Button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">AI要約を体験</h2>
                  <p className="text-sm text-gray-500 mt-1">ボタンを押して、AI要約の生成を体験してみましょう</p>
                </div>
                <div className="flex justify-center">
                  <Button onClick={handleDemoSummary} size="lg">
                    <Brain className="w-5 h-5 mr-2" />
                    AI要約を生成（デモ）
                  </Button>
                </div>
                {demoSummary && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">{demoSummary}</pre>
                  </div>
                )}
                <div className="flex justify-between pt-4">
                  <Button variant="secondary" onClick={() => setStep(2)}>戻る</Button>
                  <Button onClick={handleComplete} loading={loading}>完了してダッシュボードへ</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
