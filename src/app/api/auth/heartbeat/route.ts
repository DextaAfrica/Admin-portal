import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, getInactivityTimeoutMinutes } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// POST /api/auth/heartbeat -> Extends session activity while user is active
export async function POST() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: "No active session token" }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
    });

    if (!session) {
      return NextResponse.json({ error: "Session invalid or expired" }, { status: 401 });
    }

    // Touch lastActiveAt
    const now = new Date();
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: now },
    });

    const timeoutMinutes = await getInactivityTimeoutMinutes();

    return NextResponse.json({
      ok: true,
      lastActiveAt: now.toISOString(),
      timeoutMinutes,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to record activity" },
      { status: 500 }
    );
  }
}
