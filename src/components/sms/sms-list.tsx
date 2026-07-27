"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquareText, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { formatPhone } from "@/lib/phone";
import { formatDate } from "@/lib/utils";

type SmsItem = {
  id: string; phone: string; message: string; status: "QUEUED" | "SENT" | "DELIVERED" | "FAILED";
  errorMessage: string | null; sentAt: string | null; createdAt: string; donor: { name: string } | null;
};
const labels = { QUEUED: "Sırada", SENT: "Gönderildi", DELIVERED: "Teslim edildi", FAILED: "Başarısız" };

export function SmsList() {
  const [messages, setMessages] = useState<SmsItem[]>([]);
  const [provider, setProvider] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/sms");
      const data = (await response.json()) as { messages?: SmsItem[]; provider?: string; balance?: number | null; message?: string };
      if (!response.ok) throw new Error(data.message);
      setMessages(data.messages ?? []); setProvider(data.provider ?? ""); setBalance(data.balance ?? null);
    } catch { setError("SMS kayıtları yüklenemedi."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  if (loading) return <Card className="space-y-3 p-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</Card>;
  if (error) return <Card><ErrorState description={error} onRetry={() => void load()} /></Card>;
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6"><h2 className="font-bold text-[#0b2b3c]">Gönderim kayıtları</h2><p className="mt-1 text-xs text-slate-500">Bağış ve hisse işlemlerinden gönderilen SMS’ler</p></div>
        {messages.length === 0 ? <EmptyState title="SMS kaydı bulunmuyor" description="SMS seçili bağış işlemleri burada görüntülenecek." /> : <div className="divide-y divide-slate-100">{messages.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_1.6fr_0.6fr] md:items-center md:px-6">
          <div><p className="text-sm font-semibold text-slate-800">{item.donor?.name ?? formatPhone(item.phone)}</p><p className="mt-1 text-[11px] text-slate-500">{formatPhone(item.phone)}</p></div>
          <p className="line-clamp-2 text-xs leading-5 text-slate-600">{item.message}</p>
          <div className="md:text-right"><Badge className={item.status === "FAILED" ? "bg-red-50 text-red-700" : ""}>{labels[item.status]}</Badge><p className="mt-1.5 text-[10px] text-slate-400">{formatDate(item.sentAt ?? item.createdAt)}</p>{item.errorMessage && <p className="mt-1 text-[10px] text-red-600">{item.errorMessage}</p>}</div>
        </div>)}</div>}
      </Card>
      <Card className="h-fit p-5">
        <span className="grid size-11 place-items-center rounded-xl bg-sky-50 text-sky-700"><Send className="size-5" /></span>
        <p className="mt-4 text-xs text-slate-500">Aktif servis</p><p className="mt-1 font-bold capitalize text-[#0b2b3c]">{provider}</p>
        <div className="my-4 border-t border-slate-100" />
        <p className="text-xs text-slate-500">Kalan bakiye</p><p className="mt-1 text-xl font-bold text-[#0b2b3c]">{balance === null ? "Bilinmiyor" : `${balance} SMS`}</p>
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[10px] leading-4 text-slate-500"><MessageSquareText className="mt-0.5 size-3.5 shrink-0" />Geliştirme ortamında gerçek SMS gönderilmez.</p>
      </Card>
    </div>
  );
}
