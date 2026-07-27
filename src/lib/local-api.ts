"use client";

import { PAYMENT_METHODS } from "./constants";
import { normalizePhone } from "./phone";

type Role = "ADMIN" | "DONATION_STAFF" | "REPORT_VIEWER";
type User = { id: string; name: string; email: string; password: string; roleCode: Role; role: Role; isActive: boolean; createdAt: string };
type Donor = { id: string; name: string; phone: string; totalDonation: number; donationCount: number; lastDonationAt: string | null; createdAt: string };
type Donation = { id: string; receiptNo: string; donorId: string; donorName: string; type: string; amount: number; paymentMethod: string; description: string; status: "COMPLETED"; createdAt: string; createdBy: { id: string; name: string; roleCode: Role }; idempotencyKey: string; sacrificeId?: string; shareNo?: number };
type Share = { id: string; shareNo: number; status: "EMPTY" | "PENDING" | "FILLED" | "CANCELLED"; paymentStatus: "PENDING" | "PAID" | "CANCELLED"; paymentMethod: string | null; amount: number; version: number; donor: { id: string; name: string; phone: string } | null; donationId?: string };
type SacrificeKind = "VACIP" | "ADAK" | "AKIKA";
type Sacrifice = { id: string; number: number; region: string; kind: SacrificeKind; sharePrice: number; status: "OPEN" | "COMPLETED"; shares: Share[] };
type Message = { id: string; phone: string; message: string; status: "SENT"; errorMessage: null; sentAt: string; createdAt: string; donor: { name: string } | null; donorId: string; donationId?: string };
type Activity = { id: string; action: string; entity: string; entityId: string | null; createdAt: string; user: { name: string; roleCode: Role } };
type Settings = { organizationName: string; organizationPhone: string; organizationEmail: string; organizationAddress: string; receiptPrefix: string; whatsappEnabled: boolean };
type LocalData = { users: User[]; donors: Donor[]; donations: Donation[]; sacrifices: Sacrifice[]; whatsapp: Message[]; sms: Message[]; activities: Activity[]; settings: Settings };

const KEY = "vefa-browser-data-v2";
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const shares = (prefix: string): Share[] => Array.from({ length: 7 }, (_, index) => ({ id: `${prefix}-${index + 1}`, shareNo: index + 1, status: "EMPTY", paymentStatus: "PENDING", paymentMethod: null, amount: 0, version: 1, donor: null }));
const seed = (): LocalData => ({
  users: [
    { id: "admin", name: "Yasir", email: "yasir@gmail", password: "12345678", roleCode: "ADMIN", role: "ADMIN", isActive: true, createdAt: now() },
    { id: "staff", name: "Bağış Personeli", email: "personel@vefa.org", password: "Personel123!", roleCode: "DONATION_STAFF", role: "DONATION_STAFF", isActive: true, createdAt: now() },
  ],
  donors: [], donations: [], whatsapp: [], sms: [], activities: [],
  sacrifices: [
    { id: "vacip-1", number: 1, region: "Somali", kind: "VACIP", sharePrice: 14500, status: "OPEN", shares: shares("v1") },
    { id: "vacip-2", number: 2, region: "Afrika", kind: "VACIP", sharePrice: 12500, status: "OPEN", shares: shares("v2") },
    { id: "vacip-3", number: 3, region: "Türkiye", kind: "VACIP", sharePrice: 18500, status: "OPEN", shares: shares("v3") },
    { id: "adak-4", number: 4, region: "Somali", kind: "ADAK", sharePrice: 14500, status: "OPEN", shares: shares("a4") },
    { id: "adak-5", number: 5, region: "Afrika", kind: "ADAK", sharePrice: 12500, status: "OPEN", shares: shares("a5") },
    { id: "adak-6", number: 6, region: "Türkiye", kind: "ADAK", sharePrice: 18500, status: "OPEN", shares: shares("a6") },
    { id: "akika-7", number: 7, region: "Somali", kind: "AKIKA", sharePrice: 14500, status: "OPEN", shares: shares("k7") },
    { id: "akika-8", number: 8, region: "Afrika", kind: "AKIKA", sharePrice: 12500, status: "OPEN", shares: shares("k8") },
    { id: "akika-9", number: 9, region: "Türkiye", kind: "AKIKA", sharePrice: 18500, status: "OPEN", shares: shares("k9") },
  ],
  settings: { organizationName: "Vefa Bağış Yönetimi", organizationPhone: "", organizationEmail: "", organizationAddress: "", receiptPrefix: "BGS", whatsappEnabled: true },
});
const read = () => {
  const stored = localStorage.getItem(KEY);
  if (stored) {
    const data = JSON.parse(stored) as LocalData;
    const admin = data.users.find((user) => user.id === "admin");
    if (admin) {
      admin.name = "Yasir";
      admin.email = "yasir@gmail";
      admin.password = "12345678";
      admin.role = "ADMIN";
      admin.roleCode = "ADMIN";
      admin.isActive = true;
    }
    data.sacrifices.forEach((sacrifice) => { sacrifice.kind ??= "VACIP"; });
    const templates: Array<[SacrificeKind, number, string, number]> = [
      ["ADAK", 4, "Somali", 14500], ["ADAK", 5, "Afrika", 12500], ["ADAK", 6, "Türkiye", 18500],
      ["AKIKA", 7, "Somali", 14500], ["AKIKA", 8, "Afrika", 12500], ["AKIKA", 9, "Türkiye", 18500],
    ];
    templates.forEach(([kind, number, region, sharePrice]) => {
      if (!data.sacrifices.some((item) => item.kind === kind && item.region === region)) {
        const prefix = `${kind.toLowerCase()}-${number}`;
        data.sacrifices.push({ id: prefix, number, region, kind, sharePrice, status: "OPEN", shares: shares(prefix) });
      }
    });
    localStorage.setItem(KEY, JSON.stringify(data));
    return data;
  }
  const data = seed(); localStorage.setItem(KEY, JSON.stringify(data)); return data;
};
const write = (data: LocalData) => localStorage.setItem(KEY, JSON.stringify(data));
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const sessionUser = (data: LocalData) => {
  const session = JSON.parse(sessionStorage.getItem("vefa-local-session") ?? "null") as { id?: string } | null;
  return data.users.find((user) => user.id === session?.id) ?? data.users[0];
};
const messageText = (name: string, amount: number, type: string) => `Sayın ${name}, ${amount.toLocaleString("tr-TR")} TL tutarındaki ${type} bağışınız alınmıştır. Desteğiniz için teşekkür ederiz.`;

