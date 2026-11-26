import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ensureCrmSchema } from "@/lib/crm/schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureCrmSchema();

    const body = await req.json();
    const { clientId, title, value, currency, stage, probability, expectedCloseDate, notes } = body;

    if (!clientId || !title) {
      return NextResponse.json({ error: "Client ID and Deal Title are required" }, { status: 400 });
    }

    const deal = await prisma.crmDeal.create({
      data: {
        clientId,
        title: String(title).trim(),
        value: Number(value) || 0,
        currency: currency || "USD",
        stage: stage || "PROPOSAL",
        probability: Number(probability) || 60,
        ownerUserId: user.id,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        notes: notes || "",
      },
    });

    return NextResponse.json({ success: true, deal });
  } catch (err: any) {
    console.error("[CRM Deals POST Error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to create deal" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureCrmSchema();

    const { dealId, stage, probability } = await req.json();
    if (!dealId || !stage) {
      return NextResponse.json({ error: "dealId and stage are required" }, { status: 400 });
    }

    const stageProbMap: Record<string, number> = {
      PROPOSAL: 40,
      DUE_DILIGENCE: 65,
      CLOSING: 85,
      WON: 100,
      LOST: 0,
    };

    const updated = await prisma.crmDeal.update({
      where: { id: dealId },
      data: {
        stage,
        probability: probability !== undefined ? Number(probability) : stageProbMap[stage] ?? 50,
      },
    });

    return NextResponse.json({ success: true, deal: updated });
  } catch (err: any) {
    console.error("[CRM Deals PATCH Error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to update deal stage" }, { status: 500 });
  }
}
