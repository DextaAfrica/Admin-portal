import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { adminCheckOutVisitor } from "@/lib/visitors/service";

export const dynamic = "force-dynamic";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const visitor = await adminCheckOutVisitor(params.id, user.email);
    if (!visitor) {
      return NextResponse.json({ error: "Visitor record not found" }, { status: 404 });
    }

    return NextResponse.json({ visitor });
  } catch (err: any) {
    console.error("Admin visitor check-out error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to check out visitor." },
      { status: 500 }
    );
  }
}
