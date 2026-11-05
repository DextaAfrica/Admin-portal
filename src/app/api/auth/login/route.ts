import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auth/audit";
import { sendEmail } from "@/lib/email/dispatcher";
import { LoginSchema } from "@/lib/auth/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = LoginSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues?.[0]?.message || (validationResult.error as any).errors?.[0]?.message || "Email and password are required";
      return NextResponse.json(
        { error: firstError },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || user.status !== "ACTIVE") {
      await logAuditEvent({
        actorEmail: email,
        action: "AUTH_LOGIN_FAILED",
        entity: "User",
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
        metadata: { reason: "Account not found or inactive" },
      });

      return NextResponse.json(
        { error: "Invalid email or password, or account access is paused" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await logAuditEvent({
        actorEmail: email,
        action: "AUTH_LOGIN_FAILED",
        entity: "User",
        entityId: user.id,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
        metadata: { reason: "Incorrect password" },
      });

      return NextResponse.json(
        { error: "Incorrect email or password. Please try again." },
        { status: 401 }
      );
    }

    // Zero-trust authentication flow:
    // If user has 2FA enabled, they use their authenticator app (TOTP) or backup recovery codes.
    // If user does not have 2FA enabled, an email OTP is dispatched securely to their inbox.
    let emailOtpSent = false;
    let sessionOtp = "";

    if (!user.twoFactorEnabled) {
      sessionOtp = String(crypto.randomInt(100000, 999999));
      const emailResult = await sendEmail({
        to: user.email,
        subject: `${sessionOtp} is your Dexta Africa verification code`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 36px 32px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff; color: #09090b;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid #f4f4f5; padding-bottom: 16px;">
              <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #09090b;">De<span style="color: #ED2618;">x</span>ta</span>
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #71717a; margin-left: 8px;">Security Verification</span>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #09090b; margin: 0 0 12px 0;">Sign-In Verification Code</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #52525b; margin: 0 0 20px 0;">
              Hello <strong>${user.fullName}</strong>,<br/>
              A sign-in attempt was initiated for your account. Please enter the following one-time verification token to complete authentication:
            </p>
            <div style="margin: 24px 0; padding: 20px; background: #fafafa; border-radius: 8px; text-align: center; border: 1px solid #e4e4e7;">
              <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ED2618;">${sessionOtp}</div>
              <div style="font-size: 11px; color: #71717a; margin-top: 8px; font-weight: 500;">Valid for 5 minutes</div>
            </div>
            <p style="font-size: 13px; line-height: 1.6; color: #71717a; margin: 0 0 16px 0;">
              If you did not make this request, your credentials may be compromised. Please notify the Dexta Africa Information Security Desk immediately.
            </p>
            <div style="border-top: 1px solid #f4f4f5; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #a1a1aa; text-align: center;">
              &copy; 2026 Dexta Africa Enterprise Gateway &bull; Zero-Trust Systems Command
            </div>
          </div>
        `,
      });
      emailOtpSent = emailResult.success;
    }

    const res = NextResponse.json({
      requiresMfa: true,
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      twoFactorEnabled: user.twoFactorEnabled,
      emailOtpSent,
    });

    if (sessionOtp) {
      res.cookies.set("dexta_mfa_challenge", `${user.id}:${sessionOtp}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 300, // 5 minutes
        path: "/",
      });
    }

    return res;
  } catch (err: unknown) {
    console.error("Login API error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not complete sign in. Please try again.",
      },
      { status: 500 }
    );
  }
}
