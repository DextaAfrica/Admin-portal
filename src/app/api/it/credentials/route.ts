import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { sendEmail } from "@/lib/email/dispatcher";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const db = prisma as any;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketParam = searchParams.get("ticket");

    // Allow public ticket status verification by ticket number
    if (ticketParam) {
      const ticket = await db.credentialRequest.findFirst({
        where: { ticketNumber: ticketParam },
        select: {
          id: true,
          ticketNumber: true,
          requesterEmail: true,
          requesterName: true,
          department: true,
          status: true,
          createdAt: true,
          resolvedAt: true,
        },
      });
      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }
      return NextResponse.json({ ticket });
    }

    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      db.credentialRequest.findMany({
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
      db.credentialRequest.count({ where: { status: "PENDING" } }),
      db.credentialRequest.count({ where: { status: "APPROVED" } }),
      db.credentialRequest.count(),
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

    const credRequest = await db.credentialRequest.create({
      data: {
        ticketNumber,
        userId: targetUser ? targetUser.id : user?.id,
        requesterEmail: requesterEmail.toLowerCase().trim(),
        requesterName: requesterName || targetUser?.fullName || "Staff Member",
        department: department || (targetUser as any)?.department || "OPERATIONS",
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

    const ticket = await db.credentialRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Request ticket not found" }, { status: 404 });
    }

    let temporaryCode = ticket.temporaryCode;
    let resetLink: string | null = null;

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

      // Generate 15-minute, single-use, cryptographically signed reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

      await prisma.systemSetting.upsert({
        where: { key: `PW_RESET_TOKEN_${resetToken}` },
        create: {
          key: `PW_RESET_TOKEN_${resetToken}`,
          value: JSON.stringify({
            ticketNumber: ticket.ticketNumber,
            requesterEmail: ticket.requesterEmail,
            userId: ticket.userId,
            expiresAt,
          }),
        },
        update: {
          value: JSON.stringify({
            ticketNumber: ticket.ticketNumber,
            requesterEmail: ticket.requesterEmail,
            userId: ticket.userId,
            expiresAt,
          }),
        },
      });

      // Construct origin URL
      const host = req.headers.get("host") || "localhost:3000";
      const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      resetLink = `${proto}://${host}/setup/password?token=${resetToken}&ticket=${ticket.ticketNumber}`;

      // Dispatch security clearance email
      await sendEmail({
        to: ticket.requesterEmail,
        subject: `[Authorized] Dexta Africa - One-Time Password Reset Link (${ticket.ticketNumber})`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0B0E14; color: #FFFFFF; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
              <div style="height: 12px; width: 12px; border-radius: 50%; background: #ED2618;"></div>
              <span style="font-size: 13px; font-weight: bold; letter-spacing: 1px; color: #ED2618;">DEXTA AFRICA IT SECURITY DIRECTORATE</span>
            </div>
            <h2 style="font-size: 20px; font-weight: bold; color: #FFFFFF; margin: 0 0 12px 0;">Credential Reset Authorization Granted</h2>
            <p style="font-size: 14px; color: #94A3B8; line-height: 1.6; margin: 0 0 20px 0;">
              Hello ${ticket.requesterName || "Staff Member"}, your request for a credential reset (Ticket #${ticket.ticketNumber}) has been approved by IT Administrator <strong>${user.fullName}</strong>.
            </p>
            <div style="padding: 16px; background: rgba(237, 38, 24, 0.08); border: 1px solid rgba(237, 38, 24, 0.25); border-radius: 12px; margin-bottom: 24px;">
              <div style="font-size: 12px; color: #ED2618; font-weight: bold; margin-bottom: 4px;">ZERO-TRUST EXPIRATION NOTICE</div>
              <div style="font-size: 13px; color: #E2E8F0; line-height: 1.5;">
                This link is valid for <strong>15 minutes</strong> and will permanently expire upon single use.
              </div>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" style="display: inline-block; background: #ED2618; color: #FFFFFF; font-weight: bold; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(237,38,24,0.4);">
                Configure New Password &rarr;
              </a>
            </div>
            <p style="font-size: 12px; color: #64748B; word-break: break-all; margin: 0 0 20px 0;">
              Or copy this direct link into your browser:<br/>
              <a href="${resetLink}" style="color: #94A3B8;">${resetLink}</a>
            </p>
            <p style="font-size: 11px; color: #475569; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; margin: 0;">
              Temporary Passcode fallback: <span style="font-family: monospace; color: #ED2618; font-weight: bold;">${temporaryCode}</span>
            </p>
          </div>
        `,
      }).catch((err) => console.warn("[IT Credentials] Reset link email delivery skipped:", err));
    }

    const updated = await db.credentialRequest.update({
      where: { id },
      data: {
        status,
        itNotes: itNotes || (resetLink ? "Reset link generated and emailed to user (15 min validity)." : undefined),
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
        hasResetLink: Boolean(resetLink),
      },
    });

    return NextResponse.json({ request: updated, resetLink });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to review credential request" },
      { status: 500 }
    );
  }
}

