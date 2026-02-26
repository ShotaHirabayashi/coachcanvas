"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime, formatTime } from "@/lib/utils";
import { Plus, Calendar, AlertCircle, Users, FileText, Brain, Clock } from "lucide-react";

interface DashboardData {
  upcoming_sessions: {
    id: string;
    client_id: string;
    client_name: string;
    scheduled_at: string;
    duration_minutes: number | null;
    session_number: number | null;
    has_note: number;
  }[];
  pending_followup_count: number;
  recent_sessions: {
    id: string;
    client_id: string;
    client_name: string;
    scheduled_at: string;
    status: string;
    has_summary: number;
  }[];
  stats: {
    total_clients: number;
    sessions_this_month: number;
    ai_usage_count: number;
    ai_usage_limit: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <Header title="ダッシュボード" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
      </PageContainer>
    );
  }

  if (!data) return null;

  const hasData = data.stats.total_clients > 0 || data.stats.sessions_this_month > 0;

  return (
    <PageContainer>
      <Header
        title="ダッシュボード"
        actions={
          <Link href="/sessions/new">
            <Button size="md">
              <Plus className="w-4 h-4 mr-2" />
              新規セッション
            </Button>
          </Link>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: "クライアント数", value: data.stats.total_clients, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "今月のセッション", value: data.stats.sessions_this_month, icon: Calendar, color: "text-green-600 bg-green-50" },
          { label: "AI利用回数", value: `${data.stats.ai_usage_count}/${data.stats.ai_usage_limit}`, icon: Brain, color: "text-purple-600 bg-purple-50" },
          { label: "未送信フォローアップ", value: data.pending_followup_count, icon: AlertCircle, color: data.pending_followup_count > 0 ? "text-red-600 bg-red-50" : "text-gray-600 bg-gray-50" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!hasData ? (
        /* Tutorial Cards for empty state */
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { step: "1", title: "クライアントを登録", desc: "最初のクライアントを登録しましょう", href: "/clients", icon: Users },
            { step: "2", title: "セッションノートを書く", desc: "セッション記録を作成しましょう", href: "/sessions/new", icon: FileText },
            { step: "3", title: "AI要約を体験", desc: "ノートからAI要約を生成してみましょう", href: "/sessions", icon: Brain },
          ].map((card) => (
            <Link key={card.step} href={card.href}>
              <Card className="hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="flex flex-col items-center text-center py-8">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                    <card.icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <Badge variant="info" className="mb-3">ステップ {card.step}</Badge>
                  <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                  <p className="text-sm text-gray-500">{card.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Sessions */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">次回のセッション</h2>
              <Link href="/sessions" className="text-sm text-indigo-600 hover:text-indigo-700">すべて見る</Link>
            </div>
            <CardContent className="p-0">
              {data.upcoming_sessions.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  予定されているセッションはありません
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {data.upcoming_sessions.map((session) => (
                    <li key={session.id}>
                      <Link href={`/sessions/${session.id}`} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50">
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{session.client_name}</p>
                          <p className="text-sm text-gray-500">{formatDateTime(session.scheduled_at)}</p>
                        </div>
                        {session.session_number && (
                          <Badge variant="default">第{session.session_number}回</Badge>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">最近のセッション</h2>
              <Link href="/sessions" className="text-sm text-indigo-600 hover:text-indigo-700">すべて見る</Link>
            </div>
            <CardContent className="p-0">
              {data.recent_sessions.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  まだセッション記録がありません
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {data.recent_sessions.map((session) => (
                    <li key={session.id}>
                      <Link href={`/sessions/${session.id}`} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{session.client_name}</p>
                          <p className="text-sm text-gray-500">{formatDateTime(session.scheduled_at)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={session.status} />
                          {session.has_summary ? (
                            <Badge variant="success">要約済み</Badge>
                          ) : null}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
