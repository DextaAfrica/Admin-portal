import { cookies } from "next/headers";
import { prisma } from "../prisma";
import crypto from "crypto";

export const SESSION_COOKIE_NAME = "dexta_session_token";
export const SESSION_DURATION_DAYS = 7;

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
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
            status: true,
            twoFactorEnabled: true,
          },
        },
      },
    });

    if (!session || new Date() > session.expiresAt || session.user.status !== "ACTIVE") {
      return { user: null, sessionToken: null, sessionId: null };
    }

    // Touch lastActiveAt
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

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