async function route(input: RequestInfo | URL, init?: RequestInit) {
  const raw = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const url = new URL(raw, window.location.origin);
  const method = (init?.method ?? "GET").toUpperCase();
  const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : {};
  const data = read();
  const user = sessionUser(data);

  if (url.pathname === "/api/dashboard") {
    const current = new Date();
    return json({ stats: {
      today: data.donations.filter((d) => new Date(d.createdAt).toDateString() === current.toDateString()).reduce((sum, d) => sum + d.amount, 0),
      month: data.donations.filter((d) => { const date = new Date(d.createdAt); return date.getMonth() === current.getMonth() && date.getFullYear() === current.getFullYear(); }).reduce((sum, d) => sum + d.amount, 0),
      donors: data.donors.length,
      remainingShares: data.sacrifices.flatMap((s) => s.shares).filter((s) => s.status === "EMPTY").length,
    } });
  }
  if (url.pathname === "/api/donations" && method === "GET") return json({ donations: data.donations.slice(0, 8) });
  if (url.pathname === "/api/donations" && method === "POST") {
    const key = String(body.idempotencyKey); const duplicate = data.donations.find((d) => d.idempotencyKey === key);
    if (duplicate) return json({ donation: duplicate, duplicate: true });
    const phone = normalizePhone(String(body.phone)); let donor = data.donors.find((d) => d.phone === phone);
    const createdAt = now(); const amount = Number(body.amount);
    if (!donor) { donor = { id: id(), name: String(body.donorName), phone, totalDonation: 0, donationCount: 0, lastDonationAt: null, createdAt }; data.donors.unshift(donor); }
    donor.name = String(body.donorName); donor.totalDonation += amount; donor.donationCount += 1; donor.lastDonationAt = createdAt;
    const donation: Donation = { id: id(), receiptNo: `${data.settings.receiptPrefix}-${Date.now()}`, donorId: donor.id, donorName: donor.name, type: String(body.type), amount, paymentMethod: String(body.paymentMethod), description: String(body.description ?? ""), status: "COMPLETED", createdAt, createdBy: { id: user.id, name: user.name, roleCode: user.roleCode }, idempotencyKey: key };
    if (body.type === "Kurban") {
      const sacrifice = data.sacrifices.find((s) => s.id === body.sacrificeId);
      const share = sacrifice?.shares.find((s) => s.status === "EMPTY");
      if (!sacrifice || !share) return json({ message: "Seçilen kurbanda boş hisse bulunmuyor." }, 409);
      share.status = "FILLED"; share.paymentStatus = "PAID"; share.paymentMethod = donation.paymentMethod; share.amount = amount; share.donor = { id: donor.id, name: donor.name, phone }; share.donationId = donation.id; share.version += 1;
      donation.sacrificeId = sacrifice.id; donation.shareNo = share.shareNo;
      if (sacrifice.shares.every((item) => item.status === "FILLED")) sacrifice.status = "COMPLETED";
    }
    data.donations.unshift(donation);
    if (body.sendWhatsapp) data.whatsapp.unshift({ id: id(), phone, message: messageText(donor.name, amount, donation.type), status: "SENT", errorMessage: null, sentAt: createdAt, createdAt, donor: { name: donor.name }, donorId: donor.id, donationId: donation.id });
    data.activities.unshift({ id: id(), action: "DONATION_CREATED", entity: "Donation", entityId: donation.id, createdAt, user: donation.createdBy });
    write(data); return json({ donation, duplicate: false }, 201);
  }
  if (url.pathname === "/api/donors") return json({ donors: data.donors });
  if (url.pathname === "/api/donors/lookup") return json({ donor: data.donors.find((d) => d.phone === normalizePhone(url.searchParams.get("phone") ?? "")) ?? null });
  if (url.pathname.startsWith("/api/donors/")) {
    const donorId = url.pathname.split("/").pop(); const donor = data.donors.find((d) => d.id === donorId);
    if (!donor) return json({ message: "Bağışçı bulunamadı." }, 404);
    return json({ donor: { ...donor, donations: data.donations.filter((d) => d.donorId === donor.id).map((d) => ({ ...d, donationType: { name: d.type } })), shares: data.sacrifices.flatMap((s) => s.shares.filter((x) => x.donor?.id === donor.id).map((x) => ({ ...x, sacrifice: { id: s.id, number: s.number, region: s.region } }))), whatsappMessages: data.whatsapp.filter((m) => m.donorId === donor.id) } });
  }
  if (url.pathname === "/api/sacrifices" && method === "GET") return json({ sacrifices: data.sacrifices });
  if (url.pathname === "/api/sacrifices/shares" && method === "POST") {
    const sacrifice = data.sacrifices.find((s) => s.id === body.sacrificeId); const share = sacrifice?.shares.find((s) => s.shareNo === Number(body.shareNo));
    if (!sacrifice || !share || share.status !== "EMPTY" || share.version !== Number(body.version)) return json({ message: "Bu hisse başka bir işlemde doldurulmuş." }, 409);
    const phone = normalizePhone(String(body.phone)); let donor = data.donors.find((d) => d.phone === phone); const createdAt = now(); const amount = Number(body.amount);
    if (!donor) { donor = { id: id(), name: String(body.donorName), phone, totalDonation: 0, donationCount: 0, lastDonationAt: null, createdAt }; data.donors.unshift(donor); }
    donor.totalDonation += amount; donor.donationCount++; donor.lastDonationAt = createdAt;
    const donation: Donation = { id: id(), receiptNo: `${data.settings.receiptPrefix}-${Date.now()}`, donorId: donor.id, donorName: donor.name, type: "Kurban", amount, paymentMethod: String(body.paymentMethod), description: "", status: "COMPLETED", createdAt, createdBy: { id: user.id, name: user.name, roleCode: user.roleCode }, idempotencyKey: id(), sacrificeId: sacrifice.id, shareNo: share.shareNo };
    share.status = body.paymentStatus === "PENDING" ? "PENDING" : body.paymentStatus === "CANCELLED" ? "CANCELLED" : "FILLED"; share.paymentStatus = String(body.paymentStatus) as Share["paymentStatus"]; share.paymentMethod = donation.paymentMethod; share.amount = amount; share.donor = { id: donor.id, name: donor.name, phone }; share.donationId = donation.id; share.version++;
    data.donations.unshift(donation); if (sacrifice.shares.every((x) => x.status === "FILLED")) sacrifice.status = "COMPLETED";
    if (body.sendWhatsapp) data.whatsapp.unshift({ id: id(), phone, message: messageText(donor.name, amount, "Kurban"), status: "SENT", errorMessage: null, sentAt: createdAt, createdAt, donor: { name: donor.name }, donorId: donor.id, donationId: donation.id });
    data.activities.unshift({ id: id(), action: "SACRIFICE_SHARE_RESERVED", entity: "SacrificeShare", entityId: share.id, createdAt, user: { name: user.name, roleCode: user.roleCode } }); write(data); return json({ share });
  }
  if (url.pathname === "/api/whatsapp") return json({ messages: data.whatsapp, provider: "Tarayıcı / WhatsApp" });
  if (url.pathname === "/api/sms") return json({ messages: data.sms, provider: "Tarayıcı", balance: null });
  if (url.pathname === "/api/settings" && method === "GET") return json({ settings: data.settings, integrations: { whatsappProvider: "tarayıcı", whatsappConfigured: false } });
  if (url.pathname === "/api/settings" && method === "PUT") { data.settings = body as unknown as Settings; data.activities.unshift({ id: id(), action: "SETTINGS_UPDATED", entity: "Settings", entityId: null, createdAt: now(), user: { name: user.name, roleCode: user.roleCode } }); write(data); return json({ settings: data.settings, message: "Ayarlar kaydedildi." }); }
  if (url.pathname === "/api/users" && method === "GET") return json({ users: data.users });
  if (url.pathname === "/api/users" && method === "POST") { const created: User = { id: id(), name: String(body.name), email: String(body.email), password: String(body.password), roleCode: String(body.role) as Role, role: String(body.role) as Role, isActive: true, createdAt: now() }; data.users.push(created); write(data); return json({ user: created }, 201); }
  if (url.pathname.startsWith("/api/users/") && method === "PATCH") { const target = data.users.find((u) => u.id === url.pathname.split("/").pop()); if (!target) return json({ message: "Kullanıcı bulunamadı." }, 404); target.name = String(body.name); target.email = String(body.email); target.roleCode = String(body.role) as Role; target.role = target.roleCode; target.isActive = Boolean(body.isActive); if (body.password) target.password = String(body.password); write(data); return json({ user: target }); }
  if (url.pathname === "/api/search") {
    const q = (url.searchParams.get("q") ?? "").toLocaleLowerCase("tr"); const results = [...data.donors.filter((d) => `${d.name} ${d.phone}`.toLocaleLowerCase("tr").includes(q)).map((d) => ({ id: d.id, kind: "DONOR", title: d.name, description: d.phone, href: `/bagiscilar/${d.id}` })), ...data.donations.filter((d) => `${d.receiptNo} ${d.donorName}`.toLocaleLowerCase("tr").includes(q)).map((d) => ({ id: d.id, kind: "DONATION", title: d.receiptNo, description: `${d.donorName} · ${d.type}`, href: "/raporlar" }))].slice(0, 10); return json({ results });
  }
  if (url.pathname === "/api/reports") return json(report(data, url));
  return json({ message: "İstenen yerel işlem bulunamadı." }, 404);
}

