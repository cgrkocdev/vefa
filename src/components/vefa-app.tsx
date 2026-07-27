"use client";

import { useState } from "react";
import {
  Bell, ChartNoAxesCombined, ChevronLeft, ChevronRight, CircleUserRound, DatabaseZap, Download,
  Eye, EyeOff, FileText, HandCoins, HandHeart, HeartHandshake, Home, LoaderCircle, LockKeyhole,
  LogOut, Mail, Menu, MessageCircle, Plus, Search, Settings, ShieldCheck, Trash2, Users, X,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { dateTime, formatPhoneInput, kindLabels, money, normalizePhone, paymentLabels } from "@/lib/format";
import type { DonationKind, UserRole } from "@/lib/models";
import { useVefaStore } from "@/lib/store";

type View = "dashboard" | "new" | "sacrifices" | "donors" | "messages" | "reports" | "users" | "settings";
const nav = [
  { id: "dashboard" as const, label: "Ana Sayfa", icon: Home },
  { id: "new" as const, label: "Yeni Bağış", icon: Plus },
  { id: "sacrifices" as const, label: "Kurbanlar", icon: HeartHandshake },
  { id: "donors" as const, label: "Bağışçılar", icon: Users },
  { id: "messages" as const, label: "WhatsApp", icon: MessageCircle },
  { id: "reports" as const, label: "Raporlar", icon: ChartNoAxesCombined },
  { id: "users" as const, label: "Kullanıcılar", icon: ShieldCheck },
  { id: "settings" as const, label: "Ayarlar", icon: Settings },
];
const viewInfo: Record<View, [string, string]> = {
  dashboard: ["Ana Sayfa", "Bağış faaliyetlerinizi tek ekrandan yönetin."],
  new: ["Yeni Bağış", "Hızlı ve kolay bağış kaydı oluşturun."],
  sacrifices: ["Kurban Yönetimi", "Ülke, fiyat ve hisse doluluklarını takip edin."],
  donors: ["Bağışçılar", "Bağışçı geçmişini ve toplamlarını görüntüleyin."],
  messages: ["WhatsApp Kayıtları", "Hazırlanan teşekkür mesajlarını takip edin."],
  reports: ["Gelişmiş Raporlar", "Verileri filtreleyin, yazdırın veya dışa aktarın."],
  users: ["Kullanıcılar", "İşlemi yapan kullanıcıları ve rolleri yönetin."],
  settings: ["Ayarlar", "Kurum ve tarayıcı verisi ayarlarını yönetin."],
};

const schema = z.object({
  kind: z.enum(["KURBAN", "ZEKAT", "KURAN", "GENEL"]),
  fullName: z.string().trim().min(3, "Ad soyad zorunludur."),
  phone: z.string().refine((value) => /^0?5\d{9}$/.test(normalizePhone(value)), "Geçerli bir Türkiye cep telefonu girin."),
  amount: z.number().positive("Tutar sıfırdan büyük olmalıdır."),
  paymentMethod: z.enum(["NAKIT", "HAVALE", "KART", "DIGER"]),
  description: z.string(),
  sacrificeId: z.string(),
  sendWhatsapp: z.boolean(),
});
type DonationForm = z.infer<typeof schema>;

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}
function Badge({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "amber" | "slate" }) {
  const colors = tone === "green" ? "bg-emerald-50 text-emerald-700" : tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors}`}>{children}</span>;
}
function Empty({ title, text }: { title: string; text: string }) {
  return <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-center">
    <DatabaseZap className="mb-3 text-slate-300" size={34} /><p className="font-semibold text-slate-700">{title}</p><p className="mt-1 text-sm text-slate-400">{text}</p>
  </div>;
}

export function VefaApp() {
  const store = useVefaStore();
  const [authenticated, setAuthenticated] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const currentUser = store.data.users.find((user) => user.id === store.data.currentUserId) ?? store.data.users[0];
  const canEdit = currentUser?.role !== "RAPOR";
  const visibleNav = nav.filter((item) => currentUser?.role === "YONETICI" || !["users", "settings"].includes(item.id));

  const go = (next: View) => { setView(next); setMobileOpen(false); };
  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 3500); };

  if (!store.ready) return <div className="min-h-screen animate-pulse bg-slate-100 p-8"><div className="h-20 rounded-2xl bg-white" /></div>;
  if (!authenticated && sessionStorage.getItem("vefa-session") !== "active") {
    return <LoginScreen onLogin={() => { sessionStorage.setItem("vefa-session", "active"); setAuthenticated(true); }} />;
  }

  return <div className="min-h-screen bg-[#f4f6f8]">
    {mobileOpen && <button aria-label="Menüyü kapat" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setMobileOpen(false)} />}
    <aside className={`no-print fixed inset-y-0 left-0 z-40 flex w-[276px] flex-col bg-[#082839] px-3 py-5 text-white shadow-2xl transition-[transform,width] lg:translate-x-0 lg:shadow-none ${collapsed ? "lg:w-[88px]" : "lg:w-[252px]"} ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="mb-7 flex items-center justify-between px-3">
        <button onClick={() => go("dashboard")} className="flex items-center gap-3 text-left"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-500"><HandHeart /></span><span className={collapsed ? "lg:hidden" : ""}><b className="block text-xl">Vefa</b><small className="text-[10px] uppercase tracking-[.2em] text-slate-400">Bağış Yönetimi</small></span></button>
        <button className="lg:hidden" onClick={() => setMobileOpen(false)}><X /></button>
      </div>
      <nav className="space-y-1">
        {visibleNav.map(({ id, label, icon: Icon }) => <button title={collapsed ? label : undefined} key={id} onClick={() => go(id)} className={`relative flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${collapsed ? "lg:justify-center lg:px-0" : ""} ${view === id ? "bg-white/11 text-white" : "text-slate-300 hover:bg-white/8 hover:text-white"}`}><Icon size={19} className={view === id ? "text-emerald-400" : ""} /><span className={collapsed ? "lg:hidden" : ""}>{label}</span>{view === id && <span className="absolute right-0 h-5 w-0.5 rounded-l-full bg-emerald-400" />}</button>)}
      </nav>
      <div className={`mt-auto rounded-2xl bg-white/6 p-3 ${collapsed ? "lg:hidden" : ""}`}>
        <p className="text-xs text-slate-400">Veri modu</p><p className="mt-1 flex items-center gap-2 text-sm font-medium"><span className="size-2 rounded-full bg-emerald-400" />Bu tarayıcıda saklanıyor</p>
        <button onClick={() => { sessionStorage.removeItem("vefa-session"); setAuthenticated(false); }} className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-300"><LogOut size={15} />Güvenli çıkış</button>
      </div>
      <button onClick={() => setCollapsed((value) => !value)} className="mt-3 hidden h-10 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-white/8 hover:text-white lg:flex">{collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} />Menüyü daralt</>}</button>
    </aside>

    <main className={`min-h-screen transition-[margin] ${collapsed ? "lg:ml-[88px]" : "lg:ml-[252px]"}`}>
      <header className="no-print sticky top-0 z-20 min-h-[84px] border-b border-slate-200/70 bg-[#f6f8f7]/92 px-4 py-4 backdrop-blur-xl md:px-7">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <button className="rounded-lg p-2 text-slate-600 lg:hidden" onClick={() => setMobileOpen(true)}><Menu /></button>
          <div className="min-w-0 flex-1"><h1 className="truncate text-xl font-bold text-[#0b1739]">{viewInfo[view][0]}</h1><p className="hidden truncate text-sm text-slate-500 md:block">{viewInfo[view][1]}</p></div>
          <label className="hidden w-64 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 md:flex"><Search size={18} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Bağışçı ara..." className="h-10 w-full bg-transparent text-sm outline-none" /></label>
          <button className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600"><Bell size={19} /><span className="absolute right-2 top-2 size-2 rounded-full bg-emerald-500" /></button>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-2"><CircleUserRound className="text-emerald-700" /><div className="hidden sm:block"><p className="max-w-32 truncate text-xs font-semibold">{currentUser?.name}</p><p className="text-[10px] text-slate-400">{currentUser?.role.replaceAll("_", " ")}</p></div></div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl p-4 md:p-7">
        {view === "dashboard" && <Dashboard data={store.data} go={go} canEdit={canEdit} search={search} />}
        {view === "new" && <DonationScreen store={store} notify={notify} />}
        {view === "sacrifices" && <Sacrifices data={store.data} />}
        {view === "donors" && <Donors data={store.data} search={search} />}
        {view === "messages" && <Messages data={store.data} />}
        {view === "reports" && <Reports data={store.data} />}
        {view === "users" && <UsersScreen store={store} notify={notify} />}
        {view === "settings" && <SettingsScreen store={store} notify={notify} />}
      </div>
    </main>
    {toast && <div className="fixed right-5 top-24 z-50 max-w-sm rounded-xl bg-[#0b1739] px-5 py-4 text-sm text-white shadow-2xl">{toast}</div>}
  </div>;
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("yonetici@vefa.org");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      if (email.trim().toLocaleLowerCase("tr") !== "yonetici@vefa.org" || password !== "Degistir123!") {
        setError("E-posta adresi veya şifre hatalı.");
        return;
      }
      onLogin();
    }, 350);
  }

  const inputClass = "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100";
  return <main className="grid min-h-screen bg-[#f6f8f7] lg:grid-cols-[1.05fr_0.95fr]">
    <section className="hidden overflow-hidden bg-[#082839] p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-emerald-500"><HandHeart size={24} /></span><div><p className="text-xl font-bold">Vefa</p><p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Bağış Yönetimi</p></div></div>
      <div className="max-w-xl"><div className="mb-8 h-1 w-14 rounded-full bg-emerald-500" /><h1 className="text-4xl font-bold leading-tight xl:text-5xl">İyiliği, güvenle<br />ve kolayca yönetin.</h1><p className="mt-6 max-w-lg text-base leading-7 text-slate-300">Bağış, bağışçı ve kurban süreçleriniz tek bir hızlı çalışma alanında.</p></div>
      <p className="text-xs text-slate-500">© 2026 Vefa Bağış Yönetim Sistemi</p>
    </section>
    <section className="flex items-center justify-center px-5 py-12 sm:px-10">
      <div className="w-full max-w-md">
        <div className="mb-9 flex items-center gap-3 lg:hidden"><span className="grid size-10 place-items-center rounded-xl bg-emerald-500 text-white"><HandHeart size={20} /></span><strong className="text-xl text-[#0b2b3c]">Vefa</strong></div>
        <p className="text-sm font-semibold text-emerald-600">Tekrar hoş geldiniz</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0b2b3c]">Hesabınıza giriş yapın</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">Yönetim paneline erişmek için bilgilerinizi girin.</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">E-posta adresi</span><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className={`${inputClass} pl-11`} placeholder="ornek@kurum.org" /></div></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Şifre</span><div className="relative"><LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} className={`${inputClass} pl-11 pr-11`} placeholder="••••••••" /><button type="button" aria-label="Şifre görünürlüğünü değiştir" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">{error}</p>}
          <button disabled={loading} className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin" size={18} /> : "Giriş Yap"}</button>
        </form>
        <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-xs leading-5 text-emerald-900"><b>Yerel giriş:</b> yonetici@vefa.org<br /><b>Şifre:</b> Degistir123!</div>
        <p className="mt-7 text-center text-xs text-slate-400">Bu sürümde oturum ve kayıtlar yalnızca bu tarayıcıda tutulur.</p>
      </div>
    </section>
  </main>;
}

