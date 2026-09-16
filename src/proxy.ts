import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { edgeAuthConfig } from "@/lib/auth/edge-config";

// Garde de premier niveau, basée sur le JWT (edge-compatible, sans Prisma).
// Le contrôle autoritaire — compte approuvé, rôle exact — est revérifié en
// base dans les layouts serveur de (client) et (admin) ainsi que dans chaque
// route API : docs/PLAN.md §10, « pas seulement par masquage d'interface ».
const { auth } = NextAuth(edgeAuthConfig);

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isLoggedIn = Boolean(request.auth?.user);

  const isAdminRoute = pathname.startsWith("/admin");
  const isClientRoute =
    pathname.startsWith("/tableau-de-bord") ||
    pathname.startsWith("/configurateur") ||
    pathname.startsWith("/devis");

  if ((isAdminRoute || isClientRoute) && !isLoggedIn) {
    const loginUrl = new URL("/connexion", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && request.auth?.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/tableau-de-bord/:path*", "/configurateur/:path*", "/devis/:path*"],
};
