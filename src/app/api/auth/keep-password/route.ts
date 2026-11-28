import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/keep-password
 * Allows a staff member provisioned by IT / Super Admin to keep and continue using
 * their assigned password instead of being forced to change it on first login.
 */
export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        mustChangePassword: false,
        activationKey: null,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "USER_KEPT_ASSIGNED_PASSWORD",
      entity: "User",
      entityId: user.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { choice: "KEPT_IT_ASSIGNED_PASSWORD" },
    });

    return NextResponse.json({
      success: true,
      message: "Assigned password confirmed. Redirecting to your workspace.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to confirm password" },
      { status: 500 }
    );
  }
}
