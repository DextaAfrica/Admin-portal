import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";

const db = prisma as any;

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.toLowerCase().trim();

    const where: any = {};
    if (department && department !== "ALL") {
      where.department = department;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { workEmail: { contains: search } },
        { jobTitle: { contains: search } },
        { employeeNumber: { contains: search } },
      ];
    }

    const [employees, totalCount, activeCount, onLeaveCount, onboardingCount] =
      await Promise.all([
        db.employeeProfile.findMany({
          where,
          include: {
            documents: true,
            user: {
              select: {
                id: true,
                role: true,
                status: true,
                twoFactorEnabled: true,
                lastLoginAt: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        db.employeeProfile.count(),
        db.employeeProfile.count({ where: { status: "ACTIVE" } }),
        db.employeeProfile.count({ where: { status: "ON_LEAVE" } }),
        db.employeeProfile.count({ where: { status: "ONBOARDING" } }),
      ]);

    return NextResponse.json({
      employees,
      stats: {
        totalCount,
        activeCount,
        onLeaveCount,
        onboardingCount,
      },
    });
  } catch (err: unknown) {
    console.error("HR Employees API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      fullName,
      workEmail,
      phone,
      department,
      jobTitle,
      employmentType = "FULL_TIME",
      status = "ACTIVE",
      startDate,
      location = "Lagos, Nigeria",
      emergencyContact,
      notes,
    } = body;

    if (!fullName || !workEmail || !department || !jobTitle) {
      return NextResponse.json(
        { error: "Full Name, Work Email, Department, and Job Title are required" },
        { status: 400 }
      );
    }

    const existing = await db.employeeProfile.findFirst({
      where: { workEmail: workEmail.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An employee with this work email already exists" },
        { status: 409 }
      );
    }

    const empCount = await db.employeeProfile.count();
    const empNumber = `DXT-${department.slice(0, 3).toUpperCase()}-${String(empCount + 101).padStart(3, "0")}`;

    const employee = await db.employeeProfile.create({
      data: {
        employeeNumber: empNumber,
        fullName,
        workEmail: workEmail.toLowerCase().trim(),
        phone: phone || "+234 800 000 0000",
        department,
        jobTitle,
        employmentType,
        status,
        startDate: startDate ? new Date(startDate) : new Date(),
        location,
        emergencyContact,
        notes,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "HR_EMPLOYEE_ONBOARDED",
      entity: "EmployeeProfile",
      entityId: employee.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { fullName, workEmail, department, jobTitle },
    });

    return NextResponse.json({ employee }, { status: 201 });
  } catch (err: unknown) {
    console.error("Create Employee API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status, department, jobTitle, phone, location, notes } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const updated = await db.employeeProfile.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(department && { department }),
        ...(jobTitle && { jobTitle }),
        ...(phone && { phone }),
        ...(location && { location }),
        ...(notes !== undefined && { notes }),
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "HR_EMPLOYEE_UPDATED",
      entity: "EmployeeProfile",
      entityId: id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { status, department, jobTitle },
    });

    return NextResponse.json({ employee: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update employee" },
      { status: 500 }
    );
  }
}

