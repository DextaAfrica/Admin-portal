import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { ensureEnterpriseSchema } from "@/lib/enterprise/schema";
import { getUtcDateKey } from "@/lib/telemetry/work-monitor";

export const dynamic = "force-dynamic";

const db = prisma as any;

/**
 * GET /api/executive/remote-telemetry
 * Strictly restricted to MD/CEO/Executive (all staff) and GM (Operations).
 * Systems IT without Executive clearance is strictly blocked (403) to preserve privacy.
 */
export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (user.role || "").toUpperCase();
    const dept = (user.department || "").toUpperCase();
    const title = (user.jobTitle || "").toUpperCase();

    const isExecutive =
      role === "MD" ||
      role === "CEO" ||
      role === "SUPER_ADMIN" ||
      dept === "EXECUTIVE" ||
      title.includes("MANAGING DIRECTOR") ||
      title.includes("CEO");

    const isGm =
      role === "GM" ||
      role === "GENERAL_MANAGER" ||
      title.includes("GENERAL MANAGER") ||
      title.includes("GM") ||
      title.includes("COO");

    if (!isExecutive && !isGm) {
      return NextResponse.json(
        { error: "Forbidden: Remote work telemetry is restricted to Executive & GM oversight." },
        { status: 403 }
      );
    }

    await ensureEnterpriseSchema();
    const dateKey = getUtcDateKey();

    const [users, todayTelemetry] = await Promise.all([
      prisma.user.findMany({
        where: isExecutive
          ? { status: "ACTIVE" }
          : { status: "ACTIVE", department: { in: ["OPERATIONS", "CRM", "CLAN"] } },
        select: {
          id: true,
          fullName: true,
          department: true,
          jobTitle: true,
          role: true,
          lastLoginAt: true,
        },
        orderBy: { fullName: "asc" },
      }),
      db.dailyWorkTelemetry.findMany({
        where: { dateKey },
      }).catch(() => []),
    ]);

    const telMap = new Map<string, any>();
    todayTelemetry.forEach((t: any) => telMap.set(t.userId, t));

    const now = Date.now();
    const staffTelemetry = users.map((u) => {
      const t = telMap.get(u.id);
      const lastHb = t?.lastHeartbeatAt ? new Date(t.lastHeartbeatAt).getTime() : 0;
      const minsSinceHb = lastHb ? Math.round((now - lastHb) / 60000) : 999;

      let liveStatus: "ONLINE_ACTIVE" | "IDLE" | "OFFLINE" = "OFFLINE";
      if (t && minsSinceHb <= 5) {
        liveStatus = t.status === "IDLE" ? "IDLE" : "ONLINE_ACTIVE";
      } else if (t && minsSinceHb <= 15) {
        liveStatus = "IDLE";
      }

      const activeMinutes = Math.round((t?.activeSeconds || 0) / 60);
      const idleMinutes = Math.round((t?.idleSeconds || 0) / 60);

      return {
        userId: u.id,
        fullName: u.fullName,
        department: u.department,
        jobTitle: u.jobTitle || u.role,
        liveStatus,
        activeMinutes,
        idleMinutes,
        verifiedActions: t?.verifiedActions || 0,
        authenticityScore: t?.authenticityScore ?? 100,
        flagReason: t?.flagReason || null,
        lastRoute: t?.lastRoute || null,
        lastHeartbeatAt: t?.lastHeartbeatAt || null,
      };
    });

    return NextResponse.json({
      dateKey,
      summary: {
        totalMonitored: staffTelemetry.length,
        onlineActive: staffTelemetry.filter((s) => s.liveStatus === "ONLINE_ACTIVE").length,
        idle: staffTelemetry.filter((s) => s.liveStatus === "IDLE").length,
        offline: staffTelemetry.filter((s) => s.liveStatus === "OFFLINE").length,
        flaggedLowOutput: staffTelemetry.filter((s) => Boolean(s.flagReason)).length,
      },
      staffTelemetry,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch remote telemetry" },
      { status: 500 }
    );
  }
}
