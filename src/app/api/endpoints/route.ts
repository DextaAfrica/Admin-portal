import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let endpoints = await prisma.apiEndpoint.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (endpoints.length === 0) {
      await prisma.apiEndpoint.createMany({
        data: [
          {
            name: "Dexta Core Go Enterprise API",
            baseUrl: process.env.BACKEND_API_URL || "http://localhost:8080",
            authType: "BEARER",
            status: "ACTIVE",
            healthStatus: "HEALTHY",
            lastLatencyMs: 8,
          },
          {
            name: "Dexta Africa Company Website",
            baseUrl: "http://localhost:3001",
            authType: "NONE",
            status: "ACTIVE",
            healthStatus: "HEALTHY",
            lastLatencyMs: 15,
          },
          {
            name: "Corporate Notification & Email Gateway",
            baseUrl: "http://localhost:8025",
            authType: "NONE",
            status: "ACTIVE",
            healthStatus: "HEALTHY",
            lastLatencyMs: 4,
          },
        ],
      });

      endpoints = await prisma.apiEndpoint.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ endpoints });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load endpoints" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, baseUrl, authType } = await req.json();

    if (!name || !baseUrl) {
      return NextResponse.json(
        { error: "Name and Base URL are required" },
        { status: 400 }
      );
    }

    const endpoint = await prisma.apiEndpoint.create({
      data: {
        name,
        baseUrl,
        authType: authType || "BEARER",
        status: "ACTIVE",
        healthStatus: "UNKNOWN",
      },
    });

    return NextResponse.json({ success: true, endpoint });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create endpoint" },
      { status: 500 }
    );
  }
}
