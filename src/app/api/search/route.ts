import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser, unauthorizedResponse } from "@/lib/server-auth";
import { normalizePhone } from "@/lib/phone";

export async function GET(request: NextRequest) {
  const user = await getAuthorizedUser("donation:view");
  if (!user) return unauthorizedResponse();
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json({ results: [] });
  const normalizedPhone = normalizePhone(query);

  const [donors, donations] = await Promise.all([
    prisma.donor.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phone: { contains: normalizedPhone.startsWith("+90") ? normalizedPhone : query } },
        ],
      },
      take: 6,
      orderBy: { lastDonationAt: "desc" },
      select: { id: true, name: true, phone: true, totalDonation: true },
    }),
    prisma.donation.findMany({
      where: {
        OR: [
          { receiptNo: { contains: query, mode: "insensitive" } },
          { donationType: { name: { contains: query, mode: "insensitive" } } },
        ],
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        donor: { select: { id: true, name: true, phone: true } },
        donationType: { select: { name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    results: [
      ...donors.map((donor) => ({
        id: `donor-${donor.id}`,
        kind: "DONOR" as const,
        title: donor.name,
        description: donor.phone,
        href: `/bagiscilar/${donor.id}`,
      })),
      ...donations.map((donation) => ({
        id: `donation-${donation.id}`,
        kind: "DONATION" as const,
        title: donation.donor.name,
        description: `${donation.receiptNo} · ${donation.donationType.name}`,
        href: `/bagiscilar/${donation.donor.id}`,
      })),
    ].slice(0, 10),
  });
}
