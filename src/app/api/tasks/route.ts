import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { ensureExecutiveSchema } from "@/lib/executive/schema";

export const dynamic = "force-dynamic";

const db = prisma as any;

function isExecutiveRole(user: { role?: string | null; department?: string | null; jobTitle?: string | null }): boolean {
  const role = (user.role || "").toUpperCase();
  const dept = (user.department || "").toUpperCase();
  const title = (user.jobTitle || "").toUpperCase();
  return (
    role === "MD" ||
    role === "CEO" ||
    role === "SUPER_ADMIN" ||
    dept === "EXECUTIVE" ||
    title.includes("MANAGING DIRECTOR") ||
    title.includes("CEO")
  );
}

function isGmOrLead(user: { role?: string | null; department?: string | null; jobTitle?: string | null }): boolean {
  const role = (user.role || "").toUpperCase();
  const dept = (user.department || "").toUpperCase();
  const title = (user.jobTitle || "").toUpperCase();
  return (
    isExecutiveRole(user) ||
    role === "GM" ||
    role === "GENERAL_MANAGER" ||
    title.includes("GENERAL MANAGER") ||
    title.includes("GM") ||
    title.includes("COO") ||
    (dept === "OPERATIONS" && (role === "ADMIN" || title.includes("DIRECTOR") || title.includes("HEAD")))
  );
}

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureExecutiveSchema();

    const isExec = isExecutiveRole(user);
    const isGm = isGmOrLead(user);
    const userDept = (user.department || "OPERATIONS").toUpperCase();

    // SILENT MD OVERSIGHT SCOPING:
    // - MD/CEO (Executive): silently sees ALL tasks across all departments (including GM-assigned tasks).
    // - GM / Operations Lead: sees tasks they assigned + Operations tasks.
    // - Regular Staff: strictly sees ONLY tasks assigned to them or their department,
    //   with zero indication of MD/CEO oversight.
    const where = isExec
      ? {}
      : isGm
      ? {
          OR: [
            { assignedById: user.id },
            { department: "OPERATIONS" },
            { assigneeId: user.id },
          ],
        }
      : {
          OR: [
            { assigneeId: user.id },
            { department: userDept, assigneeId: null },
          ],
        };

    const tasks = await db.departmentTask.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    // Auto-flag overdue tasks in response
    const now = Date.now();
    const enriched = tasks.map((t: any) => {
      const isOverdue =
        t.status !== "COMPLETED" &&
        t.dueDate &&
        new Date(t.dueDate).getTime() < now;
      return {
        ...t,
        effectiveStatus: isOverdue ? "OVERDUE" : t.status,
      };
    });

    return NextResponse.json({ tasks: enriched });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user || !isGmOrLead(user)) {
      return NextResponse.json(
        { error: "Forbidden: Only General Manager, Executive, or Department Leads can assign operational tasks." },
        { status: 403 }
      );
    }

    await ensureExecutiveSchema();

    const body = await req.json();
    const {
      title,
      description,
      department = "OPERATIONS",
      assigneeId,
      priority = "NORMAL",
      dueDate,
    } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: "Task title and description are required." },
        { status: 400 }
      );
    }

    let assigneeName: string | null = null;
    let assigneeEmail: string | null = null;
    let resolvedDept = String(department).toUpperCase();

    if (assigneeId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { id: true, fullName: true, email: true, department: true },
      });
      if (targetUser) {
        assigneeName = targetUser.fullName;
        assigneeEmail = targetUser.email;
        resolvedDept = (targetUser.department || resolvedDept).toUpperCase();
      }
    }

    const roleUpper = (user.role || "").toUpperCase();
    const titleUpper = (user.jobTitle || "").toUpperCase();
    const assignedByRole =
      roleUpper === "MD" || roleUpper === "CEO" || titleUpper.includes("MANAGING DIRECTOR")
        ? "MD"
        : roleUpper === "GM" || roleUpper === "GENERAL_MANAGER" || titleUpper.includes("GENERAL MANAGER") || titleUpper.includes("GM")
        ? "GM"
        : roleUpper || "ADMIN";

    const reference = `TSK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const task = await db.departmentTask.create({
      data: {
        reference,
        title: title.trim(),
        description: description.trim(),
        department: resolvedDept,
        assigneeId: assigneeId || null,
        assigneeName,
        assigneeEmail,
        assignedById: user.id,
        assignedByName: user.fullName || "General Manager",
        assignedByRole,
        priority: String(priority).toUpperCase(),
        status: "PENDING",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    // Notify assignee / target department (standard task notification — zero mention of MD oversight)
    try {
      await db.dashboardNotification.create({
        data: {
          userId: assigneeId || null,
          department: resolvedDept,
          title: `[New Task • ${String(priority).toUpperCase()}] ${reference}: ${title.trim()}`,
          message: `Assigned by ${user.fullName || "Operations Management"}: ${description.trim().slice(0, 120)}`,
          type: "TASK_ASSIGNED",
          link: "/dashboard",
          isRead: false,
          metadata: JSON.stringify({ taskId: task.id, reference }),
        },
      });
    } catch {}

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "DEPARTMENT_TASK_ASSIGNED",
      entity: "DepartmentTask",
      entityId: task.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { reference, department: resolvedDept, assigneeId, assignedByRole },
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to assign task" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureExecutiveSchema();

    const body = await req.json();
    const { id, status, completionNotes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Task ID and status are required." }, { status: 400 });
    }

    const existing = await db.departmentTask.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const userDept = (user.department || "").toUpperCase();
    const canUpdate =
      isGmOrLead(user) ||
      existing.assigneeId === user.id ||
      (existing.assigneeId === null && existing.department === userDept);

    if (!canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const nextStatus = String(status).toUpperCase();
    const updateData: Record<string, unknown> = { status: nextStatus };
    if (nextStatus === "COMPLETED") {
      updateData.completedAt = new Date();
    }
    if (completionNotes !== undefined) {
      updateData.completionNotes = completionNotes;
    }

    const updated = await db.departmentTask.update({
      where: { id },
      data: updateData,
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: `DEPARTMENT_TASK_${nextStatus}`,
      entity: "DepartmentTask",
      entityId: id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { reference: existing.reference, status: nextStatus },
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    console.error("PATCH /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
