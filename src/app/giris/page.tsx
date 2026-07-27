"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, HandHeart, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/lib/validations";
import type { z } from "zod";
import { useLocalAuth } from "@/lib/local-auth";

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const router = useRouter();
  const { login } = useLocalAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginInput) {
    setFormError("");
    if (!login(values.email, values.password)) {
      setFormError("E-posta adresi veya şifre hatalı.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen bg-[#f6f8f7] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden overflow-hidden bg-[#082839] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-emerald-500"><HandHeart className="size-6" /></span>
          <div><p className="text-xl font-bold">Vefa</p><p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Bağış Yönetimi</p></div>
        </div>
        <div className="max-w-xl">
          <div className="mb-8 h-1 w-14 rounded-full bg-emerald-500" />
          <h1 className="text-4xl font-bold leading-tight xl:text-5xl">İyiliği, güvenle<br />ve kolayca yönetin.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">Bağış, bağışçı ve kurban süreçleriniz tek bir güvenli çalışma alanında.</p>
        </div>
        <p className="text-xs text-slate-500">© 2026 Vefa Bağış Yönetim Sistemi</p>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-500 text-white"><HandHeart className="size-5" /></span>
            <strong className="text-xl text-[#0b2b3c]">Vefa</strong>
          </div>
          <p className="text-sm font-semibold text-emerald-600">Tekrar hoş geldiniz</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0b2b3c]">Hesabınıza giriş yapın</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">Yönetim paneline erişmek için bilgilerinizi girin.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Kullanıcı adı</span>
              <div className="relative"><Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input className="pl-11" placeholder="Kullanıcı adınızı girin" {...register("email")} /></div>
              {errors.email && <span className="mt-1.5 block text-xs text-red-600">{errors.email.message}</span>}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Şifre</span>
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input className="pl-11 pr-11" type={showPassword ? "text" : "password"} placeholder="••••••••" {...register("password")} />
                <button type="button" aria-label="Şifre görünürlüğünü değiştir" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <span className="mt-1.5 block text-xs text-red-600">{errors.password.message}</span>}
            </label>
            {formError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">{formError}</p>}
            <Button variant="success" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : "Giriş Yap"}
            </Button>
          </form>
          <p className="mt-8 text-center text-xs text-slate-400">Erişim sorunu yaşıyorsanız sistem yöneticinizle iletişime geçin.</p>
        </div>
      </section>
    </main>
  );
}
