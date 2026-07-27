import type { WhatsAppProvider, WhatsAppSendInput, WhatsAppSendResult } from "@/lib/whatsapp/types";

type MetaResponse = {
  messages?: Array<{ id: string }>;
  error?: { message?: string };
};

export class MetaWhatsAppProvider implements WhatsAppProvider {
  readonly name = "meta-cloud-api";

  constructor(
    private readonly accessToken: string,
    private readonly phoneNumberId: string,
    private readonly apiVersion: string,
    private readonly templateName: string,
    private readonly templateLanguage: string,
  ) {}

  async sendDonationThanks(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: input.phone.replace(/\D/g, ""),
            type: "template",
            template: {
              name: this.templateName,
              language: { code: this.templateLanguage },
              components: [{
                type: "body",
                parameters: [
                  { type: "text", text: input.donorName },
                  { type: "text", text: input.amount },
                  { type: "text", text: input.donationType },
                ],
              }],
            },
          }),
        },
      );
      const data = (await response.json()) as MetaResponse;
      if (!response.ok || !data.messages?.[0]?.id) {
        return { success: false, errorMessage: data.error?.message ?? "WhatsApp mesajı gönderilemedi." };
      }
      return { success: true, providerId: data.messages[0].id };
    } catch {
      return { success: false, errorMessage: "WhatsApp servisine ulaşılamadı." };
    }
  }
}
