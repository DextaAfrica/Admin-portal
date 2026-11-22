import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { MarketingAudienceSubscriberSchema, formatZodError } from "@/lib/validation/schemas";

/**
 * Ensures AudienceSubscriber table exists on SQLite in production.
 */
async function ensureAudienceSchema(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AudienceSubscriber" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL,
        "firstName" TEXT,
        "lastName" TEXT,
        "phone" TEXT,
        "company" TEXT,
        "category" TEXT NOT NULL DEFAULT 'NEWSLETTER',
        "notes" TEXT,
        "status" TEXT NOT NULL DEFAULT 'SUBSCRIBED',
        "tags" TEXT NOT NULL DEFAULT '[]',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "AudienceSubscriber_email_key" ON "AudienceSubscriber"("email");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AudienceSubscriber_status_idx" ON "AudienceSubscriber"("status");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AudienceSubscriber_category_idx" ON "AudienceSubscriber"("category");`);
  } catch (schemaErr) {
    console.warn("⚠️  [Audience] Schema self-healing note:", schemaErr);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";

    const whereClause: any = {};
    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (q) {
      whereClause.OR = [
        { email: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { company: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    let subscribers: any[] = [];
    let allSubscribers: any[] = [];

    try {
      subscribers = await prisma.audienceSubscriber.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
      });
      allSubscribers = await prisma.audienceSubscriber.findMany({
        select: { category: true, status: true },
      });
    } catch {
      await ensureAudienceSchema();
      try {
        subscribers = await prisma.audienceSubscriber.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
        });
        allSubscribers = await prisma.audienceSubscriber.findMany({
          select: { category: true, status: true },
        });
      } catch {
        subscribers = [];
        allSubscribers = [];
      }
    }

    // Compute category aggregations
    const categoryCounts: Record<string, number> = {
      ALL: allSubscribers.length,
      CLIENT: 0,
      INVESTOR: 0,
      PARTNER: 0,
      CONTRACTOR: 0,
      LEAD: 0,
      NEWSLETTER: 0,
    };

    allSubscribers.forEach((s) => {
      if (s.category && categoryCounts[s.category] !== undefined) {
        categoryCounts[s.category] += 1;
      }
    });

    return NextResponse.json({
      subscribers,
      categoryCounts,
      totalCount: allSubscribers.length,
      activeSubscribersCount: allSubscribers.filter((s) => s.status === "SUBSCRIBED").length,
    });
  } catch (err: unknown) {
    console.error("GET /api/marketing/audience error:", err);
    return NextResponse.json({
      subscribers: [],
      categoryCounts: {
        ALL: 0,
        CLIENT: 0,
        INVESTOR: 0,
        PARTNER: 0,
        CONTRACTOR: 0,
        LEAD: 0,
        NEWSLETTER: 0,
      },
      totalCount: 0,
      activeSubscribersCount: 0,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = MarketingAudienceSubscriberSchema.safeParse(body);
    if (!parsed.success) {
      const err = formatZodError(parsed.error);
      return NextResponse.json(err, { status: 400 });
    }

    const { email, firstName, lastName, phone, company, category, notes, tags } = parsed.data;

    let subscriber;
    try {
      subscriber = await prisma.audienceSubscriber.upsert({
        where: { email },
        update: {
          firstName,
          lastName,
          phone,
          company,
          category,
          notes,
          tags: JSON.stringify(tags),
        },
        create: {
          email,
          firstName,
          lastName,
          phone,
          company,
          category,
          notes,
          status: "SUBSCRIBED",
          tags: JSON.stringify(tags),
        },
      });
    } catch {
      await ensureAudienceSchema();
      subscriber = await prisma.audienceSubscriber.upsert({
        where: { email },
        update: {
          firstName,
          lastName,
          phone,
          company,
          category,
          notes,
          tags: JSON.stringify(tags),
        },
        create: {
          email,
          firstName,
          lastName,
          phone,
          company,
          category,
          notes,
          status: "SUBSCRIBED",
          tags: JSON.stringify(tags),
        },
      });
    }

    return NextResponse.json({ success: true, subscriber });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save contact" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {
        // query param is fallback
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Contact ID is required" }, { status: 400 });
    }

    try {
      await prisma.audienceSubscriber.delete({
        where: { id },
      });
    } catch {
      await ensureAudienceSchema();
      await prisma.audienceSubscriber.delete({
        where: { id },
      }).catch(() => null);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete contact" },
      { status: 500 }
    );
  }
}
