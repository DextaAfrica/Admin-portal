import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_DAYS,
  createSsoTicket,
  consumeSsoTicket,
  getCookieDomain,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticket = searchParams.get("ticket");
  const target = searchParams.get("target");
  const next = searchParams.get("next") || "/dashboard";

  // Mode 1: Ticket Consumption (Landing on target domain)
  if (ticket) {
    const sessionToken = await consumeSsoTicket(ticket);
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session || new Date() > session.expiresAt || session.user.status !== "ACTIVE") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const host = req.headers.get("host");
    const cookieDomain = getCookieDomain(host);

    const redirectUrl = new URL(next, req.url);
    const res = NextResponse.redirect(redirectUrl);

    res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
      path: "/",
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });

    return res;
  }

  // Mode 2: Ticket Issuance (Leaving source domain to transfer session to another subdomain)
  if (target) {
    let currentToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!currentToken) {
      try {
        const cookieStore = await cookies();
        currentToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      } catch {
        // Fallback
      }
    }

    if (!currentToken) {
      const targetUrl = new URL(target);
      return NextResponse.redirect(new URL("/login", targetUrl.origin));
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken: currentToken },
      include: { user: true },
    });

    if (!session || new Date() > session.expiresAt || session.user.status !== "ACTIVE") {
      const targetUrl = new URL(target);
      return NextResponse.redirect(new URL("/login", targetUrl.origin));
    }

    const newTicket = await createSsoTicket(currentToken);
    const targetUrl = new URL(target);
    targetUrl.searchParams.set("ticket", newTicket);
    targetUrl.searchParams.set("next", next);

    return NextResponse.redirect(targetUrl);
  }

  return NextResponse.redirect(new URL("/dashboard", req.url));
}

