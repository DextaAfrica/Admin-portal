import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { sendEmail } from "@/lib/email/dispatcher";
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
    title.includes("CEO") ||
    title.includes("CHIEF EXECUTIVE")
  );
}

const DEPT_EMAIL_MAP: Record<string, { email: string; name: string }> = {
  FINANCE: { email: "finance@dextaafrica.com", name: "Finance & Treasury Directorate" },
  OPERATIONS: { email: "operations@dextaafrica.com", name: "Operations Directorate" },
  HR: { email: "hr@dextaafrica.com", name: "People & Culture (HR)" },
  IT: { email: "it@dextaafrica.com", name: "Systems & IT Security" },
  EXECUTIVE: { email: "executive@dextaafrica.com", name: "Executive Office" },
  ALL: { email: "operations@dextaafrica.com", name: "All Dexta Africa Directorates" },
};

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureExecutiveSchema();

    const isExec = isExecutiveRole(user);
    const userDept = (user.department || "OPERATIONS").toUpperCase();

    // Privacy gate:
    // Executive / MD / CEO sees all directives.
    // Department staff (including IT) only see directives addressed to their own department, ALL, or themselves.
    const where = isExec
      ? {}
      : {
          OR: [
            { targetDepartment: userDept },
            { targetDepartment: "ALL" },
            { targetUserId: user.id },
          ],
        };

    const directives = await db.executiveDirective.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    return NextResponse.json({ directives });
  } catch (error) {
    console.error("GET /api/executive/directives error:", error);
    return NextResponse.json({ error: "Failed to fetch executive directives" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user || !isExecutiveRole(user)) {
      return NextResponse.json(
        { error: "Forbidden: Only Managing Director / CEO / Executive Directorate can issue directives." },
        { status: 403 }
      );
    }

    await ensureExecutiveSchema();

    const body = await req.json();
    const {
      title,
      instruction,
      targetDepartment,
      targetUserId,
      targetUserName,
      priority = "HIGH",
      dueDate,
    } = body;

    if (!title?.trim() || !instruction?.trim() || !targetDepartment?.trim()) {
      return NextResponse.json(
        { error: "Title, instruction details, and target department are required." },
        { status: 400 }
      );
    }

    const deptUpper = String(targetDepartment).toUpperCase();
    const priorityUpper = String(priority).toUpperCase();
    const reference = `DIR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const directive = await db.executiveDirective.create({
      data: {
        reference,
        title: title.trim(),
        instruction: instruction.trim(),
        targetDepartment: deptUpper,
        targetUserId: targetUserId || null,
        targetUserName: targetUserName || null,
        priority: priorityUpper,
        status: "ISSUED",
        dueDate: dueDate ? new Date(dueDate) : null,
        issuedById: user.id,
        issuedByName: user.fullName || "Managing Director",
        issuedByEmail: user.email,
      },
    });

    // 1. Automated In-App Dashboard Notification for target department / user
    try {
      await db.dashboardNotification.create({
        data: {
          userId: targetUserId || null,
          department: deptUpper,
          title: `[Executive Directive • ${priorityUpper}] ${reference}: ${title.trim()}`,
          message: `From ${user.fullName || "MD / CEO"}: ${instruction.trim().slice(0, 140)}`,
          type: "EXECUTIVE_DIRECTIVE",
          link: "/dashboard",
          isRead: false,
          metadata: JSON.stringify({ directiveId: directive.id, reference }),
        },
      });
    } catch (notifErr) {
      console.warn("[Directive notification warning]:", notifErr);
    }

    // 2. Automated Corporate SMTP Dispatch + CorporateEmail audit log
    const dest = DEPT_EMAIL_MAP[deptUpper] || DEPT_EMAIL_MAP.OPERATIONS;
    const emailSubject = `[Executive Directive: ${priorityUpper}] ${reference} — ${title.trim()}`;
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff; color: #09090b;">
        <div style="border-bottom: 1px solid #f4f4f5; padding-bottom: 14px; margin-bottom: 20px;">
          <span style="font-size: 18px; font-weight: 800;">De<span style="color: #ED2618;">x</span>ta Africa</span>
          <span style="font-size: 11px; text-transform: uppercase; color: #71717a; margin-left: 8px;">Office of the Managing Director &amp; CEO</span>
        </div>
        <div style="display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; background: #fee2e2; color: #ED2618; margin-bottom: 12px;">
          ${priorityUpper} DIRECTIVE • ${reference}
        </div>
        <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 10px 0;">${title.trim()}</h2>
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6; margin: 0 0 18px 0;">${instruction.trim()}</p>
        <div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 14px; font-size: 12px; color: #52525b;">
          <div><strong>Target Directorate:</strong> ${deptUpper}</div>
          <div><strong>Issued By:</strong> ${user.fullName || "Managing Director"}</div>
          ${dueDate ? `<div><strong>Target Completion:</strong> ${new Date(dueDate).toLocaleDateString()}</div>` : ""}
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: dest.email,
        subject: emailSubject,
        html: emailHtml,
      });

      await db.corporateEmail.create({
        data: {
          direction: "OUTBOUND",
          fromEmail: user.email,
          fromName: user.fullName || "Managing Director",
          fromDepartment: "EXECUTIVE",
          toEmail: dest.email,
          toName: dest.name,
          toDepartment: deptUpper,
          subject: emailSubject,
          bodyHtml: emailHtml,
          status: "SENT",
          category: "EXECUTIVE",
        },
      });
    } catch (mailErr) {
      console.warn("[Directive email dispatch warning]:", mailErr);
    }

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "EXECUTIVE_DIRECTIVE_ISSUED",
      entity: "ExecutiveDirective",
      entityId: directive.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { reference, targetDepartment: deptUpper, priority: priorityUpper },
    });

    return NextResponse.json({ success: true, directive }, { status: 201 });
  } catch (error) {
    console.error("POST /api/executive/directives error:", error);
    return NextResponse.json({ error: "Failed to issue executive directive" }, { status: 500 });
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
      return NextResponse.json({ error: "Directive ID and status are required." }, { status: 400 });
    }

    const existing = await db.executiveDirective.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Directive not found." }, { status: 404 });
    }

    const isExec = isExecutiveRole(user);
    const userDept = (user.department || "").toUpperCase();
    const canUpdate =
      isExec ||
      existing.targetDepartment === "ALL" ||
      existing.targetDepartment === userDept ||
      existing.targetUserId === user.id;

    if (!canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const nextStatus = String(status).toUpperCase();
    const updateData: Record<string, unknown> = { status: nextStatus };

    if (nextStatus === "ACKNOWLEDGED" && !existing.acknowledgedAt) {
      updateData.acknowledgedBy = user.fullName || user.email;
      updateData.acknowledgedAt = new Date();
    }
    if (nextStatus === "COMPLETED") {
      updateData.completedAt = new Date();
      if (!existing.acknowledgedAt) {
        updateData.acknowledgedBy = user.fullName || user.email;
        updateData.acknowledgedAt = new Date();
      }
    }
    if (completionNotes !== undefined) {
      updateData.completionNotes = completionNotes;
    }

    const updated = await db.executiveDirective.update({
      where: { id },
      data: updateData,
    });

    // Notify Executive Office when a department acknowledges or completes a directive
    if (nextStatus === "COMPLETED" || nextStatus === "ACKNOWLEDGED") {
      try {
        await db.dashboardNotification.create({
          data: {
            department: "EXECUTIVE",
            title: `[Directive ${nextStatus}] ${existing.reference}`,
            message: `${user.fullName || userDept} marked "${existing.title}" as ${nextStatus}.`,
            type: "EXECUTIVE_DIRECTIVE_UPDATE",
            link: "/dashboard/md",
            isRead: false,
          },
        });
      } catch {}
    }

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: `DIRECTIVE_${nextStatus}`,
      entity: "ExecutiveDirective",
      entityId: id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { reference: existing.reference, status: nextStatus },
    });

    return NextResponse.json({ success: true, directive: updated });
  } catch (error) {
    console.error("PATCH /api/executive/directives error:", error);
    return NextResponse.json({ error: "Failed to update directive" }, { status: 500 });
  }
}
