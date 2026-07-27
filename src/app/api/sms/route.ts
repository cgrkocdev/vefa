import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser, unauthorizedResponse } from "@/lib/server-auth";
import { getSmsProvider } from "@/lib/sms";

export async function GET() {
  const user = await getAuthorizedUser("sms:send");
  if (!user) return unauthorizedResponse();
  const [messages, balance] = await Promise.all([
    prisma.smsMessage.findMany({ take: 50, orderBy: { createdAt: "desc" }, include: { donor: { select: { name: true } } } }),
    getSmsProvider().getBalance(),
  ]);
  return NextResponse.json({ messages, balance, provider: getSmsProvider().name });
}
