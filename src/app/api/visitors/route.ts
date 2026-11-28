import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { validateVisitorPayload } from "@/lib/visitors/constants";
import { checkInVisitor, listVisitors } from "@/lib/visitors/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const visitors = await listVisitors({
      status: searchParams.get("status") || undefined,
      department: searchParams.get("department") || undefined,
      purpose: searchParams.get("purpose") || undefined,
      date: searchParams.get("date") || undefined,
      q: searchParams.get("q") || undefined,
    });

    return NextResponse.json({ visitors });
  } catch (err: any) {
    console.error("Visitors list error:", err);
    return NextResponse.json(
      { visitors: [], error: err?.message || "Failed to load visitors." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validationError = validateVisitorPayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const visitor = await checkInVisitor(body, {
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: `assisted-by:${user.email}`,
    });

    return NextResponse.json({ visitor }, { status: 201 });
  } catch (err: any) {
    console.error("Assisted visitor check-in error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to check in visitor." },
      { status: 500 }
    );
  }
}
