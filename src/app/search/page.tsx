"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import { Search, Users, FileText } from "lucide-react";

interface SearchResults {
  clients: {
    id: string;
    name: string;
    email: string | null;
    company: string | null;
    status: string;
  }[];
  sessions: {
    id: string;
    client_name: string;
    scheduled_at: string;
    snippet: string;
  }[];
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "clients" | "sessions">("all");
  const [results, setResults] = useState<SearchResults>({ clients: [], sessions: [] });
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(() => {
    if (!query.trim()) return;
    fetch(`/api/search?q=${encodeURIComponent(query.trim())}&type=${activeTab}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data);
        setSearched(true);
      });
  }, [query, activeTab]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ clients: [], sessions: [] });
      setSearched(false);
      return;
    }
    const timer = setTimeout(doSearch, 400);
    return () => clearTimeout(timer);
  }, [query, activeTab, doSearch]);

  const hasResults = results.clients.length > 0 || results.sessions.length > 0;

  return (
    <PageContainer>
      <Header title="検索" />

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="クライアント名、セッション内容を検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          autoFocus
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { value: "all" as const, label: "すべて" },
          { value: "clients" as const, label: "クライアント" },
          { value: "sessions" as const, label: "セッション" },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveTab(t.value)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.value
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {!searched ? (
        <div className="text-center py-16 text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">キーワードを入力して検索</p>
        </div>
      ) : !hasResults ? (
        <EmptyState
          icon={Search}
          title="該当する結果が見つかりません"
          description="別のキーワードで検索してみてください"
        />
      ) : (
        <div className="space-y-6">
          {/* Client Results */}
          {results.clients.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Users className="w-4 h-4" />
                クライアント ({results.clients.length}件)
              </h3>
              <div className="space-y-2">
                {results.clients.map((client) => (
                  <Link key={client.id} href={`/clients/${client.id}`}>
                    <Card className="hover:border-indigo-300 cursor-pointer">
                      <CardContent className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm">
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{client.name}</p>
                            {client.company && <p className="text-xs text-gray-500">{client.company}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Session Results */}
          {results.sessions.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <FileText className="w-4 h-4" />
                セッション ({results.sessions.length}件)
              </h3>
              <div className="space-y-2">
                {results.sessions.map((session) => (
                  <Link key={session.id} href={`/sessions/${session.id}`}>
                    <Card className="hover:border-indigo-300 cursor-pointer">
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900">{session.client_name}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(session.scheduled_at)}</p>
                        </div>
                        {session.snippet && (
                          <p className="text-sm text-gray-600 line-clamp-2">{session.snippet}</p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
