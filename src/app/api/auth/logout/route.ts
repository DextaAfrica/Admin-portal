import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, getCookieDomain } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const cookieDomain = getCookieDomain(req.headers.get("host"));
  const { searchParams } = new URL(req.url);
  const next = searchParams.get("next") || "/login";

  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await prisma.session.deleteMany({
        where: { sessionToken: token },
      });
    }
  } catch {
    // Ignore error
  }

  const redirectUrl = new URL(next, req.url);
  const res = NextResponse.redirect(redirectUrl);

  if (cookieDomain) {
    res.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      domain: cookieDomain,
    });
  }

  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  res.cookies.delete(SESSION_COOKIE_NAME);

  return res;
}

export async function POST(req: NextRequest) {
  const cookieDomain = getCookieDomain(req.headers.get("host"));

  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await prisma.session.deleteMany({
        where: { sessionToken: token },
      });
    }

    const res = NextResponse.json({ success: true });
    // Clear cross-subdomain cookie
    if (cookieDomain) {
      res.cookies.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        path: "/",
        maxAge: 0,
        expires: new Date(0),
        domain: cookieDomain,
      });
    }
    // Clear host-only cookie
    res.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    res.cookies.delete(SESSION_COOKIE_NAME);
    return res;
  } catch {
    const res = NextResponse.json({ success: true });
    if (cookieDomain) {
      res.cookies.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        path: "/",
        maxAge: 0,
        expires: new Date(0),
        domain: cookieDomain,
      });
    }
    res.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    res.cookies.delete(SESSION_COOKIE_NAME);
    return res;
  }
}
