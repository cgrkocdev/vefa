import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser, unauthorizedResponse } from "@/lib/server-auth";

export async function GET() {
  const user = await getAuthorizedUser("donation:view");
  if (!user) return unauthorizedResponse();
  const donors = await prisma.donor.findMany({
    orderBy: { lastDonationAt: "desc" },
    select: {
      id: true, name: true, phone: true, totalDonation: true,
      donationCount: true, lastDonationAt: true,
    },
  });
  return NextResponse.json({
    donors: donors.map((donor) => ({ ...donor, totalDonation: Number(donor.totalDonation) })),
  });
}
