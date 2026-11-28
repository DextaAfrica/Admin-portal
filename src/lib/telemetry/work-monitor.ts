import { prisma } from "@/lib/prisma";
import { ensureEnterpriseSchema } from "@/lib/enterprise/schema";

const db = prisma as any;

export function getUtcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Computes an Authenticity & Productivity Score (0-100) from real backend signals:
 * - Active vs Idle ratio (prevents "open tab" pretending)
 * - Verified backend actions (CRM follow-ups, task completions, approvals, reports, messages)
 */
export function computeWorkAuthenticity(params: {
  activeSeconds: number;
  idleSeconds: number;
  verifiedActions: number;
}): { score: number; flagReason: string | null } {
  const totalSeconds = params.activeSeconds + params.idleSeconds;
  if (totalSeconds < 120) {
    return { score: 100, flagReason: null };
  }

  const idleRatio = params.idleSeconds / Math.max(1, totalSeconds);
  const activeHours = params.activeSeconds / 3600;

  let score = 100;
  let flagReason: string | null = null;

  // Penalize high idle ratio (>40% idle)
  if (idleRatio > 0.65) {
    score -= 45;
    flagReason = "EXCESSIVE_IDLE";
  } else if (idleRatio > 0.4) {
    score -= 22;
    flagReason = "EXCESSIVE_IDLE";
  }

  // Correlate presence with actual backend output (anti-pretend detection)
  if (activeHours >= 2 && params.verifiedActions === 0) {
    score -= 40;
    flagReason = "LOW_OUTPUT_HIGH_PRESENCE";
  } else if (activeHours >= 1 && params.verifiedActions === 0) {
    score -= 20;
    if (!flagReason) flagReason = "NO_VERIFIED_OUTPUT_YET";
  } else if (params.verifiedActions >= 5) {
    score = Math.min(100, score + 8);
  }

  return {
    score: Math.max(10, Math.min(100, Math.round(score))),
    flagReason,
  };
}

/**
 * Records a 45-second heartbeat pulse into DailyWorkTelemetry.
 * Distinguishes active engagement from idle open tabs.
 */
export async function recordHeartbeatTelemetry(params: {
  userId: string;
  activeDeltaSeconds?: number;
  idleDeltaSeconds?: number;
  routePath?: string;
  ipAddress?: string;
}): Promise<void> {
  try {
    await ensureEnterpriseSchema();
    const dateKey = getUtcDateKey();
    const activeDelta = Math.max(0, Math.min(120, Math.round(params.activeDeltaSeconds ?? 45)));
    const idleDelta = Math.max(0, Math.min(120, Math.round(params.idleDeltaSeconds ?? 0)));

    const existing = await db.dailyWorkTelemetry.findUnique({
      where: { userId_dateKey: { userId: params.userId, dateKey } },
    });

    const nextActive = (existing?.activeSeconds || 0) + activeDelta;
    const nextIdle = (existing?.idleSeconds || 0) + idleDelta;
    const verifiedActions = existing?.verifiedActions || 0;

    const { score, flagReason } = computeWorkAuthenticity({
      activeSeconds: nextActive,
      idleSeconds: nextIdle,
      verifiedActions,
    });

    const status = idleDelta > activeDelta ? "IDLE" : "ONLINE_ACTIVE";

    if (existing) {
      await db.dailyWorkTelemetry.update({
        where: { id: existing.id },
        data: {
          activeSeconds: nextActive,
          idleSeconds: nextIdle,
          heartbeatCount: { increment: 1 },
          lastRoute: params.routePath || existing.lastRoute,
          lastIpAddress: params.ipAddress || existing.lastIpAddress,
          lastHeartbeatAt: new Date(),
          status,
          authenticityScore: score,
          flagReason,
        },
      });
    } else {
      await db.dailyWorkTelemetry.create({
        data: {
          userId: params.userId,
          dateKey,
          activeSeconds: nextActive,
          idleSeconds: nextIdle,
          verifiedActions: 0,
          heartbeatCount: 1,
          lastRoute: params.routePath || "/dashboard",
          lastIpAddress: params.ipAddress || "127.0.0.1",
          lastHeartbeatAt: new Date(),
          status,
          authenticityScore: score,
          flagReason,
        },
      });
    }
  } catch (err) {
    console.warn("[recordHeartbeatTelemetry warning]:", err);
  }
}

/**
 * Increments verified backend work output whenever a staff member performs
 * a genuine business action (CRM follow-up, task update, approval, report, message).
 */
export async function recordVerifiedWorkAction(userId: string, routePath?: string): Promise<void> {
  if (!userId) return;
  try {
    await ensureEnterpriseSchema();
    const dateKey = getUtcDateKey();

    const existing = await db.dailyWorkTelemetry.findUnique({
      where: { userId_dateKey: { userId, dateKey } },
    });

    const nextActions = (existing?.verifiedActions || 0) + 1;
    const activeSeconds = existing?.activeSeconds || 45;
    const idleSeconds = existing?.idleSeconds || 0;

    const { score, flagReason } = computeWorkAuthenticity({
      activeSeconds,
      idleSeconds,
      verifiedActions: nextActions,
    });

    if (existing) {
      await db.dailyWorkTelemetry.update({
        where: { id: existing.id },
        data: {
          verifiedActions: nextActions,
          lastRoute: routePath || existing.lastRoute,
          lastHeartbeatAt: new Date(),
          status: "ONLINE_ACTIVE",
          authenticityScore: score,
          flagReason,
        },
      });
    } else {
      await db.dailyWorkTelemetry.create({
        data: {
          userId,
          dateKey,
          activeSeconds: 45,
          idleSeconds: 0,
          verifiedActions: 1,
          heartbeatCount: 1,
          lastRoute: routePath || "/dashboard",
          lastHeartbeatAt: new Date(),
          status: "ONLINE_ACTIVE",
          authenticityScore: score,
          flagReason,
        },
      });
    }
  } catch (err) {
    console.warn("[recordVerifiedWorkAction warning]:", err);
  }
}
