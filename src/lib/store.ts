"use client";

import { useCallback, useEffect, useState } from "react";
import type { Donation, VefaData } from "./models";
import { kindLabels, money } from "./format";

const KEY = "vefa-data-v1";
const uid = () => crypto.randomUUID();
const emptyShares = () => Array.from({ length: 7 }, (_, index) => ({ no: index + 1, status: "BOS" as const }));

export const initialData: VefaData = {
  donors: [],
  donations: [],
  sacrifices: [
    { id: "somali-1", number: 1, country: "Somali", sharePrice: 14500, shares: emptyShares() },
    { id: "afrika-2", number: 2, country: "Afrika", sharePrice: 12500, shares: emptyShares() },
    { id: "turkiye-3", number: 3, country: "Türkiye", sharePrice: 18500, shares: emptyShares() },
  ],
  users: [
    { id: "admin", name: "Sistem Yöneticisi", email: "yonetici@vefa.org", role: "YONETICI", active: true },
    { id: "personel", name: "Bağış Personeli", email: "personel@vefa.org", role: "BAGIS_PERSONELI", active: true },
  ],
  messages: [],
  audit: [],
  currentUserId: "admin",
  organizationName: "Vefa Bağış Yönetimi",
};

export function useVefaStore() {
  const [data, setData] = useState<VefaData>(initialData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      // Browser storage is the external source for this client-only store.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setData(JSON.parse(saved) as VefaData);
    } catch {
      localStorage.removeItem(KEY);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(data));
  }, [data, ready]);

  const addDonation = useCallback((input: Omit<Donation, "id" | "createdAt" | "createdBy" | "donorId" | "donorName" | "shareNo"> & { fullName: string; sendWhatsapp: boolean }) => {
    let whatsappUrl = "";
    setData((current) => {
      const now = new Date().toISOString();
      const user = current.users.find((item) => item.id === current.currentUserId) ?? current.users[0];
      const existing = current.donors.find((item) => item.phone === input.phone);
      const donorId = existing?.id ?? uid();
      const donationId = uid();
      let shareNo: number | undefined;
      let sacrifices = current.sacrifices;

      if (input.kind === "KURBAN" && input.sacrificeId) {
        sacrifices = current.sacrifices.map((sacrifice) => {
          if (sacrifice.id !== input.sacrificeId) return sacrifice;
          const firstEmpty = sacrifice.shares.find((share) => share.status === "BOS");
          if (!firstEmpty) throw new Error("Bu kurbanın boş hissesi kalmadı.");
          shareNo = firstEmpty.no;
          return {
            ...sacrifice,
            shares: sacrifice.shares.map((share) =>
              share.no === firstEmpty.no
                ? { ...share, status: "DOLU", donorId, donorName: input.fullName, donationId }
                : share
            ),
          };
        });
      }

      const donation: Donation = {
        id: donationId,
        donorId,
        donorName: input.fullName,
        phone: input.phone,
        kind: input.kind,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        description: input.description,
        sacrificeId: input.sacrificeId,
        shareNo,
        createdAt: now,
        createdBy: user.name,
      };
      const donors = existing
        ? current.donors.map((donor) => donor.id === donorId ? {
            ...donor, fullName: input.fullName, total: donor.total + input.amount,
            donationCount: donor.donationCount + 1, lastDonationAt: now,
          } : donor)
        : [{ id: donorId, fullName: input.fullName, phone: input.phone, total: input.amount, donationCount: 1, lastDonationAt: now }, ...current.donors];

      const text = `Sayın ${input.fullName}, ${money(input.amount)} tutarındaki ${kindLabels[input.kind]} bağışınız alınmıştır. Desteğiniz için teşekkür ederiz.`;
      const messages = input.sendWhatsapp
        ? [{ id: uid(), phone: input.phone, donorName: input.fullName, message: text, createdAt: now, status: "HAZIRLANDI" as const, donationId }, ...current.messages]
        : current.messages;
      if (input.sendWhatsapp) whatsappUrl = `https://wa.me/90${input.phone.slice(1)}?text=${encodeURIComponent(text)}`;

      return {
        ...current, donors, sacrifices, messages,
        donations: [donation, ...current.donations],
        audit: [{ id: uid(), action: "Bağış kaydı", detail: `${input.fullName} - ${kindLabels[input.kind]}`, userName: user.name, createdAt: now }, ...current.audit],
      };
    });
    return whatsappUrl;
  }, []);

  const update = useCallback((recipe: (current: VefaData) => VefaData) => setData(recipe), []);
  const reset = useCallback(() => setData(initialData), []);
  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `vefa-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [data]);

  return { data, ready, addDonation, update, reset, exportData };
}
