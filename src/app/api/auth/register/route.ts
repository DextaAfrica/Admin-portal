import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyTotpToken, generateAndStoreRecoveryCodes } from "@/lib/auth/mfa";
import { createSession, SESSION_COOKIE_NAME, SESSION_DURATION_DAYS, getCookieDomain } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { logPolicyAlert } from "@/lib/auth/policy-alerts";
import { RegisterSchema } from "@/lib/auth/validation";
import { backendApi } from "@/lib/backend-api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const db = prisma as any;
    const body = await req.json();

    // 1. Enterprise Schema & Password Entropy Validation
    const validationResult = RegisterSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues?.[0]?.message || (validationResult.error as any).errors?.[0]?.message || "Validation failed";
      return NextResponse.json(
        {
          error: firstError,
          fieldErrors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      password,
      department = "Operations",
      jobTitle,
      phone,
      avatarUrl,
      bio,
      mfaSecret,
      mfaCode,
    } = validationResult.data;

    // 2. Email Uniqueness Check
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A team member account with this corporate email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    let twoFactorEnabled = false;
    let validatedSecret: string | null = null;
    let recoveryCodes: string[] = [];

    // 3. TOTP Verification (if enabled during registration)
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
      validatedSecret = mfaSecret;
    }

    // 4. Secure Cryptographic Password Hashing
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Create User Profile in Database
    const newUser = await db.user.create({
      data: {
        email: normalizedEmail,
        fullName: fullName.trim(),
        passwordHash,
        role: "ADMIN",
        department: (department || "OPERATIONS").toUpperCase(),
        jobTitle: jobTitle ? jobTitle.trim() : "Team Member",
        phone: phone ? phone.trim() : null,
        avatarUrl: avatarUrl || null,
        bio: bio ? bio.trim() : null,
        status: "ACTIVE",
        twoFactorEnabled,
        twoFactorSecret: validatedSecret,
        mustChangePassword: false,
        lastLoginAt: new Date(),
      },
    });

    // 6. Auto-create HR EmployeeProfile Record
    try {
      const empNumber = `DXT-${(department || "OP").slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await db.employeeProfile.create({
        data: {
          userId: newUser.id,
          employeeNumber: empNumber,
          fullName: newUser.fullName,
          workEmail: newUser.email,
          department: newUser.department || "Operations",
          jobTitle: newUser.jobTitle || "Team Member",
          employmentType: "FULL_TIME",
          status: "ACTIVE",
          phone: newUser.phone || "+234 800 000 0000",
          startDate: new Date(),
          annualLeaveBalance: 20,
          usedLeaveDays: 0,
        },
      });
    } catch (hrErr) {
      console.warn("Auto HR profile creation deferred:", hrErr);
    }

    if (twoFactorEnabled) {
      recoveryCodes = await generateAndStoreRecoveryCodes(newUser.id);
    }

    // 8. Go Core Backend Synchronization & Real-Time Registration Notification
    const backendSyncResult = await backendApi.users.syncUser({
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      department: newUser.department,
      jobTitle: newUser.jobTitle || undefined,
      phone: newUser.phone || undefined,
      status: newUser.status,
      createdAt: newUser.createdAt,
    });

    // 9. Session Generation
    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const session = await createSession({
      userId: newUser.id,
      ipAddress,
      userAgent,
    });

    // 10. Audit Logging (persisted locally and dispatched to Go backend in real-time)
    await logAuditEvent({
      actorId: newUser.id,
      actorEmail: newUser.email,
      action: "TEAM_MEMBER_REGISTERED",
      entity: "User",
      entityId: newUser.id,
      ipAddress,
      userAgent,
      metadata: {
        department: newUser.department,
        role: newUser.role,
        backendSynced: backendSyncResult.synced,
      },
    });

    // 11. Security Watchdog Alert
    await logPolicyAlert({
      severity: "INFO",
      eventType: "SUSPICIOUS_ACTIVITY",
      title: "New Team Account Created",
      description: `${newUser.fullName} (${newUser.email}) registered under ${newUser.department}. Initial workspace credentials established.`,
      actorEmail: newUser.email,
      targetResource: `/users/${newUser.id}`,
      ipAddress,
      userAgent,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        department: newUser.department,
        twoFactorEnabled,
      },
      backendSynced: backendSyncResult.synced,
      recoveryCodes,
    });

    // Set HTTP-Only Session Cookie with Cross-Subdomain SSO
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
    console.error("Register API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Registration error" },
      { status: 500 }
    );
  }
}
