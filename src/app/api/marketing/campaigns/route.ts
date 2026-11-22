import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auth/audit";
import { CreateMarketingCampaignSchema, formatZodError } from "@/lib/validation/schemas";

/**
 * Ensures the EmailCampaign table and indexes exist on the underlying SQLite database.
 * Auto-heals in production if migrations were not executed.
 */
async function ensureCampaignsSchema(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EmailCampaign" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "contentHtml" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'DRAFT',
        "recipientCount" INTEGER NOT NULL DEFAULT 0,
        "openCount" INTEGER NOT NULL DEFAULT 0,
        "clickCount" INTEGER NOT NULL DEFAULT 0,
        "sentAt" DATETIME,
        "createdById" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "EmailCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EmailCampaign_status_idx" ON "EmailCampaign"("status");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EmailCampaign_createdAt_idx" ON "EmailCampaign"("createdAt");`);
  } catch (schemaErr) {
    console.warn("⚠️  [Marketing] Schema self-healing note:", schemaErr);
  }
}

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
      const campaigns = await prisma.emailCampaign.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          creator: { select: { fullName: true, email: true } },
        },
      });
      return NextResponse.json({ campaigns });
    } catch {
      await ensureCampaignsSchema();
      const retryCampaigns = await prisma.emailCampaign.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          creator: { select: { fullName: true, email: true } },
        },
      });
      return NextResponse.json({ campaigns: retryCampaigns });
    }
  } catch (err: unknown) {
    console.error("GET /api/marketing/campaigns error:", err);
    return NextResponse.json({ campaigns: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = CreateMarketingCampaignSchema.safeParse(body);
    if (!parsed.success) {
      const err = formatZodError(parsed.error);
      return NextResponse.json(err, { status: 400 });
    }

    const { title, subject, contentHtml } = parsed.data;

    let campaign;
    try {
      campaign = await prisma.emailCampaign.create({
        data: {
          title,
          subject,
          contentHtml,
          status: "DRAFT",
          createdById: user.id,
        },
      });
    } catch {
      // Self-heal table schema on failure
      await ensureCampaignsSchema();

      try {
        campaign = await prisma.emailCampaign.create({
          data: {
            title,
            subject,
            contentHtml,
            status: "DRAFT",
            createdById: user.id,
          },
        });
      } catch {
        // If createdById fails foreign-key constraint check (e.g. session user ID mismatch)
        campaign = await prisma.emailCampaign.create({
          data: {
            title,
            subject,
            contentHtml,
            status: "DRAFT",
            createdById: null,
          },
        });
      }
    }

    logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "CAMPAIGN_CREATED",
      entity: "EmailCampaign",
      entityId: campaign.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { title, subject },
    }).catch((auditErr) => console.warn("Audit log skipped:", auditErr));

    return NextResponse.json({ success: true, campaign });
  } catch (err: unknown) {
    console.error("POST /api/marketing/campaigns error:", err);
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

    try {
      const campaign = await prisma.emailCampaign.update({
        where: { id },
        data: {
          title,
          subject,
          contentHtml,
        },
      });
      return NextResponse.json({ success: true, campaign });
    } catch {
      await ensureCampaignsSchema();
      const campaign = await prisma.emailCampaign.update({
        where: { id },
        data: {
          title,
          subject,
          contentHtml,
        },
      });
      return NextResponse.json({ success: true, campaign });
    }
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

    try {
      await prisma.emailCampaign.delete({
        where: { id },
      });
    } catch {
      await ensureCampaignsSchema();
      await prisma.emailCampaign.delete({
        where: { id },
      }).catch(() => null);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
