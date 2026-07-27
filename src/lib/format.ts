export const money = (value: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value);

export const dateTime = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));

export const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "").replace(/^90/, "").replace(/^0/, "").slice(0, 10);
  return digits ? `0${digits}` : "";
};

export const formatPhoneInput = (value: string) => {
  const phone = normalizePhone(value);
  const d = phone.slice(1);
  if (!d) return "";
  return `0${d.length > 0 ? " (" : ""}${d.slice(0, 3)}${d.length >= 3 ? ") " : ""}${d.slice(3, 6)}${d.length >= 6 ? " " : ""}${d.slice(6, 8)}${d.length >= 8 ? " " : ""}${d.slice(8, 10)}`.trim();
};

export const kindLabels = {
  KURBAN: "Kurban Bağışı",
  ZEKAT: "Zekât",
  KURAN: "Kur’an Bağışı",
  GENEL: "Genel Bağış",
} as const;

export const paymentLabels = {
  NAKIT: "Nakit",
  HAVALE: "Havale / EFT",
  KART: "Kredi Kartı",
  DIGER: "Diğer",
} as const;
