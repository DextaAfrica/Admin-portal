import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import {
  verifyTotpToken,
  generateAndStoreRecoveryCodes,
} from "@/lib/auth/mfa";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auth/audit";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token, secret } = await req.json();

    if (!token || !secret) {
      return NextResponse.json(
        { error: "Token and secret are required" },
        { status: 400 }
      );
    }

    const isValid = verifyTotpToken({ token, secret });
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check your authenticator app." },
        { status: 400 }
      );
    }

    // Persist 2FA secret and status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      },
    });

    // Generate 10 single-use recovery codes
    const recoveryCodes = await generateAndStoreRecoveryCodes(user.id);

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "MFA_ENROLLED",
      entity: "User",
      entityId: user.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { method: "TOTP_RFC6238", recoveryCodesIssued: recoveryCodes.length },
    });

    return NextResponse.json({
      success: true,
      recoveryCodes,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "MFA verification failed" },
      { status: 500 }
    );
  }
}

