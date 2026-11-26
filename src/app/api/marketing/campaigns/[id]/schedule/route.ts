import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auth/audit";
import { ensureEmailCampaignsSchema } from "@/lib/email/campaign-schema";

export const dynamic = "force-dynamic";

// POST /api/marketing/campaigns/[id]/schedule -> Schedule a campaign for future delivery
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureEmailCampaignsSchema();

    const { id: campaignId } = await params;
    const { scheduledAt, targetCategory, customRecipients } = await req.json();

    if (!scheduledAt) {
      return NextResponse.json(
        { error: "A valid scheduled date and time is required." },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format provided for scheduling." },
        { status: 400 }
      );
    }

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Determine target recipient count accurately across Custom List, CustomForm, and AudienceSubscriber
    let recipientCount = 0;
    const hasCustomList = Array.isArray(customRecipients) && customRecipients.length > 0;
    const cleanTarget = targetCategory || (hasCustomList ? "CUSTOM_LIST" : "ALL");

    if (hasCustomList) {
      recipientCount = customRecipients.length;
    } else if (cleanTarget.startsWith("FORM:")) {
      const slug = cleanTarget.replace("FORM:", "").trim();
      const form = await prisma.customForm.findUnique({
        where: { slug },
        include: { submissions: true },
      });
      recipientCount = form
        ? form.submissions.filter((s) => s.status !== "ARCHIVED" && Boolean(s.email)).length
        : 0;
    } else if (cleanTarget !== "ALL") {
      recipientCount = await prisma.audienceSubscriber.count({
        where: { status: "SUBSCRIBED", category: cleanTarget },
      });
    } else {
      const subCount = await prisma.audienceSubscriber.count({
        where: { status: "SUBSCRIBED" },
      });
      const formSubCount = await prisma.formSubmission.count();
      recipientCount = subCount > 0 ? subCount : formSubCount;
    }

    const updated = await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: "SCHEDULED",
        sentAt: scheduledDate,
        recipientCount,
        scheduledTarget: cleanTarget,
        scheduledRecipients: hasCustomList ? JSON.stringify(customRecipients) : null,
      },
    });

    try {
      await logAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: "CAMPAIGN_SCHEDULED",
        entity: "EmailCampaign",
        entityId: campaignId,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
        metadata: {
          scheduledAt: scheduledDate.toISOString(),
          recipientCount,
          targetCategory: cleanTarget,
        },
      });
    } catch (auditErr) {
      console.warn("[Schedule Audit Warning]:", auditErr);
    }

    return NextResponse.json({
      success: true,
      campaign: updated,
      message: `Campaign scheduled for delivery on ${scheduledDate.toLocaleString()}`,
    });
  } catch (err: unknown) {
    console.error("[Schedule POST Error]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to schedule campaign" },
      { status: 500 }
    );
  }
}

// DELETE /api/marketing/campaigns/[id]/schedule -> Cancel scheduled delivery and revert to draft
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureEmailCampaignsSchema();

    const { id: campaignId } = await params;
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const updated = await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: "DRAFT",
        sentAt: null,
      },
    });

    try {
      await logAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: "CAMPAIGN_SCHEDULE_CANCELLED",
        entity: "EmailCampaign",
        entityId: campaignId,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
        metadata: { previousStatus: campaign.status },
      });
    } catch (auditErr) {
      console.warn("[Cancel Schedule Audit Warning]:", auditErr);
    }

    return NextResponse.json({
      success: true,
      campaign: updated,
      message: "Scheduled delivery cancelled. Campaign returned to drafts.",
    });
  } catch (err: unknown) {
    console.error("[Schedule DELETE Error]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to cancel scheduled campaign" },
      { status: 500 }
    );
  }
}
