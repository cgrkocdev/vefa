export type WhatsAppSendInput = {
  phone: string;
  donorName: string;
  amount: string;
  donationType: string;
};

export type WhatsAppSendResult = {
  success: boolean;
  providerId?: string;
  errorMessage?: string;
};

export interface WhatsAppProvider {
  readonly name: string;
  sendDonationThanks(input: WhatsAppSendInput): Promise<WhatsAppSendResult>;
}
