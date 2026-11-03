import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId, type = "NOTE", title, description, outcome, activityDate } =
      await req.json();

    if (!title) {
      return NextResponse.json({ error: "Activity title is required" }, { status: 400 });
    }

    const activity = await prisma.crmActivity.create({
      data: {
        clientId: clientId || null,
        userId: user.id,
        type,
        title,
        description,
        outcome,
        activityDate: activityDate ? new Date(activityDate) : new Date(),
      },
    });

    return NextResponse.json({ activity }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to record activity" },
      { status: 500 }
    );
  }
}

