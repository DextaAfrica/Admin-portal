import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
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

