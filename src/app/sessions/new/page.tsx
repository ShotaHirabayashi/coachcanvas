"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { CardSkeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ClientOption {
  id: string;
  name: string;
}

interface TemplateOption {
  id: string;
  name: string;
  category: string | null;
}

function NewSessionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    client_id: searchParams.get("client_id") || "",
    scheduled_at: new Date().toISOString().slice(0, 16),
    duration_minutes: "60",
    template_id: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/clients?limit=100&status=active").then((r) => r.json()),
      fetch("/api/templates").then((r) => r.json()),
    ]).then(([clientData, templateData]) => {
      setClients(clientData.clients || []);
      setTemplates(Array.isArray(templateData) ? templateData : []);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id) {
      toast("クライアントを選択してください", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: form.client_id,
          scheduled_at: new Date(form.scheduled_at).toISOString(),
          duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
          template_id: form.template_id || undefined,
        }),
      });
      if (res.ok) {
        const session = await res.json();
        toast("セッションを作成しました");
        router.push(`/sessions/${session.id}`);
      } else {
        const err = await res.json();
        toast(err.error || "作成に失敗しました", "error");
      }
    } catch {
      toast("エラーが発生しました", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-lg">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select
            id="client_id"
            label="クライアント"
            value={form.client_id}
            onChange={(e) => setForm({ ...form, client_id: e.target.value })}
            options={clients.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="クライアントを選択..."
          />
          <Input
            id="scheduled_at"
            label="セッション日時"
            type="datetime-local"
            value={form.scheduled_at}
            onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
          />
          <Input
            id="duration_minutes"
            label="所要時間（分）"
            type="number"
            value={form.duration_minutes}
            onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
            min="1"
            max="480"
          />
          <Select
            id="template_id"
            label="テンプレート"
            value={form.template_id}
            onChange={(e) => setForm({ ...form, template_id: e.target.value })}
            options={templates.map((t) => ({ value: t.id, label: t.name }))}
            placeholder="テンプレートを選択（任意）"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => router.back()}>キャンセル</Button>
            <Button type="submit" loading={loading}>作成</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function NewSessionPage() {
  return (
    <PageContainer>
      <div className="mb-4">
        <Link href="/sessions" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" />
          セッション一覧
        </Link>
      </div>

      <Header title="新規セッション作成" />

      <Suspense fallback={<CardSkeleton />}>
        <NewSessionForm />
      </Suspense>
    </PageContainer>
  );
}
