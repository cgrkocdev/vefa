import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validations";
import { errorResponse, getAuthorizedUser, unauthorizedResponse } from "@/lib/server-auth";

const SETTINGS_KEY = "general";
const defaultSettings = {
  organizationName: "Vefa Bağış Yönetimi",
  organizationPhone: "",
  organizationEmail: "",
  organizationAddress: "",
  receiptPrefix: "BGS",
  whatsappEnabled: true,
};

export async function GET() {
  const user = await getAuthorizedUser("settings:manage");
  if (!user) return unauthorizedResponse();
  const saved = await prisma.systemSetting.findUnique({ where: { key: SETTINGS_KEY } });
  const parsed = settingsSchema.safeParse(saved?.value);
  return NextResponse.json({
    settings: parsed.success ? parsed.data : defaultSettings,
    integrations: {
      whatsappProvider: process.env.WHATSAPP_PROVIDER ?? "mock",
      whatsappConfigured: Boolean(
        process.env.WHATSAPP_PROVIDER === "meta" &&
        process.env.WHATSAPP_ACCESS_TOKEN &&
        process.env.WHATSAPP_PHONE_NUMBER_ID
      ),
    },
  });
}

export async function PUT(request: NextRequest) {
  const user = await getAuthorizedUser("settings:manage");
  if (!user) return unauthorizedResponse();
  const parsed = settingsSchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message);
  const settings = {
    organizationName: parsed.data.organizationName,
    organizationPhone: parsed.data.organizationPhone ?? "",
    organizationEmail: parsed.data.organizationEmail,
    organizationAddress: parsed.data.organizationAddress ?? "",
    receiptPrefix: parsed.data.receiptPrefix,
    whatsappEnabled: parsed.data.whatsappEnabled,
  };
  await prisma.$transaction([
    prisma.systemSetting.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: settings as Prisma.InputJsonValue, updatedById: user.id },
      create: { key: SETTINGS_KEY, value: settings as Prisma.InputJsonValue, updatedById: user.id },
    }),
    prisma.auditLog.create({
      data: {
        action: "SETTINGS_UPDATED",
        entity: "SystemSetting",
        entityId: SETTINGS_KEY,
        userId: user.id,
        metadata: { sections: ["organization", "receipt", "whatsapp"] },
      },
    }),
  ]);
  return NextResponse.json({ settings, message: "Ayarlar başarıyla kaydedildi." });
}
