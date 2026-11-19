import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { sendEmail } from "@/lib/email/dispatcher";

export const dynamic = "force-dynamic";

const db = prisma as any;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // STRICT STAGE-2 GOVERNANCE:
    // Only Super Admin or Executive Directorate can give Stage-2 Production Authorization
    const userRole = (user.role || "").toUpperCase();
    const userSeniority = (user.seniorityLevel || "").toUpperCase();
    const isSuperAdmin =
      userRole === "SUPER_ADMIN" ||
      userRole === "CEO" ||
      userRole === "MD" ||
      userSeniority === "EXECUTIVE" ||
      user.department?.toUpperCase() === "EXECUTIVE";

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Stage-2 Production Authorization strictly requires Super Admin clearance." },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { action, decisionNotes } = body; // "APPROVE" or "REJECT"

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be APPROVE or REJECT" },
        { status: 400 }
      );
    }

    const existing = await db.productionReleaseRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Release request not found" }, { status: 404 });
    }

    if (existing.status !== "PENDING_SUPER_ADMIN") {
      return NextResponse.json(
        { error: `This ticket is already resolved with status ${existing.status}` },
        { status: 400 }
      );
    }

    const isApproved = action === "APPROVE";
    const newStatus = isApproved ? "APPROVED_LIVE" : "REJECTED";

    const updated = await db.productionReleaseRequest.update({
      where: { id },
      data: {
        status: newStatus,
        stage: 2,
        superAdminId: user.id,
        superAdminName: user.fullName,
        superAdminEmail: user.email,
        approvedAt: isApproved ? new Date() : null,
        rejectedAt: !isApproved ? new Date() : null,
        rejectionReason: !isApproved ? decisionNotes || "Declined by Super Admin." : null,
      },
    });

    // 1. Send Direct In-App Notification to the Initiating Admin
    await db.dashboardNotification.create({
      data: {
        userId: existing.adminId,
        department: "IT",
        title: isApproved
          ? `Production Release Approved: ${existing.ticketNumber}`
          : `Production Release Declined: ${existing.ticketNumber}`,
        message: isApproved
          ? `Super Admin ${user.fullName} has authorized your production release "${existing.title}". The deployment is now LIVE in production.`
          : `Super Admin ${user.fullName} declined your request "${existing.title}". Reason: ${decisionNotes || "See IT governance review notes."}`,
        type: isApproved ? "APPROVAL_GRANTED" : "APPROVAL_REJECTED",
        link: `/it?tab=production&ticket=${existing.ticketNumber}`,
        isRead: false,
      },
    });

    // 2. Dispatch Email Notification directly to Initiating Admin
    try {
      await sendEmail({
        to: existing.adminEmail,
        subject: isApproved
          ? `[Production Live] Request ${existing.ticketNumber} Approved by Super Admin`
          : `[Action Required] Request ${existing.ticketNumber} Declined by Super Admin`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; color: #0f172a;">
            <div style="border-bottom: 2px solid ${isApproved ? "#10b981" : "#ef4444"}; padding-bottom: 16px; margin-bottom: 20px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: ${isApproved ? "#10b981" : "#ef4444"};">
                ${isApproved ? "STAGE-2 PRODUCTION SIGN-OFF GRANTED" : "STAGE-2 REVIEW DECLINED"}
              </span>
              <h2 style="margin: 8px 0 0 0; font-size: 20px; font-weight: 800; color: #0f172a;">
                ${existing.title}
              </h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b; font-family: monospace;">
                Ticket: ${existing.ticketNumber} &bull; Target: ${existing.targetSystem}
              </p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              Hello <strong>${existing.adminName}</strong>,
            </p>

            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              ${
                isApproved
                  ? `Your Stage-1 administrative release request has received final Stage-2 Super Admin authorization from <strong>${user.fullName}</strong>. The requested changes have been executed and deployed live to production.`
                  : `Your Stage-1 release request was reviewed by Super Admin <strong>${user.fullName}</strong> and was not approved for live release at this time.`
              }
            </p>

            ${
              decisionNotes
                ? `<div style="background: #f8fafc; border-left: 4px solid ${isApproved ? "#10b981" : "#ef4444"}; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
                     <div style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Super Admin Decision Notes:</div>
                     <div style="font-size: 13px; color: #1e293b; margin-top: 4px;">${decisionNotes}</div>
                   </div>`
                : ""
            }

            <div style="margin: 28px 0 16px 0;">
              <a href="https://admin.dextaafrica.org/it?tab=production" style="display: inline-block; padding: 12px 24px; background: #0f172a; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 700;">
                View Live Ticket in IT Portal &rarr;
              </a>
            </div>

            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="font-size: 11px; color: #94a3b8; font-family: monospace;">
              Dexta Africa Dual-Key IT Production Governance &bull; Immutable Audit Ref: ${updated.id}
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.warn("Production approval email notification deferred:", emailErr);
    }

    // 3. Immutable Audit Log
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: isApproved ? "IT_PRODUCTION_REQUEST_AUTHORIZED" : "IT_PRODUCTION_REQUEST_REJECTED",
      entity: "ProductionReleaseRequest",
      entityId: updated.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: {
        ticketNumber: existing.ticketNumber,
        initiatingAdmin: existing.adminEmail,
        decisionNotes,
        newStatus,
      },
    });

    return NextResponse.json({
      success: true,
      request: updated,
      message: isApproved
        ? `Request ${existing.ticketNumber} approved and executed live. Initiating Admin notified.`
        : `Request ${existing.ticketNumber} declined with feedback. Initiating Admin notified.`,
    });
  } catch (error: any) {
    console.error("PATCH /api/it/production-approvals/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process production release decision" },
      { status: 500 }
    );
  }
}
