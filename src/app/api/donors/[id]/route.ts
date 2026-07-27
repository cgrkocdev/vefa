import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser, unauthorizedResponse, errorResponse } from "@/lib/server-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthorizedUser("donation:view");
  if (!user) return unauthorizedResponse();
  const { id } = await params;
  const donor = await prisma.donor.findUnique({
    where: { id },
    include: {
      donations: { orderBy: { createdAt: "desc" }, include: { donationType: true } },
      shares: { orderBy: { createdAt: "desc" }, include: { sacrifice: true } },
      whatsappMessages: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!donor) return errorResponse("Bağışçı bulunamadı.", 404);
  return NextResponse.json({
    donor: {
      ...donor,
      totalDonation: Number(donor.totalDonation),
      donations: donor.donations.map((item) => ({ ...item, amount: Number(item.amount) })),
      shares: donor.shares.map((item) => ({ ...item, amount: item.amount ? Number(item.amount) : null })),
    },
  });
}
