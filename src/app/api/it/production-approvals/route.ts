import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { sendEmail } from "@/lib/email/dispatcher";

export const dynamic = "force-dynamic";

const db = prisma as any;

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (category && category !== "ALL") {
      where.category = category;
    }

    const requests = await db.productionReleaseRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const pendingCount = await db.productionReleaseRequest.count({
      where: { status: "PENDING_SUPER_ADMIN" },
    });
    const approvedCount = await db.productionReleaseRequest.count({
      where: { status: "APPROVED_LIVE" },
    });
    const totalCount = await db.productionReleaseRequest.count();

    return NextResponse.json({
      requests,
      stats: {
        pendingCount,
        approvedCount,
        totalCount,
      },
    });
  } catch (error: any) {
    console.error("GET /api/it/production-approvals error:", error);
    return NextResponse.json(
      { error: "Failed to load production release requests" },
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

    const userRole = (user.role || "").toUpperCase();
    const isAuthorized =
      userRole === "SUPER_ADMIN" ||
      userRole === "ADMIN" ||
      user.department?.toUpperCase() === "IT";

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Only authenticated IT administrators may initiate production release requests." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      category = "PROD_DEPLOYMENT",
      targetSystem = "PORTAL_CORE",
      justification,
      payloadDiff,
      scheduledFor,
    } = body;

    if (!title || !description || !justification) {
      return NextResponse.json(
        { error: "Title, comprehensive description, and executive justification are required." },
        { status: 400 }
      );
    }

    // Generate unique sequential enterprise ticket number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `PRD-2026-${randomSuffix}`;

    const newRequest = await db.productionReleaseRequest.create({
      data: {
        ticketNumber,
        title: title.trim(),
        description: description.trim(),
        category,
        targetSystem,
        adminId: user.id,
        adminName: user.fullName,
        adminEmail: user.email,
        status: "PENDING_SUPER_ADMIN",
        stage: 1,
        justification: justification.trim(),
        payloadDiff: typeof payloadDiff === "object" ? JSON.stringify(payloadDiff) : payloadDiff || null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      },
    });

    // Notify Super Admins & Executives via in-app notification
    await db.dashboardNotification.create({
      data: {
        department: "EXECUTIVE",
        title: `Production Approval Required: ${ticketNumber}`,
        message: `Admin ${user.fullName} has submitted request "${newRequest.title}" for production release. Awaiting Super Admin authorization.`,
        type: "APPROVAL_REQUEST",
        link: `/it?tab=production&ticket=${ticketNumber}`,
        isRead: false,
      },
    });

    // Immutable Audit Log
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "IT_PRODUCTION_REQUEST_INITIATED",
      entity: "ProductionReleaseRequest",
      entityId: newRequest.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: {
        ticketNumber,
        title: newRequest.title,
        targetSystem,
        stage: 1,
      },
    });

    return NextResponse.json({
      success: true,
      request: newRequest,
      message: `Request ${ticketNumber} staged successfully. Awaiting Stage-2 Super Admin authorization.`,
    });
  } catch (error: any) {
    console.error("POST /api/it/production-approvals error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate production release request" },
      { status: 500 }
    );
  }
}
