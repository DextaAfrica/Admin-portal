import { cookies } from "next/headers";
import { prisma } from "../prisma";
import crypto from "crypto";

export const SESSION_COOKIE_NAME = "dexta_session_token";
export const SESSION_DURATION_DAYS = 7;
export const DEFAULT_INACTIVITY_TIMEOUT_MINUTES = 15;
export const INACTIVITY_SETTING_KEY = "SESSION_INACTIVITY_TIMEOUT_MINUTES";

// In-memory cache for inactivity timeout to prevent excessive DB queries
let cachedTimeoutMinutes = DEFAULT_INACTIVITY_TIMEOUT_MINUTES;
let cacheExpiresAt = 0;

export async function getInactivityTimeoutMinutes(): Promise<number> {
  const now = Date.now();
  if (now < cacheExpiresAt) {
    return cachedTimeoutMinutes;
  }
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: INACTIVITY_SETTING_KEY },
    });
    if (setting && setting.value) {
      const val = parseInt(setting.value, 10);
      if (!isNaN(val) && val > 0) {
        cachedTimeoutMinutes = val;
      }
    }
    cacheExpiresAt = now + 30000; // cache for 30s
  } catch {
    // Return cached fallback on read error
  }
  return cachedTimeoutMinutes;
}

export async function setInactivityTimeoutMinutes(minutes: number, adminUserId?: string) {
  cachedTimeoutMinutes = minutes;
  cacheExpiresAt = Date.now() + 60000;

  const setting = await prisma.systemSetting.upsert({
    where: { key: INACTIVITY_SETTING_KEY },
    create: {
      key: INACTIVITY_SETTING_KEY,
      value: minutes.toString(),
      description: "Session inactivity logout threshold in minutes across all enterprise portals",
    },
    update: {
      value: minutes.toString(),
    },
  });

  if (adminUserId) {
    await prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "UPDATE_INACTIVITY_POLICY",
        target: "SystemSetting",
        details: JSON.stringify({
          newTimeoutMinutes: minutes,
          policyKey: INACTIVITY_SETTING_KEY,
        }),
      },
    }).catch(() => {});
  }

  return setting;
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  department?: string;
  status: string;
  twoFactorEnabled: boolean;
}

export async function createSession({
  userId,
  ipAddress,
  userAgent,
}: {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      sessionToken,
      userId,
      ipAddress: ipAddress || "unknown",
      userAgent: userAgent || "unknown",
      expiresAt,
    },
  });

  return session;
}

export async function getCurrentSession(): Promise<{
  user: SessionUser | null;
  sessionToken: string | null;
  sessionId: string | null;
}> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return { user: null, sessionToken: null, sessionId: null };
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            department: true,
            status: true,
            twoFactorEnabled: true,
          },
        },
      },
    });

    if (!session || new Date() > session.expiresAt || session.user.status !== "ACTIVE") {
      return { user: null, sessionToken: null, sessionId: null };
    }

    // Enforce Backend Inactivity Timeout
    const timeoutMinutes = await getInactivityTimeoutMinutes();
    const now = Date.now();
    const lastActiveTime = session.lastActiveAt
      ? new Date(session.lastActiveAt).getTime()
      : new Date(session.createdAt || now).getTime();
    const inactiveMs = now - lastActiveTime;
    const timeoutMs = timeoutMinutes * 60 * 1000;

    if (inactiveMs > timeoutMs) {
      // Session expired due to inactivity -> automatically delete session from database
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      await prisma.auditLog.create({
        data: {
          actorId: session.userId,
          action: "SESSION_EXPIRED_INACTIVITY",
          target: "Session",
          details: JSON.stringify({
            sessionId: session.id,
            inactiveDurationMinutes: Math.round(inactiveMs / 60000),
            thresholdMinutes: timeoutMinutes,
          }),
        },
      }).catch(() => {});

      return { user: null, sessionToken: null, sessionId: null };
    }

    // Touch lastActiveAt if more than 30 seconds have passed to minimize write contention
    if (inactiveMs > 30 * 1000) {
      await prisma.session.update({
        where: { id: session.id },
        data: { lastActiveAt: new Date() },
      }).catch(() => {});
    }

    return {
      user: session.user,
      sessionToken: token,
      sessionId: session.id,
    };
  } catch {
    return { user: null, sessionToken: null, sessionId: null };
  }
}

export async function revokeSession(sessionId: string) {
  return prisma.session.delete({
    where: { id: sessionId },
  });
}

export async function revokeAllOtherSessions(userId: string, currentSessionToken: string) {
  return prisma.session.deleteMany({
    where: {
      userId,
      sessionToken: { not: currentSessionToken },
    },
  });
}

