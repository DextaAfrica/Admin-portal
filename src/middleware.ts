import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "./lib/auth/constants";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const host = req.headers.get("host") || "";
  const protocol = req.nextUrl.protocol || "http:";

  // 1. Subdomain Host Detection
  const isOpsHost = host.startsWith("ops.") || host.includes("ops.dextaafrica");
  const isAdminHost = host.startsWith("admin.") || host.includes("admin.dextafrica");

  const buildSubdomainRedirect = (subdomain: "ops" | "admin", subPath = "/") => {
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    if (isLocal) {
      const port = host.split(":")[1] || "3000";
      return new URL(`${protocol}//${subdomain}.localhost:${port}${subPath}`);
    }
    const targetDomain = subdomain === "ops" ? "ops.dextaafrica.org" : "admin.dextafrica.org";
    return new URL(`https://${targetDomain}${subPath}`);
  };

  // 2. Strict Subdomain Isolation on Root Host (localhost / dextafrica.org)
  // If someone accesses /ops or /admin-portal paths on the root host, redirect to the dedicated subdomain!
  if (!isOpsHost && !isAdminHost) {
    if (pathname === "/ops" || pathname.startsWith("/ops/")) {
      const subPath = pathname.replace(/^\/ops/, "") || "/";
      return NextResponse.redirect(buildSubdomainRedirect("ops", subPath));
    }
    if (pathname === "/admin-portal" || pathname.startsWith("/admin-portal/")) {
      const subPath = pathname.replace(/^\/admin-portal/, "") || "/";
      return NextResponse.redirect(buildSubdomainRedirect("admin", subPath));
    }
  }

  // 3. Subdomain Root & Auth Rewrites on OPS Subdomain
  if (isOpsHost) {
    // Strip redundant /ops prefix on ops subdomain
    if (pathname === "/ops" || pathname.startsWith("/ops/")) {
      const sub = pathname.replace(/^\/ops/, "") || "/";
      return NextResponse.redirect(new URL(sub, req.url));
    }

    // Root serves the dedicated high-end Operations Welcome Landing page
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

  // 4. Subdomain Root & Auth Rewrites on ADMIN Subdomain
  if (isAdminHost) {
    // Strip redundant /admin-portal prefix on admin subdomain
    if (pathname === "/admin-portal" || pathname.startsWith("/admin-portal/")) {
      const sub = pathname.replace(/^\/admin-portal/, "") || "/";
      return NextResponse.redirect(new URL(sub, req.url));
    }

    // Root serves the dedicated high-end Systems Command Welcome Landing page
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

  // 5. Public Routes Whitelist
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

  // 6. Redirect unauthenticated users trying to access protected workspace pages
  if (!token && !isPublicRoute && !isStaticOrApi) {
    const loginTarget = "/login";
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
