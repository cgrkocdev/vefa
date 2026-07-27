import { PaymentMethod, Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser, unauthorizedResponse } from "@/lib/server-auth";

const paymentLabels = {
  CASH: "Nakit",
  BANK_TRANSFER: "Havale / EFT",
  CREDIT_CARD: "Kredi Kartı",
  OTHER: "Diğer",
} as const;

export async function GET(request: NextRequest) {
  const user = await getAuthorizedUser("report:view");
  if (!user) return unauthorizedResponse();

  const requestedDays = Number(request.nextUrl.searchParams.get("days") ?? 30);
  const days = Number.isInteger(requestedDays) ? Math.min(Math.max(requestedDays, 7), 365) : 30;
  const requestedStart = request.nextUrl.searchParams.get("start");
  const requestedEnd = request.nextUrl.searchParams.get("end");
  const donationType = request.nextUrl.searchParams.get("type");
  const paymentMethod = request.nextUrl.searchParams.get("payment");
  const selectedPayment =
    paymentMethod && Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)
      ? (paymentMethod as PaymentMethod)
      : undefined;
  const userId = request.nextUrl.searchParams.get("userId");
  const startDate = requestedStart ? new Date(`${requestedStart}T00:00:00`) : new Date();
  if (!requestedStart) {
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));
  }
  const endDate = requestedEnd ? new Date(`${requestedEnd}T23:59:59.999`) : new Date();
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
    return NextResponse.json({ message: "Geçerli bir tarih aralığı seçin." }, { status: 400 });
  }
  const where: Prisma.DonationWhereInput = {
    createdAt: { gte: startDate, lte: endDate },
    status: "COMPLETED",
    ...(donationType ? { donationTypeId: donationType } : {}),
    ...(selectedPayment ? { paymentMethod: selectedPayment } : {}),
    ...(userId ? { createdById: userId } : {}),
  };

  const [donations, donorCount, sacrifices, auditLogs, users, donationTypes] = await Promise.all([
    prisma.donation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        donor: { select: { name: true } },
        donationType: { select: { name: true } },
        createdBy: { select: { id: true, name: true, roleCode: true } },
      },
    }),
    prisma.donor.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
    prisma.sacrifice.findMany({
      select: { status: true, shares: { select: { status: true } } },
    }),
    prisma.auditLog.findMany({
      where: { createdAt: { gte: startDate, lte: endDate }, ...(userId ? { userId } : {}) },
      take: 50,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, roleCode: true } } },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, roleCode: true },
    }),
    prisma.donationType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const daily = new Map<string, { amount: number; count: number }>();
  const byType = new Map<string, { amount: number; count: number }>();
  const byPayment = new Map<string, { amount: number; count: number }>();
  const byUser = new Map<string, { userId: string; name: string; role: string; amount: number; count: number }>();
  let total = 0;

  const chartDays = Math.min(
    Math.max(Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1, 1),
    366,
  );
  for (let offset = 0; offset < chartDays; offset += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + offset);
    daily.set(date.toISOString().slice(0, 10), { amount: 0, count: 0 });
  }
  for (const donation of donations) {
    const amount = Number(donation.amount);
    total += amount;
    const day = donation.createdAt.toISOString().slice(0, 10);
    const dayValue = daily.get(day) ?? { amount: 0, count: 0 };
    daily.set(day, { amount: dayValue.amount + amount, count: dayValue.count + 1 });
    const typeValue = byType.get(donation.donationType.name) ?? { amount: 0, count: 0 };
    byType.set(donation.donationType.name, { amount: typeValue.amount + amount, count: typeValue.count + 1 });
    const paymentName = paymentLabels[donation.paymentMethod];
    const paymentValue = byPayment.get(paymentName) ?? { amount: 0, count: 0 };
    byPayment.set(paymentName, { amount: paymentValue.amount + amount, count: paymentValue.count + 1 });
    const userValue = byUser.get(donation.createdBy.id) ?? {
      userId: donation.createdBy.id,
      name: donation.createdBy.name,
      role: donation.createdBy.roleCode,
      amount: 0,
      count: 0,
    };
    byUser.set(donation.createdBy.id, {
      ...userValue,
      amount: userValue.amount + amount,
      count: userValue.count + 1,
    });
  }

  const allShares = sacrifices.flatMap((item) => item.shares);
  return NextResponse.json({
    period: { days: chartDays, startDate, endDate },
    filters: {
      users,
      donationTypes,
      paymentMethods: Object.entries(paymentLabels).map(([value, label]) => ({ value, label })),
      selected: { userId, donationType, paymentMethod: selectedPayment ?? null },
    },
    summary: {
      total,
      donationCount: donations.length,
      average: donations.length ? total / donations.length : 0,
      newDonors: donorCount,
      filledShares: allShares.filter((item) => item.status === "FILLED").length,
      totalShares: allShares.length,
    },
    daily: Array.from(daily, ([date, value]) => ({ date, ...value })),
    byType: Array.from(byType, ([name, value]) => ({ name, ...value })).sort((a, b) => b.amount - a.amount),
    byPayment: Array.from(byPayment, ([name, value]) => ({ name, ...value })).sort((a, b) => b.amount - a.amount),
    byUser: Array.from(byUser.values()).sort((a, b) => b.amount - a.amount),
    donations: donations.slice(0, 50).map((item) => ({
      id: item.id,
      receiptNo: item.receiptNo,
      donorName: item.donor.name,
      type: item.donationType.name,
      paymentMethod: paymentLabels[item.paymentMethod],
      amount: Number(item.amount),
      createdAt: item.createdAt,
      createdBy: item.createdBy,
    })),
    activities: auditLogs.map((item) => ({
      id: item.id,
      action: item.action,
      entity: item.entity,
      entityId: item.entityId,
      createdAt: item.createdAt,
      user: item.user,
    })),
  });
}
