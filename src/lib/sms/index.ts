import { MockSmsProvider } from "@/lib/sms/mock-provider";
import type { SmsProvider } from "@/lib/sms/types";

export function getSmsProvider(): SmsProvider {
  if (process.env.NODE_ENV !== "production" || !process.env.SMS_PROVIDER) {
    return new MockSmsProvider();
  }
  throw new Error("SMS servis sağlayıcısı yapılandırılmamış.");
}

export function renderDonationSms(input: {
  donorName: string;
  amount: string;
  donationType: string;
}) {
  return `Sayın ${input.donorName}, ${input.amount} tutarındaki ${input.donationType} bağışınız alınmıştır. Desteğiniz için teşekkür ederiz.`;
}
