import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auth/audit";

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const campaigns = await prisma.emailCampaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { fullName: true, email: true } },
      },
    });

    return NextResponse.json({ campaigns });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, subject, contentHtml } = await req.json();

    if (!title || !subject || !contentHtml) {
      return NextResponse.json(
        { error: "Title, subject, and content are required" },
        { status: 400 }
      );
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        title,
        subject,
        contentHtml,
        status: "DRAFT",
        createdById: user.id,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "CAMPAIGN_CREATED",
      entity: "EmailCampaign",
      entityId: campaign.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { title, subject },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create campaign" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, title, subject, contentHtml } = await req.json();

    if (!id || !title || !subject || !contentHtml) {
      return NextResponse.json(
        { error: "Campaign ID, title, subject, and content are required" },
        { status: 400 }
      );
    }

    const campaign = await prisma.emailCampaign.update({
      where: { id },
      data: {
        title,
        subject,
        contentHtml,
      },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
    }

    await prisma.emailCampaign.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
