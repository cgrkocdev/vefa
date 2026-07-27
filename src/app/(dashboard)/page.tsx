import Link from "next/link";
import { Bird, BookOpen, HandCoins, HeartHandshake, Plus } from "lucide-react";
import { RecentDonations } from "@/components/dashboard/recent-donations";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { Card } from "@/components/ui/card";

const actions = [
  { title: "Kurban", description: "Kurban hissesi ve vekâlet kaydı", icon: Bird, type: "Kurban", tone: "bg-amber-50 text-amber-700" },
  { title: "Zekât", description: "Zekât bağışını hızlıca kaydedin", icon: HandCoins, type: "Zekât", tone: "bg-emerald-50 text-emerald-700" },
  { title: "Kur’an", description: "Kur’an-ı Kerim bağışı oluşturun", icon: BookOpen, type: "Kur’an", tone: "bg-sky-50 text-sky-700" },
  { title: "Genel Bağış", description: "Genel amaçlı destek kaydı", icon: HeartHandshake, type: "Genel Bağış", tone: "bg-violet-50 text-violet-700" },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1480px]">
      <div className="mb-6">
        <p className="text-sm font-semibold text-emerald-700">Hızlı işlemler</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0b2b3c]">Bağış türünü seçerek başlayın</h2>
        <p className="mt-1 text-sm text-slate-500">Yeni bağış kaydını tek adımda açın.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <Link key={action.title} href={`/bagislar/yeni?tur=${encodeURIComponent(action.type)}`} className="group">
            <Card className="flex h-full min-h-48 flex-col p-5 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-950/5">
              <span className={`grid size-12 place-items-center rounded-2xl ${action.tone}`}><action.icon className="size-[22px]" /></span>
              <h3 className="mt-5 text-base font-bold text-[#0b2b3c]">{action.title}</h3>
              <p className="mt-1 min-h-9 text-xs leading-5 text-slate-500">{action.description}</p>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-bold text-emerald-700"><Plus className="size-3.5" /> Bağış Ekle</span>
            </Card>
          </Link>
        ))}
      </section>

      <section className="mt-7">
        <div className="mb-4"><h2 className="text-base font-bold text-[#0b2b3c]">Genel görünüm</h2><p className="mt-1 text-xs text-slate-500">Güncel bağış özetiniz</p></div>
        <DashboardStats />
      </section>

      <section className="mt-7">
        <RecentDonations />
      </section>
    </div>
  );
}
