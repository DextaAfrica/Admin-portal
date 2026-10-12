import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { user, sessionToken } = await getCurrentSession();
    if (!user || !sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { lastActiveAt: "desc" },
    });

    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      isCurrent: s.sessionToken === sessionToken,
    }));

    return NextResponse.json({ sessions: formattedSessions });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load sessions" },
      { status: 500 }
    );
  }
}

