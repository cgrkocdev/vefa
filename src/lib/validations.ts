import { z } from "zod";

const turkishPhoneSchema = z
  .string()
  .transform((value) => {
    const digits = value.replace(/\D/g, "");
    if (digits.startsWith("90") && digits.length === 12) return `+${digits}`;
    if (digits.startsWith("0") && digits.length === 11) return `+90${digits.slice(1)}`;
    if (digits.startsWith("5") && digits.length === 10) return `+90${digits}`;
    return value;
  })
  .refine((value) => /^\+905\d{9}$/.test(value), {
    message: "Telefon numarasını 05XX XXX XX XX formatında girin.",
  });

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Kullanıcı adınızı girin."),
  password: z.string().min(6, "Şifreniz en az 6 karakter olmalıdır."),
});

export const donationSchema = z.object({
  donorName: z.string().min(2, "Bağışçı adını girin."),
  phone: turkishPhoneSchema,
  type: z.string().min(1, "Bağış türünü seçin."),
  amount: z.coerce.number().positive("Bağış tutarı sıfırdan büyük olmalıdır."),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CREDIT_CARD", "OTHER"], {
    message: "Ödeme yöntemini seçin.",
  }),
  description: z.string().max(500, "Açıklama en fazla 500 karakter olabilir.").optional(),
  sacrificeId: z.string().optional(),
  sendWhatsapp: z.boolean(),
  idempotencyKey: z.string().uuid("İşlem anahtarı geçersiz."),
}).superRefine((value, context) => {
  if (value.type === "Kurban" && !value.sacrificeId) {
    context.addIssue({
      code: "custom",
      path: ["sacrificeId"],
      message: "Kurban ülkesi seçin.",
    });
  }
});

export type DonationInput = z.infer<typeof donationSchema>;

export const donorPhoneSchema = z.object({
  phone: turkishPhoneSchema,
});

export const shareSchema = z.object({
  sacrificeId: z.string().min(1),
  shareNo: z.number().int().min(1).max(7),
  version: z.number().int().nonnegative(),
  donorName: z.string().min(2, "Bağışçı adını girin."),
  phone: turkishPhoneSchema,
  amount: z.coerce.number().positive("Hisse tutarı sıfırdan büyük olmalıdır."),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CREDIT_CARD", "OTHER"]),
  paymentStatus: z.enum(["PENDING", "PAID", "CANCELLED"]),
  sendWhatsapp: z.boolean(),
});

export const userSchema = z.object({
  name: z.string().min(2, "Ad soyad zorunludur."),
  email: z.string().email("Geçerli bir e-posta adresi girin."),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır."),
  role: z.enum(["ADMIN", "DONATION_STAFF", "REPORT_VIEWER"]),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2, "Ad soyad zorunludur."),
  email: z.string().email("Geçerli bir e-posta adresi girin."),
  password: z.union([
    z.literal(""),
    z.string().min(8, "Yeni şifre en az 8 karakter olmalıdır."),
  ]),
  role: z.enum(["ADMIN", "DONATION_STAFF", "REPORT_VIEWER"]),
  isActive: z.boolean(),
});

export const settingsSchema = z.object({
  organizationName: z.string().min(2, "Kurum adını girin.").max(120),
  organizationPhone: z.string().max(30).optional(),
  organizationEmail: z.union([z.literal(""), z.string().email("Geçerli bir e-posta adresi girin.")]),
  organizationAddress: z.string().max(300).optional(),
  receiptPrefix: z.string().min(2, "Makbuz ön ekini girin.").max(10)
    .regex(/^[A-ZÇĞİÖŞÜ0-9-]+$/, "Yalnızca büyük harf, rakam ve tire kullanın."),
  whatsappEnabled: z.boolean(),
});
