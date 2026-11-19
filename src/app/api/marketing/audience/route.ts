import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { MarketingAudienceSubscriberSchema, formatZodError } from "@/lib/validation/schemas";

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

    const subscribers = await prisma.audienceSubscriber.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    // Compute category aggregations
    const allSubscribers = await prisma.audienceSubscriber.findMany({
      select: { category: true, status: true },
    });

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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load audience contacts" },
      { status: 500 }
    );
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

    const subscriber = await prisma.audienceSubscriber.upsert({
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

    await prisma.audienceSubscriber.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Contact deleted successfully" });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete contact" },
      { status: 500 }
    );
  }
}
