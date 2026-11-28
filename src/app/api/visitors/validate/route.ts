import { NextRequest, NextResponse } from "next/server";
import { VisitorPayload, validateVisitorIdentity } from "@/lib/visitors/constants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Submit valid visitor details." }, { status: 400 });
  }

  const validationError = validateVisitorIdentity(body as Partial<VisitorPayload>);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 422 });
  }

  return NextResponse.json({ valid: true }, { headers: { "Cache-Control": "no-store" } });
}
