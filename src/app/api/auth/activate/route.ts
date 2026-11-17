import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE_NAME, SESSION_DURATION_DAYS, getCookieDomain } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { logPolicyAlert } from "@/lib/auth/policy-alerts";
import { evaluatePasswordStrength } from "@/lib/auth/validation";
import { verifyTotpToken, generateAndStoreRecoveryCodes } from "@/lib/auth/mfa";
import { backendApi } from "@/lib/backend-api";

const db = prisma as any;

export async function POST(req: NextRequest) {
  try {
    const {
      email,
      activationKey,
      preferredPassword,
      phone,
      bio,
      avatarUrl,
      mfaSecret,
      mfaCode,
    } = await req.json();

    if (!email || !activationKey || !preferredPassword) {
      return NextResponse.json(
        { error: "Work email, IT activation key, and preferred password are required." },
        { status: 400 }
      );
    }

    const passwordAnalysis = evaluatePasswordStrength(preferredPassword);
    if (passwordAnalysis.errors.length > 0) {
      return NextResponse.json(
        { error: passwordAnalysis.errors[0] },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanKey = activationKey.trim();

    // Find the user provisioned by IT
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      await logPolicyAlert({
        severity: "WARNING",
        eventType: "UNAUTHORIZED_DASHBOARD_ACCESS",
        title: "Failed Account Activation Attempt",
        description: `Unrecognized email address attempted account activation: ${normalizedEmail}`,
        actorEmail: normalizedEmail,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent") || "unknown",
      });

      return NextResponse.json(
        { error: "No pending account found for this email. Contact your IT administrator." },
        { status: 404 }
      );
    }

    const staffUser = user as any;

    // Verify activation key
    let isKeyValid = false;
    if (staffUser.activationKey && staffUser.activationKey === cleanKey) {
      isKeyValid = true;
    } else {
      const matchTemp = await bcrypt.compare(cleanKey, staffUser.passwordHash).catch(() => false);
      if (matchTemp) {
        isKeyValid = true;
      } else {
        const ticket = await db.credentialRequest.findFirst({
          where: {
            requesterEmail: normalizedEmail,
            temporaryCode: cleanKey,
            status: { in: ["APPROVED", "FULFILLED"] },
          },
        });
        if (ticket) {
          isKeyValid = true;
        }
      }
    }

    if (!isKeyValid) {
      await logPolicyAlert({
        severity: "WARNING",
        eventType: "CREDENTIAL_ABUSE",
        title: "Invalid IT Activation Key Entered",
        description: `Failed authorization key validation for user account: ${normalizedEmail}`,
        actorEmail: normalizedEmail,
        targetResource: "UserAccountActivation",
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent") || "unknown",
      });

      return NextResponse.json(
        { error: "Invalid or expired IT activation key. Please request a new key from Systems IT Command." },
        { status: 403 }
      );
    }

    let twoFactorEnabled = staffUser.twoFactorEnabled || false;
    let twoFactorSecret = staffUser.twoFactorSecret || null;
    let recoveryCodes: string[] = [];

    // Optional 2FA TOTP verification
    if (mfaSecret && mfaCode) {
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
      twoFactorEnabled = true;
      twoFactorSecret = mfaSecret;
    }

    // Hash preferred password
    const passwordHash = await bcrypt.hash(preferredPassword, 10);

    // Update user: clear mustChangePassword and activationKey
    const updatedUser: any = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        activationKey: null,
        status: "ACTIVE",
        phone: phone ? phone.trim() : staffUser.phone,
        avatarUrl: avatarUrl || staffUser.avatarUrl,
        bio: bio ? bio.trim() : staffUser.bio,
        twoFactorEnabled,
        twoFactorSecret,
        lastLoginAt: new Date(),
      },
    });

    if (twoFactorEnabled) {
      recoveryCodes = await generateAndStoreRecoveryCodes(updatedUser.id);
    }

    // Mark any corresponding credential tickets as FULFILLED
    await db.credentialRequest.updateMany({
      where: {
        requesterEmail: normalizedEmail,
        temporaryCode: cleanKey,
      },
      data: {
        status: "FULFILLED",
        resolvedAt: new Date(),
      },
    });

    // Synchronize with Go core backend
    try {
      await backendApi.users.syncUser({
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        department: updatedUser.department,
        jobTitle: updatedUser.jobTitle || undefined,
        phone: updatedUser.phone || undefined,
        status: updatedUser.status,
        createdAt: updatedUser.createdAt,
      });
    } catch (syncErr) {
      console.warn("Go core backend user sync deferred:", syncErr);
    }

    // Create session
    const session = await createSession({
      userId: updatedUser.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "unknown",
    });

    await logAuditEvent({
      actorId: updatedUser.id,
      actorEmail: updatedUser.email,
      action: "STAFF_ACCOUNT_ACTIVATED_AND_PASSWORD_SET",
      entity: "User",
      entityId: updatedUser.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { department: updatedUser.department || "OPERATIONS", role: updatedUser.role },
    });

    const res = NextResponse.json({
      success: true,
      message: "Account successfully activated with preferred password.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        department: updatedUser.department || "OPERATIONS",
        jobTitle: updatedUser.jobTitle || "Operations Manager",
        seniorityLevel: updatedUser.seniorityLevel,
        twoFactorEnabled: updatedUser.twoFactorEnabled,
        avatarUrl: updatedUser.avatarUrl,
      },
      recoveryCodes,
    });

    const cookieDomain = getCookieDomain(req.headers.get("host"));
    res.cookies.set(SESSION_COOKIE_NAME, session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
      path: "/",
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });

    return res;
  } catch (err: unknown) {
    console.error("Account activation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Account activation failed" },
      { status: 500 }
    );
  }
}
