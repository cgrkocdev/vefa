import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser, unauthorizedResponse } from "@/lib/server-auth";
import { getWhatsAppProvider } from "@/lib/whatsapp";

export async function GET() {
  const user = await getAuthorizedUser("sms:send");
  if (!user) return unauthorizedResponse();
  const messages = await prisma.whatsAppMessage.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: { donor: { select: { name: true } } },
  });
  return NextResponse.json({
    messages,
    provider: getWhatsAppProvider().name,
  });
}
