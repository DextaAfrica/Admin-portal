import { NextRequest, NextResponse } from "next/server";
import { getVisitorByPassCode } from "@/lib/visitors/service";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const visitor = await getVisitorByPassCode(params.code);
    if (!visitor) {
      return NextResponse.json({ error: "Visitor pass not found." }, { status: 404 });
    }
    return NextResponse.json({ visitor });
  } catch (err: any) {
    console.error("Pass lookup error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to look up visitor pass." },
      { status: 500 }
    );
  }
}
