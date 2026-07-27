import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { userUpdateSchema } from "@/lib/validations";
import { errorResponse, getAuthorizedUser, unauthorizedResponse } from "@/lib/server-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getAuthorizedUser("user:manage");
  if (!currentUser) return unauthorizedResponse();
  const { id } = await params;
  const parsed = userUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message);

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return errorResponse("Kullanıcı bulunamadı.", 404);
  if (id === currentUser.id && !parsed.data.isActive) {
    return errorResponse("Kendi hesabınızı pasifleştiremezsiniz.", 409);
  }
  if (
    target.roleCode === "ADMIN" &&
    target.isActive &&
    (!parsed.data.isActive || parsed.data.role !== "ADMIN")
  ) {
    const activeAdminCount = await prisma.user.count({
      where: { roleCode: "ADMIN", isActive: true },
    });
    if (activeAdminCount <= 1) {
      return errorResponse("Sistemde en az bir aktif yönetici bulunmalıdır.", 409);
    }
  }

  try {
    const role = await prisma.role.findUniqueOrThrow({ where: { code: parsed.data.role } });
    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          name: parsed.data.name,
          email: parsed.data.email.toLocaleLowerCase("tr-TR"),
          roleCode: parsed.data.role,
          roleId: role.id,
          isActive: parsed.data.isActive,
          ...(parsed.data.password ? { passwordHash: await hash(parsed.data.password, 12) } : {}),
        },
        select: {
          id: true, name: true, email: true, roleCode: true,
          isActive: true, createdAt: true, updatedAt: true,
        },
      });
      await tx.auditLog.create({
        data: {
          action: "USER_UPDATED",
          entity: "User",
          entityId: user.id,
          userId: currentUser.id,
          metadata: {
            previousRole: target.roleCode,
            role: user.roleCode,
            isActive: user.isActive,
            passwordChanged: Boolean(parsed.data.password),
          },
        },
      });
      return user;
    });
    return NextResponse.json({
      user: updated,
      message: "Kullanıcı bilgileri güncellendi.",
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse("Bu e-posta adresi başka bir kullanıcıya ait.", 409);
    }
    console.error("Kullanıcı güncelleme hatası", error);
    return errorResponse("Kullanıcı güncellenemedi.", 500);
  }
}