function report(data: LocalData, url: URL) {
  const days = Number(url.searchParams.get("days") ?? 30); const end = new Date(); const start = new Date(); start.setDate(end.getDate() - days + 1); start.setHours(0, 0, 0, 0);
  const userId = url.searchParams.get("userId"); const type = url.searchParams.get("type"); const payment = url.searchParams.get("payment");
  const donations = data.donations.filter((d) => new Date(d.createdAt) >= start && (!userId || d.createdBy.id === userId) && (!type || d.type === type) && (!payment || d.paymentMethod === payment));
  const group = (key: (d: Donation) => string) => Object.values(donations.reduce<Record<string, { name: string; amount: number; count: number }>>((acc, d) => { const name = key(d); acc[name] ??= { name, amount: 0, count: 0 }; acc[name].amount += d.amount; acc[name].count++; return acc; }, {}));
  const total = donations.reduce((sum, d) => sum + d.amount, 0);
  return { period: { days, startDate: start.toISOString(), endDate: end.toISOString() }, summary: { total, donationCount: donations.length, average: donations.length ? total / donations.length : 0, newDonors: data.donors.filter((d) => new Date(d.createdAt) >= start).length, filledShares: data.sacrifices.flatMap((s) => s.shares).filter((s) => s.status === "FILLED").length, totalShares: data.sacrifices.length * 7 }, daily: Object.values(donations.reduce<Record<string, { date: string; amount: number; count: number }>>((a, d) => { const date = d.createdAt.slice(0, 10); a[date] ??= { date, amount: 0, count: 0 }; a[date].amount += d.amount; a[date].count++; return a; }, {})), byType: group((d) => d.type), byPayment: group((d) => PAYMENT_METHODS.find((p) => p.value === d.paymentMethod)?.label ?? d.paymentMethod), filters: { users: data.users.map(({ id, name, roleCode }) => ({ id, name, roleCode })), donationTypes: ["Kurban", "Zekât", "Kur’an", "Genel Bağış"].map((name) => ({ id: name, name })), paymentMethods: PAYMENT_METHODS, selected: { userId, donationType: type, paymentMethod: payment } }, byUser: data.users.map((u) => { const items = donations.filter((d) => d.createdBy.id === u.id); return { userId: u.id, name: u.name, role: u.roleCode, amount: items.reduce((s, d) => s + d.amount, 0), count: items.length }; }).filter((x) => x.count), donations: donations.slice(0, 50), activities: data.activities.filter((a) => new Date(a.createdAt) >= start).slice(0, 50) };
}

let installed = false;
export function installLocalApi() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (new URL(raw, window.location.origin).pathname.startsWith("/api/")) return route(input, init);
    return nativeFetch(input, init);
  };
  read();
}
