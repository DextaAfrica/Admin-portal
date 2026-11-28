import { NextRequest, NextResponse } from "next/server";
import { selfCheckOutVisitor } from "@/lib/visitors/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Enter your Visitor Pass Code." }, { status: 400 });
    }
    const identifier = String(body.identifier || body.passCode || "").trim();
    if (!identifier) {
      return NextResponse.json(
        { error: "Please enter your Visitor Pass Code." },
        { status: 400 }
      );
    }
    if (!/^DXV-[A-HJ-NP-Z2-9]{6}$/i.test(identifier)) {
      return NextResponse.json(
        { error: "Use the DXV pass code shown on your visitor pass." },
        { status: 400 }
      );
    }

    const visitor = await selfCheckOutVisitor(identifier);
    if (!visitor) {
      return NextResponse.json(
        { error: "No active visit was found for that pass code." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      visitor: {
        id: visitor.id,
        passCode: visitor.passCode,
        checkInAt: visitor.checkInAt,
        checkOutAt: visitor.checkOutAt,
        status: visitor.status,
      },
    });
  } catch (err: any) {
    console.error("Visitor self check-out error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process check-out." },
      { status: 500 }
    );
  }
}
