import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const db = prisma as any;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const project = await db.infrastructureProject.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, project });
  } catch (err: unknown) {
    console.error("[Project Detail GET Error]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load project" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const existing = await db.infrastructureProject.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const {
      name,
      clientOrEntity,
      location,
      category,
      status,
      progressPct,
      startDate,
      targetEndDate,
      leadEngineer,
      contractorTeam,
      budget,
      currency,
      summary,
      milestones,
      images,
    } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (clientOrEntity !== undefined) updateData.clientOrEntity = clientOrEntity ? clientOrEntity.trim() : null;
    if (location !== undefined) updateData.location = location.trim();
    if (category !== undefined) updateData.category = category.toUpperCase();
    if (status !== undefined) updateData.status = status.toUpperCase();
    if (progressPct !== undefined) updateData.progressPct = Math.min(100, Math.max(0, parseInt(progressPct) || 0));
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (targetEndDate !== undefined) updateData.targetEndDate = targetEndDate ? new Date(targetEndDate) : null;
    if (leadEngineer !== undefined) updateData.leadEngineer = leadEngineer ? leadEngineer.trim() : null;
    if (contractorTeam !== undefined) updateData.contractorTeam = contractorTeam ? contractorTeam.trim() : null;
    if (budget !== undefined) updateData.budget = budget ? parseFloat(budget) : null;
    if (currency !== undefined) updateData.currency = currency.toUpperCase();
    if (summary !== undefined) updateData.summary = summary.trim();
    if (milestones !== undefined) {
      updateData.milestones = typeof milestones === "string" ? milestones : JSON.stringify(milestones);
    }
    if (images !== undefined) {
      updateData.images = typeof images === "string" ? images : JSON.stringify(images);
    }

    const updated = await db.infrastructureProject.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorEmail: user.email,
        action: "UPDATE_PROJECT",
        entity: "InfrastructureProject",
        entityId: id,
        metadata: JSON.stringify({
          code: existing.code,
          name: updated.name,
          status: updated.status,
          progressPct: updated.progressPct,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Project ${existing.code} updated successfully.`,
      project: updated,
    });
  } catch (err: unknown) {
    console.error("[Project Detail PUT Error]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const existing = await db.infrastructureProject.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await db.infrastructureProject.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorEmail: user.email,
        action: "DELETE_PROJECT",
        entity: "InfrastructureProject",
        entityId: id,
        metadata: JSON.stringify({
          code: existing.code,
          name: existing.name,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Project ${existing.code} has been deleted.`,
    });
  } catch (err: unknown) {
    console.error("[Project Detail DELETE Error]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete project" },
      { status: 500 }
    );
  }
}
