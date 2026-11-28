import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { backendApi } from "@/lib/backend-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const res = await backendApi.visitors.getReportSchedule();
    return NextResponse.json({ schedule: res?.data ?? res });
  } catch (err: any) {
    console.error("Fetch report schedule error:", err);
    // Return sensible fallback defaults if backend is initializing
    return NextResponse.json({
      schedule: {
        id: "default",
        title: "Visitor Check-in Digest",
        cadence: "WEEKLY",
        recipientEmails: ["operations@dextaafrica.com"],
        department: "ALL",
        includeAllDepts: true,
        isActive: true,
        nextRunAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role === "AUDITOR") {
      return NextResponse.json(
        { error: "Reviewer (AUDITOR) role has read-only permissions." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const res = await backendApi.visitors.updateReportSchedule(body, user.email);

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "VISITOR_REPORT_SCHEDULE_UPDATED",
      entity: "VisitorReportSchedule",
      entityId: "default",
      metadata: {
        cadence: body.cadence,
        recipients: body.recipientEmails,
        isActive: body.isActive,
      },
    });

    return NextResponse.json({ schedule: res?.data ?? res });
  } catch (err: any) {
    console.error("Update report schedule error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update visitor report schedule." },
      { status: 500 }
    );
  }
}
