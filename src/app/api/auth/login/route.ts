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
      await sendEmail({
        to: user.email,
        subject: "Your Dexta Africa Login Verification Code",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #0f172a; margin-top: 0;">Sign-In Verification</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">Hello <strong>${user.fullName}</strong>,</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">Use the verification code below to complete your sign-in to the Dexta Africa Enterprise Workspace:</p>
            <div style="margin: 24px 0; padding: 16px; background: #f8fafc; border-radius: 8px; text-align: center; border: 1px dashed #cbd5e1;">
              <span style="font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #ED2618;">${sessionOtp}</span>
            </div>
            <p style="color: #64748b; font-size: 12px;">This code will expire in 5 minutes. If you did not attempt to sign in, please contact security immediately.</p>
          </div>
        `,
      });
      emailOtpSent = true;
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
