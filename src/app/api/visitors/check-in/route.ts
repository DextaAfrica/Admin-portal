import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { normalizeVisitorPhone, validateVisitorPayload, VisitorPayload } from "@/lib/visitors/constants";
import { checkInVisitor } from "@/lib/visitors/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const referenceId = randomUUID();
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Please submit valid registration details." }, { status: 400 });
    }
    const payload = body as Partial<VisitorPayload>;
    const validationError = validateVisitorPayload(payload);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const validatedPayload = payload as VisitorPayload;
    const visitor = await checkInVisitor({
      ...validatedPayload,
      email: validatedPayload.email.trim().toLowerCase(),
      phone: normalizeVisitorPhone(validatedPayload.phone),
    }, {
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "",
    });

    return NextResponse.json(
      { visitor },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    console.error(`[Visitor check-in ${referenceId}]`, err);
    return NextResponse.json(
      { error: "We could not save this registration. Please ask Front Desk Reception to assist.", referenceId },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
