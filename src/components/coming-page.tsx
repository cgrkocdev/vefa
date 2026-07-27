import { Construction } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ComingPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-[1480px]">
      <div className="mb-6">
        <div><h2 className="text-xl font-bold text-[#0b2b3c]">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>
      </div>
      <Card className="grid min-h-[420px] place-items-center p-8 text-center">
        <div className="max-w-md">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Construction className="size-6" />
          </span>
          <h2 className="mt-5 text-lg font-bold text-[#0b2b3c]">Modül altyapısı hazır</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sayfa, ortak yerleşim ve rol bazlı menü yapısına bağlandı. İş akışları sonraki geliştirme aşamasında eklenecek.
          </p>
        </div>
      </Card>
    </div>
  );
}
