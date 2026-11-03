import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const requestType = searchParams.get("requestType");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (requestType && requestType !== "ALL") {
      where.requestType = requestType;
    }

    const [requests, pendingCount, approvedCount, totalCount] = await Promise.all([
      prisma.credentialRequest.findMany({
        where,
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              department: true,
              role: true,
              status: true,
              twoFactorEnabled: true,
              lastLoginAt: true,
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
      prisma.credentialRequest.count({ where: { status: "PENDING" } }),
      prisma.credentialRequest.count({ where: { status: "APPROVED" } }),
      prisma.credentialRequest.count(),
    ]);

    return NextResponse.json({
      requests,
      stats: {
        pendingCount,
        approvedCount,
        totalCount,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load credential requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();

    const body = await req.json();
    const {
      requesterEmail,
      requesterName,
      department = "GENERAL",
      requestType = "PASSWORD_RESET",
      priority = "MEDIUM",
      reason,
    } = body;

    if (!requesterEmail || !reason) {
      return NextResponse.json(
        { error: "Requester email and reason for credential change are required" },
        { status: 400 }
      );
    }

    // Lookup user if exists in DB
    const targetUser = await prisma.user.findUnique({
      where: { email: requesterEmail.toLowerCase().trim() },
    });

    const ticketNumber = `SEC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const credRequest = await prisma.credentialRequest.create({
      data: {
        ticketNumber,
        userId: targetUser ? targetUser.id : user?.id,
        requesterEmail: requesterEmail.toLowerCase().trim(),
        requesterName: requesterName || targetUser?.fullName || "Staff Member",
        department: department || targetUser?.department || "OPERATIONS",
        requestType,
        priority,
        reason,
        status: "PENDING",
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent") || "unknown",
      },
    });

    await logAuditEvent({
      actorId: user?.id || targetUser?.id,
      actorEmail: user?.email || requesterEmail,
      action: "IT_CREDENTIAL_CHANGE_REQUESTED",
      entity: "CredentialRequest",
      entityId: credRequest.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { ticketNumber, requestType, priority, requesterEmail },
    });

    return NextResponse.json({ request: credRequest }, { status: 201 });
  } catch (err: unknown) {
    console.error("Submit credential request error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to submit credential request" },
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

    const { id, status, itNotes, newPassword } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "Request ID and Status are required" },
        { status: 400 }
      );
    }

    const ticket = await prisma.credentialRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Request ticket not found" }, { status: 404 });
    }

    let temporaryCode = ticket.temporaryCode;

    // When IT approves a password change or credential request:
    if (status === "APPROVED" || status === "FULFILLED") {
      // Generate secure temporary activation passcode
      temporaryCode = `DXT-${crypto.randomBytes(3).toString("hex").toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      // If IT provides a specific new password or temporary password, update user
      if (newPassword && ticket.userId) {
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
          where: { id: ticket.userId },
          data: { passwordHash },
        });
      }
    }

    const updated = await prisma.credentialRequest.update({
      where: { id },
      data: {
        status,
        itNotes,
        temporaryCode,
        reviewedById: user.id,
        resolvedAt: new Date(),
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: `IT_CREDENTIAL_${status}`,
      entity: "CredentialRequest",
      entityId: id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: {
        ticketNumber: ticket.ticketNumber,
        status,
        requesterEmail: ticket.requesterEmail,
        authorizedBy: user.fullName,
      },
    });

    return NextResponse.json({ request: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to review credential request" },
      { status: 500 }
    );
  }
}

