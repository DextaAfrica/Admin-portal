import { NextRequest, NextResponse } from "next/server";
import { selfCheckOutVisitor } from "@/lib/visitors/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = String(body.identifier || body.passCode || "").trim();
    if (!identifier) {
      return NextResponse.json(
        { error: "Please enter your Visitor Pass Code, Email, or Phone Number." },
        { status: 400 }
      );
    }

    const visitor = await selfCheckOutVisitor(identifier);
    if (!visitor) {
      return NextResponse.json(
        { error: "No active Checked-In visit found matching that Pass Code, Email, or Phone Number." },
        { status: 404 }
      );
    }

    return NextResponse.json({ visitor });
  } catch (err: any) {
    console.error("Visitor self check-out error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process check-out." },
      { status: 500 }
    );
  }
}
