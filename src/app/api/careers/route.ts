import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import {
  SaveCareerListingSchema,
  formatZodError,
} from "@/lib/validation/schemas";
import { triggerCareerOpeningSubmittedWorkflow } from "@/lib/automation/engine";

export const dynamic = "force-dynamic";

const db = prisma as any;

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.toLowerCase().trim();

    const where: any = {};

    if (department && department !== "all" && department !== "ALL") {
      where.department = department;
    }

    if (status && status !== "all" && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { department: { contains: search } },
        { location: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const openings = await db.careerOpening.findMany({
      where,
      include: {
        inquiries: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const parsedOpenings = openings.map((item: any) => ({
      ...item,
      requirements: safeJsonParse(item.requirements, []),
      benefits: safeJsonParse(item.benefits, []),
      description: safeJsonParse(item.description, {}),
    }));

    const [
      totalCount,
      pendingItCount,
      openCount,
      filledPendingTakedownCount,
      closedCount,
    ] = await Promise.all([
      db.careerOpening.count(),
      db.careerOpening.count({ where: { status: "PENDING_IT_APPROVAL" } }),
      db.careerOpening.count({ where: { status: "OPEN" } }),
      db.careerOpening.count({ where: { status: "FILLED_PENDING_TAKEDOWN" } }),
      db.careerOpening.count({ where: { status: "CLOSED" } }),
    ]);

    return NextResponse.json({
      data: parsedOpenings,
      stats: {
        total: totalCount,
        pendingIt: pendingItCount,
        open: openCount,
        filledPendingTakedown: filledPendingTakedownCount,
        closed: closedCount,
      },
      currentUser: {
        id: user.id,
        role: user.role,
        department: user.department,
        fullName: user.fullName,
      },
    });
  } catch (error: any) {
    console.error("GET /api/careers error:", error);
    return NextResponse.json(
      { error: "Failed to load career listings", details: error?.message },
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

    // Role check: HR, Admin, or Super Admin can initiate job openings
    const userDept = (user.department || "").toUpperCase();
    const userRole = (user.role || "").toUpperCase();
    const isHrOrAdmin =
      userRole === "SUPER_ADMIN" ||
      userRole === "ADMIN" ||
      userRole === "HR_MANAGER" ||
      userDept === "HR" ||
      userDept === "EXECUTIVE";

    if (!isHrOrAdmin) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Initiating career openings is restricted to the People & HR Directorate.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = SaveCareerListingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }

    const {
      title,
      slug,
      department,
      location,
      type,
      summary,
      requirements,
      benefits,
      description,
    } = parsed.data;

    // Check slug uniqueness
    const existing = await db.careerOpening.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A position with the slug "${slug}" already exists.` },
        { status: 409 }
      );
    }

    // By enterprise rule: HR initiates with status "PENDING_IT_APPROVAL" and published: false
    const newOpening = await db.careerOpening.create({
      data: {
        title,
        slug,
        department,
        location,
        type,
        summary,
        requirements: JSON.stringify(requirements),
        benefits: JSON.stringify(benefits || []),
        description: JSON.stringify(description || {}),
        status: "PENDING_IT_APPROVAL",
        published: false,
        initiatedById: user.id,
        initiatedByName: user.fullName,
        initiatedByEmail: user.email,
        applicantClickCount: 0,
      },
    });

    // Fire automated workflow to notify IT Department
    await triggerCareerOpeningSubmittedWorkflow({
      id: newOpening.id,
      title: newOpening.title,
      department: newOpening.department,
      location: newOpening.location,
      slug: newOpening.slug,
      initiatedByName: user.fullName,
      initiatedByEmail: user.email,
    });

    // Log enterprise audit event
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "HR_CAREER_OPENING_INITIATED",
      entity: "CareerOpening",
      entityId: newOpening.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: {
        title,
        slug,
        department,
        status: "PENDING_IT_APPROVAL",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newOpening,
          requirements,
          benefits,
          description,
        },
        message:
          "Opening initiated by HR. IT Department has been notified for web clearance.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/careers error:", error);
    return NextResponse.json(
      { error: "Failed to initiate career opening", details: error?.message },
      { status: 500 }
    );
  }
}

function safeJsonParse(val: any, fallback: any) {
  if (!val) return fallback;
  if (typeof val !== "string") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}
