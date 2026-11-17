import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { CreateCrmActivitySchema, formatZodError } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateCrmActivitySchema.safeParse(body);
    if (!parsed.success) {
      const err = formatZodError(parsed.error);
      return NextResponse.json(err, { status: 400 });
    }

    const { clientId, type, title, description, outcome, activityDate } = parsed.data;

    const db = prisma as any;
    const activity = await db.crmActivity.create({
      data: {
        clientId: clientId || null,
        userId: user.id,
        type,
        title,
        description,
        outcome,
        activityDate: new Date(activityDate),
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

