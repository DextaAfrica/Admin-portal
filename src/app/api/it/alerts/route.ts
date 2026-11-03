import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";

const db = prisma as any;

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (severity && severity !== "ALL") {
      where.severity = severity;
    }

    const [alerts, openCount, criticalCount, totalCount] = await Promise.all([
      db.policyAlert.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.policyAlert.count({ where: { status: "OPEN" } }),
      db.policyAlert.count({ where: { severity: "CRITICAL", status: "OPEN" } }),
      db.policyAlert.count(),
    ]);

    return NextResponse.json({
      alerts,
      stats: {
        openCount,
        criticalCount,
        totalCount,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load policy alerts" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status, resolutionNotes } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "Alert ID and Status are required" },
        { status: 400 }
      );
    }

    const updated = await db.policyAlert.update({
      where: { id },
      data: {
        status,
        resolutionNotes,
        resolvedAt: status === "RESOLVED" ? new Date() : undefined,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: `POLICY_ALERT_${status}`,
      entity: "PolicyAlert",
      entityId: id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { status, resolutionNotes },
    });

    return NextResponse.json({ alert: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update alert" },
      { status: 500 }
    );
  }
}

