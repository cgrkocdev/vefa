"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, Pencil, Plus, Save, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { USER_ROLES, type UserRole } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type UserItem = { id: string; name: string; email: string; roleCode: UserRole; isActive: boolean; createdAt: string };

export function UserManagement() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<UserItem | "create" | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/users");
      const data = (await response.json()) as { users?: UserItem[]; message?: string };
      if (!response.ok) throw new Error(data.message);
      setUsers(data.users ?? []);
    } catch { setError("Kullanıcılar yüklenemedi."); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-5 sm:p-6"><div><h2 className="font-bold text-[#0b2b3c]">Kullanıcılar ve yetkiler</h2><p className="mt-1 text-xs text-slate-500">Ekip üyelerinin sistem erişimini ve hesap durumunu yönetin.</p></div><Button variant="success" onClick={() => setModal("create")}><Plus className="size-4" /> Kullanıcı ekle</Button></div>
        {loading ? <div className="space-y-3 border-t border-slate-100 p-5">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div> : error ? <ErrorState description={error} onRetry={() => void load()} /> : <div className="border-t border-slate-100"><div className="hidden grid-cols-[1fr_0.8fr_0.65fr_0.5fr_40px] gap-4 bg-slate-50 px-6 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400 md:grid"><span>Kullanıcı</span><span>Rol</span><span>Kayıt tarihi</span><span>Durum</span><span /></div><div className="divide-y divide-slate-100">{users.map((user) => <div key={user.id} className="grid gap-2 px-5 py-4 md:grid-cols-[1fr_0.8fr_0.65fr_0.5fr_40px] md:items-center md:gap-4 md:px-6"><div><p className="text-sm font-semibold text-slate-800">{user.name}</p><p className="mt-1 text-[11px] text-slate-500">{user.email}</p></div><p className="text-xs font-medium text-slate-600">{USER_ROLES[user.roleCode]}</p><p className="text-xs text-slate-500">{formatDate(user.createdAt)}</p><span className={`w-fit rounded-full px-2 py-1 text-[10px] font-bold ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{user.isActive ? "Aktif" : "Pasif"}</span><button onClick={() => setModal(user)} aria-label={`${user.name} kullanıcısını düzenle`} className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#0b2b3c]"><Pencil className="size-4" /></button></div>)}</div></div>}
      </Card>
      {modal && <UserModal user={modal === "create" ? null : modal} onClose={() => setModal(null)} onSaved={async () => { setModal(null); await load(); }} />}
    </>
  );
}

function UserModal({ user, onClose, onSaved }: { user: UserItem | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form);
    const response = await fetch(user ? `/api/users/${user.id}` : "/api/users", {
      method: user ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        ...(user ? { isActive: form.get("isActive") === "on" } : {}),
      }),
    });
    const data = (await response.json()) as { message?: string };
    if (!response.ok) { setError(data.message ?? (user ? "Kullanıcı güncellenemedi." : "Kullanıcı oluşturulamadı.")); setSaving(false); return; }
    await onSaved();
  }
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"><Card className="max-h-[92vh] w-full max-w-md overflow-auto p-6"><div className="flex justify-between"><div><h2 className="font-bold text-[#0b2b3c]">{user ? "Kullanıcıyı düzenle" : "Yeni kullanıcı"}</h2><p className="mt-1 text-xs text-slate-500">{user ? "Hesap bilgilerini ve erişim rolünü güncelleyin." : "Rolüne uygun erişim otomatik atanır."}</p></div><button onClick={onClose}><X className="size-5 text-slate-400" /></button></div><form onSubmit={submit} className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">Ad soyad</span><Input name="name" required defaultValue={user?.name} placeholder="Ad soyad" /></label><label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">E-posta</span><Input name="email" type="email" required defaultValue={user?.email} placeholder="E-posta adresi" /></label><label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">{user ? "Yeni şifre (isteğe bağlı)" : "Geçici şifre"}</span><Input name="password" type="password" required={!user} minLength={8} placeholder={user ? "Değiştirmek istemiyorsanız boş bırakın" : "En az 8 karakter"} /></label><label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">Kullanıcı rolü</span><select name="role" defaultValue={user?.roleCode ?? "DONATION_STAFF"} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm">{Object.entries(USER_ROLES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{user && <label className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 p-3"><span><span className="block text-xs font-semibold text-slate-700">Hesap aktif</span><span className="mt-0.5 block text-[10px] text-slate-500">Pasif kullanıcı sisteme giriş yapamaz.</span></span><input name="isActive" type="checkbox" defaultChecked={user.isActive} className="size-4 accent-emerald-600" /></label>}{error && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}<Button type="submit" variant="success" className="w-full" disabled={saving}>{saving ? <LoaderCircle className="size-4 animate-spin" /> : user ? <><Save className="size-4" /> Değişiklikleri kaydet</> : <><ShieldCheck className="size-4" /> Kullanıcı oluştur</>}</Button></form></Card></div>;
}
