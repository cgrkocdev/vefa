"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocalAuth } from "@/lib/local-auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import type { UserRole } from "@/lib/constants";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useLocalAuth();
  const router = useRouter();
  useEffect(() => { if (!user) router.replace("/giris"); }, [router, user]);
  const role: UserRole = user?.role ?? "ADMIN";
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#f6f8f7]">
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed((value) => !value)}
        role={role}
      />
      <div className="min-w-0 flex-1">
        <Header onMenuClick={() => setMenuOpen(true)} />
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
