import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email/dispatcher";
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
    const category = searchParams.get("category");
    const direction = searchParams.get("direction");

    const where: any = {};
    if (category && category !== "ALL") where.category = category;
    if (direction && direction !== "ALL") where.direction = direction;

    const emails = await db.corporateEmail.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const totalCount = await db.corporateEmail.count();
    const outboundCount = await db.corporateEmail.count({ where: { direction: "OUTBOUND" } });
    const internalCount = await db.corporateEmail.count({ where: { direction: "INTERNAL" } });

    return NextResponse.json({
      emails,
      stats: {
        total: totalCount,
        outbound: outboundCount,
        internal: internalCount,
      },
    });
  } catch (error) {
    console.error("GET /api/corporate-emails error:", error);
    return NextResponse.json({ error: "Failed to fetch corporate emails" }, { status: 500 });
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
      toEmail,
      toName,
      toDepartment,
      subject,
      bodyHtml,
      category = "OPERATIONS",
      direction = "OUTBOUND",
    } = body;

    if (!toEmail || !subject || !bodyHtml) {
      return NextResponse.json(
        { error: "Recipient email, subject, and message content are required" },
        { status: 400 }
      );
    }

    const fromDepartment = user.department || "OPERATIONS";
    const fromEmail = user.email;
    const fromName = user.fullName;

    // Wrap bodyHtml in executive corporate styling
    const styledHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff; color: #09090b;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f4f4f5; padding-bottom: 16px; margin-bottom: 24px;">
          <div style="font-size: 20px; font-weight: 800; color: #09090b;">De<span style="color: #ED2618;">x</span>ta <span style="font-size: 11px; text-transform: uppercase; color: #71717a; margin-left: 8px;">${fromDepartment} Communications</span></div>
          <span style="font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; background: #f4f4f5; color: #3f3f46;">${category}</span>
        </div>

        <div style="font-size: 14px; color: #18181b; line-height: 1.6; margin-bottom: 24px;">
          ${bodyHtml}
        </div>

        <div style="background: #fafafa; border-radius: 8px; padding: 16px; margin-top: 24px; border: 1px solid #f4f4f5; font-size: 12px; color: #71717a;">
          <div><strong>Sender:</strong> ${fromName} (${fromDepartment} Department)</div>
          <div><strong>Corporate Email:</strong> ${fromEmail}</div>
        </div>

        <div style="border-top: 1px solid #f4f4f5; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #a1a1aa; text-align: center;">
          &copy; 2026 Dexta Africa Enterprise Gateway &bull; Official Operations Correspondence
        </div>
      </div>
    `;

    // Real SMTP Dispatch via Mailpit
    const sendResult = await sendEmail({
      to: toEmail,
      subject,
      html: styledHtml,
    });

    // Save to CorporateEmail table
    const emailRecord = await db.corporateEmail.create({
      data: {
        direction,
        fromEmail,
        fromName,
        fromDepartment,
        toEmail,
        toName: toName || toEmail,
        toDepartment: toDepartment || null,
        subject,
        bodyHtml,
        status: sendResult.success ? "DELIVERED" : "FAILED",
        smtpMessageId: sendResult.messageId || null,
        category,
      },
    });

    // Notify target department if internal
    if (direction === "INTERNAL" && toDepartment) {
      await db.dashboardNotification.create({
        data: {
          department: toDepartment,
          title: `New Internal Communication: ${subject}`,
          message: `${fromName} (${fromDepartment}) sent an official message regarding "${subject}".`,
          type: "EMAIL_RECEIVED",
          link: "/dashboard",
          isRead: false,
        },
      });
    }

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "CORPORATE_EMAIL_DISPATCHED",
      entity: "CorporateEmail",
      entityId: emailRecord.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { toEmail, subject, category, direction, success: sendResult.success },
    });

    return NextResponse.json({
      success: true,
      email: emailRecord,
      deliveredViaSmtp: sendResult.success,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/corporate-emails error:", error);
    return NextResponse.json({ error: "Failed to dispatch corporate email" }, { status: 500 });
  }
}

