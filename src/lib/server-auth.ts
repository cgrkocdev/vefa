import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { UserRole } from "@/lib/constants";

export type AuthorizedUser = { id: string; role: UserRole; name?: string | null };

export async function getAuthorizedUser(permission?: Permission): Promise<AuthorizedUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.role) return null;
  if (permission && !hasPermission(session.user.role, permission)) return null;
  return { id: session.user.id, role: session.user.role, name: session.user.name };
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { message: "Bu işlem için yetkiniz bulunmuyor." },
    { status: 403 },
  );
}

export function errorResponse(message = "İşlem tamamlanamadı. Lütfen yeniden deneyin.", status = 400) {
  return NextResponse.json({ message }, { status });
}
