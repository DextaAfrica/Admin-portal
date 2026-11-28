import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { startBatchedCampaign, BatchConfig } from "@/lib/email/batch-engine";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role === "AUDITOR") {
      return NextResponse.json(
        { error: "Reviewer (AUDITOR) role has read-only permissions." },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const campaignId = resolvedParams.id;
    let targetCategory: string | undefined = undefined;
    let customRecipients: any[] | undefined = undefined;
    let batchConfig: Partial<BatchConfig> | undefined = undefined;

    try {
      const body = await req.json();
      targetCategory = body?.targetCategory;
      customRecipients = body?.customRecipients;
      batchConfig = body?.batchConfig;
    } catch {
      // body optional
    }

    const result = await startBatchedCampaign(
      campaignId,
      targetCategory,
      customRecipients,
      batchConfig
    );

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "CAMPAIGN_BATCH_DISPATCH_STARTED",
      entity: "EmailCampaign",
      entityId: campaignId,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: {
        recipientCount: result.campaign.recipientCount,
        totalBatches: result.campaign.totalBatches,
        completedBatches: result.campaign.completedBatches,
        batchConfig: result.batchConfig,
        targetCategory: targetCategory || (customRecipients?.length ? "CUSTOM_LIST" : "ALL"),
      },
    });

    return NextResponse.json({
      success: true,
      campaign: result.campaign,
      batches: result.batches,
      batchConfig: result.batchConfig,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to dispatch campaign" },
      { status: 500 }
    );
  }
}
