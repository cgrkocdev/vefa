import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser, unauthorizedResponse } from "@/lib/server-auth";

export async function GET() {
  const user = await getAuthorizedUser("donation:view");
  if (!user) return unauthorizedResponse();

  const sacrifices = await prisma.sacrifice.findMany({
    orderBy: { number: "asc" },
    include: {
      shares: {
        orderBy: { shareNo: "asc" },
        include: { donor: { select: { name: true, phone: true } } },
      },
    },
  });
  return NextResponse.json({
    sacrifices: sacrifices.map((item) => ({
      id: item.id,
      number: item.number,
      region: item.region,
      sharePrice: Number(item.sharePrice),
      status: item.status,
      shares: item.shares.map((share) => ({
        id: share.id,
        shareNo: share.shareNo,
        status: share.status,
        paymentStatus: share.paymentStatus,
        paymentMethod: share.paymentMethod,
        amount: share.amount ? Number(share.amount) : Number(item.sharePrice),
        version: share.version,
        donor: share.donor,
      })),
    })),
  });
}
