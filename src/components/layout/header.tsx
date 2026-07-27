"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LoaderCircle, LogOut, Menu, ReceiptText, Search, Settings, UserRound, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useLocalAuth } from "@/lib/local-auth";
import { Input } from "@/components/ui/input";

const pageDetails: Record<string, { title: string; description: string }> = {
  "/": { title: "Ana Sayfa", description: "Bağış süreçlerinin güncel özeti" },
  "/bagislar/yeni": { title: "Yeni Bağış", description: "Hızlı ve güvenli bağış kaydı" },
  "/kurbanlar": { title: "Kurbanlar", description: "Kampanya ve hisse yönetimi" },
  "/bagiscilar": { title: "Bağışçılar", description: "Bağışçı kayıtları ve işlem geçmişi" },
  "/whatsapp": { title: "WhatsApp", description: "Anlık teşekkür mesajları ve gönderim kayıtları" },
  "/raporlar": { title: "Raporlar", description: "Bağış performansı ve tahsilat verileri" },
  "/ayarlar": { title: "Ayarlar", description: "Kurum ve sistem tercihleri" },
  "/kullanicilar": { title: "Kullanıcılar", description: "Ekip ve yetki yönetimi" },
};

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const details = pageDetails[pathname] ?? pageDetails["/"];
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const { user, logout } = useLocalAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setUserMenuOpen(false);
      if (!searchRef.current?.contains(event.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase("tr-TR") === "k") {
        event.preventDefault();
        setSearchOpen(true);
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      if (event.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = (await response.json()) as { results?: SearchResult[] };
        setResults(response.ok ? (data.results ?? []) : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  function selectResult(result: SearchResult) {
    setSearchOpen(false);
    setQuery("");
    router.push(result.href);
  }

  return (
    <header className="sticky top-0 z-30 flex min-h-[84px] items-center gap-3 border-b border-slate-200/70 bg-[#f6f8f7]/92 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <button
        className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
        aria-label="Menüyü aç"
        onClick={onMenuClick}
      >
        <Menu className="size-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold tracking-tight text-[#0b2b3c] sm:text-xl">{details.title}</h1>
        <p className="hidden truncate text-xs text-slate-500 sm:block">{details.description}</p>
      </div>

      <div ref={searchRef} className="relative hidden w-full max-w-[340px] xl:block">
        <SearchBox inputRef={searchInputRef} query={query} setQuery={setQuery} open={searchOpen} setOpen={setSearchOpen} searching={searching} results={results} onSelect={selectResult} />
      </div>

      <button onClick={() => { setSearchOpen(true); window.setTimeout(() => searchInputRef.current?.focus(), 0); }} aria-label="Genel aramayı aç" className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-sm hover:bg-slate-50 xl:hidden"><Search className="size-[19px]" /></button>

      <button aria-label="Bildirimler" className="relative grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-sm hover:bg-slate-50">
        <Bell className="size-[19px]" />
        <span className="absolute right-2 top-2 size-2 rounded-full bg-emerald-500 ring-2 ring-white" />
      </button>

      <div ref={menuRef} className="relative">
        <button
          onClick={() => setUserMenuOpen((value) => !value)}
          aria-expanded={userMenuOpen}
          className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white py-1.5 pl-1.5 pr-2.5 text-left shadow-sm hover:bg-slate-50"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-[#0b2b3c] text-xs font-bold text-white">{user?.name?.split(" ").map((part) => part[0]).slice(0, 2).join("") ?? "AY"}</span>
          <span className="hidden sm:block">
            <span className="block text-xs font-semibold text-slate-900">{user?.name ?? "Kullanıcı"}</span>
            <span className="block text-[10px] text-slate-500">{user?.role === "ADMIN" ? "Yönetici" : user?.role === "DONATION_STAFF" ? "Bağış Personeli" : "Rapor Kullanıcısı"}</span>
          </span>
          <ChevronDown className="hidden size-4 text-slate-400 sm:block" />
        </button>
        {userMenuOpen && (
          <div className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/10">
            <div className="border-b border-slate-100 px-3 py-2 sm:hidden">
              <p className="text-xs font-semibold text-slate-900">{user?.name ?? "Kullanıcı"}</p>
              <p className="text-[10px] text-slate-500">{user?.email}</p>
            </div>
            <Link href="/" className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"><UserRound className="size-4" /> Ana sayfa</Link>
            {user?.role === "ADMIN" && <Link href="/ayarlar" className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"><Settings className="size-4" /> Sistem ayarları</Link>}
            <button onClick={logout} className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-xs font-medium text-red-600 hover:bg-red-50"><LogOut className="size-4" /> Güvenli çıkış</button>
          </div>
        )}
      </div>
      {searchOpen && <div className="fixed inset-0 z-[80] bg-slate-950/35 p-4 pt-20 backdrop-blur-sm xl:hidden" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}><div ref={searchRef} className="mx-auto max-w-lg rounded-2xl bg-white p-3 shadow-2xl"><SearchBox inputRef={searchInputRef} query={query} setQuery={setQuery} open={searchOpen} setOpen={setSearchOpen} searching={searching} results={results} onSelect={selectResult} mobile /></div></div>}
    </header>
  );
}

type SearchResult = {
  id: string;
  kind: "DONOR" | "DONATION";
  title: string;
  description: string;
  href: string;
};

function SearchBox({
  inputRef, query, setQuery, open, setOpen, searching, results, onSelect, mobile = false,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  setQuery: (value: string) => void;
  open: boolean;
  setOpen: (value: boolean) => void;
  searching: boolean;
  results: SearchResult[];
  onSelect: (result: SearchResult) => void;
  mobile?: boolean;
}) {
  return <>
    <div className="relative">
      <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <Input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} className="h-10 border-slate-200/80 bg-white pl-10 pr-12 shadow-sm" placeholder="Bağışçı, makbuz veya telefon ara" />
      {mobile || query ? <button onClick={() => { setQuery(""); if (mobile) setOpen(false); }} aria-label="Aramayı temizle" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100"><X className="size-4" /></button> : <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">⌘ K</kbd>}
    </div>
    {open && (query.length >= 2 || mobile) && <div className={`${mobile ? "mt-2" : "absolute left-0 right-0 top-[calc(100%+8px)]"} overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-950/10`}>
      {searching ? <div className="flex items-center justify-center gap-2 p-6 text-xs text-slate-500"><LoaderCircle className="size-4 animate-spin" /> Aranıyor</div>
        : query.length < 2 ? <p className="p-5 text-center text-xs text-slate-500">Aramak için en az 2 karakter girin.</p>
        : results.length === 0 ? <p className="p-5 text-center text-xs text-slate-500">Eşleşen kayıt bulunamadı.</p>
        : <div className="max-h-80 divide-y divide-slate-100 overflow-auto">{results.map((result) => <button key={result.id} onClick={() => onSelect(result)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${result.kind === "DONOR" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"}`}>{result.kind === "DONOR" ? <UserRound className="size-4" /> : <ReceiptText className="size-4" />}</span><span className="min-w-0"><span className="block truncate text-xs font-semibold text-slate-800">{result.title}</span><span className="mt-0.5 block truncate text-[10px] text-slate-500">{result.description}</span></span></button>)}</div>}
    </div>}
  </>;
}
