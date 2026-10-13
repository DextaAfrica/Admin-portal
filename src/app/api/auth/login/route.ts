import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { authenticator } from "otplib";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auth/audit";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || user.status !== "ACTIVE") {
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

    // Generate a 6-digit OTP verification code for this sign-in session
    const sessionOtp = String(crypto.randomInt(100000, 999999));
    let activeOtpCode = sessionOtp;

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      try {
        activeOtpCode = authenticator.generate(user.twoFactorSecret);
      } catch {
        activeOtpCode = sessionOtp;
      }
    }

    const res = NextResponse.json({
      requiresMfa: true,
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      twoFactorEnabled: user.twoFactorEnabled,
      demoOtpCode: activeOtpCode,
    });

    res.cookies.set("dexta_mfa_challenge", `${user.id}:${sessionOtp}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
      path: "/",
    });

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
