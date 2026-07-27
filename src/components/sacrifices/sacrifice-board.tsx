"use client";

import { useCallback, useEffect, useState } from "react";
import { Bird, Check, LoaderCircle, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

type ShareStatus = "EMPTY" | "PENDING" | "FILLED" | "CANCELLED";
type Share = {
  id: string; shareNo: number; status: ShareStatus; paymentStatus: "PENDING" | "PAID" | "CANCELLED";
  paymentMethod: string | null; amount: number; version: number; donor: { name: string; phone: string } | null;
};
type Sacrifice = { id: string; number: number; region: string; sharePrice: number; status: "OPEN" | "COMPLETED" | "CANCELLED"; shares: Share[] };

const shareStyles: Record<ShareStatus, string> = {
  EMPTY: "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  FILLED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
};
const statusLabels: Record<ShareStatus, string> = { EMPTY: "Boş", PENDING: "Bekleyen", FILLED: "Dolu", CANCELLED: "İptal" };

export function SacrificeBoard() {
  const [sacrifices, setSacrifices] = useState<Sacrifice[]>([]);
  const [selected, setSelected] = useState<{ sacrifice: Sacrifice; share: Share } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/sacrifices");
      const data = (await response.json()) as { sacrifices?: Sacrifice[]; message?: string };
      if (!response.ok) throw new Error(data.message);
      setSacrifices(data.sacrifices ?? []);
    } catch { setError("Kurban bilgileri yüklenemedi."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (loading) return <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-5"><Skeleton className="h-6 w-36" /><Skeleton className="mt-5 h-2 w-full" /><div className="mt-5 grid grid-cols-7 gap-2">{Array.from({ length: 7 }).map((__, x) => <Skeleton key={x} className="aspect-square" />)}</div></Card>)}</div>;
  if (error) return <Card><ErrorState description={error} onRetry={() => void load()} /></Card>;

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-4 text-[11px] font-medium text-slate-500">
        {(["EMPTY", "PENDING", "FILLED", "CANCELLED"] as ShareStatus[]).map((status) => <span key={status} className="flex items-center gap-1.5"><span className={`size-3 rounded border ${shareStyles[status]}`} />{statusLabels[status]}</span>)}
      </div>
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {sacrifices.map((sacrifice) => {
          const filled = sacrifice.shares.filter((share) => share.status === "FILLED").length;
          return (
            <Card key={sacrifice.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Bird className="size-5" /></span><div><h3 className="font-bold text-[#0b2b3c]">{sacrifice.number}. Kurban</h3><p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><MapPin className="size-3" />{sacrifice.region}</p></div></div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${sacrifice.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"}`}>{sacrifice.status === "COMPLETED" ? "Tamamlandı" : "Hisseye açık"}</span>
              </div>
              <div className="mt-5 flex items-end justify-between"><div><p className="text-[10px] text-slate-400">Hisse bedeli</p><p className="mt-1 text-lg font-bold text-[#0b2b3c]">{formatCurrency(sacrifice.sharePrice)}</p></div><p className="text-xs text-slate-500"><strong className="text-slate-800">{filled}</strong> dolu · <strong className="text-slate-800">{7 - filled}</strong> kalan</p></div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(filled / 7) * 100}%` }} /></div>
              <div className="mt-5 grid grid-cols-7 gap-2">
                {sacrifice.shares.map((share) => (
                  <button key={share.id} disabled={share.status !== "EMPTY" || sacrifice.status !== "OPEN"} onClick={() => setSelected({ sacrifice, share })} title={`${share.shareNo}. hisse · ${statusLabels[share.status]}`} className={`aspect-square rounded-lg border text-xs font-bold transition-colors disabled:cursor-default ${shareStyles[share.status]}`}>{share.shareNo}</button>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
      {selected && <ShareModal selected={selected} onClose={() => setSelected(null)} onSaved={async () => { setSelected(null); await load(); }} />}
    </>
  );
}

function ShareModal({ selected, onClose, onSaved }: { selected: { sacrifice: Sacrifice; share: Share }; onClose: () => void; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const values = new FormData(event.currentTarget);
    const response = await fetch("/api/sacrifices/shares", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sacrificeId: selected.sacrifice.id, shareNo: selected.share.shareNo, version: selected.share.version,
        donorName: values.get("donorName"), phone: values.get("phone"), amount: values.get("amount"),
        paymentMethod: values.get("paymentMethod"), paymentStatus: values.get("paymentStatus"),
        sendWhatsapp: values.get("sendWhatsapp") === "on",
      }),
    });
    const data = (await response.json()) as { message?: string };
    if (!response.ok) { setError(data.message ?? "Hisse kaydedilemedi."); setSaving(false); return; }
    await onSaved();
  }
  return (
    <div className="fixed inset-0 z-[70] grid place-items-end bg-slate-950/40 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <Card className="max-h-[92vh] w-full overflow-auto rounded-b-none p-5 sm:max-w-lg sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between"><div><h2 className="text-lg font-bold text-[#0b2b3c]">{selected.sacrifice.number}. Kurban · {selected.share.shareNo}. Hisse</h2><p className="mt-1 text-xs text-slate-500">{selected.sacrifice.region} bölgesi için hisse kaydı</p></div><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="size-5" /></button></div>
        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="mb-2 block text-xs font-semibold text-slate-700">Bağışçı</span><Input name="donorName" required placeholder="Ad soyad" /></label>
          <label className="sm:col-span-2"><span className="mb-2 block text-xs font-semibold text-slate-700">Telefon</span><Input name="phone" required inputMode="tel" placeholder="05XX XXX XX XX" /></label>
          <label><span className="mb-2 block text-xs font-semibold text-slate-700">Hisse tutarı</span><Input name="amount" required type="number" min="1" defaultValue={selected.sacrifice.sharePrice} /></label>
          <label><span className="mb-2 block text-xs font-semibold text-slate-700">Ödeme yöntemi</span><select name="paymentMethod" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">{PAYMENT_METHODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label><span className="mb-2 block text-xs font-semibold text-slate-700">Ödeme durumu</span><select name="paymentStatus" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="PAID">Ödendi</option><option value="PENDING">Bekliyor</option><option value="CANCELLED">İptal</option></select></label>
          <label className="flex items-end"><span className="flex h-12 w-full items-center gap-2 rounded-xl bg-slate-50 px-3 text-xs font-medium text-slate-600"><input name="sendWhatsapp" type="checkbox" defaultChecked className="accent-emerald-600" /> WhatsApp gönder</span></label>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700 sm:col-span-2">{error}</p>}
          <div className="flex gap-3 pt-2 sm:col-span-2"><Button type="button" variant="outline" className="flex-1" onClick={onClose}>Vazgeç</Button><Button type="submit" variant="success" className="flex-1" disabled={saving}>{saving ? <LoaderCircle className="size-4 animate-spin" /> : <><Check className="size-4" /> Kaydet</>}</Button></div>
        </form>
      </Card>
    </div>
  );
}
