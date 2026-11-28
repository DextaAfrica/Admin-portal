import { NextRequest, NextResponse } from "next/server";
import { validateVisitorPayload } from "@/lib/visitors/constants";
import { checkInVisitor } from "@/lib/visitors/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationError = validateVisitorPayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const visitor = await checkInVisitor(body, {
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "",
    });

    return NextResponse.json({ visitor }, { status: 201 });
  } catch (err: any) {
    console.error("Visitor check-in error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to complete visitor check-in." },
      { status: 500 }
    );
  }
}
