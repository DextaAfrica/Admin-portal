import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { dispatchCampaign } from "@/lib/email/dispatcher";
import { logAuditEvent } from "@/lib/auth/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const campaignId = params.id;
    const updated = await dispatchCampaign(campaignId);

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "CAMPAIGN_DISPATCHED",
      entity: "EmailCampaign",
      entityId: campaignId,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { recipientCount: updated.recipientCount },
    });

    return NextResponse.json({ success: true, campaign: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to dispatch campaign" },
      { status: 500 }
    );
  }
}

