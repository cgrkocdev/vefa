import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser, unauthorizedResponse } from "@/lib/server-auth";

export async function GET() {
  const user = await getAuthorizedUser("donation:view");
  if (!user) return unauthorizedResponse();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [today, month, donors, remainingShares, donations] = await Promise.all([
    prisma.donation.aggregate({ where: { status: "COMPLETED", createdAt: { gte: startOfDay } }, _sum: { amount: true } }),
    prisma.donation.aggregate({ where: { status: "COMPLETED", createdAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.donor.count(),
    prisma.sacrificeShare.count({ where: { status: "EMPTY" } }),
    prisma.donation.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { donor: true, donationType: true } }),
  ]);

  return NextResponse.json({
    stats: {
      today: Number(today._sum.amount ?? 0),
      month: Number(month._sum.amount ?? 0),
      donors,
      remainingShares,
    },
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
