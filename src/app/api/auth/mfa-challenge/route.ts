import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
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
        { error: "User ID and code are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== "ACTIVE" || !user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "Invalid authentication state" },
        { status: 400 }
      );
    }

    let isValid = false;

    if (isRecoveryCode) {
      isValid = await verifyAndBurnRecoveryCode({
        userId: user.id,
        code,
      });
    } else {
      if (!user.twoFactorSecret) {
        return NextResponse.json(
          { error: "2FA secret not found on account" },
          { status: 400 }
        );
      }
      isValid = verifyTotpToken({
        token: code,
        secret: user.twoFactorSecret,
      });
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
            ? "Invalid or previously used recovery code."
            : "Invalid 6-digit code. Please verify the code on your device.",
        },
        { status: 400 }
      );
    }

    // Success: create session
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
      metadata: { method: isRecoveryCode ? "RECOVERY_CODE" : "TOTP" },
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

    // Clear challenge cookie
    res.cookies.delete("dexta_mfa_challenge");

    return res;
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "MFA challenge error" },
      { status: 500 }
    );
  }
}

