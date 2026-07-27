"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import { formatPhone } from "@/lib/phone";

type Donor = { id: string; name: string; phone: string; totalDonation: number; donationCount: number; lastDonationAt: string | null };

export function DonorList() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/donors");
      const data = (await response.json()) as { donors?: Donor[]; message?: string };
      if (!response.ok) throw new Error(data.message);
      setDonors(data.donors ?? []);
    } catch { setError("Bağışçı bilgileri yüklenemedi."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const filtered = donors.filter((item) => `${item.name} ${item.phone}`.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR")));

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div><h2 className="font-bold text-[#0b2b3c]">Bağışçı listesi</h2><p className="mt-1 text-xs text-slate-500">{donors.length} kayıtlı bağışçı</p></div>
        <div className="relative w-full sm:max-w-xs"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-10" placeholder="Ad veya telefon ara" /></div>
      </div>
      {loading ? <div className="space-y-3 border-t border-slate-100 p-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        : error ? <ErrorState description={error} onRetry={() => void load()} />
        : filtered.length === 0 ? <EmptyState title="Bağışçı bulunamadı" description={search ? "Arama ifadenizi değiştirerek yeniden deneyin." : "İlk bağış kaydıyla bağışçı otomatik oluşturulur."} />
        : <div className="border-t border-slate-100">
          <div className="hidden grid-cols-[1.3fr_1fr_0.8fr_0.6fr_0.8fr_24px] gap-4 bg-slate-50 px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:grid"><span>Ad soyad</span><span>Telefon</span><span>Toplam bağış</span><span>Bağış sayısı</span><span>Son bağış</span><span /></div>
          <div className="divide-y divide-slate-100">{filtered.map((donor) => <Link key={donor.id} href={`/bagiscilar/${donor.id}`} className="grid gap-2 px-5 py-4 hover:bg-slate-50 md:grid-cols-[1.3fr_1fr_0.8fr_0.6fr_0.8fr_24px] md:items-center md:gap-4 md:px-6">
            <div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-[11px] font-bold text-[#0b2b3c]">{initials(donor.name)}</span><span className="text-sm font-semibold text-slate-800">{donor.name}</span></div>
            <span className="text-xs text-slate-600">{formatPhone(donor.phone)}</span><span className="text-sm font-bold text-[#0b2b3c]">{formatCurrency(donor.totalDonation)}</span><span className="text-xs text-slate-600">{donor.donationCount}</span><span className="text-xs text-slate-500">{donor.lastDonationAt ? formatDate(donor.lastDonationAt) : "—"}</span><ChevronRight className="hidden size-4 text-slate-400 md:block" />
          </Link>)}</div>
        </div>}
    </Card>
  );
}