function Dashboard({ data, go, canEdit, search }: { data: ReturnType<typeof useVefaStore>["data"]; go: (v: View) => void; canEdit: boolean; search: string }) {
  const today = new Date().toDateString();
  const month = new Date().getMonth();
  const todayTotal = data.donations.filter((d) => new Date(d.createdAt).toDateString() === today).reduce((a, b) => a + b.amount, 0);
  const monthTotal = data.donations.filter((d) => new Date(d.createdAt).getMonth() === month).reduce((a, b) => a + b.amount, 0);
  const remaining = data.sacrifices.flatMap((s) => s.shares).filter((s) => s.status === "BOS").length;
  const recent = data.donations.filter((d) => !search || `${d.donorName} ${kindLabels[d.kind]}`.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr"))).slice(0, 8);
  const actions: [DonationKind, string, string][] = [["KURBAN", "Kurban Bağışı", "Ülke seçerek otomatik hisse ayırın."], ["ZEKAT", "Zekât", "Zekât bağışını saniyeler içinde kaydedin."], ["KURAN", "Kur’an Bağışı", "Kur’an bağışlarını düzenli takip edin."], ["GENEL", "Genel Bağış", "Diğer destekleri hızlıca kaydedin."]];
  return <div className="space-y-7">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{actions.map(([kind, title, text]) => <Card key={kind} className="group transition hover:-translate-y-0.5 hover:shadow-md"><div className="mb-5 grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><HandCoins /></div><h2 className="font-bold text-[#0b1739]">{title}</h2><p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">{text}</p>{canEdit && <button onClick={() => { sessionStorage.setItem("vefa-kind", kind); go("new"); }} className="mt-5 flex items-center gap-2 text-sm font-semibold text-emerald-700">Bağış Ekle <ChevronRight size={16} /></button>}</Card>)}</div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Bugünkü Bağış", money(todayTotal), HandCoins], ["Bu Ayki Bağış", money(monthTotal), ChartNoAxesCombined], ["Toplam Bağışçı", data.donors.length.toLocaleString("tr-TR"), Users], ["Kalan Kurban Hissesi", remaining.toString(), HeartHandshake]].map(([label, value, Icon]) => <Card key={String(label)}><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">{String(label)}</p><p className="mt-2 text-2xl font-bold text-[#0b1739]">{String(value)}</p></div><Icon className="text-slate-300" size={30} /></div></Card>)}</div>
    <Card><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold text-[#0b1739]">Son Gelen Bağışlar</h2><p className="mt-1 text-sm text-slate-500">En yeni kayıtlar anında burada görünür.</p></div><Badge>{data.donations.length} kayıt</Badge></div>{recent.length ? <div className="divide-y divide-slate-100">{recent.map((d) => <div key={d.id} className="grid gap-2 py-4 text-sm sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto] sm:items-center"><b>{d.donorName}</b><span className="text-slate-500">{kindLabels[d.kind]}</span><b className="text-emerald-700">{money(d.amount)}</b><span className="text-slate-400">{dateTime(d.createdAt)}</span><Badge>Alındı</Badge></div>)}</div> : <Empty title="Henüz bağış yok" text="İlk bağışı eklediğinizde burada görünecek." />}</Card>
  </div>;
}

function DonationScreen({ store, notify }: { store: ReturnType<typeof useVefaStore>; notify: (text: string) => void }) {
  const initialKind = (typeof window !== "undefined" ? sessionStorage.getItem("vefa-kind") : null) as DonationKind | null;
  const form = useForm<DonationForm>({ resolver: zodResolver(schema), defaultValues: { kind: initialKind ?? "GENEL", fullName: "", phone: "", amount: 0, paymentMethod: "NAKIT", description: "", sacrificeId: "", sendWhatsapp: true } });
  const kind = useWatch({ control: form.control, name: "kind" });
  const sacrificeId = useWatch({ control: form.control, name: "sacrificeId" });
  const phone = useWatch({ control: form.control, name: "phone" });
  const available = store.data.sacrifices.filter((s) => s.shares.some((share) => share.status === "BOS"));
  const selected = available.find((s) => s.id === sacrificeId);
  const phoneChanged = (value: string) => {
    form.setValue("phone", formatPhoneInput(value), { shouldValidate: true });
    const donor = store.data.donors.find((item) => item.phone === normalizePhone(value));
    if (donor) form.setValue("fullName", donor.fullName);
  };
  const submit = form.handleSubmit((values) => {
    if (values.kind === "KURBAN" && !values.sacrificeId) { form.setError("sacrificeId", { message: "Ülke ve kurban seçimi zorunludur." }); return; }
    const url = store.addDonation({ ...values, phone: normalizePhone(values.phone), amount: values.kind === "KURBAN" && selected ? selected.sharePrice : values.amount });
    notify(`${values.fullName} için bağış kaydedildi.`);
    form.reset({ kind: "GENEL", fullName: "", phone: "", amount: 0, paymentMethod: "NAKIT", description: "", sacrificeId: "", sendWhatsapp: true });
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  });
  const input = "mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100";
  return <Card className="mx-auto max-w-4xl"><form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
    <label className="text-sm font-semibold">Bağış türü<select {...form.register("kind")} className={input}><option value="KURBAN">Kurban</option><option value="ZEKAT">Zekât</option><option value="KURAN">Kur’an</option><option value="GENEL">Genel Bağış</option></select></label>
    {kind === "KURBAN" && <label className="text-sm font-semibold">Ülke ve kurban<select {...form.register("sacrificeId", { onChange: (event) => { const s = available.find((item) => item.id === event.target.value); if (s) form.setValue("amount", s.sharePrice); } })} className={input}><option value="">Seçiniz</option>{available.map((s) => <option value={s.id} key={s.id}>{s.number}. Kurban – {s.country} ({money(s.sharePrice)})</option>)}</select><Error text={form.formState.errors.sacrificeId?.message} /></label>}
    <label className="text-sm font-semibold">Telefon numarası<input value={phone} onChange={(e) => phoneChanged(e.target.value)} inputMode="tel" placeholder="0 (5__) ___ __ __" className={input} /><Error text={form.formState.errors.phone?.message} /></label>
    <label className="text-sm font-semibold">Ad soyad<input {...form.register("fullName")} placeholder="Bağışçının adı ve soyadı" className={input} /><Error text={form.formState.errors.fullName?.message} /></label>
    <label className="text-sm font-semibold">Bağış tutarı<input {...form.register("amount", { valueAsNumber: true })} type="number" readOnly={kind === "KURBAN"} className={`${input} ${kind === "KURBAN" ? "bg-slate-100" : ""}`} /><Error text={form.formState.errors.amount?.message} /></label>
    <label className="text-sm font-semibold">Ödeme yöntemi<select {...form.register("paymentMethod")} className={input}>{Object.entries(paymentLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
    <label className="text-sm font-semibold md:col-span-2">Açıklama<textarea {...form.register("description")} rows={3} placeholder="İsteğe bağlı not" className={`${input} h-auto py-3`} /></label>
    <label className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm font-medium md:col-span-2"><input type="checkbox" {...form.register("sendWhatsapp")} className="size-5 accent-emerald-700" />Teşekkür mesajını WhatsApp ile aç</label>
    <button disabled={form.formState.isSubmitting} className="h-13 rounded-xl bg-emerald-700 px-6 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 md:col-span-2">{form.formState.isSubmitting ? "Kaydediliyor..." : "Bağışı Kaydet"}</button>
  </form></Card>;
}
function Error({ text }: { text?: string }) { return text ? <span className="mt-1 block text-xs font-normal text-red-600">{text}</span> : null; }

function Sacrifices({ data }: { data: ReturnType<typeof useVefaStore>["data"] }) {
  return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{data.sacrifices.map((s) => { const full = s.shares.filter((x) => x.status === "DOLU").length; return <Card key={s.id}><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase text-emerald-700">{s.country}</p><h2 className="mt-1 text-lg font-bold">{s.number}. Kurban</h2></div><Badge tone={full === 7 ? "green" : "amber"}>{full === 7 ? "Tamamlandı" : "Devam ediyor"}</Badge></div><div className="mt-5 flex justify-between text-sm"><span className="text-slate-500">Hisse bedeli</span><b>{money(s.sharePrice)}</b></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-600" style={{ width: `${full / 7 * 100}%` }} /></div><div className="mt-4 grid grid-cols-7 gap-2">{s.shares.map((share) => <div title={share.donorName ?? "Boş hisse"} key={share.no} className={`grid aspect-square place-items-center rounded-lg text-xs font-bold ${share.status === "DOLU" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}>{share.no}</div>)}</div><p className="mt-4 text-xs text-slate-500">{full} dolu · {7 - full} boş hisse</p></Card>; })}</div>;
}

function Donors({ data, search }: { data: ReturnType<typeof useVefaStore>["data"]; search: string }) {
  const list = data.donors.filter((d) => !search || `${d.fullName} ${d.phone}`.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr")));
  return <Card>{list.length ? <div className="overflow-x-auto"><table className="w-full min-w-180 text-left text-sm"><thead className="text-xs uppercase text-slate-400"><tr>{["Ad soyad", "Telefon", "Toplam bağış", "Bağış sayısı", "Son bağış"].map((x) => <th key={x} className="border-b border-slate-100 px-3 py-3">{x}</th>)}</tr></thead><tbody>{list.map((d) => <tr key={d.id} className="border-b border-slate-50"><td className="px-3 py-4 font-semibold">{d.fullName}</td><td className="px-3 py-4">{formatPhoneInput(d.phone)}</td><td className="px-3 py-4 font-semibold text-emerald-700">{money(d.total)}</td><td className="px-3 py-4">{d.donationCount}</td><td className="px-3 py-4 text-slate-500">{dateTime(d.lastDonationAt)}</td></tr>)}</tbody></table></div> : <Empty title="Bağışçı bulunamadı" text="Bağış kaydı oluşturulduğunda otomatik eklenecek." />}</Card>;
}

function Messages({ data }: { data: ReturnType<typeof useVefaStore>["data"] }) {
  return <Card>{data.messages.length ? <div className="space-y-3">{data.messages.map((m) => <div key={m.id} className="rounded-xl border border-slate-100 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><b>{m.donorName}</b><Badge tone="slate">{dateTime(m.createdAt)}</Badge></div><p className="mt-2 text-sm text-slate-500">{m.message}</p><a className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700" target="_blank" rel="noreferrer" href={`https://wa.me/90${m.phone.slice(1)}?text=${encodeURIComponent(m.message)}`}><MessageCircle size={17} />WhatsApp&apos;ta aç</a></div>)}</div> : <Empty title="Mesaj kaydı yok" text="WhatsApp seçili bir bağış eklediğinizde burada görünür." />}</Card>;
}

function Reports({ data }: { data: ReturnType<typeof useVefaStore>["data"] }) {
  const total = data.donations.reduce((sum, item) => sum + item.amount, 0);
  const csv = () => {
    const rows = [["Tarih", "Bağışçı", "Telefon", "Tür", "Tutar", "Ödeme", "Kullanıcı"], ...data.donations.map((d) => [dateTime(d.createdAt), d.donorName, d.phone, kindLabels[d.kind], String(d.amount), paymentLabels[d.paymentMethod], d.createdBy])];
    const blob = new Blob(["\ufeff" + rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "vefa-bagis-raporu.csv"; a.click(); URL.revokeObjectURL(url);
  };
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><Card><p className="text-sm text-slate-500">Toplam tahsilat</p><b className="mt-2 block text-2xl">{money(total)}</b></Card><Card><p className="text-sm text-slate-500">Bağış kaydı</p><b className="mt-2 block text-2xl">{data.donations.length}</b></Card><Card><p className="text-sm text-slate-500">Ortalama bağış</p><b className="mt-2 block text-2xl">{money(data.donations.length ? total / data.donations.length : 0)}</b></Card></div><Card><div className="no-print mb-5 flex flex-wrap justify-between gap-3"><div><h2 className="font-bold">Bağış Hareket Raporu</h2><p className="mt-1 text-sm text-slate-500">İşlemi yapan kullanıcı dahil tüm kayıtlar.</p></div><div className="flex gap-2"><button onClick={csv} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold"><Download size={17} />CSV</button><button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-[#0b1739] px-4 py-2 text-sm font-semibold text-white"><FileText size={17} />Yazdır</button></div></div>{data.donations.length ? <div className="overflow-x-auto"><table className="w-full min-w-200 text-left text-sm"><thead><tr className="text-xs uppercase text-slate-400">{["Tarih", "Bağışçı", "Tür", "Tutar", "Ödeme", "İşlemi yapan"].map((x) => <th className="border-b px-3 py-3" key={x}>{x}</th>)}</tr></thead><tbody>{data.donations.map((d) => <tr key={d.id} className="border-b border-slate-50"><td className="px-3 py-3">{dateTime(d.createdAt)}</td><td className="px-3 py-3 font-semibold">{d.donorName}</td><td className="px-3 py-3">{kindLabels[d.kind]}</td><td className="px-3 py-3 text-emerald-700">{money(d.amount)}</td><td className="px-3 py-3">{paymentLabels[d.paymentMethod]}</td><td className="px-3 py-3">{d.createdBy}</td></tr>)}</tbody></table></div> : <Empty title="Rapor verisi yok" text="Bağışlar kaydedildikçe rapor oluşacak." />}</Card></div>;
}

function UsersScreen({ store, notify }: { store: ReturnType<typeof useVefaStore>; notify: (s: string) => void }) {
  const add = () => store.update((d) => ({ ...d, users: [...d.users, { id: crypto.randomUUID(), name: "Yeni Kullanıcı", email: `kullanici${d.users.length + 1}@vefa.local`, role: "BAGIS_PERSONELI", active: true }] }));
  const change = (id: string, field: "name" | "email" | "role" | "active", value: string | boolean) => store.update((d) => ({ ...d, users: d.users.map((u) => u.id === id ? { ...u, [field]: value } : u) }));
  return <Card><div className="mb-5 flex justify-between"><div><h2 className="font-bold">Kullanıcı ve roller</h2><p className="mt-1 text-sm text-slate-500">Her bağışta işlemi yapan kullanıcı kaydedilir.</p></div><button onClick={add} className="rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white">Kullanıcı ekle</button></div><div className="space-y-3">{store.data.users.map((u) => <div key={u.id} className="grid gap-3 rounded-xl border border-slate-100 p-4 md:grid-cols-[1fr_1fr_180px_110px]"><input value={u.name} onChange={(e) => change(u.id, "name", e.target.value)} className="rounded-lg bg-slate-50 px-3 py-2 outline-none" /><input value={u.email} onChange={(e) => change(u.id, "email", e.target.value)} className="rounded-lg bg-slate-50 px-3 py-2 outline-none" /><select value={u.role} onChange={(e) => change(u.id, "role", e.target.value as UserRole)} className="rounded-lg bg-slate-50 px-3 py-2"><option value="YONETICI">Yönetici</option><option value="BAGIS_PERSONELI">Bağış Personeli</option><option value="RAPOR">Rapor Kullanıcısı</option></select><button onClick={() => { change(u.id, "active", !u.active); notify("Kullanıcı durumu güncellendi."); }} className={`rounded-lg px-3 py-2 text-xs font-semibold ${u.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{u.active ? "Aktif" : "Pasif"}</button></div>)}</div><div className="mt-5"><label className="text-sm font-semibold">Aktif oturum kullanıcı<select value={store.data.currentUserId} onChange={(e) => store.update((d) => ({ ...d, currentUserId: e.target.value }))} className="ml-3 rounded-lg border border-slate-200 px-3 py-2">{store.data.users.filter((u) => u.active).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label></div></Card>;
}

function SettingsScreen({ store, notify }: { store: ReturnType<typeof useVefaStore>; notify: (s: string) => void }) {
  return <div className="grid gap-5 lg:grid-cols-2"><Card><h2 className="font-bold">Kurum bilgisi</h2><label className="mt-5 block text-sm font-semibold">Kurum adı<input value={store.data.organizationName} onChange={(e) => store.update((d) => ({ ...d, organizationName: e.target.value }))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-emerald-600" /></label></Card><Card><h2 className="font-bold">Veri yönetimi</h2><p className="mt-2 text-sm leading-6 text-slate-500">Kayıtlar yalnızca bu tarayıcıda tutulur. Başka cihaza taşımak veya veri kaybına karşı saklamak için düzenli yedek alın.</p><div className="mt-5 flex flex-wrap gap-3"><button onClick={store.exportData} className="flex items-center gap-2 rounded-xl bg-[#0b1739] px-4 py-3 text-sm font-semibold text-white"><Download size={17} />Yedeği indir</button><button onClick={() => { if (confirm("Bu tarayıcıdaki tüm Vefa kayıtları silinsin mi?")) { store.reset(); notify("Tarayıcı verileri temizlendi."); } }} className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700"><Trash2 size={17} />Tüm verileri temizle</button></div></Card></div>;
}
