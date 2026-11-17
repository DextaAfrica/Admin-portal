import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import {
  CreateHrLeaveRequestSchema,
  ReviewHrLeaveSchema,
  formatZodError,
} from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

const db = prisma as any;

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dept = (user.department || "").toUpperCase();
    const role = (user.role || "").toUpperCase();
    if (role !== "SUPER_ADMIN" && dept !== "HR") {
      return NextResponse.json(
        { error: "Forbidden: Access restricted to People & HR Directorate" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const [leaves, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      db.leaveRequest.findMany({
        where,
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              department: true,
              jobTitle: true,
            },
          },
          reviewedBy: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.leaveRequest.count({ where: { status: "PENDING" } }),
      db.leaveRequest.count({ where: { status: "APPROVED" } }),
      db.leaveRequest.count({ where: { status: "REJECTED" } }),
    ]);

    return NextResponse.json({
      leaves,
      stats: {
        pendingCount,
        approvedCount,
        rejectedCount,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load leaves" },
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
    const parsed = CreateHrLeaveRequestSchema.safeParse(body);
    if (!parsed.success) {
      const err = formatZodError(parsed.error);
      return NextResponse.json(err, { status: 400 });
    }

    const { leaveType, startDate, endDate, daysCount, reason, handoverNotes } = parsed.data;

    const leave = await db.leaveRequest.create({
      data: {
        userId: user.id,
        employeeName: user.fullName,
        department: user.department || "Operations",
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        daysCount,
        reason,
        handoverNotes,
        status: "PENDING",
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "HR_LEAVE_REQUESTED",
      entity: "LeaveRequest",
      entityId: leave.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { leaveType, daysCount, startDate, endDate },
    });

    return NextResponse.json({ leave }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to submit leave request" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ReviewHrLeaveSchema.safeParse(body);
    if (!parsed.success) {
      const err = formatZodError(parsed.error);
      return NextResponse.json(err, { status: 400 });
    }

    const { id, status, reviewerNotes } = parsed.data;

    const leave = await db.leaveRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!leave) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    const updated = await db.leaveRequest.update({
      where: { id },
      data: {
        status,
        reviewerNotes,
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
    });

    // If approved, update employee's used leave days balance
    if (status === "APPROVED") {
      await db.employeeProfile.updateMany({
        where: { userId: leave.userId },
        data: {
          usedLeaveDays: { increment: leave.daysCount },
          status: "ON_LEAVE",
        },
      });
    }

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: `HR_LEAVE_${status}`,
      entity: "LeaveRequest",
      entityId: id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { status, reviewerNotes, employeeName: leave.employeeName },
    });

    return NextResponse.json({ leave: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update leave request" },
      { status: 500 }
    );
  }
}
