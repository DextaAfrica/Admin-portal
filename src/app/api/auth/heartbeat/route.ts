import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, getInactivityTimeoutMinutes } from "@/lib/auth/session";
import { recordHeartbeatTelemetry } from "@/lib/telemetry/work-monitor";

export const dynamic = "force-dynamic";

// POST /api/auth/heartbeat -> Extends session activity & records remote work telemetry
export async function POST(req: NextRequest) {
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

    let body: { activeDeltaSeconds?: number; idleDeltaSeconds?: number; currentPath?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Allow empty body from legacy callers
    }

    const now = new Date();
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: now },
    });

    await recordHeartbeatTelemetry({
      userId: session.userId,
      activeDeltaSeconds: body.activeDeltaSeconds ?? 45,
      idleDeltaSeconds: body.idleDeltaSeconds ?? 0,
      routePath: body.currentPath || "/dashboard",
      ipAddress: req.headers.get("x-forwarded-for") || session.ipAddress || "127.0.0.1",
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
