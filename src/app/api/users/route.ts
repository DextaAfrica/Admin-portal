import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logAuditEvent } from "@/lib/auth/audit";
import { ensureInitialEnterpriseData } from "@/lib/automation/engine";

const MOCK_EMAILS = [
  "amina.arch@dextaafrica.com",
  "chidi.eng@dextaafrica.com",
  "olufemi@dextaafrica.com",
  "tariq.it@dextaafrica.com",
  "sadia@dextaafrica.com",
  "esther.ade@dextaafrica.com",
];

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureInitialEnterpriseData();

    const users = await prisma.user.findMany({
      where: {
        email: { notIn: MOCK_EMAILS },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        jobTitle: true,
        status: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: { sessions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const safeUsers = users.map((u: any) => ({
      ...u,
      seniorityLevel: u.seniorityLevel || "SENIOR",
    }));

    return NextResponse.json({ users: safeUsers });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, fullName, password, role, department, seniorityLevel, jobTitle } = await req.json();

    if (!email || !fullName || !password) {
      return NextResponse.json(
        { error: "Email, Full Name, and Password are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        fullName,
        passwordHash,
        role: role || "ADMIN",
        department: (department || "OPERATIONS").toUpperCase(),
        seniorityLevel: (seniorityLevel || "SENIOR").toUpperCase(),
        jobTitle: jobTitle || null,
        status: "ACTIVE",
        twoFactorEnabled: false,
      },
    });

    const createdUser = newUser as any;

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "USER_CREATED",
      entity: "User",
      entityId: createdUser.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { targetEmail: createdUser.email, assignedRole: createdUser.role, department: createdUser.department, seniorityLevel: createdUser.seniorityLevel },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        fullName: createdUser.fullName,
        role: createdUser.role,
        department: createdUser.department,
        seniorityLevel: createdUser.seniorityLevel,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, status, role, department, seniorityLevel, jobTitle } = await req.json();

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (role && user.role === "SUPER_ADMIN") data.role = role;
    if (department && (user.role === "SUPER_ADMIN" || user.role === "ADMIN")) data.department = department.toUpperCase();
    if (seniorityLevel && (user.role === "SUPER_ADMIN" || user.role === "ADMIN")) data.seniorityLevel = seniorityLevel.toUpperCase();
    if (jobTitle !== undefined) data.jobTitle = jobTitle;

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "USER_UPDATED",
      entity: "User",
      entityId: userId,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: data,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update user" },
      { status: 500 }
    );
  }
}

