"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronRight, LoaderCircle, MapPin, MessageCircle, Search, UserRound } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DONATION_TYPES, PAYMENT_METHODS, SACRIFICE_KINDS, type SacrificeKind } from "@/lib/constants";
import { donationSchema } from "@/lib/validations";
import { publishDonation } from "@/lib/realtime";
import { normalizePhone } from "@/lib/phone";

type DonationResponse = {
  donation?: {
    id: string;
    donorName: string;
    type: string;
    amount: number;
    createdAt: string;
    status: "COMPLETED" | "PENDING";
  };
  duplicate?: boolean;
  message?: string;
};

type SacrificeOption = {
  id: string;
  number: number;
  region: string;
  kind: SacrificeKind;
  sharePrice: number;
  status: "OPEN" | "COMPLETED" | "CANCELLED";
  shares: Array<{ status: string }>;
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1.5 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

export function DonationForm() {
  const [successMessage, setSuccessMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [donorFound, setDonorFound] = useState(false);
  const [sacrifices, setSacrifices] = useState<SacrificeOption[]>([]);
  const [sacrificeKind, setSacrificeKind] = useState<SacrificeKind>("VACIP");
  const lookupAbortRef = useRef<AbortController | null>(null);
  const {
    register, handleSubmit, reset, setValue, control,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof donationSchema>, unknown, z.output<typeof donationSchema>>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      type: DONATION_TYPES[0], paymentMethod: "CASH", sendWhatsapp: true,
      description: "", idempotencyKey: crypto.randomUUID(),
    },
  });
  const phone = useWatch({ control, name: "phone" });
  const donationType = useWatch({ control, name: "type" });
  const sacrificeId = useWatch({ control, name: "sacrificeId" });

  useEffect(() => {
    if (donationType !== "Kurban") return;
    const controller = new AbortController();
    void fetch("/api/sacrifices", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as { sacrifices: SacrificeOption[] };
        const available = data.sacrifices.filter(
          (item) => item.kind === sacrificeKind && item.status === "OPEN" && item.shares.some((share) => share.status === "EMPTY"),
        );
        setSacrifices(available);
        const selected = available.find((item) => item.id === sacrificeId) ?? available[0];
        if (selected) {
          setValue("sacrificeId", selected.id, { shouldValidate: true });
          setValue("amount", selected.sharePrice, { shouldValidate: true });
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setSacrifices([]);
      });
    return () => controller.abort();
  }, [donationType, sacrificeId, sacrificeKind, setValue]);

  useEffect(() => {
    if (donationType !== "Kurban") return;
    const selected = sacrifices.find((item) => item.id === sacrificeId);
    if (selected) setValue("amount", selected.sharePrice, { shouldValidate: true });
  }, [donationType, sacrificeId, sacrifices, setValue]);

  useEffect(() => {
    const selectedType = new URLSearchParams(window.location.search).get("tur");
    if (selectedType && DONATION_TYPES.some((type) => type === selectedType)) setValue("type", selectedType);
  }, [setValue]);

  useEffect(() => {
    const normalized = normalizePhone(phone ?? "");
    const timer = window.setTimeout(async () => {
      if (!/^\+905\d{9}$/.test(normalized)) {
        setDonorFound(false);
        return;
      }
      lookupAbortRef.current?.abort();
      const controller = new AbortController();
      lookupAbortRef.current = controller;
      try {
        const response = await fetch(`/api/donors/lookup?phone=${encodeURIComponent(normalized)}`, { signal: controller.signal });
        if (!response.ok) return;
        const data = (await response.json()) as { donor: { name: string } | null };
        if (data.donor) {
          setValue("donorName", data.donor.name, { shouldValidate: true });
          setDonorFound(true);
        } else setDonorFound(false);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setDonorFound(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [phone, setValue]);

  const onSubmit = async (values: z.output<typeof donationSchema>) => {
    setFormError("");
    setSuccessMessage("");
    try {
      const response = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as DonationResponse;
      if (!response.ok || !result.donation) {
        setFormError(result.message ?? "Bağış kaydedilemedi. Lütfen yeniden deneyin.");
        return;
      }
      if (!result.duplicate) {
        publishDonation({
          id: result.donation.id,
          donorName: result.donation.donorName,
          type: result.donation.type,
          amount: result.donation.amount,
          date: new Intl.DateTimeFormat("tr-TR", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
          }).format(new Date(result.donation.createdAt)).replace(",", " ·"),
          status: result.donation.status === "COMPLETED" ? "Tamamlandı" : "Bekliyor",
        });
      }
      setSuccessMessage(result.duplicate ? "Bu bağış daha önce kaydedilmiş." : "Bağış başarıyla kaydedildi ve makbuz oluşturuldu.");
      reset({
        type: values.type, paymentMethod: "CASH", sendWhatsapp: true,
        sacrificeId: values.sacrificeId,
        description: "", idempotencyKey: crypto.randomUUID(), donorName: "", phone: "", amount: values.type === "Kurban" ? values.amount : undefined,
      });
      setDonorFound(false);
    } catch {
      setFormError("Bağış kaydedilemedi. İnternet bağlantınızı kontrol edip yeniden deneyin.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <Card className="p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><UserRound className="size-5" /></span>
          <div><h2 className="font-bold text-[#0b2b3c]">Bağış ve bağışçı bilgileri</h2><p className="text-xs text-slate-500">Zorunlu alanları doldurarak işlemi tamamlayın.</p></div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Bağış türü" error={errors.type?.message}>
            <select className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50" {...register("type")}>
              {DONATION_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </Field>
          {donationType === "Kurban" && (
            <>
              <Field label="Kurban çeşidi">
                <select value={sacrificeKind} onChange={(event) => setSacrificeKind(event.target.value as SacrificeKind)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50">
                  {SACRIFICE_KINDS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </Field>
              <Field label="Kurban ülkesi" error={errors.sacrificeId?.message}>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <select
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                    {...register("sacrificeId")}
                  >
                    {sacrifices.length === 0 && <option value="">Uygun kurban bulunamadı</option>}
                    {sacrifices.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.region} · {item.number}. Kurban · {item.sharePrice.toLocaleString("tr-TR")} ₺
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
            </>
          )}
          <Field label="Telefon numarası" error={errors.phone?.message}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input className="pl-11" inputMode="tel" autoComplete="tel" maxLength={17} placeholder="05XX XXX XX XX" {...register("phone")} />
              {donorFound && <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">Kayıtlı bağışçı</span>}
            </div>
          </Field>
          <Field label="Ad soyad" error={errors.donorName?.message}>
            <Input placeholder="Örn. Mehmet Kaya" {...register("donorName")} />
          </Field>
          <Field label="Bağış tutarı" error={errors.amount?.message}>
            <div className="relative"><Input className="pr-12 text-lg font-semibold" inputMode="decimal" placeholder="0" readOnly={donationType === "Kurban"} {...register("amount")} /><span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-slate-400">₺</span></div>
          </Field>
          <Field label="Ödeme yöntemi" error={errors.paymentMethod?.message}>
            <select className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50" {...register("paymentMethod")}>
              {PAYMENT_METHODS.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Açıklama (isteğe bağlı)" error={errors.description?.message}>
              <textarea className="min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50" placeholder="Bağışa ilişkin kısa bir açıklama..." {...register("description")} />
            </Field>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <h3 className="font-bold text-[#0b2b3c]">İşlem özeti</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><Check className="size-4 text-emerald-600" /><span className="text-slate-600">Makbuz otomatik oluşturulur</span></div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-3"><input type="checkbox" className="size-4 accent-emerald-600" {...register("sendWhatsapp")} /><MessageCircle className="size-4 text-emerald-600" /><span className="text-slate-600">WhatsApp teşekkür mesajı gönder</span></label>
          </div>
          <Button type="submit" variant="success" className="mt-5 w-full" disabled={isSubmitting}>
            {isSubmitting ? <><LoaderCircle className="size-4 animate-spin" /> Kaydediliyor</> : <>Bağışı Kaydet <ChevronRight className="size-4" /></>}
          </Button>
        </Card>
        {successMessage && <div role="status" className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><Check className="mt-0.5 size-4 shrink-0" /><span>{successMessage}</span></div>}
        {formError && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{formError}</div>}
      </div>
    </form>
  );
}
