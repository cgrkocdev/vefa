export const DONATION_CHANNEL = "vefa-donations";

export type LiveDonation = {
  id: string;
  donorName: string;
  type: string;
  amount: number;
  date: string;
  status: "Tamamlandı" | "Bekliyor";
};

export function publishDonation(donation: LiveDonation) {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
  const channel = new BroadcastChannel(DONATION_CHANNEL);
  channel.postMessage(donation);
  channel.close();
}
