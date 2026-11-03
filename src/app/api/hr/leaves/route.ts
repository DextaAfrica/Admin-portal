import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const [leaves, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.leaveRequest.findMany({
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
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.leaveRequest.count({ where: { status: "APPROVED" } }),
      prisma.leaveRequest.count({ where: { status: "REJECTED" } }),
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

    const { leaveType, startDate, endDate, daysCount, reason, handoverNotes } = await req.json();

    if (!leaveType || !startDate || !endDate || !daysCount || !reason) {
      return NextResponse.json(
        { error: "Leave type, start date, end date, days count, and reason are required" },
        { status: 400 }
      );
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        userId: user.id,
        employeeName: user.fullName,
        department: user.department || "Operations",
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        daysCount: Number(daysCount),
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

    const { id, status, reviewerNotes } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Leave ID and Status are required" }, { status: 400 });
    }

    const leave = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!leave) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    const updated = await prisma.leaveRequest.update({
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
      await prisma.employeeProfile.updateMany({
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
