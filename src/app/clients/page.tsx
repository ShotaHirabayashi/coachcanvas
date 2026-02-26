"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate, daysSince } from "@/lib/utils";
import { Plus, Search, Users, Calendar, Clock } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  status: string;
  session_count: number;
  last_session_date: string | null;
  next_session_date: string | null;
}

export default function ClientsPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", company: "" });

  const fetchClients = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/clients?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setClients(data.clients || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchClients, 300);
    return () => clearTimeout(timer);
  }, [fetchClients]);

  const handleCreate = async () => {
    if (!newClient.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      if (res.ok) {
        toast("クライアントを登録しました");
        setShowCreateDialog(false);
        setNewClient({ name: "", email: "", phone: "", company: "" });
        fetchClients();
      } else {
        const err = await res.json();
        toast(err.error || "エラーが発生しました", "error");
      }
    } catch {
      toast("エラーが発生しました", "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <PageContainer>
      <Header
        title="クライアント"
        description={`${total}名のクライアント`}
        actions={
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新規登録
          </Button>
        }
      />

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="名前やメールで検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          {["active", "archived", "all"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {s === "active" ? "アクティブ" : s === "archived" ? "アーカイブ" : "すべて"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="クライアントがいません"
          description="最初のクライアントを登録して、コーチングを始めましょう"
          actionLabel="クライアントを登録"
          onAction={() => setShowCreateDialog(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold">
                      {client.name.charAt(0)}
                    </div>
                    <StatusBadge status={client.status} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{client.name}</h3>
                  {client.company && (
                    <p className="text-sm text-gray-500 mb-3">{client.company}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {client.session_count}回
                    </span>
                    {client.last_session_date && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {daysSince(client.last_session_date)}日前
                      </span>
                    )}
                  </div>
                  {client.next_session_date && (
                    <p className="text-xs text-indigo-600 mt-2">
                      次回: {formatDate(client.next_session_date)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} title="クライアントを登録">
        <div className="space-y-4">
          <Input
            id="new-client-name"
            label="名前"
            value={newClient.name}
            onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
            placeholder="クライアントの名前"
          />
          <Input
            id="new-client-email"
            label="メールアドレス"
            type="email"
            value={newClient.email}
            onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
            placeholder="email@example.com"
          />
          <Input
            id="new-client-phone"
            label="電話番号"
            value={newClient.phone}
            onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
            placeholder="090-1234-5678"
          />
          <Input
            id="new-client-company"
            label="会社名"
            value={newClient.company}
            onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
            placeholder="株式会社〇〇"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateDialog(false)}>キャンセル</Button>
            <Button onClick={handleCreate} loading={creating} disabled={!newClient.name.trim()}>登録</Button>
          </div>
        </div>
      </Dialog>
    </PageContainer>
  );
}
