"use client";

import { useEffect, useState } from "react";
import { Bird, HandCoins, UserRound, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/states";
import { DONATION_CHANNEL, type LiveDonation } from "@/lib/realtime";
import { formatCurrency } from "@/lib/utils";

type Stats = { today: number; month: number; donors: number; remainingShares: number };

export function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    void fetch("/api/dashboard").then(async (response) => {
      if (!response.ok) return;
      const data = (await response.json()) as { stats: Stats };
      setStats(data.stats);
    });
    if (!("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(DONATION_CHANNEL);
    channel.onmessage = (event: MessageEvent<LiveDonation>) => {
      setStats((current) => current ? { ...current, today: current.today + event.data.amount, month: current.month + event.data.amount } : current);
    };
    return () => channel.close();
  }, []);
  if (!stats) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Card key={i} className="flex items-center gap-4 p-5"><Skeleton className="size-11 shrink-0" /><div className="flex-1"><Skeleton className="h-3 w-20" /><Skeleton className="mt-3 h-6 w-28" /></div></Card>)}</div>;
  const items = [
    { label: "Bugünkü Bağış", value: formatCurrency(stats.today), description: "Bugün alınan toplam", icon: WalletCards },
    { label: "Bu Ayki Bağış", value: formatCurrency(stats.month), description: "Bu ay alınan toplam", icon: HandCoins },
    { label: "Toplam Bağışçı", value: stats.donors.toLocaleString("tr-TR"), description: "Kayıtlı bağışçı", icon: UserRound },
    { label: "Kalan Kurban Hissesi", value: stats.remainingShares.toString(), description: "Kayıt bekleyen hisse", icon: Bird },
  ];
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map((item) => <Card key={item.label} className="flex items-center gap-4 p-5"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-50 text-[#0b2b3c]"><item.icon className="size-5" /></span><div className="min-w-0"><p className="text-xs font-medium text-slate-500">{item.label}</p><p className="mt-1 truncate text-xl font-bold tracking-tight text-[#0b2b3c]">{item.value}</p><p className="mt-1 truncate text-[10px] text-slate-400">{item.description}</p></div></Card>)}</div>;
}
