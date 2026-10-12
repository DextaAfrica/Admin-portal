import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const endpoints = await prisma.apiEndpoint.findMany({
      orderBy: { createdAt: "desc" },
    });

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

