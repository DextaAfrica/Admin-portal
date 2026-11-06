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

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        jobTitle: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        status: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: fullUser });
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
    const { fullName, jobTitle, phone, avatarUrl, bio, department } = body;

    const dataToUpdate: any = {};
    if (fullName && typeof fullName === "string") dataToUpdate.fullName = fullName.trim();
    if (jobTitle !== undefined) dataToUpdate.jobTitle = typeof jobTitle === "string" ? jobTitle.trim() : null;
    if (phone !== undefined) dataToUpdate.phone = typeof phone === "string" ? phone.trim() : null;
    if (avatarUrl !== undefined) dataToUpdate.avatarUrl = typeof avatarUrl === "string" ? avatarUrl : null;
    if (bio !== undefined) dataToUpdate.bio = typeof bio === "string" ? bio.trim() : null;
    // Department reassignment is an administrative privilege reserved exclusively for SUPER_ADMIN
    if (department && typeof department === "string" && user.role === "SUPER_ADMIN") {
      dataToUpdate.department = department.toUpperCase();
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        jobTitle: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        status: true,
        twoFactorEnabled: true,
      },
    });

    // Sync with EmployeeProfile if exists
    try {
      await prisma.employeeProfile.updateMany({
        where: { userId: user.id },
        data: {
          fullName: updatedUser.fullName,
          jobTitle: updatedUser.jobTitle || "Team Member",
          phone: updatedUser.phone || "+234 800 000 0000",
          department: updatedUser.department || "Operations",
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

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update profile" },
      { status: 500 }
    );
  }
}

