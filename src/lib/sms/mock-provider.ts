import type { SmsDeliveryStatus, SmsProvider, SmsSendInput, SmsSendResult } from "@/lib/sms/types";

export class MockSmsProvider implements SmsProvider {
  readonly name = "mock";

  async sendSms(input: SmsSendInput): Promise<SmsSendResult> {
    console.info(`[Mock SMS] ${input.phone}: ${input.message}`);
    return { success: true, providerId: `mock-${crypto.randomUUID()}` };
  }

  async getBalance(): Promise<number> {
    return 1000;
  }

  async getDeliveryStatus(): Promise<SmsDeliveryStatus> {
    return "DELIVERED";
  }
}
