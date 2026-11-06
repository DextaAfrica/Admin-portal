import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, getInactivityTimeoutMinutes } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/it/sessions -> List all active sessions across company & portals with inactivity indicators
export async function GET() {
  try {
    const { user, sessionToken } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (user.role || "").toUpperCase();
    const dept = (user.department || "").toUpperCase();
    const isAuthorized =
      role === "SUPER_ADMIN" ||
      role === "ADMIN" ||
      role === "IT_ADMIN" ||
      dept === "IT" ||
      dept === "EXECUTIVE";

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const timeoutMinutes = await getInactivityTimeoutMinutes();
    const now = Date.now();

    const sessions = await prisma.session.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            department: true,
          },
        },
      },
      orderBy: { lastActiveAt: "desc" },
      take: 50,
    });

    const formatted = sessions.map((s) => {
      const lastActive = s.lastActiveAt ? new Date(s.lastActiveAt).getTime() : new Date(s.createdAt).getTime();
      const inactiveMinutes = Math.floor((now - lastActive) / 60000);
      const remainingMinutes = Math.max(0, timeoutMinutes - inactiveMinutes);
      const isIdle = inactiveMinutes >= 5;

      return {
        id: s.id,
        user: s.user,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
        inactiveMinutes,
        remainingMinutes,
        isIdle,
        isCurrent: s.sessionToken === sessionToken,
      };
    });

    return NextResponse.json({
      sessions: formatted,
      timeoutMinutes,
      totalActive: formatted.length,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load sessions" },
      { status: 500 }
    );
  }
}

// DELETE /api/it/sessions -> Terminate / revoke a session remotely
export async function DELETE(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (user.role || "").toUpperCase();
    const dept = (user.department || "").toUpperCase();
    const isAuthorized =
      role === "SUPER_ADMIN" ||
      role === "ADMIN" ||
      role === "IT_ADMIN" ||
      dept === "IT" ||
      dept === "EXECUTIVE";

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId parameter" }, { status: 400 });
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "REVOKE_SESSION",
        entity: "Session",
        metadata: JSON.stringify({ revokedSessionId: sessionId }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, message: "Session successfully revoked" });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to revoke session" },
      { status: 500 }
    );
  }
}
