"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Bird, Download, Filter, HandCoins, Printer, ReceiptText, UserPlus, UsersRound } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { formatCurrency, formatDate } from "@/lib/utils";

type ReportData = {
  period: { days: number; startDate: string; endDate: string };
  summary: { total: number; donationCount: number; average: number; newDonors: number; filledShares: number; totalShares: number };
  daily: Array<{ date: string; amount: number; count: number }>;
  byType: Array<{ name: string; amount: number; count: number }>;
  byPayment: Array<{ name: string; amount: number; count: number }>;
  filters: {
    users: Array<{ id: string; name: string; roleCode: string }>;
    donationTypes: Array<{ id: string; name: string }>;
    paymentMethods: Array<{ value: string; label: string }>;
    selected: { userId: string | null; donationType: string | null; paymentMethod: string | null };
  };
  byUser: Array<{ userId: string; name: string; role: string; amount: number; count: number }>;
  donations: Array<{ id: string; receiptNo: string; donorName: string; type: string; paymentMethod: string; amount: number; createdAt: string; createdBy: { id: string; name: string; roleCode: string } }>;
  activities: Array<{ id: string; action: string; entity: string; entityId: string | null; createdAt: string; user: { name: string; roleCode: string } }>;
};

const pieColors = ["#10b981", "#0f766e", "#0ea5e9", "#8b5cf6", "#f59e0b"];
const roleLabels: Record<string, string> = { ADMIN: "Yönetici", DONATION_STAFF: "Bağış Personeli", REPORT_VIEWER: "Rapor Kullanıcısı" };
const actionLabels: Record<string, string> = {
  DONATION_CREATED: "Bağış kaydetti",
  SACRIFICE_SHARE_AUTO_ASSIGNED: "Kurban hissesi atadı",
  SACRIFICE_SHARE_RESERVED: "Kurban hissesi kaydetti",
  WHATSAPP_SENT: "WhatsApp mesajı gönderdi",
  WHATSAPP_FAILED: "WhatsApp gönderimi başarısız oldu",
  USER_CREATED: "Kullanıcı oluşturdu",
  USER_UPDATED: "Kullanıcı bilgilerini güncelledi",
  SETTINGS_UPDATED: "Sistem ayarlarını güncelledi",
};

