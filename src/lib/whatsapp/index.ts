import { MetaWhatsAppProvider } from "@/lib/whatsapp/meta-provider";
import { MockWhatsAppProvider } from "@/lib/whatsapp/mock-provider";
import type { WhatsAppProvider } from "@/lib/whatsapp/types";

export function getWhatsAppProvider(): WhatsAppProvider {
  if (process.env.WHATSAPP_PROVIDER !== "meta") return new MockWhatsAppProvider();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) {
    throw new Error("WhatsApp Cloud API bilgileri eksik.");
  }
  return new MetaWhatsAppProvider(
    accessToken,
    phoneNumberId,
    process.env.WHATSAPP_API_VERSION ?? "v23.0",
    process.env.WHATSAPP_TEMPLATE_NAME ?? "bagis_tesekkur",
    process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "tr",
  );
}

export function renderWhatsAppMessage(input: {
  donorName: string;
  amount: string;
  donationType: string;
}) {
  return `Sayın ${input.donorName}, ${input.amount} tutarındaki ${input.donationType} bağışınız alınmıştır. Desteğiniz için teşekkür ederiz.`;
}
