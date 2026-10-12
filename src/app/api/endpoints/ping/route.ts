import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { pingEndpoint } from "@/lib/api-gateway/client";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { endpointId } = await req.json();
    if (!endpointId) {
      return NextResponse.json({ error: "endpointId is required" }, { status: 400 });
    }

    const result = await pingEndpoint(endpointId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to ping endpoint" },
      { status: 500 }
    );
  }
}

