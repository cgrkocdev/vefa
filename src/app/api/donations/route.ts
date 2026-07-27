import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { donationSchema } from "@/lib/validations";
import { errorResponse, getAuthorizedUser, unauthorizedResponse } from "@/lib/server-auth";
import { getWhatsAppProvider, renderWhatsAppMessage } from "@/lib/whatsapp";
import { formatCurrency } from "@/lib/utils";

function createReceiptNo(prefix = "BGS") {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `${prefix}-${date}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  const user = await getAuthorizedUser("donation:create");
  if (!user) return unauthorizedResponse();

  const parsed = donationSchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message);
  const input = parsed.data;

  try {
    const existing = await prisma.donation.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { donor: true, donationType: true },
    });
    if (existing) {
      return NextResponse.json({
        donation: {
          id: existing.id,
          donorName: existing.donor.name,
          type: existing.donationType.name,
          amount: Number(existing.amount),
          createdAt: existing.createdAt,
          status: existing.status,
        },
        duplicate: true,
      });
    }

    const donation = await prisma.$transaction(async (tx) => {
      const donationType = await tx.donationType.findFirst({
        where: { OR: [{ code: input.type }, { name: input.type }], isActive: true },
      });
      if (!donationType) throw new Error("DONATION_TYPE_NOT_FOUND");

      const selectedSacrifice = donationType.code === "KURBAN"
        ? await tx.sacrifice.findFirst({
            where: {
              id: input.sacrificeId,
              status: "OPEN",
              shares: { some: { status: "EMPTY" } },
            },
          })
        : null;
      if (donationType.code === "KURBAN" && !selectedSacrifice) {
        throw new Error("NO_AVAILABLE_SHARE");
      }
      const effectiveAmount = selectedSacrifice
        ? Number(selectedSacrifice.sharePrice)
        : input.amount;
      const systemSettings = await tx.systemSetting.findUnique({ where: { key: "general" } });
      const settingValue = systemSettings?.value;
      const receiptPrefix =
        settingValue &&
        typeof settingValue === "object" &&
        !Array.isArray(settingValue) &&
        typeof settingValue.receiptPrefix === "string"
          ? settingValue.receiptPrefix
          : "BGS";

      const donor = await tx.donor.upsert({
        where: { phone: input.phone },
        create: {
          name: input.donorName,
          phone: input.phone,
          totalDonation: effectiveAmount,
          donationCount: 1,
          lastDonationAt: new Date(),
        },
        update: {
          name: input.donorName,
          totalDonation: { increment: effectiveAmount },
          donationCount: { increment: 1 },
          lastDonationAt: new Date(),
        },
      });

      const created = await tx.donation.create({
        data: {
          receiptNo: createReceiptNo(receiptPrefix),
          idempotencyKey: input.idempotencyKey,
          amount: effectiveAmount,
          paymentMethod: input.paymentMethod,
          description: input.description,
          donorId: donor.id,
          donationTypeId: donationType.id,
          createdById: user.id,
        },
        include: { donor: true, donationType: true },
      });

      if (donationType.code === "KURBAN" && selectedSacrifice) {
        const share = await tx.sacrificeShare.findFirst({
          where: { sacrificeId: selectedSacrifice.id, status: "EMPTY" },
          orderBy: { shareNo: "asc" },
        });
        if (!share) throw new Error("NO_AVAILABLE_SHARE");

        const reserved = await tx.sacrificeShare.updateMany({
          where: { id: share.id, status: "EMPTY", version: share.version },
          data: {
            donorId: donor.id,
            donationId: created.id,
            createdById: user.id,
            amount: effectiveAmount,
            paymentMethod: input.paymentMethod,
            paymentStatus: "PAID",
            status: "FILLED",
            version: { increment: 1 },
          },
        });
        if (reserved.count !== 1) throw new Error("SHARE_ALREADY_RESERVED");

        const filledCount = await tx.sacrificeShare.count({
          where: { sacrificeId: selectedSacrifice.id, status: "FILLED" },
        });
        if (filledCount === 7) {
          await tx.sacrifice.update({
            where: { id: selectedSacrifice.id },
            data: { status: "COMPLETED" },
          });
        }
        await tx.auditLog.create({
          data: {
            action: "SACRIFICE_SHARE_AUTO_ASSIGNED",
            entity: "SacrificeShare",
            entityId: share.id,
            userId: user.id,
            metadata: {
              sacrificeNo: selectedSacrifice.number,
              region: selectedSacrifice.region,
              shareNo: share.shareNo,
              donorId: donor.id,
              donationId: created.id,
            },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          action: "DONATION_CREATED",
          entity: "Donation",
          entityId: created.id,
          userId: user.id,
          metadata: { amount: effectiveAmount, type: donationType.code, phone: input.phone },
        },
      });
      await tx.notification.create({
        data: {
          title: "Yeni bağış",
          message: `${donor.name} tarafından ${formatCurrency(effectiveAmount)} ${donationType.name} alındı.`,
          type: "DONATION_CREATED",
        },
      });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    const messagingSettings = await prisma.systemSetting.findUnique({ where: { key: "general" } });
    const messagingValue = messagingSettings?.value;
    const whatsappEnabled =
      !messagingValue ||
      typeof messagingValue !== "object" ||
      Array.isArray(messagingValue) ||
      messagingValue.whatsappEnabled !== false;

    if (input.sendWhatsapp && whatsappEnabled) {
      try {
        const message = renderWhatsAppMessage({
          donorName: donation.donor.name,
          amount: formatCurrency(Number(donation.amount)),
          donationType: donation.donationType.name,
        });
        const provider = getWhatsAppProvider();
        const result = await provider.sendDonationThanks({
          phone: donation.donor.phone,
          donorName: donation.donor.name,
          amount: formatCurrency(Number(donation.amount)),
          donationType: donation.donationType.name,
        });
        await prisma.whatsAppMessage.create({
          data: {
            phone: donation.donor.phone,
            message,
            provider: provider.name,
            providerId: result.providerId,
            status: result.success ? "SENT" : "FAILED",
            errorMessage: result.errorMessage,
            sentAt: result.success ? new Date() : null,
            donorId: donation.donor.id,
            donationId: donation.id,
          },
        });
        await prisma.auditLog.create({
          data: {
            action: result.success ? "WHATSAPP_SENT" : "WHATSAPP_FAILED",
            entity: "WhatsAppMessage",
            entityId: donation.id,
            userId: user.id,
            metadata: { provider: provider.name, phone: donation.donor.phone },
          },
        });
      } catch (whatsAppError) {
        console.error("WhatsApp gönderim kayıt hatası", whatsAppError);
      }
    }

    return NextResponse.json({
      donation: {
        id: donation.id,
        donorName: donation.donor.name,
        type: donation.donationType.name,
        amount: Number(donation.amount),
        createdAt: donation.createdAt,
        status: donation.status,
      },
      duplicate: false,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse("Bu bağış işlemi daha önce kaydedilmiş.", 409);
    }
    if (error instanceof Error && error.message === "DONATION_TYPE_NOT_FOUND") {
      return errorResponse("Seçilen bağış türü bulunamadı.");
    }
    if (error instanceof Error && error.message === "NO_AVAILABLE_SHARE") {
      return errorResponse("Boş kurban hissesi bulunamadı. Yeni kurban kaydı açın.", 409);
    }
    if (
      (error instanceof Error && error.message === "SHARE_ALREADY_RESERVED") ||
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034")
    ) {
      return errorResponse("Hisse aynı anda başka bir işlemde kullanıldı. Lütfen yeniden kaydedin.", 409);
    }
    console.error("Bağış kayıt hatası", error);
    return errorResponse("Bağış kaydedilemedi. Lütfen yeniden deneyin.", 500);
  }
}

export async function GET() {
  const user = await getAuthorizedUser("donation:view");
  if (!user) return unauthorizedResponse();
  const donations = await prisma.donation.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: { donor: true, donationType: true },
  });
  return NextResponse.json({
    donations: donations.map((item) => ({
      id: item.id,
      donorName: item.donor.name,
      type: item.donationType.name,
      amount: Number(item.amount),
      createdAt: item.createdAt,
      status: item.status,
    })),
  });
}
