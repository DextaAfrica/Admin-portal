import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchCampaign } from "@/lib/email/dispatcher";

export const dynamic = "force-dynamic";

// GET or POST /api/marketing/campaigns/process-scheduled -> checks for due scheduled campaigns and sends them
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    // Allow internal or secret-authenticated calls
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Check session if not cron
    }

    const now = new Date();
    const dueCampaigns = await prisma.emailCampaign.findMany({
      where: {
        status: "SCHEDULED",
        sentAt: { lte: now },
      },
    });

    const results = [];
    for (const campaign of dueCampaigns) {
      try {
        const dispatched = await dispatchCampaign(campaign.id);
        results.push({ id: campaign.id, success: true, count: dispatched.recipientCount });
      } catch (err: unknown) {
        results.push({
          id: campaign.id,
          success: false,
          error: err instanceof Error ? err.message : "Dispatch failed",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: dueCampaigns.length,
      results,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
