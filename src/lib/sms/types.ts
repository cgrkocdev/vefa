export type SmsSendInput = {
  phone: string;
  message: string;
};

export type SmsSendResult = {
  success: boolean;
  providerId?: string;
  errorMessage?: string;
};

export type SmsDeliveryStatus = "QUEUED" | "SENT" | "DELIVERED" | "FAILED";

export interface SmsProvider {
  readonly name: string;
  sendSms(input: SmsSendInput): Promise<SmsSendResult>;
  getBalance(): Promise<number | null>;
  getDeliveryStatus(providerId: string): Promise<SmsDeliveryStatus>;
}
