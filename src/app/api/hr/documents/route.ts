import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { employeeId, title, category, fileUrl, fileSize = 0, mimeType = "application/pdf" } =
      await req.json();

    if (!employeeId || !title || !category || !fileUrl) {
      return NextResponse.json(
        { error: "Employee ID, Title, Category, and File URL are required" },
        { status: 400 }
      );
    }

    const doc = await prisma.employeeDocument.create({
      data: {
        employeeId,
        title,
        category,
        fileUrl,
        fileSize: Number(fileSize),
        mimeType,
        verified: true,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "HR_DOCUMENT_ATTACHED",
      entity: "EmployeeDocument",
      entityId: doc.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { employeeId, title, category },
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to record employee document" },
      { status: 500 }
    );
  }
}

