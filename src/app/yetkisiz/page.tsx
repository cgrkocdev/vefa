import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8f7] p-6 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600"><ShieldX className="size-6" /></span>
        <h1 className="mt-5 text-xl font-bold text-[#0b2b3c]">Bu sayfaya erişemezsiniz</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Bu işlem için gerekli yetkiniz bulunmuyor.</p>
        <Link href="/" className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#0b2b3c] px-4 text-xs font-semibold text-white">Ana sayfaya dön</Link>
      </div>
    </main>
  );
}
