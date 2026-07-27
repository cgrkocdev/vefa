"use client";

import { createContext, useContext, useState } from "react";
import type { UserRole } from "@/lib/constants";

type LocalUser = { id: string; name: string; email: string; role: UserRole };
type AuthContextValue = {
  user: LocalUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_KEY = "vefa-local-session";

export function LocalAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = sessionStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) as LocalUser : null;
  });
  function login(email: string, password: string) {
    const users = JSON.parse(localStorage.getItem("vefa-browser-data-v2") ?? "{}") as { users?: Array<LocalUser & { password: string; isActive: boolean }> };
    const match = users.users?.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password && item.isActive)
      ?? (email.toLowerCase() === "yonetici@vefa.org" && password === "Degistir123!" ? { id: "admin", name: "Sistem Yöneticisi", email, role: "ADMIN" as const } : null);
    if (!match) return false;
    const session = { id: match.id, name: match.name, email: match.email, role: match.role };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return true;
  }
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
    window.location.href = "/giris";
  }
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useLocalAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("Yerel oturum sağlayıcısı bulunamadı.");
  return value;
}
