"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { formatPhone } from "@/lib/phone";
import { formatDate } from "@/lib/utils";

type MessageItem = {
  id: string; phone: string; message: string; status: "QUEUED" | "SENT" | "DELIVERED" | "FAILED";
  errorMessage: string | null; sentAt: string | null; createdAt: string; donor: { name: string } | null;
};
const labels = { QUEUED: "Sırada", SENT: "Gönderildi", DELIVERED: "Teslim edildi", FAILED: "Başarısız" };

export function WhatsAppList() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [provider, setProvider] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/whatsapp");
      const data = (await response.json()) as { messages?: MessageItem[]; provider?: string; message?: string };
      if (!response.ok) throw new Error(data.message);
      setMessages(data.messages ?? []); setProvider(data.provider ?? "");
    } catch { setError("WhatsApp kayıtları yüklenemedi."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  if (loading) return <Card className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</Card>;
  if (error) return <Card><ErrorState description={error} onRetry={() => void load()} /></Card>;
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6"><h2 className="font-bold text-[#0b2b3c]">WhatsApp gönderimleri</h2><p className="mt-1 text-xs text-slate-500">Bağış sonrası anlık teşekkür mesajları</p></div>
        {messages.length === 0 ? <EmptyState title="WhatsApp kaydı bulunmuyor" description="Mesaj seçili bağış işlemleri burada görüntülenecek." /> : <div className="divide-y divide-slate-100">{messages.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_1.6fr_0.6fr] md:items-center md:px-6"><div><p className="text-sm font-semibold text-slate-800">{item.donor?.name ?? formatPhone(item.phone)}</p><p className="mt-1 text-[11px] text-slate-500">{formatPhone(item.phone)}</p></div><p className="line-clamp-2 text-xs leading-5 text-slate-600">{item.message}</p><div className="md:text-right"><Badge className={item.status === "FAILED" ? "bg-red-50 text-red-700" : ""}>{labels[item.status]}</Badge><p className="mt-1.5 text-[10px] text-slate-400">{formatDate(item.sentAt ?? item.createdAt)}</p></div></div>)}</div>}
      </Card>
      <Card className="h-fit p-5"><span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Send className="size-5" /></span><p className="mt-4 text-xs text-slate-500">Aktif sağlayıcı</p><p className="mt-1 font-bold capitalize text-[#0b2b3c]">{provider}</p><p className="mt-4 flex gap-2 rounded-xl bg-slate-50 p-3 text-[10px] leading-4 text-slate-500"><MessageCircle className="size-4 shrink-0" />Meta kimlik bilgileri tanımlandığında onaylı şablonla gerçek gönderim yapılır.</p></Card>
    </div>
  );
}
