import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { shareSchema } from "@/lib/validations";
import { errorResponse, getAuthorizedUser, unauthorizedResponse } from "@/lib/server-auth";
import { getWhatsAppProvider, renderWhatsAppMessage } from "@/lib/whatsapp";
import { formatCurrency } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const user = await getAuthorizedUser("sacrifice:manage");
  if (!user) return unauthorizedResponse();
  const parsed = shareSchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message);
  const input = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sacrifice = await tx.sacrifice.findUnique({ where: { id: input.sacrificeId } });
      if (!sacrifice || sacrifice.status !== "OPEN") throw new Error("SACRIFICE_NOT_OPEN");

      const share = await tx.sacrificeShare.findUnique({
        where: { sacrificeId_shareNo: { sacrificeId: input.sacrificeId, shareNo: input.shareNo } },
      });
      if (!share || share.status !== "EMPTY" || share.version !== input.version) {
        throw new Error("SHARE_ALREADY_RESERVED");
      }

      const donationType = await tx.donationType.findUnique({ where: { code: "KURBAN" } });
      if (!donationType) throw new Error("DONATION_TYPE_NOT_FOUND");
      const donor = await tx.donor.upsert({
        where: { phone: input.phone },
        create: {
          name: input.donorName, phone: input.phone, totalDonation: input.amount,
          donationCount: 1, lastDonationAt: new Date(),
        },
        update: {
          name: input.donorName, totalDonation: { increment: input.amount },
          donationCount: { increment: 1 }, lastDonationAt: new Date(),
        },
      });
      const donation = await tx.donation.create({
        data: {
          receiptNo: `KRB-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          idempotencyKey: crypto.randomUUID(),
          amount: input.amount,
          status: input.paymentStatus === "PAID" ? "COMPLETED" : "PENDING",
          paymentMethod: input.paymentMethod,
          description: `${sacrifice.number}. Kurban - ${input.shareNo}. hisse`,
          donorId: donor.id,
          donationTypeId: donationType.id,
          createdById: user.id,
        },
      });

      const updated = await tx.sacrificeShare.updateMany({
        where: { id: share.id, version: input.version, status: "EMPTY" },
        data: {
          donorId: donor.id,
          donationId: donation.id,
          createdById: user.id,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentStatus,
          status: input.paymentStatus === "PAID" ? "FILLED" : input.paymentStatus === "CANCELLED" ? "CANCELLED" : "PENDING",
          version: { increment: 1 },
        },
      });
      if (updated.count !== 1) throw new Error("SHARE_ALREADY_RESERVED");

      const filledCount = await tx.sacrificeShare.count({
        where: { sacrificeId: sacrifice.id, status: "FILLED" },
      });
      if (filledCount === 7) {
        await tx.sacrifice.update({ where: { id: sacrifice.id }, data: { status: "COMPLETED" } });
      }
      await tx.auditLog.create({
        data: {
          action: "SACRIFICE_SHARE_RESERVED",
          entity: "SacrificeShare",
          entityId: share.id,
          userId: user.id,
          metadata: { sacrificeNo: sacrifice.number, shareNo: input.shareNo, donorId: donor.id },
        },
      });
      return { sacrifice, shareId: share.id, donation, donor };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (input.sendWhatsapp) {
      try {
        const message = renderWhatsAppMessage({
          donorName: result.donor.name,
          amount: formatCurrency(input.amount),
          donationType: "Kurban Bağışı",
        });
        const provider = getWhatsAppProvider();
        const sent = await provider.sendDonationThanks({
          phone: result.donor.phone,
          donorName: result.donor.name,
          amount: formatCurrency(input.amount),
          donationType: "Kurban Bağışı",
        });
        await prisma.whatsAppMessage.create({
          data: {
            phone: result.donor.phone, message, provider: provider.name,
            providerId: sent.providerId, errorMessage: sent.errorMessage,
            status: sent.success ? "SENT" : "FAILED", sentAt: sent.success ? new Date() : null,
            donorId: result.donor.id, donationId: result.donation.id, shareId: result.shareId,
          },
        });
        await prisma.auditLog.create({
          data: {
            action: sent.success ? "WHATSAPP_SENT" : "WHATSAPP_FAILED",
            entity: "SacrificeShare",
            entityId: result.shareId,
            userId: user.id,
            metadata: { provider: provider.name, phone: result.donor.phone },
          },
        });
      } catch (whatsAppError) {
        console.error("WhatsApp gönderim kayıt hatası", whatsAppError);
      }
    }
    return NextResponse.json({ message: "Kurban hissesi başarıyla kaydedildi." }, { status: 201 });
  } catch (error) {
    if (
      (error instanceof Error && error.message === "SHARE_ALREADY_RESERVED") ||
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
    ) return errorResponse("Bu hisse başka bir kullanıcı tarafından kaydedildi. Liste yenilendi.", 409);
    if (error instanceof Error && error.message === "SACRIFICE_NOT_OPEN") {
      return errorResponse("Bu kurban için hisse kaydı kapalı.", 409);
    }
    console.error("Kurban hissesi kayıt hatası", error);
    return errorResponse("Hisse kaydedilemedi. Lütfen yeniden deneyin.", 500);
  }
}
