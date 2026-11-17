import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const db = prisma as any;

/**
 * Executive Corporate Reports Management API
 * Supports Word-like narrative sections, Excel-like data grids, image galleries, and line manager routing.
 */

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");
    const cadence = searchParams.get("cadence");
    const status = searchParams.get("status");
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const where: any = {};
    if (department && department !== "ALL") where.department = department;
    if (cadence && cadence !== "ALL") where.cadence = cadence;
    if (status && status !== "ALL") where.status = status;

    const reports = await db.reportDocument.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    let filtered = reports;
    if (search) {
      filtered = reports.filter((r: any) => {
        const text = `${r.reference} ${r.title} ${r.authorName} ${r.lineManagerName || ""} ${r.department}`.toLowerCase();
        return text.includes(search);
      });
    }

    return NextResponse.json({
      success: true,
      reports: filtered,
      totalCount: filtered.length,
    });
  } catch (err: unknown) {
    console.error("[Reports API GET Error]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch corporate reports" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      cadence = "DAILY",
      department = user.department || "OPERATIONS",
      lineManagerName,
      lineManagerTitle,
      reportDate = new Date(),
      summary = "",
      sections = [],
      spreadsheetData = [],
      images = [],
      managerNotes = "",
      status = "DRAFT",
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Report title is required." }, { status: 400 });
    }

    // Auto-generate reference code e.g. RPT-OPS-2026-001
    const deptPrefix = (department || "OPS").slice(0, 3).toUpperCase();
    const year = new Date().getFullYear();
    const count = await db.reportDocument.count();
    const refCode = `RPT-${deptPrefix}-${year}-${String(count + 1).padStart(3, "0")}`;

    const newReport = await db.reportDocument.create({
      data: {
        reference: refCode,
        title: title.trim(),
        cadence: cadence.toUpperCase(),
        department: department.toUpperCase(),
        authorName: user.fullName,
        authorTitle: user.jobTitle || "Operations Lead",
        authorEmail: user.email,
        lineManagerName: lineManagerName ? lineManagerName.trim() : null,
        lineManagerTitle: lineManagerTitle ? lineManagerTitle.trim() : null,
        status: status.toUpperCase(),
        reportDate: new Date(reportDate),
        summary: summary.trim(),
        sections: typeof sections === "string" ? sections : JSON.stringify(sections),
        spreadsheetData: typeof spreadsheetData === "string" ? spreadsheetData : JSON.stringify(spreadsheetData),
        images: typeof images === "string" ? images : JSON.stringify(images),
        managerNotes: managerNotes ? managerNotes.trim() : null,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorEmail: user.email,
        action: "CREATE_REPORT_DOCUMENT",
        entity: "ReportDocument",
        entityId: newReport.id,
        metadata: JSON.stringify({
          reference: refCode,
          title: newReport.title,
          cadence: newReport.cadence,
          lineManager: newReport.lineManagerName,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Report ${refCode} successfully initialized.`,
      report: newReport,
    });
  } catch (err: unknown) {
    console.error("[Reports API POST Error]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create report" },
      { status: 500 }
    );
  }
}
