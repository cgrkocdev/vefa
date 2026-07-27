"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MessageSquareText, Phone, WalletCards, Bird } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton, ErrorState } from "@/components/ui/states";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatPhone } from "@/lib/phone";

type DonorDetail = {
  id: string; name: string; phone: string; totalDonation: number; donationCount: number;
  donations: Array<{ id: string; amount: number; createdAt: string; donationType: { name: string } }>;
  shares: Array<{ id: string; shareNo: number; sacrifice: { number: number; region: string } }>;
  whatsappMessages: Array<{ id: string; message: string; createdAt: string; status: string }>;
};

export default function DonorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [donor, setDonor] = useState<DonorDetail | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void fetch(`/api/donors/${id}`).then(async (response) => {
      const data = await response.json() as { donor?: DonorDetail };
      if (!response.ok || !data.donor) throw new Error();
      setDonor(data.donor);
    }).catch(() => setError("Bağışçı bilgileri yüklenemedi."));
  }, [id]);
  if (error) return <Card><ErrorState description={error} /></Card>;
  if (!donor) return <div className="space-y-4"><Skeleton className="h-36" /><Skeleton className="h-72" /></div>;
  return (
    <div className="mx-auto max-w-[1200px] space-y-5">
      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-semibold text-emerald-700">Bağışçı profili</p><h2 className="mt-1 text-2xl font-bold text-[#0b2b3c]">{donor.name}</h2><p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><Phone className="size-4" />{formatPhone(donor.phone)}</p></div>
        <div className="rounded-2xl bg-emerald-50 px-5 py-4"><p className="text-xs text-emerald-700">Toplam bağış</p><p className="mt-1 text-xl font-bold text-emerald-800">{formatCurrency(donor.totalDonation)}</p><p className="mt-1 text-[10px] text-emerald-700">{donor.donationCount} işlem</p></div>
      </Card>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2"><SectionTitle icon={WalletCards} title="Geçmiş bağışlar" /><div className="divide-y divide-slate-100">{donor.donations.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="text-sm font-semibold text-slate-800">{item.donationType.name}</p><p className="mt-1 text-[11px] text-slate-500">{formatDate(item.createdAt)}</p></div><p className="text-sm font-bold text-[#0b2b3c]">{formatCurrency(item.amount)}</p></div>)}{donor.donations.length === 0 && <p className="p-6 text-sm text-slate-500">Bağış kaydı bulunmuyor.</p>}</div></Card>
        <div className="space-y-5">
          <Card className="overflow-hidden"><SectionTitle icon={Bird} title="Kurban hisseleri" /><div className="divide-y divide-slate-100">{donor.shares.map((item) => <div key={item.id} className="px-5 py-3 text-xs"><strong>{item.sacrifice.number}. Kurban</strong><span className="ml-2 text-slate-500">{item.shareNo}. hisse · {item.sacrifice.region}</span></div>)}{donor.shares.length === 0 && <p className="p-5 text-xs text-slate-500">Hisse kaydı bulunmuyor.</p>}</div></Card>
          <Card className="overflow-hidden"><SectionTitle icon={MessageSquareText} title="WhatsApp kayıtları" /><div className="divide-y divide-slate-100">{donor.whatsappMessages.map((item) => <div key={item.id} className="px-5 py-3"><p className="line-clamp-2 text-[11px] leading-5 text-slate-600">{item.message}</p><p className="mt-1 text-[10px] text-slate-400">{formatDate(item.createdAt)} · {item.status}</p></div>)}{donor.whatsappMessages.length === 0 && <p className="p-5 text-xs text-slate-500">WhatsApp kaydı bulunmuyor.</p>}</div></Card>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof WalletCards; title: string }) {
  return <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4"><Icon className="size-4 text-emerald-700" /><h3 className="text-sm font-bold text-[#0b2b3c]">{title}</h3></div>;
}
