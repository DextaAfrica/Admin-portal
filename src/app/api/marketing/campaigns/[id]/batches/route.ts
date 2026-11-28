import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import {
  getCampaignBatchStatus,
  pauseCampaignBatches,
  processNextBatch,
  resumeCampaignBatches,
  retryFailedCampaignRecipients,
} from "@/lib/email/batch-engine";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Advance any due batch automatically when polled
    try {
      await processNextBatch(id, false);
    } catch (err) {
      console.warn("[Batch Poll] Non-fatal batch advance error:", err);
    }

    const status = await getCampaignBatchStatus(id);
    return NextResponse.json(status);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load batch status" },
      { status: 500 }
    );
  }
}

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

    const { id } = await params;
    const body = await req.json();
    const action = String(body?.action || "");

    let result;
    if (action === "send_next") {
      await processNextBatch(id, true);
      result = await getCampaignBatchStatus(id);
    } else if (action === "pause") {
      result = await pauseCampaignBatches(id);
    } else if (action === "resume") {
      result = await resumeCampaignBatches(id);
    } else if (action === "retry_failed") {
      result = await retryFailedCampaignRecipients(id);
    } else {
      return NextResponse.json({ error: "Unsupported batch action" }, { status: 400 });
    }

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: `CAMPAIGN_BATCH_${action.toUpperCase()}`,
      entity: "EmailCampaign",
      entityId: id,
      metadata: {
        status: result.campaign.status,
        completedBatches: result.campaign.completedBatches,
        totalBatches: result.campaign.totalBatches,
      },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to execute batch action" },
      { status: 500 }
    );
  }
}
