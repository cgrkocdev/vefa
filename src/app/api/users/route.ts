import { hash } from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { userSchema } from "@/lib/validations";
import { errorResponse, getAuthorizedUser, unauthorizedResponse } from "@/lib/server-auth";

export async function GET() {
  const currentUser = await getAuthorizedUser("user:manage");
  if (!currentUser) return unauthorizedResponse();
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, roleCode: true, isActive: true, createdAt: true },
  });
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const currentUser = await getAuthorizedUser("user:manage");
  if (!currentUser) return unauthorizedResponse();
  const parsed = userSchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message);
  try {
    const role = await prisma.role.findUniqueOrThrow({ where: { code: parsed.data.role } });
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email.toLocaleLowerCase("tr-TR"),
          passwordHash: await hash(parsed.data.password, 12),
          roleCode: parsed.data.role,
          roleId: role.id,
        },
        select: { id: true, name: true, email: true, roleCode: true, isActive: true, createdAt: true },
      });
      await tx.auditLog.create({
        data: {
          action: "USER_CREATED", entity: "User", entityId: created.id,
          userId: currentUser.id, metadata: { role: parsed.data.role },
        },
      });
      return created;
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse("Bu e-posta adresi zaten kullanılıyor.", 409);
    }
    return errorResponse("Kullanıcı oluşturulamadı.", 500);
  }
}
