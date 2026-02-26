"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import { Plus, FileText, ChevronLeft, ChevronRight } from "lucide-react";

interface SessionItem {
  id: string;
  client_name: string;
  scheduled_at: string;
  status: string;
  session_number: number | null;
  has_note: number;
  has_summary: number;
  has_follow_up: number;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const limit = 20;

  const fetchSessions = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit.toString());
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/sessions?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.sessions || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchSessions();
  }, [fetchSessions]);

  const totalPages = Math.ceil(total / limit);

  return (
    <PageContainer>
      <Header
        title="セッション一覧"
        description={`${total}件のセッション`}
        actions={
          <Link href="/sessions/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              新規セッション
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { value: "", label: "すべて" },
          { value: "scheduled", label: "予定" },
          { value: "completed", label: "完了" },
          { value: "cancelled", label: "キャンセル" },
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => { setStatusFilter(s.value); setPage(1); }}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              statusFilter === s.value
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="セッションがありません"
          description="最初のセッションを作成しましょう"
          actionLabel="セッションを作成"
          actionHref="/sessions/new"
        />
      ) : (
        <>
          {/* Table for desktop, cards for mobile */}
          <div className="hidden md:block">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-sm text-gray-500">
                      <th className="px-6 py-3 font-medium">日時</th>
                      <th className="px-6 py-3 font-medium">クライアント</th>
                      <th className="px-6 py-3 font-medium">回数</th>
                      <th className="px-6 py-3 font-medium">ステータス</th>
                      <th className="px-6 py-3 font-medium">要約</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <Link href={`/sessions/${session.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600">
                            {formatDateTime(session.scheduled_at)}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700">{session.client_name}</td>
                        <td className="px-6 py-3 text-sm text-gray-500">
                          {session.session_number ? `第${session.session_number}回` : "-"}
                        </td>
                        <td className="px-6 py-3"><StatusBadge status={session.status} /></td>
                        <td className="px-6 py-3">
                          {session.has_summary ? <Badge variant="success">要約済み</Badge> : <Badge variant="default">未生成</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {sessions.map((session) => (
              <Link key={session.id} href={`/sessions/${session.id}`}>
                <Card className="hover:border-indigo-300 cursor-pointer">
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{session.client_name}</p>
                      <p className="text-sm text-gray-500">{formatDateTime(session.scheduled_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={session.status} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
