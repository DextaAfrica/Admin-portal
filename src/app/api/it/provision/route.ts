import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { sendEmail } from "@/lib/email/dispatcher";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const db = prisma as any;

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      fullName,
      email,
      department = "OPERATIONS",
      role = "ADMIN",
      jobTitle,
      temporaryPassword,
    } = await req.json();

    if (!fullName || !email || !temporaryPassword) {
      return NextResponse.json(
        { error: "Full Name, Email, and Temporary Password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const activationKey = `DXT-ACT-${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName,
        passwordHash,
        department,
        role,
        jobTitle,
        status: "ACTIVE",
        mustChangePassword: true,
        activationKey,
        twoFactorEnabled: false,
      },
    });

    // Also link or create EmployeeProfile in HR if not exists
    const empCount = await db.employeeProfile.count();
    const empNumber = `DXT-${department.slice(0, 3).toUpperCase()}-${String(empCount + 101).padStart(3, "0")}`;

    await db.employeeProfile.upsert({
      where: { workEmail: normalizedEmail },
      update: {
        userId: newUser.id,
        department,
        jobTitle: jobTitle || role,
      },
      create: {
        userId: newUser.id,
        employeeNumber: empNumber,
        fullName,
        workEmail: normalizedEmail,
        phone: "+234 800 000 0000",
        department,
        jobTitle: jobTitle || role,
        employmentType: "FULL_TIME",
        status: "ACTIVE",
        startDate: new Date(),
        location: "Lagos Executive Hub, Nigeria",
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "IT_ACCOUNT_PROVISIONED",
      entity: "User",
      entityId: newUser.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { fullName, email: normalizedEmail, department, role, provisionedBy: user.fullName },
    });

    // Dispatch real activation credentials to Mailpit / employee inbox
    await sendEmail({
      to: normalizedEmail,
      subject: "Welcome to Dexta Africa - Your Workspace Activation Credentials",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 36px 32px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff; color: #09090b;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid #f4f4f5; padding-bottom: 16px;">
            <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #09090b;">De<span style="color: #ED2618;">x</span>ta</span>
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #71717a; margin-left: 8px;">Workspace Onboarding</span>
          </div>
          <h2 style="font-size: 20px; font-weight: 700; color: #09090b; margin: 0 0 12px 0;">Your Account Has Been Provisioned</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #52525b; margin: 0 0 20px 0;">
            Hello <strong>${fullName}</strong>,<br/>
            An enterprise account has been created for you under the <strong>${department}</strong> department with the role <strong>${role}</strong>.
          </p>
          <div style="margin: 24px 0; padding: 20px; background: #fafafa; border-radius: 8px; border: 1px solid #e4e4e7;">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #71717a; margin-bottom: 8px;">Activation Key</div>
            <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 24px; font-weight: 800; color: #ED2618; margin-bottom: 16px;">${activationKey}</div>
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #71717a; margin-bottom: 8px;">Temporary Password</div>
            <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 16px; font-weight: 700; color: #09090b;">${temporaryPassword}</div>
          </div>
          <p style="font-size: 13px; line-height: 1.6; color: #71717a; margin: 0 0 16px 0;">
            Please log in and update your password immediately upon first sign-in.
          </p>
          <div style="border-top: 1px solid #f4f4f5; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #a1a1aa; text-align: center;">
            &copy; 2026 Dexta Africa Enterprise Gateway &bull; IT Governance &amp; Identity Provisioning
          </div>
        </div>
      `,
    });

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          department: newUser.department,
          role: newUser.role,
          activationKey,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("IT Provision account error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to provision account" },
      { status: 500 }
    );
  }
}

