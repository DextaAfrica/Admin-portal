import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";

// Explicit delegate accessor ensures zero IDE TS2339 diagnostics even with cached language server ASTs
const db = prisma as any;

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage");
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.toLowerCase().trim();

    const where: any = {};
    if (stage && stage !== "ALL") {
      where.stage = stage;
    }
    if (category && category !== "ALL") {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { company: { contains: search } },
        { email: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const [clients, totalValueResult, totalCount, activeClientsCount, dealsCount] =
      await Promise.all([
        db.crmClient.findMany({
          where,
          include: {
            deals: {
              orderBy: { createdAt: "desc" },
            },
            activities: {
              orderBy: { activityDate: "desc" },
              take: 5,
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        db.crmDeal.aggregate({
          _sum: { value: true },
        }),
        db.crmClient.count(),
        db.crmClient.count({
          where: { stage: { in: ["CONTRACT_SIGNED", "ACTIVE_ACCOUNT"] } },
        }),
        db.crmDeal.count(),
      ]);

    return NextResponse.json({
      clients,
      stats: {
        totalPipelineValue: totalValueResult._sum.value || 0,
        totalCount,
        activeClientsCount,
        dealsCount,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load CRM clients" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      company,
      email,
      phone,
      category = "PROSPECT",
      stage = "INQUIRY",
      estimatedValue = 0,
      currency = "USD",
      location = "Lagos, Nigeria",
      tags = [],
      notes,
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Client / Organization Name and Email are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db.crmClient.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A client record with this email address already exists" },
        { status: 409 }
      );
    }

    const client = await db.crmClient.create({
      data: {
        name,
        company,
        email: normalizedEmail,
        phone,
        category,
        stage,
        estimatedValue: Number(estimatedValue),
        currency,
        location,
        tags: JSON.stringify(tags),
        notes,
        assignedTo: user.fullName,
      },
    });

    // If deal value provided, create initial deal record
    if (Number(estimatedValue) > 0) {
      await db.crmDeal.create({
        data: {
          clientId: client.id,
          title: `${name} - Strategic Project`,
          value: Number(estimatedValue),
          currency,
          stage: stage === "CONTRACT_SIGNED" ? "CLOSING" : "PROPOSAL",
          probability: stage === "CONTRACT_SIGNED" ? 95 : 50,
        },
      });
    }

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "CRM_CLIENT_CREATED",
      entity: "CrmClient",
      entityId: client.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { name, company, email: normalizedEmail, category, stage },
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create CRM client" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, stage, category, estimatedValue, notes } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    const updated = await db.crmClient.update({
      where: { id },
      data: {
        ...(stage && { stage }),
        ...(category && { category }),
        ...(estimatedValue !== undefined && { estimatedValue: Number(estimatedValue) }),
        ...(notes !== undefined && { notes }),
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "CRM_CLIENT_UPDATED",
      entity: "CrmClient",
      entityId: id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { stage, category, estimatedValue },
    });

    return NextResponse.json({ client: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update client" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    await db.crmClient.delete({ where: { id } });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "CRM_CLIENT_DELETED",
      entity: "CrmClient",
      entityId: id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete client" },
      { status: 500 }
    );
  }
}

