"use client";

import { LocalAuthProvider } from "@/lib/local-auth";
import { installLocalApi } from "@/lib/local-api";

export function Providers({ children }: { children: React.ReactNode }) {
  installLocalApi();
  return <LocalAuthProvider>{children}</LocalAuthProvider>;
}
