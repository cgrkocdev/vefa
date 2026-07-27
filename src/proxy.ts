import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { hasPermission, routePermissions } from "@/lib/permissions";
import type { UserRole } from "@/lib/constants";

export default async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  if (!token) {
    const loginUrl = new URL("/giris", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const protectedRoute = Object.entries(routePermissions).find(([route]) => pathname.startsWith(route));
  if (protectedRoute) {
    const role = token.role as UserRole | undefined;
    if (!role || !hasPermission(role, protectedRoute[1])) {
      return NextResponse.redirect(new URL("/yetkisiz", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|giris|_next/static|_next/image|favicon.ico).*)"],
};
