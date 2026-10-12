import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const subscribers = await prisma.audienceSubscriber.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ subscribers });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load audience" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { email, firstName, lastName, tags } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const subscriber = await prisma.audienceSubscriber.upsert({
      where: { email: email.toLowerCase().trim() },
      update: {
        firstName,
        lastName,
        tags: JSON.stringify(tags || []),
      },
      create: {
        email: email.toLowerCase().trim(),
        firstName,
        lastName,
        status: "SUBSCRIBED",
        tags: JSON.stringify(tags || []),
      },
    });

    return NextResponse.json({ success: true, subscriber });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add subscriber" },
      { status: 500 }
    );
  }
}

