"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { CardSkeleton } from "@/components/ui/skeleton";

interface UserProfile {
  name: string;
  email: string;
  title: string;
  specialty: string;
  timezone: string;
  email_signature: string;
  plan: string;
  ai_usage_count: number;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        setProfile({
          name: data.name || "",
          email: data.email || "",
          title: data.title || "",
          specialty: data.specialty || "",
          timezone: data.timezone || "Asia/Tokyo",
          email_signature: data.email_signature || "",
          plan: data.plan || "free",
          ai_usage_count: data.ai_usage_count || 0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        toast("設定を保存しました");
      } else {
        toast("保存に失敗しました", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <PageContainer>
        <Header title="設定" />
        <CardSkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header title="設定" />

      <div className="space-y-6 max-w-2xl">
        {/* Profile */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">プロフィール</h2>
          </div>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="settings-name"
                label="名前"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
              <Input
                id="settings-email"
                label="メールアドレス"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
              <Input
                id="settings-title"
                label="肩書き"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                placeholder="プロコーチ"
              />
              <Select
                id="settings-specialty"
                label="専門分野"
                value={profile.specialty}
                onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                options={[
                  { value: "life", label: "ライフコーチング" },
                  { value: "business", label: "ビジネスコーチング" },
                  { value: "career", label: "キャリアコーチング" },
                  { value: "other", label: "その他" },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Signature */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">メール署名</h2>
          </div>
          <CardContent>
            <Textarea
              id="settings-signature"
              label="フォローアップメールの署名テンプレート"
              rows={5}
              value={profile.email_signature}
              onChange={(e) => setProfile({ ...profile, email_signature: e.target.value })}
              placeholder="お名前&#10;肩書き&#10;連絡先"
            />
          </CardContent>
        </Card>

        {/* Plan Info */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">プラン情報</h2>
          </div>
          <CardContent>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">現在のプラン</span>
              <span className="font-medium text-gray-900 capitalize">{profile.plan}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">今月のAI利用回数</span>
              <span className="font-medium text-gray-900">
                {profile.ai_usage_count} / {profile.plan === "free" ? 5 : "無制限"}
              </span>
            </div>
            {profile.plan === "free" && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                <p className="text-sm text-indigo-800 mb-2">
                  Proプランにアップグレードすると、AI利用無制限、カスタムテンプレートなどをご利用いただけます。
                </p>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  Proプランにアップグレード
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            設定を保存
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
