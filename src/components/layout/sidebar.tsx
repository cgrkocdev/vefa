"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, HandHeart, LogOut, X } from "lucide-react";
import { APP_NAME, NAV_ITEMS, type UserRole } from "@/lib/constants";
import { cn } from "@/lib/utils";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onCollapse: () => void;
  role?: UserRole;
};

export function Sidebar({ open, onClose, collapsed, onCollapse, role = "ADMIN" }: SidebarProps) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <>
      {open && (
        <button
          aria-label="Menüyü kapat"
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[276px] flex-col bg-[#082839] px-3 py-5 text-white shadow-2xl shadow-slate-950/20 transition-[transform,width] duration-200 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none",
          collapsed ? "lg:w-[88px]" : "lg:w-[252px]",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className={cn("mb-8 flex h-12 items-center justify-between px-2", collapsed && "lg:justify-center lg:px-0")}>
          <Link href="/" className="flex min-w-0 items-center gap-3" onClick={onClose}>
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-950/20">
              <HandHeart className="size-6" />
            </span>
            <span className={cn("overflow-hidden whitespace-nowrap transition-opacity", collapsed && "lg:hidden")}>
              <span className="block text-xl font-bold tracking-tight">{APP_NAME}</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                Bağış Yönetimi
              </span>
            </span>
          </Link>
          <button className="rounded-lg p-2 text-slate-300 lg:hidden" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {visibleItems.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/8 hover:text-white",
                  collapsed && "lg:justify-center lg:px-0",
                  active && "bg-white/11 text-white",
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn("size-[19px]", active && "text-emerald-400")} />
                <span className={cn("whitespace-nowrap", collapsed && "lg:hidden")}>{item.label}</span>
                {active && <span className="absolute right-0 h-5 w-0.5 rounded-l-full bg-emerald-400" />}
              </Link>
            );
          })}
        </nav>

        <div className={cn("rounded-2xl bg-white/6 p-3", collapsed && "lg:hidden")}>
          <p className="text-xs font-semibold text-white">Yardım mı gerekiyor?</p>
          <p className="mt-1 text-[11px] leading-4 text-slate-400">
            Destek ekibimiz iş günlerinde yanınızda.
          </p>
          <button onClick={() => void signOut({ callbackUrl: "/giris" })} className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white">
            <LogOut className="size-4" /> Güvenli çıkış
          </button>
        </div>
        <button
          onClick={onCollapse}
          className="mt-3 hidden h-10 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-white/8 hover:text-white lg:flex"
          aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <><ChevronLeft className="size-4" /><span>Menüyü daralt</span></>}
        </button>
      </aside>
    </>
  );
}
