import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyTotpToken,
  verifyAndBurnRecoveryCode,
} from "@/lib/auth/mfa";
import {
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_DAYS,
} from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";

export async function POST(req: NextRequest) {
  try {
    const { userId, code, isRecoveryCode } = await req.json();

    if (!userId || !code) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Account not found or access is paused" },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim();
    let isValid = false;

    if (isRecoveryCode) {
      isValid = await verifyAndBurnRecoveryCode({
        userId: user.id,
        code: cleanCode,
      });
    } else {
      // 1. Check session challenge OTP cookie
      const challengeCookie = req.cookies.get("dexta_mfa_challenge")?.value;
      if (challengeCookie) {
        const [cookieUserId, cookieOtp] = challengeCookie.split(":");
        if (cookieUserId === user.id && cookieOtp === cleanCode) {
          isValid = true;
        }
      }

      // 2. Also check Authenticator TOTP secret if configured on the account
      if (!isValid && user.twoFactorSecret) {
        isValid = verifyTotpToken({
          token: cleanCode,
          secret: user.twoFactorSecret,
        });
      }
    }

    if (!isValid) {
      await logAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: "MFA_CHALLENGE_FAILED",
        entity: "User",
        entityId: user.id,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
        metadata: { isRecoveryCode },
      });

      return NextResponse.json(
        {
          error: isRecoveryCode
            ? "Invalid or previously used backup access code."
            : "Incorrect 6-digit verification code. Please check the code and try again.",
        },
        { status: 400 }
      );
    }

    // Success: create authenticated workspace session
    const session = await createSession({
      userId: user.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "unknown",
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "MFA_CHALLENGE_SUCCESS",
      entity: "User",
      entityId: user.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { method: isRecoveryCode ? "RECOVERY_CODE" : "OTP" },
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });

    res.cookies.set(SESSION_COOKIE_NAME, session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
      path: "/",
    });

    res.cookies.delete("dexta_mfa_challenge");

    return res;
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification error" },
      { status: 500 }
    );
  }
}
