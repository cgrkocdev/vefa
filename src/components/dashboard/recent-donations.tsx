"use client";

import { useEffect, useState } from "react";
import { Check, HandCoins, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DONATION_CHANNEL, type LiveDonation } from "@/lib/realtime";
import { formatCurrency, initials } from "@/lib/utils";
import { ErrorState, Skeleton } from "@/components/ui/states";

export function RecentDonations() {
  const [donations, setDonations] = useState<LiveDonation[]>([]);
  const [notification, setNotification] = useState<LiveDonation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/donations");
        const data = (await response.json()) as {
          donations?: Array<{ id: string; donorName: string; type: string; amount: number; createdAt: string; status: string }>;
          message?: string;
        };
        if (!response.ok) throw new Error(data.message);
        setDonations((data.donations ?? []).map((item) => ({
          id: item.id, donorName: item.donorName, type: item.type, amount: item.amount,
          date: new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(item.createdAt)).replace(",", " ·"),
          status: item.status === "COMPLETED" ? "Tamamlandı" : "Bekliyor",
        })));
      } catch { setError("Son bağışlar yüklenemedi."); }
      finally { setLoading(false); }
    };
    void load();
    if (!("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(DONATION_CHANNEL);
    channel.onmessage = (event: MessageEvent<LiveDonation>) => {
      setDonations((current) => [event.data, ...current].slice(0, 8));
      setNotification(event.data);
    };
    return () => channel.close();
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => setNotification(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  return (
    <>
      {notification && (
        <div role="status" aria-live="polite" className="fixed right-4 top-24 z-50 flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl shadow-slate-950/15 sm:right-6">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Check className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">Yeni bağış alındı</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{notification.donorName} tarafından {formatCurrency(notification.amount)} {notification.type} alındı.</p>
          </div>
          <button onClick={() => setNotification(null)} aria-label="Bildirimi kapat" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="size-4" /></button>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-[#0b2b3c]">Son Gelen Bağışlar</h2>
            <p className="mt-1 text-xs text-slate-500">En son tamamlanan bağış işlemleri</p>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
            <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50" /><span className="relative inline-flex size-2 rounded-full bg-emerald-500" /></span>
            Canlı
          </span>
        </div>
        {loading ? (
          <div className="space-y-3 border-t border-slate-100 p-5">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div>
        ) : error ? (
          <ErrorState description={error} />
        ) : donations.length === 0 ? (
          <div className="grid min-h-64 place-items-center border-t border-slate-100 p-8 text-center">
            <div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-50 text-slate-400"><HandCoins className="size-5" /></span><p className="mt-4 text-sm font-semibold text-slate-700">Henüz bağış kaydı yok</p><p className="mt-1 text-xs text-slate-500">Yeni bağışlar burada görüntülenecek.</p></div>
          </div>
        ) : (
          <div className="border-t border-slate-100">
            <div className="hidden grid-cols-[1.4fr_1fr_0.7fr_0.85fr_0.65fr] gap-4 bg-slate-50/70 px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:grid">
              <span>Bağışçı</span><span>Bağış türü</span><span>Tutar</span><span>Tarih</span><span>Durum</span>
            </div>
            <div className="divide-y divide-slate-100">
              {donations.map((donation) => (
                <div key={donation.id} className="grid gap-3 px-5 py-4 transition-colors hover:bg-slate-50/60 md:grid-cols-[1.4fr_1fr_0.7fr_0.85fr_0.65fr] md:items-center md:gap-4 md:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eef3f4] text-[11px] font-bold text-[#0b2b3c]">{initials(donation.donorName)}</span>
                    <p className="truncate text-sm font-semibold text-slate-800">{donation.donorName}</p>
                  </div>
                  <p className="text-xs font-medium text-slate-600">{donation.type}</p>
                  <p className="text-sm font-bold text-[#0b2b3c]">{formatCurrency(donation.amount)}</p>
                  <p className="text-[11px] text-slate-500">{donation.date}</p>
                  <Badge className="w-fit">{donation.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
