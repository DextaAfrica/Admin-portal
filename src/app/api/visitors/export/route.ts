import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { sanitizeCsvCell } from "@/lib/visitors/constants";
import { listVisitors } from "@/lib/visitors/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const visitors = await listVisitors({
      status: searchParams.get("status") || undefined,
      department: searchParams.get("department") || undefined,
      purpose: searchParams.get("purpose") || undefined,
      date: searchParams.get("date") || undefined,
      q: searchParams.get("q") || undefined,
    });

    const headers = [
      "Pass Code",
      "Full Name",
      "Phone",
      "Email",
      "Company / Organisation",
      "Position / Designation",
      "Purpose of Visit",
      "Purpose Detail",
      "Host (Seeing)",
      "Department",
      "Scheduled Appointment",
      "Invited By",
      "Description",
      "Date of Visit",
      "Time of Arrival",
      "Time of Departure",
      "Visit Status",
      "Guidelines Agreed",
      "Data Consent",
    ];

    const rows = visitors.map((v) => [
      v.passCode,
      v.fullName,
      v.phone,
      v.email,
      v.company,
      v.position,
      v.purpose,
      v.purposeOther,
      v.hostName,
      v.department,
      v.hasAppointment ? "Yes" : "No",
      v.invitedBy,
      v.visitDescription,
      v.visitDate,
      v.checkInAt,
      v.checkOutAt || "",
      v.status === "checked_out" ? "Checked Out" : "Checked In",
      v.agreedGuidelines ? "Yes" : "No",
      v.consentedData ? "I agree" : "No",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(sanitizeCsvCell).join(","))
      .join("\n");

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "VISITOR_EXPORT_CSV",
      entity: "VisitorLog",
      metadata: { exportedCount: visitors.length },
    });

    const filename = `dexta-visitors-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("Visitor CSV export error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to export CSV." },
      { status: 500 }
    );
  }
}
