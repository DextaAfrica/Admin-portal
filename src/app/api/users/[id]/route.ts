import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auth/audit";
import { ensureUserWorkspaceSchema } from "@/lib/auth/user-schema";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRole = (user.role || "").toUpperCase();
    const userDept = (user.department || "").toUpperCase();
    const isAuthorized = userRole === "SUPER_ADMIN" || userDept === "EXECUTIVE" || userDept === "IT";
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await ensureUserWorkspaceSchema();
    const { id } = await params;
    const body = await req.json();

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        department: body.department ? String(body.department).toUpperCase() : target.department,
        role: body.role ? String(body.role).toUpperCase() : target.role,
        jobTitle: body.jobTitle !== undefined ? body.jobTitle : target.jobTitle,
        primaryWorkspace: body.primaryWorkspace || target.primaryWorkspace,
        assignedModules: body.assignedModules
          ? Array.isArray(body.assignedModules)
            ? JSON.stringify(body.assignedModules)
            : String(body.assignedModules)
          : target.assignedModules,
      },
    });

    try {
      await logAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: "USER_WORKSPACE_UPDATED",
        entity: "User",
        entityId: id,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
        metadata: {
          targetEmail: target.email,
          department: updated.department,
          primaryWorkspace: updated.primaryWorkspace,
        },
      });
    } catch {
      // non-fatal
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    console.error("[Users PATCH Error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRole = (user.role || "").toUpperCase();
    const userDept = (user.department || "").toUpperCase();
    const isAuthorized = userRole === "SUPER_ADMIN" || userDept === "EXECUTIVE" || userDept === "IT";
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Only Super Admins or Systems IT Administrators can delete user accounts." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (id === user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own active administrator account." },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    if (target.role === "SUPER_ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only a Super Administrator can delete another Super Administrator." },
        { status: 403 }
      );
    }

    // Revoke sessions & delete account
    await prisma.session.deleteMany({ where: { userId: id } }).catch(() => {});
    await prisma.user.delete({ where: { id } });

    try {
      await logAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: "USER_ACCOUNT_DELETED",
        entity: "User",
        entityId: id,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
        metadata: {
          deletedEmail: target.email,
          deletedName: target.fullName,
          deletedRole: target.role,
          deletedDepartment: target.department,
        },
      });
    } catch {
      // non-fatal
    }

    return NextResponse.json({
      success: true,
      message: `Account for ${target.fullName} (${target.email}) permanently deleted.`,
    });
  } catch (err: any) {
    console.error("[Users DELETE Error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to delete user account" }, { status: 500 });
  }
}
