import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { backendApi } from "@/lib/backend-api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role === "AUDITOR") {
      return NextResponse.json(
        { error: "Reviewer (AUDITOR) role has read-only permissions." },
        { status: 403 }
      );
    }

    const res = await backendApi.visitors.triggerReport(user.email);

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "VISITOR_REPORT_TRIGGERED_MANUAL",
      entity: "VisitorReportDelivery",
      entityId: res?.data?.id || "manual-run",
      metadata: {
        triggeredBy: user.email,
        status: res?.data?.status || "SENT",
      },
    });

    return NextResponse.json({ delivery: res?.data ?? res });
  } catch (err: any) {
    console.error("Trigger visitor report error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to trigger visitor report." },
      { status: 500 }
    );
  }
}