export function ReportDashboard() {
  const [days, setDays] = useState(30);
  const [userId, setUserId] = useState("");
  const [donationType, setDonationType] = useState("");
  const [payment, setPayment] = useState("");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ days: days.toString() });
      if (userId) params.set("userId", userId);
      if (donationType) params.set("type", donationType);
      if (payment) params.set("payment", payment);
      const response = await fetch(`/api/reports?${params}`);
      const result = (await response.json()) as ReportData & { message?: string };
      if (!response.ok) throw new Error(result.message);
      setData(result);
    } catch { setError("Rapor verileri yüklenemedi."); }
    finally { setLoading(false); }
  }, [days, userId, donationType, payment]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  function exportCsv() {
    if (!data) return;
    const rows = [
      ["Makbuz No", "Bağışçı", "Bağış Türü", "Ödeme Yöntemi", "Tutar", "İşlemi Yapan", "Tarih"],
      ...data.donations.map((item) => [item.receiptNo, item.donorName, item.type, item.paymentMethod, item.amount.toString(), item.createdBy.name, new Date(item.createdAt).toLocaleString("tr-TR")]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${cell.replaceAll("\"", "\"\"")}"`).join(";")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `bagis-raporu-${days}-gun.csv`; anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-[1480px]" id="printable-report">
      <div className="hidden border-b-2 border-[#0b2b3c] pb-4 print:block"><h1 className="text-2xl font-bold text-[#0b2b3c]">Vefa Bağış Yönetimi</h1><p className="mt-1 text-sm text-slate-500">Bağış ve işlem raporu · {new Date().toLocaleString("tr-TR")}</p></div>
      <div className="print-hidden mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-xl font-bold text-[#0b2b3c]">Bağış raporları</h2><p className="mt-1 text-sm text-slate-500">Tahsilat ve bağış performansını gerçek zamanlı inceleyin.</p></div>
        <div className="flex gap-2">
          <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"><option value={7}>Son 7 gün</option><option value={30}>Son 30 gün</option><option value={90}>Son 90 gün</option><option value={365}>Son 1 yıl</option></select>
          <Button size="sm" variant="outline" disabled={!data?.donations.length} onClick={exportCsv}><Download className="size-4" /> CSV indir</Button>
          <Button size="sm" variant="primary" disabled={!data} onClick={() => window.print()}><Printer className="size-4" /> Yazdır / PDF</Button>
        </div>
      </div>
      {data && <Card className="print-hidden mb-5 p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#0b2b3c]"><Filter className="size-4 text-emerald-700" /> Gelişmiş filtreler</div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <select value={userId} onChange={(event) => setUserId(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700"><option value="">Tüm kullanıcılar</option>{data.filters.users.map((user) => <option key={user.id} value={user.id}>{user.name} · {roleLabels[user.roleCode] ?? user.roleCode}</option>)}</select>
          <select value={donationType} onChange={(event) => setDonationType(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700"><option value="">Tüm bağış türleri</option>{data.filters.donationTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select>
          <select value={payment} onChange={(event) => setPayment(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700"><option value="">Tüm ödeme yöntemleri</option>{data.filters.paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}</select>
          <Button type="button" variant="ghost" size="sm" onClick={() => { setUserId(""); setDonationType(""); setPayment(""); setDays(30); }}>Filtreleri temizle</Button>
        </div>
      </Card>}
      {loading ? <ReportSkeleton /> : error ? <Card><ErrorState description={error} onRetry={() => void load()} /></Card> : data && <ReportContent data={data} />}
    </div>
  );
}

function ReportContent({ data }: { data: ReportData }) {
  const stats = [
    { label: "Toplam Bağış", value: formatCurrency(data.summary.total), detail: `${data.summary.donationCount} işlem`, icon: HandCoins },
    { label: "Ortalama Bağış", value: formatCurrency(data.summary.average), detail: "İşlem başına", icon: ReceiptText },
    { label: "Yeni Bağışçı", value: data.summary.newDonors.toLocaleString("tr-TR"), detail: `${data.period.days} günlük dönem`, icon: UserPlus },
    { label: "Dolu Kurban Hissesi", value: `${data.summary.filledShares}/${data.summary.totalShares}`, detail: "Tüm kurbanlar", icon: Bird },
  ];
  return <>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((item) => <Card key={item.label} className="flex items-center gap-4 p-5"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><item.icon className="size-5" /></span><div><p className="text-xs text-slate-500">{item.label}</p><p className="mt-1 text-xl font-bold text-[#0b2b3c]">{item.value}</p><p className="mt-1 text-[10px] text-slate-400">{item.detail}</p></div></Card>)}</div>
    {data.summary.donationCount === 0 ? <Card className="mt-5"><EmptyState title="Bu dönemde bağış bulunmuyor" description="Farklı bir tarih aralığı seçerek yeniden deneyin." /></Card> : <>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-5 sm:p-6"><div className="mb-5"><h3 className="font-bold text-[#0b2b3c]">Günlük bağış hareketi</h3><p className="mt-1 text-xs text-slate-500">{formatDate(data.period.startDate)} – {formatDate(data.period.endDate)}</p></div><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.daily}><CartesianGrid vertical={false} stroke="#e9efec" strokeDasharray="4 4" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(value: string) => new Date(value).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })} minTickGap={24} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(value: number) => `${value / 1000}B`} /><Tooltip formatter={(value) => [formatCurrency(Number(value)), "Bağış"]} labelFormatter={(value) => formatDate(String(value))} contentStyle={{ border: 0, borderRadius: 12, boxShadow: "0 10px 30px #0f172a18", fontSize: 12 }} /><Bar dataKey="amount" fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={30} /></BarChart></ResponsiveContainer></div></Card>
        <Card className="p-5 sm:p-6"><h3 className="font-bold text-[#0b2b3c]">Bağış türleri</h3><p className="mt-1 text-xs text-slate-500">Toplam tutara göre dağılım</p><div className="h-48"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.byType} dataKey="amount" nameKey="name" innerRadius={48} outerRadius={75} paddingAngle={3}>{data.byType.map((item, index) => <Cell key={item.name} fill={pieColors[index % pieColors.length]} />)}</Pie><Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ border: 0, borderRadius: 12, fontSize: 12 }} /></PieChart></ResponsiveContainer></div><div className="space-y-2">{data.byType.map((item, index) => <div key={item.name} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-slate-600"><span className="size-2.5 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />{item.name}</span><strong className="text-slate-800">{formatCurrency(item.amount)}</strong></div>)}</div></Card>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><span className="grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-700"><UsersRound className="size-4" /></span><div><h3 className="font-bold text-[#0b2b3c]">Kullanıcı performansı</h3><p className="mt-0.5 text-xs text-slate-500">Bağışı kaydeden personele göre</p></div></div>
          <div className="divide-y divide-slate-100">{data.byUser.map((item) => <div key={item.userId} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="text-sm font-semibold text-slate-800">{item.name}</p><p className="mt-1 text-[10px] text-slate-500">{roleLabels[item.role] ?? item.role} · {item.count} bağış</p></div><p className="text-sm font-bold text-[#0b2b3c]">{formatCurrency(item.amount)}</p></div>)}</div>
        </Card>
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><span className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-700"><Activity className="size-4" /></span><div><h3 className="font-bold text-[#0b2b3c]">Son kullanıcı hareketleri</h3><p className="mt-0.5 text-xs text-slate-500">Sistemde yapılan kayıt ve değişiklikler</p></div></div>
          <div className="max-h-80 divide-y divide-slate-100 overflow-auto">{data.activities.map((item) => <div key={item.id} className="flex items-start justify-between gap-4 px-5 py-3.5"><div><p className="text-xs font-semibold text-slate-800">{item.user.name}</p><p className="mt-1 text-[11px] text-slate-500">{actionLabels[item.action] ?? item.action}</p></div><p className="shrink-0 text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p></div>)}{data.activities.length === 0 && <p className="p-5 text-xs text-slate-500">Bu dönemde kullanıcı hareketi bulunmuyor.</p>}</div>
        </Card>
      </div>
      <Card className="mt-5 overflow-hidden"><div className="border-b border-slate-100 px-5 py-4"><h3 className="font-bold text-[#0b2b3c]">Dönem işlemleri</h3><p className="mt-1 text-xs text-slate-500">Bağışı kaydeden kullanıcı bilgisiyle en yeni 50 işlem</p></div><div className="hidden grid-cols-[0.75fr_1fr_0.7fr_0.8fr_0.9fr_0.65fr] gap-3 bg-slate-50 px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400 md:grid"><span>Makbuz</span><span>Bağışçı</span><span>Tür</span><span>Ödeme</span><span>İşlemi yapan</span><span className="text-right">Tutar</span></div><div className="divide-y divide-slate-100">{data.donations.map((item) => <div key={item.id} className="grid gap-2 px-5 py-4 md:grid-cols-[0.75fr_1fr_0.7fr_0.8fr_0.9fr_0.65fr] md:items-center md:gap-3"><span className="text-[11px] font-medium text-slate-500">{item.receiptNo}</span><span className="text-sm font-semibold text-slate-800">{item.donorName}</span><span className="text-xs text-slate-600">{item.type}</span><span className="text-xs text-slate-500">{item.paymentMethod}</span><span className="text-xs font-semibold text-sky-700">{item.createdBy.name}</span><span className="text-sm font-bold text-[#0b2b3c] md:text-right">{formatCurrency(item.amount)}</span></div>)}</div></Card>
    </>}
  </>;
}

function ReportSkeleton() {
  return <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Card key={index} className="flex gap-4 p-5"><Skeleton className="size-11" /><div className="flex-1"><Skeleton className="h-3 w-20" /><Skeleton className="mt-3 h-6 w-28" /></div></Card>)}</div><div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]"><Card className="p-6"><Skeleton className="h-5 w-40" /><Skeleton className="mt-6 h-72" /></Card><Card className="p-6"><Skeleton className="h-5 w-28" /><Skeleton className="mx-auto mt-6 size-48 rounded-full" /></Card></div></>;
}
