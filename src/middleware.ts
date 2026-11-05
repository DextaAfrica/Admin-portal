import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "./lib/auth/constants";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const host = req.headers.get("host") || "";

  // 1. Subdomain Host Detection
  const isOpsHost = host.startsWith("ops.") || host.includes("ops.dextaafrica");
  const isAdminHost = host.startsWith("admin.") || host.includes("admin.dextafrica");

  // 2. Subdomain Root & Auth Rewrites
  if (isOpsHost) {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/ops", req.url));
    }
    if (pathname === "/login") {
      return NextResponse.rewrite(new URL("/ops/login", req.url));
    }
    if (pathname === "/register") {
      return NextResponse.rewrite(new URL("/ops/register", req.url));
    }
  }

  if (isAdminHost) {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/admin-portal", req.url));
    }
    if (pathname === "/login") {
      return NextResponse.rewrite(new URL("/admin-portal/login", req.url));
    }
    if (pathname === "/register") {
      return NextResponse.rewrite(new URL("/admin-portal/register", req.url));
    }
  }

  // 3. Public Routes Whitelist
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/ops") ||
    pathname.startsWith("/admin-portal") ||
    pathname.startsWith("/crm-portal") ||
    pathname.startsWith("/setup/password") ||
    pathname.startsWith("/mfa-challenge") ||
    pathname.startsWith("/api/auth");

  const isStaticOrApi =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico";

  // 4. Redirect unauthenticated users trying to access protected workspace pages
  if (!token && !isPublicRoute && !isStaticOrApi) {
    const loginTarget = isOpsHost
      ? "/ops/login"
      : isAdminHost
      ? "/admin-portal/login"
      : "/login";
    const url = new URL(loginTarget, req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
