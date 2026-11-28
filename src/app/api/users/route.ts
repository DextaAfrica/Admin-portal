import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logAuditEvent } from "@/lib/auth/audit";
import { validateCorporateEmail, validatePhoneNumber } from "@/lib/validation/contact";
import { ensureUserWorkspaceSchema } from "@/lib/auth/user-schema";

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureUserWorkspaceSchema();

    const userRole = (user.role || "").toUpperCase();
    const userDept = (user.department || "").toUpperCase();
    const isSuperAdmin = userRole === "SUPER_ADMIN" || userDept === "EXECUTIVE";
    const isIT = userDept === "IT";

    // Privacy gate: IT admins without EXECUTIVE clearance may provision accounts
    // but cannot see personal staff data (email, phone, login history)
    const isExecutiveSuperAdmin = isSuperAdmin && userDept === "EXECUTIVE";

    if (!isSuperAdmin && !isIT) {
      return NextResponse.json(
        { error: "Access Denied: Team Member Management is restricted to Systems IT Governance and Executive Directorate." },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        jobTitle: true,
        status: true,
        primaryWorkspace: true,
        assignedModules: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: { sessions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Privacy: strip / mask personal data based on clearance level
    // Executive SUPER_ADMIN → full data. IT Admin → masked email, no timestamps.
    const safeUsers = users.map((u: any) => ({
      id: u.id,
      fullName: u.fullName,
      role: u.role,
      department: u.department,
      jobTitle: u.jobTitle,
      status: u.status,
      primaryWorkspace: u.primaryWorkspace,
      assignedModules: u.assignedModules,
      twoFactorEnabled: u.twoFactorEnabled,
      seniorityLevel: u.seniorityLevel || "SENIOR",
      _count: u._count,
      email: isExecutiveSuperAdmin
        ? u.email
        : u.email
        ? `${u.email.charAt(0)}***@${u.email.split("@")[1] || "dextaafrica.com"}`
        : null,
      lastLoginAt: isExecutiveSuperAdmin ? u.lastLoginAt : null,
      createdAt: isExecutiveSuperAdmin ? u.createdAt : null,
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

    await ensureUserWorkspaceSchema();
    const {
      email,
      fullName,
      password,
      role,
      department,
      seniorityLevel,
      jobTitle,
      phone,
      primaryWorkspace,
      assignedModules,
    } = await req.json();

    if (!email || !fullName || !password) {
      return NextResponse.json(
        { error: "Email, Full Name, and Password are required" },
        { status: 400 }
      );
    }

    const emailCheck = validateCorporateEmail(email);
    if (!emailCheck.isValid) {
      return NextResponse.json(
        { error: emailCheck.error },
        { status: 400 }
      );
    }

    let sanitizedPhone: string | null = null;
    if (phone && phone.trim()) {
      const phoneCheck = validatePhoneNumber(phone);
      if (!phoneCheck.isValid) {
        return NextResponse.json(
          { error: phoneCheck.error },
          { status: 400 }
        );
      }
      sanitizedPhone = phoneCheck.formatted;
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

    const workspaceKey = String(primaryWorkspace || "operations").toLowerCase();
    let resolvedDepartment = (department || "OPERATIONS").toUpperCase();
    if (workspaceKey === "crm" || workspaceKey === "clan" || workspaceKey === "operations") {
      if (resolvedDepartment === "IT") resolvedDepartment = "OPERATIONS";
    } else if (workspaceKey === "finance") {
      resolvedDepartment = "FINANCE";
    } else if (workspaceKey === "hr") {
      resolvedDepartment = "HR";
    } else if (workspaceKey === "systems") {
      resolvedDepartment = "IT";
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        fullName,
        passwordHash,
        phone: sanitizedPhone,
        role: role || "ADMIN",
        department: resolvedDepartment,
        seniorityLevel: (seniorityLevel || "SENIOR").toUpperCase(),
        jobTitle: jobTitle || null,
        primaryWorkspace: workspaceKey,
        assignedModules: Array.isArray(assignedModules)
          ? JSON.stringify(assignedModules)
          : typeof assignedModules === "string"
          ? assignedModules
          : JSON.stringify([workspaceKey, "storage", "personal"]),
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

