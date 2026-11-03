import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE_NAME, SESSION_DURATION_DAYS } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { logPolicyAlert } from "@/lib/auth/policy-alerts";

const db = prisma as any;

export async function POST(req: NextRequest) {
  try {
    const { email, activationKey, preferredPassword } = await req.json();

    if (!email || !activationKey || !preferredPassword) {
      return NextResponse.json(
        { error: "Work email, IT activation key, and preferred password are required." },
        { status: 400 }
      );
    }

    if (preferredPassword.length < 8) {
      return NextResponse.json(
        { error: "Preferred password must be at least 8 characters long." },
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
      // Possible policy violation: someone attempting activation on a non-existent account
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

    // Verify activation key: either matches stored activationKey, or matches temporary credential ticket
    let isKeyValid = false;
    if (user.activationKey && user.activationKey === cleanKey) {
      isKeyValid = true;
    } else {
      // Check if matches bcrypt of temporary password
      const matchTemp = await bcrypt.compare(cleanKey, user.passwordHash).catch(() => false);
      if (matchTemp) {
        isKeyValid = true;
      } else {
        // Also check if there is an approved CredentialRequest ticket with this temporaryCode
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
        { error: "Invalid or expired IT activation key. Please request a new key from IT." },
        { status: 403 }
      );
    }

    // Hash preferred password
    const passwordHash = await bcrypt.hash(preferredPassword, 10);

    // Update user: clear mustChangePassword and activationKey
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        activationKey: null,
        status: "ACTIVE",
        lastLoginAt: new Date(),
      },
    });

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
      metadata: { department: updatedUser.department, role: updatedUser.role },
    });

    const res = NextResponse.json({
      success: true,
      message: "Account successfully activated with preferred password.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        department: updatedUser.department,
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
    console.error("Account activation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Account activation failed" },
      { status: 500 }
    );
  }
}

