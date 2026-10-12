import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, revokeSession, revokeAllOtherSessions } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";

export async function POST(req: NextRequest) {
  try {
    const { user, sessionToken } = await getCurrentSession();
    if (!user || !sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, revokeAllOthers } = await req.json();

    if (revokeAllOthers) {
      await revokeAllOtherSessions(user.id, sessionToken);
      await logAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: "SESSIONS_REVOKE_ALL_OTHERS",
        entity: "Session",
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
      });

      return NextResponse.json({ success: true, message: "All other sessions revoked" });
    }

    if (sessionId) {
      await revokeSession(sessionId);
      await logAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: "SESSION_REVOKED",
        entity: "Session",
        entityId: sessionId,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
      });

      return NextResponse.json({ success: true, message: "Session revoked" });
    }

    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to revoke session" },
      { status: 500 }
    );
  }
}

