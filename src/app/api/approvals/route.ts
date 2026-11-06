import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { triggerApprovalCreatedWorkflow, ensureInitialEnterpriseData } from "@/lib/automation/engine";

export const dynamic = "force-dynamic";

const db = prisma as any;

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureInitialEnterpriseData();

    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (department && department !== "ALL") {
      where.OR = [
        { fromDepartment: department },
        { toDepartment: department },
      ];
    }

    const approvals = await db.interDeptApproval.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const pendingCount = await db.interDeptApproval.count({ where: { status: "PENDING" } });
    const approvedCount = await db.interDeptApproval.count({ where: { status: "APPROVED" } });

    return NextResponse.json({
      approvals,
      stats: {
        total: approvals.length,
        pending: pendingCount,
        approved: approvedCount,
      },
    });
  } catch (error) {
    console.error("GET /api/approvals error:", error);
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 });
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
      description,
      category,
      toDepartment,
      priority = "NORMAL",
      amount,
      currency = "USD",
    } = body;

    if (!title || !description || !category || !toDepartment) {
      return NextResponse.json(
        { error: "Title, description, category, and target department are required" },
        { status: 400 }
      );
    }

    const fromDepartment = user.department || "GENERAL";
    const ticketNumber = `APR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newApproval = await db.interDeptApproval.create({
      data: {
        ticketNumber,
        title,
        description,
        category,
        fromDepartment,
        toDepartment,
        requesterId: user.id,
        requesterName: user.fullName,
        requesterEmail: user.email,
        priority,
        status: "PENDING",
        amount: amount ? Number(amount) : null,
        currency,
      },
    });

    // Execute automated inter-department workflow (email + in-app notification + audit log)
    await triggerApprovalCreatedWorkflow(newApproval);

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "APPROVAL_REQUEST_CREATED",
      entity: "InterDeptApproval",
      entityId: newApproval.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { ticketNumber, fromDepartment, toDepartment, priority, amount },
    });

    return NextResponse.json({ success: true, approval: newApproval }, { status: 201 });
  } catch (error) {
    console.error("POST /api/approvals error:", error);
    return NextResponse.json({ error: "Failed to create approval request" }, { status: 500 });
  }
}

