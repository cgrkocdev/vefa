import { DonationForm } from "@/components/donation-form";

export const metadata = { title: "Yeni Bağış" };

export default function NewDonationPage() {
  return (
    <div className="mx-auto max-w-[1240px]">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#0b2b3c]">Bağış bilgileri</h2>
        <p className="mt-1 text-sm text-slate-500">Bağışçı ve ödeme bilgilerini girerek işlemi tamamlayın.</p>
      </div>
      <DonationForm />
    </div>
  );
}
