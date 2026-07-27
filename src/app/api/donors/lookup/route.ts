import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser, unauthorizedResponse } from "@/lib/server-auth";
import { normalizePhone } from "@/lib/phone";

export async function GET(request: NextRequest) {
  const user = await getAuthorizedUser("donation:create");
  if (!user) return unauthorizedResponse();

  const phone = normalizePhone(request.nextUrl.searchParams.get("phone") ?? "");
  if (!/^\+905\d{9}$/.test(phone)) return NextResponse.json({ donor: null });

  const donor = await prisma.donor.findUnique({
    where: { phone },
    select: { id: true, name: true, phone: true, totalDonation: true, donationCount: true },
  });

  return NextResponse.json({
    donor: donor ? { ...donor, totalDonation: Number(donor.totalDonation) } : null,
  });
}
