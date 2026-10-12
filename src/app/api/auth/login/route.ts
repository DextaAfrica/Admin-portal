import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE_NAME, SESSION_DURATION_DAYS } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import crypto from "crypto";

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
        { error: "Invalid credentials or account suspended" },
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
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // If 2FA is enabled, require MFA challenge step
    if (user.twoFactorEnabled) {
      // Create temporary challenge token valid for 5 minutes
      const challengeToken = crypto.randomBytes(24).toString("hex");
      // Store challenge in cookie or response
      const res = NextResponse.json({
        requiresMfa: true,
        userId: user.id,
        challengeToken,
      });

      res.cookies.set("dexta_mfa_challenge", `${user.id}:${challengeToken}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 300, // 5 minutes
      });

      return res;
    }

    // 2FA not enabled: create session directly
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
      action: "AUTH_LOGIN_SUCCESS",
      entity: "User",
      entityId: user.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { role: user.role, mfaUsed: false },
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });

    res.cookies.set(SESSION_COOKIE_NAME, session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
      path: "/",
    });

    return res;
  } catch (err: unknown) {
    console.error("Login API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal authentication error" },
      { status: 500 }
    );
  }
}

