"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Check, FileText, LoaderCircle, MessageCircle, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { settingsSchema } from "@/lib/validations";

type SettingsInput = z.infer<typeof settingsSchema>;
type IntegrationInfo = { whatsappProvider: string; whatsappConfigured: boolean };

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">{label}</span>{children}{error && <span className="mt-1.5 block text-xs text-red-600">{error}</span>}</label>;
}

export function SettingsForm() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [integration, setIntegration] = useState<IntegrationInfo | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { organizationName: "", organizationPhone: "", organizationEmail: "", organizationAddress: "", receiptPrefix: "BGS", whatsappEnabled: true },
  });

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/settings", { signal: controller.signal }).then(async (response) => {
      const data = (await response.json()) as { settings?: SettingsInput; integrations?: IntegrationInfo; message?: string };
      if (!response.ok || !data.settings) throw new Error(data.message);
      reset(data.settings); setIntegration(data.integrations ?? null);
    }).catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) setLoadError("Ayarlar yüklenemedi.");
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [reset]);

  async function save(values: SettingsInput) {
    setMessage(""); setSaveError("");
    try {
      const response = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const data = (await response.json()) as { settings?: SettingsInput; message?: string };
      if (!response.ok || !data.settings) { setSaveError(data.message ?? "Ayarlar kaydedilemedi."); return; }
      reset(data.settings); setMessage(data.message ?? "Ayarlar kaydedildi.");
    } catch { setSaveError("Ayarlar kaydedilemedi. Bağlantınızı kontrol edin."); }
  }

  if (loading) return <div className="grid gap-5 xl:grid-cols-[1fr_340px]"><Card className="space-y-5 p-6"><Skeleton className="h-6 w-40" />{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12" />)}</Card><Card className="h-64 p-6"><Skeleton className="size-11" /><Skeleton className="mt-5 h-5 w-36" /><Skeleton className="mt-4 h-20" /></Card></div>;
  if (loadError) return <Card><ErrorState description={loadError} /></Card>;

  return (
    <form onSubmit={handleSubmit(save)} className="mx-auto grid max-w-[1280px] gap-5 xl:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        <Card className="p-5 sm:p-6">
          <SectionTitle icon={Building2} title="Kurum bilgileri" description="Makbuz ve mesajlarda kullanılacak temel bilgiler" />
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label="Kurum adı" error={errors.organizationName?.message}><Input {...register("organizationName")} /></Field></div>
            <Field label="Telefon" error={errors.organizationPhone?.message}><Input inputMode="tel" placeholder="0XXX XXX XX XX" {...register("organizationPhone")} /></Field>
            <Field label="E-posta" error={errors.organizationEmail?.message}><Input type="email" placeholder="bilgi@kurum.org" {...register("organizationEmail")} /></Field>
            <div className="sm:col-span-2"><Field label="Adres" error={errors.organizationAddress?.message}><textarea className="min-h-24 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50" {...register("organizationAddress")} /></Field></div>
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <SectionTitle icon={FileText} title="Makbuz ayarları" description="Bağış makbuzlarının numaralandırma tercihi" />
          <div className="mt-6 max-w-xs"><Field label="Makbuz numarası ön eki" error={errors.receiptPrefix?.message}><Input className="uppercase" maxLength={10} {...register("receiptPrefix", { onChange: (event) => { event.target.value = event.target.value.toLocaleUpperCase("tr-TR"); } })} /></Field><p className="mt-2 text-[10px] leading-4 text-slate-400">Örnek: BGS-20260727-A1B2C3D4</p></div>
        </Card>
      </div>
      <div className="space-y-5">
        <Card className="p-5">
          <SectionTitle icon={MessageCircle} title="WhatsApp" description="Bağış sonrası teşekkür mesajları" />
          <label className="mt-5 flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 p-3"><span><span className="block text-xs font-semibold text-slate-700">Otomatik mesaj</span><span className="mt-0.5 block text-[10px] text-slate-500">Bağış sonrası WhatsApp gönderimine izin verir</span></span><input type="checkbox" className="size-4 accent-emerald-600" {...register("whatsappEnabled")} /></label>
          <div className="mt-4 rounded-xl border border-slate-100 p-3"><div className="flex items-center justify-between"><span className="text-xs text-slate-500">Sağlayıcı</span><strong className="text-xs capitalize text-slate-800">{integration?.whatsappProvider ?? "mock"}</strong></div><div className="mt-3 flex items-center justify-between"><span className="text-xs text-slate-500">Gerçek gönderim</span><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${integration?.whatsappConfigured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{integration?.whatsappConfigured ? "Hazır" : "Yapılandırılmadı"}</span></div></div>
        </Card>
        <Card className="p-5">
          <Button type="submit" variant="success" className="w-full" disabled={isSubmitting}>{isSubmitting ? <><LoaderCircle className="size-4 animate-spin" /> Kaydediliyor</> : <><Save className="size-4" /> Ayarları kaydet</>}</Button>
          {message && <p role="status" className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700"><Check className="size-4" />{message}</p>}
          {saveError && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{saveError}</p>}
        </Card>
      </div>
    </form>
  );
}

function SectionTitle({ icon: Icon, title, description }: { icon: typeof Building2; title: string; description: string }) {
  return <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon className="size-5" /></span><div><h2 className="text-sm font-bold text-[#0b2b3c]">{title}</h2><p className="mt-0.5 text-[11px] text-slate-500">{description}</p></div></div>;
}
