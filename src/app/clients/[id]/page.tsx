"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { TabGroup } from "@/components/ui/tab-group";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { CardSkeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft, Plus, FileText, Trash2, Archive } from "lucide-react";

interface ClientDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  goals: string | null;
  notes: string | null;
  status: string;
  contract_start_date: string | null;
  contract_end_date: string | null;
  contract_total_sessions: number | null;
  contract_fee: number | null;
  session_count: number;
  recent_sessions: {
    id: string;
    scheduled_at: string;
    status: string;
    session_number: number | null;
    has_summary: number;
    client_name: string;
  }[];
}

interface GoalScore {
  id: string;
  goal_label: string;
  score: number;
  note: string | null;
  created_at: string;
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [goalScores, setGoalScores] = useState<GoalScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", goals: "", notes: "",
    contract_start_date: "", contract_end_date: "",
    contract_total_sessions: "", contract_fee: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/clients/${id}`).then((r) => r.json()),
      fetch(`/api/clients/${id}/goal-scores`).then((r) => r.json()),
    ]).then(([clientData, scores]) => {
      setClient(clientData);
      setGoalScores(Array.isArray(scores) ? scores : []);
      setForm({
        name: clientData.name || "",
        email: clientData.email || "",
        phone: clientData.phone || "",
        company: clientData.company || "",
        goals: clientData.goals || "",
        notes: clientData.notes || "",
        contract_start_date: clientData.contract_start_date || "",
        contract_end_date: clientData.contract_end_date || "",
        contract_total_sessions: clientData.contract_total_sessions?.toString() || "",
        contract_fee: clientData.contract_fee?.toString() || "",
      });
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { ...form };
      if (form.contract_total_sessions) body.contract_total_sessions = Number(form.contract_total_sessions);
      else delete body.contract_total_sessions;
      if (form.contract_fee) body.contract_fee = Number(form.contract_fee);
      else delete body.contract_fee;

      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setClient((prev) => prev ? { ...prev, ...updated } : prev);
        setEditing(false);
        toast("保存しました");
      } else {
        toast("保存に失敗しました", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("クライアントを削除しました");
      router.push("/clients");
    }
  };

  const handleArchive = async () => {
    const res = await fetch(`/api/clients/${id}/archive`, { method: "PATCH" });
    if (res.ok) {
      const updated = await res.json();
      setClient((prev) => prev ? { ...prev, status: updated.status } : prev);
      toast(updated.status === "archived" ? "アーカイブしました" : "復元しました");
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <CardSkeleton />
      </PageContainer>
    );
  }

  if (!client) {
    return (
      <PageContainer>
        <EmptyState
          title="クライアントが見つかりません"
          description="指定されたクライアントは存在しないか、削除されています"
          actionLabel="クライアント一覧へ"
          actionHref="/clients"
        />
      </PageContainer>
    );
  }

  // Group goal scores by label for chart-like display
  const goalLabels = [...new Set(goalScores.map((g) => g.goal_label))];

  return (
    <PageContainer>
      <div className="mb-4">
        <Link href="/clients" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" />
          クライアント一覧
        </Link>
      </div>

      <Header
        title={client.name}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/sessions/new?client_id=${id}`}>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                セッション作成
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleArchive}>
              <Archive className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2 mb-6">
        <StatusBadge status={client.status} />
        <span className="text-sm text-gray-500">セッション {client.session_count}回</span>
      </div>

      <TabGroup
        tabs={[
          { id: "profile", label: "プロフィール" },
          { id: "sessions", label: "セッション履歴" },
          { id: "goals", label: "目標・進捗" },
          { id: "notes", label: "メモ" },
        ]}
      >
        {(activeTab) => (
          <>
            {activeTab === "profile" && (
              <Card>
                <CardContent>
                  <div className="flex justify-end mb-4">
                    {editing ? (
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>キャンセル</Button>
                        <Button size="sm" onClick={handleSave} loading={saving}>保存</Button>
                      </div>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>編集</Button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input id="client-name" label="名前" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!editing} />
                    <Input id="client-email" label="メール" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!editing} />
                    <Input id="client-phone" label="電話番号" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={!editing} />
                    <Input id="client-company" label="会社名" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} disabled={!editing} />
                    <Input id="client-start" label="契約開始日" type="date" value={form.contract_start_date} onChange={(e) => setForm({ ...form, contract_start_date: e.target.value })} disabled={!editing} />
                    <Input id="client-end" label="契約終了日" type="date" value={form.contract_end_date} onChange={(e) => setForm({ ...form, contract_end_date: e.target.value })} disabled={!editing} />
                    <Input id="client-sessions" label="契約セッション数" type="number" value={form.contract_total_sessions} onChange={(e) => setForm({ ...form, contract_total_sessions: e.target.value })} disabled={!editing} />
                    <Input id="client-fee" label="契約料金（円）" type="number" value={form.contract_fee} onChange={(e) => setForm({ ...form, contract_fee: e.target.value })} disabled={!editing} />
                  </div>
                  <div className="mt-4">
                    <Textarea id="client-goals" label="コーチング目標" rows={4} value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} disabled={!editing} />
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "sessions" && (
              <div>
                {client.recent_sessions.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="まだセッション記録がありません"
                    description="最初のセッションノートを作成しましょう"
                    actionLabel="セッションを作成"
                    actionHref={`/sessions/new?client_id=${id}`}
                  />
                ) : (
                  <div className="space-y-3">
                    {client.recent_sessions.map((session) => (
                      <Link key={session.id} href={`/sessions/${session.id}`}>
                        <Card className="hover:border-indigo-300 transition-colors cursor-pointer">
                          <CardContent className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {session.session_number ? `第${session.session_number}回 ` : ""}
                                セッション
                              </p>
                              <p className="text-sm text-gray-500">{formatDateTime(session.scheduled_at)}</p>
                            </div>
                            <StatusBadge status={session.status} />
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "goals" && (
              <div>
                {goalLabels.length === 0 ? (
                  <EmptyState
                    title="目標スコアがありません"
                    description="セッション中に目標スコアを記録すると、ここに進捗が表示されます"
                  />
                ) : (
                  <div className="space-y-6">
                    {goalLabels.map((label) => {
                      const scores = goalScores.filter((g) => g.goal_label === label);
                      const latest = scores[scores.length - 1];
                      return (
                        <Card key={label}>
                          <CardContent>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-gray-900">{label}</h3>
                              <span className="text-2xl font-bold text-indigo-600">{latest?.score}/10</span>
                            </div>
                            {/* Simple progress bar */}
                            <div className="w-full bg-gray-100 rounded-full h-3">
                              <div
                                className="bg-indigo-600 rounded-full h-3 transition-all"
                                style={{ width: `${(latest?.score || 0) * 10}%` }}
                              />
                            </div>
                            {scores.length > 1 && (
                              <div className="flex items-center gap-1 mt-3 overflow-x-auto">
                                {scores.map((s, i) => (
                                  <div key={s.id} className="flex flex-col items-center min-w-[40px]">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
                                      {s.score}
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1">{i + 1}回</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "notes" && (
              <Card>
                <CardContent>
                  <Textarea
                    id="client-notes"
                    label="自由記述メモ"
                    rows={10}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="クライアントに関するメモを自由に記入..."
                  />
                  <div className="flex justify-end mt-4">
                    <Button size="sm" onClick={handleSave} loading={saving}>保存</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </TabGroup>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="クライアントの削除"
        message="このクライアントを削除してもよろしいですか？この操作は取り消せません。"
      />
    </PageContainer>
  );
}
