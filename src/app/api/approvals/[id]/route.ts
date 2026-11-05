import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { triggerApprovalDecidedWorkflow } from "@/lib/automation/engine";

export const dynamic = "force-dynamic";

const db = prisma as any;

export async function PATCH(
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
    const { status, decisionNotes } = body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    const existing = await db.interDeptApproval.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Approval request not found" }, { status: 404 });
    }

    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { error: `This request is already ${existing.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    const updated = await db.interDeptApproval.update({
      where: { id },
      data: {
        status,
        approvedById: user.id,
        approvedByName: user.fullName,
        decisionNotes: decisionNotes || null,
        decidedAt: new Date(),
      },
    });

    // Fire automated decision workflow (emails, notification, treasury ledger posting)
    await triggerApprovalDecidedWorkflow({
      id: updated.id,
      ticketNumber: updated.ticketNumber,
      title: updated.title,
      category: updated.category,
      fromDepartment: updated.fromDepartment,
      toDepartment: updated.toDepartment,
      requesterName: updated.requesterName,
      requesterEmail: updated.requesterEmail,
      status,
      decisionNotes,
      decidedByName: user.fullName,
      amount: updated.amount,
      currency: updated.currency,
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: `APPROVAL_REQUEST_${status}`,
      entity: "InterDeptApproval",
      entityId: updated.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { ticketNumber: updated.ticketNumber, status, decisionNotes },
    });

    return NextResponse.json({ success: true, approval: updated });
  } catch (error) {
    console.error("PATCH /api/approvals/[id] error:", error);
    return NextResponse.json({ error: "Failed to update approval status" }, { status: 500 });
  }
}

