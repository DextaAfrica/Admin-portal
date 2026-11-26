import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { dispatchCampaign } from "@/lib/email/dispatcher";
import { ensureEmailCampaignsSchema } from "@/lib/email/campaign-schema";

export const dynamic = "force-dynamic";

// GET or POST /api/marketing/campaigns/process-scheduled -> checks for due scheduled campaigns and sends them
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const hasValidCronAuth = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

    if (!hasValidCronAuth) {
      const { user } = await getCurrentSession();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    await ensureEmailCampaignsSchema();

    const now = new Date();
    const dueCampaigns = await prisma.emailCampaign.findMany({
      where: {
        status: "SCHEDULED",
        sentAt: { lte: now },
      },
      orderBy: { sentAt: "asc" },
    });

    const results = [];
    for (const campaign of dueCampaigns) {
      try {
        let customRecipients: Array<{ email: string; fullName?: string }> | undefined;
        if (campaign.scheduledRecipients) {
          try {
            const parsed = JSON.parse(campaign.scheduledRecipients);
            if (Array.isArray(parsed) && parsed.length > 0) {
              customRecipients = parsed;
            }
          } catch {
            customRecipients = undefined;
          }
        }

        const targetCategory =
          campaign.scheduledTarget && campaign.scheduledTarget !== "CUSTOM_LIST"
            ? campaign.scheduledTarget
            : "ALL";

        const dispatched = await dispatchCampaign(
          campaign.id,
          targetCategory,
          customRecipients
        );
        results.push({ id: campaign.id, title: campaign.title, success: true, count: dispatched.recipientCount });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Dispatch failed";
        await prisma.emailCampaign.update({
          where: { id: campaign.id },
          data: { status: "FAILED" },
        }).catch(() => {});
        results.push({
          id: campaign.id,
          title: campaign.title,
          success: false,
          error: errorMsg,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: dueCampaigns.length,
      results,
    });
  } catch (err: unknown) {
    console.error("[Process Scheduled Campaigns Error]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
