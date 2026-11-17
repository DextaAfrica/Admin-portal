import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const db = prisma as any;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const report = await db.reportDocument.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report document not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err: unknown) {
    console.error("[Report Detail GET Error]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load report" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const existing = await db.reportDocument.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Report document not found" }, { status: 404 });
    }

    const {
      title,
      cadence,
      department,
      lineManagerName,
      lineManagerTitle,
      reportDate,
      summary,
      sections,
      spreadsheetData,
      images,
      managerNotes,
      status,
    } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (cadence !== undefined) updateData.cadence = cadence.toUpperCase();
    if (department !== undefined) updateData.department = department.toUpperCase();
    if (lineManagerName !== undefined) updateData.lineManagerName = lineManagerName ? lineManagerName.trim() : null;
    if (lineManagerTitle !== undefined) updateData.lineManagerTitle = lineManagerTitle ? lineManagerTitle.trim() : null;
    if (reportDate !== undefined) updateData.reportDate = new Date(reportDate);
    if (summary !== undefined) updateData.summary = summary.trim();
    if (sections !== undefined) {
      updateData.sections = typeof sections === "string" ? sections : JSON.stringify(sections);
    }
    if (spreadsheetData !== undefined) {
      updateData.spreadsheetData = typeof spreadsheetData === "string" ? spreadsheetData : JSON.stringify(spreadsheetData);
    }
    if (images !== undefined) {
      updateData.images = typeof images === "string" ? images : JSON.stringify(images);
    }
    if (managerNotes !== undefined) updateData.managerNotes = managerNotes ? managerNotes.trim() : null;
    if (status !== undefined) updateData.status = status.toUpperCase();

    const updated = await db.reportDocument.update({
      where: { id },
      data: updateData,
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorEmail: user.email,
        action: "UPDATE_REPORT_DOCUMENT",
        entity: "ReportDocument",
        entityId: id,
        metadata: JSON.stringify({
          reference: existing.reference,
          newStatus: updated.status,
          updatedFields: Object.keys(updateData),
        }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Report ${existing.reference} saved successfully.`,
      report: updated,
    });
  } catch (err: unknown) {
    console.error("[Report Detail PUT Error]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update report" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const existing = await db.reportDocument.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Report document not found" }, { status: 404 });
    }

    await db.reportDocument.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorEmail: user.email,
        action: "DELETE_REPORT_DOCUMENT",
        entity: "ReportDocument",
        entityId: id,
        metadata: JSON.stringify({
          reference: existing.reference,
          title: existing.title,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Report ${existing.reference} has been deleted.`,
    });
  } catch (err: unknown) {
    console.error("[Report Detail DELETE Error]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete report" },
      { status: 500 }
    );
  }
}
