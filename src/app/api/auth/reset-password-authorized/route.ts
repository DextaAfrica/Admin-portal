import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluatePasswordStrength } from "@/lib/auth/validation";
import { logAuditEvent } from "@/lib/auth/audit";
import { sendEmail } from "@/lib/email/dispatcher";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const db = prisma as any;

/**
 * GET /api/auth/reset-password-authorized?token=...&ticket=...
 * Validates the single-use IT authorization reset token.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const ticket = searchParams.get("ticket");

    if (!token || !ticket) {
      return NextResponse.json(
        { valid: false, error: "Missing authorization token or ticket number." },
        { status: 400 }
      );
    }

    const settingKey = `PW_RESET_TOKEN_${token}`;
    const setting = await prisma.systemSetting.findUnique({
      where: { key: settingKey },
    });

    if (!setting) {
      return NextResponse.json(
        {
          valid: false,
          error: "Authorization token is invalid or has already been consumed.",
        },
        { status: 400 }
      );
    }

    let payload: { ticketNumber: string; requesterEmail: string; userId?: string; expiresAt: number };
    try {
      payload = JSON.parse(setting.value);
    } catch {
      return NextResponse.json(
        { valid: false, error: "Malformed authorization token record." },
        { status: 400 }
      );
    }

    // Verify expiration (15-minute single-use policy)
    if (Date.now() > payload.expiresAt) {
      // Purge expired token
      await prisma.systemSetting.delete({ where: { key: settingKey } }).catch(() => {});
      return NextResponse.json(
        {
          valid: false,
          error: "Authorization token expired. In accordance with zero-trust security policy, reset links are valid for 15 minutes only. Please request a new authorization.",
        },
        { status: 400 }
      );
    }

    if (payload.ticketNumber !== ticket) {
      return NextResponse.json(
        { valid: false, error: "Ticket number mismatch." },
        { status: 400 }
      );
    }

    // Retrieve user details
    const user = await prisma.user.findFirst({
      where: payload.userId
        ? { id: payload.userId }
        : { email: payload.requesterEmail.toLowerCase() },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
      },
    });

    return NextResponse.json({
      valid: true,
      ticketNumber: payload.ticketNumber,
      requesterEmail: payload.requesterEmail,
      user: user || {
        fullName: payload.requesterEmail.split("@")[0],
        email: payload.requesterEmail,
      },
      expiresAt: payload.expiresAt,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { valid: false, error: error instanceof Error ? error.message : "Validation error." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/reset-password-authorized
 * Consumes the token, validates entropy, and updates user password.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, ticketNumber, newPassword, confirmPassword } = body;

    if (!token || !ticketNumber || !newPassword) {
      return NextResponse.json(
        { error: "Token, ticket number, and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    const strength = evaluatePasswordStrength(newPassword);
    if (strength.errors.length > 0) {
      return NextResponse.json(
        { error: strength.errors[0] },
        { status: 400 }
      );
    }

    const settingKey = `PW_RESET_TOKEN_${token}`;
    const setting = await prisma.systemSetting.findUnique({
      where: { key: settingKey },
    });

    if (!setting) {
      return NextResponse.json(
        {
          error: "Authorization token is invalid or has already been used.",
        },
        { status: 400 }
      );
    }

    let payload: { ticketNumber: string; requesterEmail: string; userId?: string; expiresAt: number };
    try {
      payload = JSON.parse(setting.value);
    } catch {
      return NextResponse.json(
        { error: "Malformed authorization token." },
        { status: 400 }
      );
    }

    if (Date.now() > payload.expiresAt) {
      await prisma.systemSetting.delete({ where: { key: settingKey } }).catch(() => {});
      return NextResponse.json(
        {
          error: "Authorization token has expired (15-minute window elapsed). Please request fresh authorization.",
        },
        { status: 400 }
      );
    }

    if (payload.ticketNumber !== ticketNumber) {
      return NextResponse.json(
        { error: "Ticket number mismatch." },
        { status: 400 }
      );
    }

    // Locate target user
    const targetUser = await prisma.user.findFirst({
      where: payload.userId
        ? { id: payload.userId }
        : { email: payload.requesterEmail.toLowerCase() },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Associated user record not found in directory." },
        { status: 404 }
      );
    }

    // Securely hash password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user record and clear temporary flags
    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    // Atomically burn the token so it cannot be reused
    await prisma.systemSetting.delete({
      where: { key: settingKey },
    }).catch(() => {});

    // Update CredentialRequest to FULFILLED
    await db.credentialRequest.updateMany({
      where: { ticketNumber },
      data: {
        status: "FULFILLED",
        resolvedAt: new Date(),
        itNotes: "Password successfully updated by user via authorized secure reset link.",
      },
    }).catch(() => {});

    // Immutable Audit Log
    await logAuditEvent({
      actorId: targetUser.id,
      actorEmail: targetUser.email,
      action: "PASSWORD_RESET_COMPLETED",
      entity: "User",
      entityId: targetUser.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: {
        ticketNumber,
        method: "ZERO_TRUST_IT_AUTHORIZED_LINK",
        timestamp: new Date().toISOString(),
      },
    });

    // Send confirmation email
    await sendEmail({
      to: targetUser.email,
      subject: `[Security Notice] Dexta Africa - Password Successfully Configured (${ticketNumber})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0B0E14; color: #FFFFFF; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
            <div style="height: 12px; width: 12px; border-radius: 50%; background: #ED2618;"></div>
            <span style="font-size: 14px; font-weight: bold; letter-spacing: 1px; color: #ED2618;">DEXTA AFRICA SECURITY DIRECTORATE</span>
          </div>
          <h2 style="font-size: 20px; font-weight: bold; color: #FFFFFF; margin: 0 0 12px 0;">Credentials Successfully Updated</h2>
          <p style="font-size: 14px; color: #94A3B8; line-height: 1.6; margin: 0 0 20px 0;">
            Hello ${targetUser.fullName}, your corporate account password has been successfully configured following authorized IT clearance (Ticket #${ticketNumber}).
          </p>
          <div style="padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; margin-bottom: 24px;">
            <div style="font-size: 12px; color: #64748B;">Account Identity: <strong style="color: #FFFFFF;">${targetUser.email}</strong></div>
            <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Ticket Ref: <strong style="color: #FFFFFF;">${ticketNumber}</strong></div>
            <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Time: <strong style="color: #FFFFFF;">${new Date().toUTCString()}</strong></div>
          </div>
          <p style="font-size: 12px; color: #64748B; line-height: 1.5; margin: 0;">
            If you did not authorize this action, please alert the IT Security Directorate immediately.
          </p>
        </div>
      `,
    }).catch((err) => console.warn("[ResetPassword] Confirmation email delivery skipped:", err));

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. You may now sign in.",
    });
  } catch (error: unknown) {
    console.error("Authorized reset password error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset password." },
      { status: 500 }
    );
  }
}

