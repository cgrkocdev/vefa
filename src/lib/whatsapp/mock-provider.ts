import type { WhatsAppProvider, WhatsAppSendInput, WhatsAppSendResult } from "@/lib/whatsapp/types";

export class MockWhatsAppProvider implements WhatsAppProvider {
  readonly name = "mock";

  async sendDonationThanks(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
    console.info(`[Mock WhatsApp] ${input.phone}: ${input.donorName} · ${input.amount} · ${input.donationType}`);
    return { success: true, providerId: `mock-wa-${crypto.randomUUID()}` };
  }
}
