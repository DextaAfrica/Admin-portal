import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const db = prisma as any;

/**
 * Operations Infrastructure Projects API
 * Allows the Operations Officer to enter, track, and manage projects & milestones.
 */

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (category && category !== "ALL") where.category = category;

    const projects = await db.infrastructureProject.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    let filtered = projects;
    if (search) {
      filtered = projects.filter((p: any) => {
        const text = `${p.code} ${p.name} ${p.location} ${p.clientOrEntity || ""} ${p.leadEngineer || ""} ${p.contractorTeam || ""}`.toLowerCase();
        return text.includes(search);
      });
    }

    return NextResponse.json({
      success: true,
      projects: filtered,
      totalCount: filtered.length,
    });
  } catch (err: unknown) {
    console.error("[Projects API GET Error]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load projects" },
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
      clientOrEntity,
      location,
      category = "INFRASTRUCTURE",
      status = "IN_PROGRESS",
      progressPct = 0,
      startDate,
      targetEndDate,
      leadEngineer,
      contractorTeam,
      budget = 0,
      currency = "NGN",
      summary = "",
      milestones = [],
      images = [],
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    if (!location || !location.trim()) {
      return NextResponse.json({ error: "Project location / site corridor is required" }, { status: 400 });
    }

    // Auto-generate project code e.g. PRJ-2026-001
    const count = await db.infrastructureProject.count();
    const year = new Date().getFullYear();
    const code = `PRJ-${year}-${String(count + 1).padStart(3, "0")}`;

    const newProject = await db.infrastructureProject.create({
      data: {
        code,
        name: name.trim(),
        clientOrEntity: clientOrEntity ? clientOrEntity.trim() : null,
        location: location.trim(),
        category: category.toUpperCase(),
        status: status.toUpperCase(),
        progressPct: Math.min(100, Math.max(0, parseInt(progressPct) || 0)),
        startDate: startDate ? new Date(startDate) : new Date(),
        targetEndDate: targetEndDate ? new Date(targetEndDate) : null,
        leadEngineer: leadEngineer ? leadEngineer.trim() : user.fullName,
        contractorTeam: contractorTeam ? contractorTeam.trim() : null,
        budget: parseFloat(budget) || null,
        currency: currency.toUpperCase(),
        summary: summary.trim(),
        milestones: typeof milestones === "string" ? milestones : JSON.stringify(milestones),
        images: typeof images === "string" ? images : JSON.stringify(images),
        createdByEmail: user.email,
        createdByName: user.fullName,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorEmail: user.email,
        action: "CREATE_PROJECT",
        entity: "InfrastructureProject",
        entityId: newProject.id,
        metadata: JSON.stringify({
          code,
          name: newProject.name,
          location: newProject.location,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Project ${code} entered successfully.`,
      project: newProject,
    });
  } catch (err: unknown) {
    console.error("[Projects API POST Error]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to enter project" },
      { status: 500 }
    );
  }
}
