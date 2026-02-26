"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/dialog";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";
import {
  ArrowLeft, Brain, Mail, Save, Trash2, ChevronDown, ChevronUp,
  Copy, RefreshCw, X, Check,
} from "lucide-react";

interface SessionDetail {
  id: string;
  client_id: string;
  client_name: string;
  client_email: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  session_number: number | null;
  note: { content: string; auto_saved_at: string | null } | null;
  summary: {
    id: string;
    summary_text: string;
    action_items: string;
    next_agenda: string;
    version: number;
  } | null;
  emails: {
    id: string;
    subject: string;
    body: string;
    status: string;
    recipient_email: string;
  }[];
  previous_summary: {
    summary_text: string;
    action_items: string;
    next_agenda: string;
  } | null;
}

interface Template {
  id: string;
  name: string;
  content: string;
}

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingFollowUp, setGeneratingFollowUp] = useState(false);
  const [showPrevContext, setShowPrevContext] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingEmail, setEditingEmail] = useState<{ subject: string; body: string; recipient_email: string } | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/sessions/${id}`).then((r) => r.json()),
      fetch("/api/templates").then((r) => r.json()),
    ]).then(([sessionData, templateData]) => {
      setSession(sessionData);
      setNoteContent(sessionData.note?.content || "");
      setTemplates(Array.isArray(templateData) ? templateData : []);
    }).finally(() => setLoading(false));
  }, [id]);

  const autosave = useCallback(
    (content: string) => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      setSaveStatus("unsaved");
      autosaveTimer.current = setTimeout(async () => {
        setSaveStatus("saving");
        try {
          const res = await fetch(`/api/sessions/${id}/note/autosave`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          });
          if (res.ok) {
            setSaveStatus("saved");
          } else {
            setSaveStatus("error");
          }
        } catch {
          setSaveStatus("error");
        }
      }, 500);
    },
    [id]
  );

  const handleNoteChange = (value: string) => {
    setNoteContent(value);
    autosave(value);
  };

  const handleSaveNote = async () => {
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/sessions/${id}/note`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteContent }),
      });
      if (res.ok) {
        setSaveStatus("saved");
        toast("保存しました");
      } else {
        setSaveStatus("error");
        toast("保存に失敗しました", "error");
      }
    } catch {
      setSaveStatus("error");
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template && (!noteContent.trim() || confirm("テンプレートを適用すると現在の内容が上書きされます。よろしいですか？"))) {
      setNoteContent(template.content);
      autosave(template.content);
    }
  };

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const res = await fetch(`/api/sessions/${id}/ai/summary`, { method: "POST" });
      if (res.ok) {
        const summary = await res.json();
        setSession((prev) => prev ? { ...prev, summary } : prev);
        toast("AI要約を生成しました");
      } else {
        const err = await res.json();
        toast(err.error || "AI要約の生成に失敗しました", "error");
      }
    } catch {
      toast("AI要約の生成に失敗しました", "error");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleGenerateFollowUp = async () => {
    setGeneratingFollowUp(true);
    try {
      const res = await fetch(`/api/sessions/${id}/ai/follow-up`, { method: "POST" });
      if (res.ok) {
        const email = await res.json();
        setSession((prev) =>
          prev ? { ...prev, emails: [email, ...prev.emails] } : prev
        );
        setEditingEmail({
          subject: email.subject,
          body: email.body,
          recipient_email: email.recipient_email,
        });
        setShowFollowUp(true);
        toast("フォローアップメールを生成しました");
      } else {
        const err = await res.json();
        toast(err.error || "メールの生成に失敗しました", "error");
      }
    } catch {
      toast("メールの生成に失敗しました", "error");
    } finally {
      setGeneratingFollowUp(false);
    }
  };

  const handleCopyEmail = () => {
    if (editingEmail) {
      navigator.clipboard.writeText(`件名: ${editingEmail.subject}\n\n${editingEmail.body}`);
      toast("クリップボードにコピーしました");
    }
  };

  const handleCompleteSession = async () => {
    const res = await fetch(`/api/sessions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    if (res.ok) {
      setSession((prev) => prev ? { ...prev, status: "completed" } : prev);
      toast("セッションを完了にしました");
    }
  };

  const handleDeleteSession = async () => {
    const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("セッションを削除しました");
      router.push("/sessions");
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <CardSkeleton />
      </PageContainer>
    );
  }

  if (!session) {
    return (
      <PageContainer>
        <EmptyState
          title="セッションが見つかりません"
          description="指定されたセッションは存在しません"
          actionLabel="セッション一覧へ"
          actionHref="/sessions"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-7xl">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center justify-between">
        <Link href="/sessions" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" />
          セッション一覧
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {saveStatus === "saved" && <span className="text-green-600">保存済み</span>}
            {saveStatus === "saving" && <span className="text-gray-400">保存中...</span>}
            {saveStatus === "unsaved" && <span className="text-yellow-600">未保存</span>}
            {saveStatus === "error" && <span className="text-red-600">保存エラー</span>}
          </span>
        </div>
      </div>

      {/* Session Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-gray-900">
              <Link href={`/clients/${session.client_id}`} className="hover:text-indigo-600">
                {session.client_name}
              </Link>
            </h1>
            <StatusBadge status={session.status} />
            {session.session_number && <Badge>第{session.session_number}回</Badge>}
          </div>
          <p className="text-sm text-gray-500">
            {formatDateTime(session.scheduled_at)}
            {session.duration_minutes && ` / ${session.duration_minutes}分`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {session.status === "scheduled" && (
            <Button variant="secondary" size="sm" onClick={handleCompleteSession}>
              <Check className="w-4 h-4 mr-1" />
              完了にする
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Previous Context */}
      {session.previous_summary && (
        <div className="mb-4">
          <button
            onClick={() => setShowPrevContext(!showPrevContext)}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {showPrevContext ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            前回のセッション要約
          </button>
          {showPrevContext && (
            <Card className="mt-2 bg-amber-50 border-amber-200">
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                  {session.previous_summary.summary_text}
                </pre>
                {session.previous_summary.next_agenda && (
                  <div className="mt-3 pt-3 border-t border-amber-200">
                    <p className="text-xs font-medium text-amber-700 mb-1">前回提案のアジェンダ:</p>
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                      {session.previous_summary.next_agenda}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Main Content - Two column on desktop */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Note Editor */}
        <div className="space-y-4">
          {/* Template + Save */}
          <div className="flex items-center gap-3">
            <Select
              id="template-select"
              value=""
              onChange={(e) => handleTemplateSelect(e.target.value)}
              options={templates.map((t) => ({ value: t.id, label: t.name }))}
              placeholder="テンプレートを選択..."
              className="flex-1"
            />
            <Button variant="secondary" size="sm" onClick={handleSaveNote}>
              <Save className="w-4 h-4 mr-1" />
              保存
            </Button>
          </div>

          {/* Text Editor */}
          <textarea
            value={noteContent}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="セッションノートを入力してください...&#10;&#10;例：&#10;- 今日のテーマ&#10;- クライアントの状態&#10;- 気づき・洞察&#10;- アクションアイテム"
            className="w-full h-[500px] rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y font-mono"
          />

          {/* AI Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleGenerateSummary}
              loading={generatingSummary}
              className="flex-1 bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
            >
              <Brain className="w-4 h-4 mr-2" />
              AI要約を生成
            </Button>
            <Button
              onClick={handleGenerateFollowUp}
              loading={generatingFollowUp}
              variant="secondary"
              className="flex-1"
            >
              <Mail className="w-4 h-4 mr-2" />
              フォローアップメール生成
            </Button>
          </div>
        </div>

        {/* Right: AI Summary + Follow-up */}
        <div className="space-y-4">
          {/* AI Summary Panel */}
          {session.summary ? (
            <Card className="bg-purple-50 border-purple-200">
              <div className="px-6 py-3 border-b border-purple-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">AI要約</h3>
                  <Badge variant="default">v{session.summary.version}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(session.summary!.summary_text);
                      toast("コピーしました");
                    }}
                    className="p-1.5 rounded hover:bg-purple-100"
                    aria-label="コピー"
                  >
                    <Copy className="w-4 h-4 text-purple-600" />
                  </button>
                  <button
                    onClick={handleGenerateSummary}
                    className="p-1.5 rounded hover:bg-purple-100"
                    aria-label="再生成"
                    disabled={generatingSummary}
                  >
                    <RefreshCw className={`w-4 h-4 text-purple-600 ${generatingSummary ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans mb-4">
                  {session.summary.summary_text}
                </pre>

                {/* Action Items */}
                {session.summary.action_items && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-purple-900 mb-2">アクションアイテム</h4>
                    <ul className="space-y-1.5">
                      {(JSON.parse(session.summary.action_items) as { item: string; done: boolean }[]).map(
                        (ai, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={ai.done} readOnly className="mt-0.5 rounded" />
                            <span>{ai.item}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* Next Agenda */}
                {session.summary.next_agenda && (
                  <div className="pt-3 border-t border-purple-200">
                    <h4 className="text-sm font-semibold text-purple-900 mb-2">次回アジェンダ案</h4>
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                      {session.summary.next_agenda}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-gray-200">
              <CardContent className="py-12 text-center">
                <Brain className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-1">AI要約がまだ生成されていません</p>
                <p className="text-xs text-gray-400">ノートを入力して「AI要約を生成」ボタンを押してください</p>
              </CardContent>
            </Card>
          )}

          {/* Follow-up emails list */}
          {session.emails.length > 0 && (
            <Card>
              <div className="px-6 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  フォローアップメール
                </h3>
              </div>
              <CardContent className="p-0">
                <ul className="divide-y divide-gray-100">
                  {session.emails.map((email) => (
                    <li key={email.id} className="px-6 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{email.subject}</p>
                        <StatusBadge status={email.status} />
                      </div>
                      <p className="text-xs text-gray-500">{email.recipient_email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => {
                            setEditingEmail({
                              subject: email.subject,
                              body: email.body,
                              recipient_email: email.recipient_email,
                            });
                            setShowFollowUp(true);
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-700"
                        >
                          表示・編集
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`件名: ${email.subject}\n\n${email.body}`);
                            toast("コピーしました");
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          コピー
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Follow-up Email Slide-over */}
      {showFollowUp && editingEmail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowFollowUp(false)} />
          <div className="relative w-full max-w-md bg-white shadow-xl overflow-y-auto md:max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900">フォローアップメール</h3>
              <button onClick={() => setShowFollowUp(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label htmlFor="email-to" className="block text-sm font-medium text-gray-700 mb-1">宛先</label>
                <input
                  id="email-to"
                  type="email"
                  value={editingEmail.recipient_email}
                  onChange={(e) => setEditingEmail({ ...editingEmail, recipient_email: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="email-subject" className="block text-sm font-medium text-gray-700 mb-1">件名</label>
                <input
                  id="email-subject"
                  type="text"
                  value={editingEmail.subject}
                  onChange={(e) => setEditingEmail({ ...editingEmail, subject: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="email-body" className="block text-sm font-medium text-gray-700 mb-1">本文</label>
                <textarea
                  id="email-body"
                  value={editingEmail.body}
                  onChange={(e) => setEditingEmail({ ...editingEmail, body: e.target.value })}
                  rows={15}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={handleCopyEmail}>
                  <Copy className="w-4 h-4 mr-2" />
                  コピー
                </Button>
                <Button className="flex-1" onClick={() => {
                  toast("メール送信機能は本番環境で利用可能になります", "info");
                  setShowFollowUp(false);
                }}>
                  <Mail className="w-4 h-4 mr-2" />
                  送信
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteSession}
        title="セッションの削除"
        message="このセッションとすべての関連データ（ノート、要約、メール）を削除してもよろしいですか？"
      />
    </PageContainer>
  );
}
