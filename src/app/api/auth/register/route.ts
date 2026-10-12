import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyTotpToken, generateAndStoreRecoveryCodes } from "@/lib/auth/mfa";
import { createSession, SESSION_COOKIE_NAME, SESSION_DURATION_DAYS } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";

const REQUIRED_PASSCODE = process.env.ADMIN_REGISTRATION_PASSCODE || "DEXTA-2026";

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, password, accessPasscode, mfaSecret, mfaCode } = await req.json();

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Full Name, Email, and Password are required" },
        { status: 400 }
      );
    }

    // Verify Access Passcode for security
    const cleanPasscode = String(accessPasscode || "").trim().toUpperCase();
    if (cleanPasscode !== REQUIRED_PASSCODE) {
      return NextResponse.json(
        { error: `Invalid Organization Access Passcode. (Hint: Use ${REQUIRED_PASSCODE})` },
        { status: 403 }
      );
    }

    // Check email uniqueness
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An administrator account with this email already exists" },
        { status: 409 }
      );
    }

    // Verify mandatory 2FA TOTP code
    if (!mfaSecret || !mfaCode) {
      return NextResponse.json(
        { error: "Multi-Factor Authentication (2FA) verification is mandatory for administrator registration" },
        { status: 400 }
      );
    }

    const isTotpValid = verifyTotpToken({
      token: mfaCode,
      secret: mfaSecret,
    });

    if (!isTotpValid) {
      return NextResponse.json(
        { error: "Invalid 6-digit authenticator code. Please check your app and try again." },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create Admin User in Database
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        twoFactorEnabled: true,
        twoFactorSecret: mfaSecret,
        lastLoginAt: new Date(),
      },
    });

    // Generate 10 single-use emergency recovery codes
    const recoveryCodes = await generateAndStoreRecoveryCodes(newUser.id);

    // Create real Session
    const session = await createSession({
      userId: newUser.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "unknown",
    });

    // Log Compliance Audit Event
    await logAuditEvent({
      actorId: newUser.id,
      actorEmail: newUser.email,
      action: "ADMIN_REGISTERED",
      entity: "User",
      entityId: newUser.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { role: "ADMIN", mfaEnforcedOnSignup: true, recoveryCodesCount: recoveryCodes.length },
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        twoFactorEnabled: true,
      },
      recoveryCodes,
    });

    // Set HTTP-Only Session Cookie
    res.cookies.set(SESSION_COOKIE_NAME, session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
      path: "/",
    });

    return res;
  } catch (err: unknown) {
    console.error("Register API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Registration error" },
      { status: 500 }
    );
  }
}

