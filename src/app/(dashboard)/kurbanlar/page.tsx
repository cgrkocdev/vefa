import { SacrificeBoard } from "@/components/sacrifices/sacrifice-board";

export default function SacrificesPage() {
  return (
    <div className="mx-auto max-w-[1480px]">
      <div className="mb-6"><h2 className="text-xl font-bold text-[#0b2b3c]">Kurban hisseleri</h2><p className="mt-1 text-sm text-slate-500">Hisse durumlarını görüntüleyin ve boş hisselere bağışçı ekleyin.</p></div>
      <SacrificeBoard />
    </div>
  );
}
