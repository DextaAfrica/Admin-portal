import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "disconnected";
  let dbLatencyMs = -1;

  try {
    const dbStart = Date.now();
    // Fast lightweight connectivity check
    await prisma.$queryRawUnsafe("SELECT 1");
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = "connected";
  } catch (error) {
    dbStatus = "error";
  }

  const isHealthy = dbStatus === "connected";
  const uptimeSeconds = Math.floor(process.uptime());

  const responsePayload = {
    status: isHealthy ? "healthy" : "degraded",
    service: "dexta-admin-portal",
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    responseTimeMs: Date.now() - startTime,
    checks: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      memory: {
        rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    },
  };

  return NextResponse.json(responsePayload, {
    status: isHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

export async function HEAD() {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}

