import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getVisitorAnalytics } from "@/lib/visitors/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const analytics = await getVisitorAnalytics();
    return NextResponse.json({ analytics });
  } catch (err: any) {
    console.error("Visitor analytics error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to compute visitor analytics." },
      { status: 500 }
    );
  }
}
