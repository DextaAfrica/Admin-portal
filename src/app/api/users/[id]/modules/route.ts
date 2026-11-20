import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (user.role || "").toUpperCase();
    const dept = (user.department || "").toUpperCase();
    const isItOrSuperAdmin = role === "SUPER_ADMIN" || dept === "IT" || role === "ADMIN";

    if (!isItOrSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only IT Administrators can modify user dashboard modules directly" },
        { status: 403 }
      );
    }

    const { id: targetUserId } = params;
    const body = await req.json();
    const { assignedModules, reason } = body;

    if (!Array.isArray(assignedModules)) {
      return NextResponse.json(
        { error: "Invalid assignedModules format. Expected an array of module keys." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, fullName: true, assignedModules: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: targetUserId },
        data: {
          assignedModules: JSON.stringify(assignedModules),
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          department: true,
          jobTitle: true,
          role: true,
          assignedModules: true,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "DIRECT_DASHBOARD_MODULES_OVERRIDE",
          entity: "User",
          entityId: targetUserId,
          actorId: user.id,
          actorEmail: user.email,
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
          userAgent: req.headers.get("user-agent") || "Internal-Console",
          metadata: JSON.stringify({
            previousModules: targetUser.assignedModules,
            newModules: assignedModules,
            reason: reason || "Direct IT Administration update",
            updatedBy: user.email,
          }),
        },
      });

      await tx.dashboardNotification.create({
        data: {
          userId: targetUserId,
          title: "Dashboard Configuration Updated",
          message: `Your dashboard feature access was updated by IT Administration: ${assignedModules.join(", ")}`,
          type: "SYSTEM_ALERT",
          link: "/dashboard",
        },
      });

      return u;
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Updated dashboard modules for ${targetUser.fullName || targetUser.email}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update user dashboard modules" },
      { status: 500 }
    );
  }
}
