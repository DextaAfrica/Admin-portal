import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        jobTitle: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        status: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    if (!baseUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let department = user.department || "OPERATIONS";
    let seniorityLevel = user.seniorityLevel || "SENIOR";

    try {
      const rawRows: any[] = await prisma.$queryRawUnsafe(
        "SELECT department, seniorityLevel FROM User WHERE id = ? LIMIT 1",
        user.id
      );
      if (rawRows?.[0]) {
        if (rawRows[0].department) department = rawRows[0].department;
        if (rawRows[0].seniorityLevel) seniorityLevel = rawRows[0].seniorityLevel;
      }
    } catch {
      // Fallback to session values
    }

    return NextResponse.json({
      user: {
        ...baseUser,
        department,
        seniorityLevel,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load profile" },
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

    const body = await req.json();
    const { fullName, jobTitle, phone, avatarUrl, bio, department, seniorityLevel } = body;

    const dataToUpdate: any = {};
    if (fullName && typeof fullName === "string") dataToUpdate.fullName = fullName.trim();
    if (jobTitle !== undefined) dataToUpdate.jobTitle = typeof jobTitle === "string" ? jobTitle.trim() : null;
    if (phone !== undefined) dataToUpdate.phone = typeof phone === "string" ? phone.trim() : null;
    if (avatarUrl !== undefined) dataToUpdate.avatarUrl = typeof avatarUrl === "string" ? avatarUrl : null;
    if (bio !== undefined) dataToUpdate.bio = typeof bio === "string" ? bio.trim() : null;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        jobTitle: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        status: true,
        twoFactorEnabled: true,
      },
    });

    let finalDept = user.department || "OPERATIONS";
    let finalSeniority = user.seniorityLevel || "SENIOR";

    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      if (department && typeof department === "string") {
        finalDept = department.toUpperCase();
        await prisma.$executeRawUnsafe(
          "UPDATE User SET department = ? WHERE id = ?",
          finalDept,
          user.id
        ).catch(() => {});
      }
      if (seniorityLevel && typeof seniorityLevel === "string") {
        finalSeniority = seniorityLevel.toUpperCase();
        await prisma.$executeRawUnsafe(
          "UPDATE User SET seniorityLevel = ? WHERE id = ?",
          finalSeniority,
          user.id
        ).catch(() => {});
      }
    }

    // Sync with EmployeeProfile if exists
    try {
      await prisma.employeeProfile.updateMany({
        where: { userId: user.id },
        data: {
          fullName: updatedUser.fullName,
          jobTitle: updatedUser.jobTitle || "Team Member",
          phone: updatedUser.phone || "+234 800 000 0000",
          department: finalDept,
        },
      });
    } catch {
      // Ignore if employee profile does not exist
    }

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorEmail: user.email,
        action: "UPDATE_USER_PROFILE",
        entity: "User",
        entityId: user.id,
        metadata: JSON.stringify({ updatedFields: Object.keys(dataToUpdate) }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        department: finalDept,
        seniorityLevel: finalSeniority,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update profile" },
      { status: 500 }
    );
  }
}
