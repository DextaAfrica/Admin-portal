import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import {
  triggerCareerOpeningApprovedWorkflow,
  triggerCareerRoleFilledWorkflow,
  triggerCareerPostTakenDownWorkflow,
} from "@/lib/automation/engine";
import {
  SaveCareerListingSchema,
  formatZodError,
} from "@/lib/validation/schemas";

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
    const opening = await db.careerOpening.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        inquiries: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!opening) {
      return NextResponse.json(
        { error: "Career opening not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        ...opening,
        requirements: safeJsonParse(opening.requirements, []),
        benefits: safeJsonParse(opening.benefits, []),
        description: safeJsonParse(opening.description, {}),
      },
    });
  } catch (error: any) {
    console.error("GET /api/careers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch opening", details: error?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const existing = await db.careerOpening.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Career opening not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const userRole = (user.role || "").toUpperCase();
    const userDept = (user.department || "").toUpperCase();
    const isSuperAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";
    const isIt = isSuperAdmin || userRole === "IT_ADMIN" || userDept === "IT";
    const isHr = isSuperAdmin || userRole === "HR_MANAGER" || userDept === "HR";

    // -------------------------------------------------------------------------
    // Workflow Action 1: IT Department Approves & Publishes to Website
    // -------------------------------------------------------------------------
    if (body.action === "IT_APPROVE") {
      if (!isIt) {
        return NextResponse.json(
          {
            error:
              "Forbidden: Only IT Department administrators can grant website clearance and publish.",
          },
          { status: 403 }
        );
      }

      const updated = await db.careerOpening.update({
        where: { id: existing.id },
        data: {
          status: "OPEN",
          published: true,
          itApprovedById: user.id,
          itApprovedByName: user.fullName,
          itApprovedAt: new Date(),
        },
      });

      await triggerCareerOpeningApprovedWorkflow({
        id: updated.id,
        title: updated.title,
        approvedByName: user.fullName,
        slug: updated.slug,
      });

      await logAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: "IT_CAREER_OPENING_APPROVED_PUBLISHED",
        entity: "CareerOpening",
        entityId: updated.id,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
        metadata: {
          title: updated.title,
          slug: updated.slug,
          action: "IT_APPROVE",
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: `"${updated.title}" approved and published to the live company website.`,
      });
    }

    // -------------------------------------------------------------------------
    // Workflow Action 2: HR Marks Role Filled & Sends Takedown Notice to IT
    // -------------------------------------------------------------------------
    if (body.action === "HR_REQUEST_TAKEDOWN") {
      if (!isHr) {
        return NextResponse.json(
          {
            error:
              "Forbidden: Only HR Department can declare a role filled and request takedown.",
          },
          { status: 403 }
        );
      }

      const notes = body.notes || "Position filled by successful candidate.";

      const updated = await db.careerOpening.update({
        where: { id: existing.id },
        data: {
          status: "FILLED_PENDING_TAKEDOWN",
          takedownRequestedAt: new Date(),
          takedownNotes: notes,
        },
      });

      await triggerCareerRoleFilledWorkflow({
        id: updated.id,
        title: updated.title,
        hrName: user.fullName,
        notes,
      });

      await logAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: "HR_CAREER_ROLE_FILLED_TAKEDOWN_REQUESTED",
        entity: "CareerOpening",
        entityId: updated.id,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
        metadata: {
          title: updated.title,
          slug: updated.slug,
          notes,
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Role marked as filled. IT Department notified to take down post.`,
      });
    }

    // -------------------------------------------------------------------------
    // Workflow Action 3: IT Takes Down the Post from the Website
    // -------------------------------------------------------------------------
    if (body.action === "IT_TAKEDOWN") {
      if (!isIt) {
        return NextResponse.json(
          {
            error:
              "Forbidden: Only IT Department administrators can execute post takedown.",
          },
          { status: 403 }
        );
      }

      const updated = await db.careerOpening.update({
        where: { id: existing.id },
        data: {
          status: "CLOSED",
          published: false,
          takenDownById: user.id,
          takenDownByName: user.fullName,
          takenDownAt: new Date(),
        },
      });

      await triggerCareerPostTakenDownWorkflow({
        id: updated.id,
        title: updated.title,
        itName: user.fullName,
      });

      await logAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: "IT_CAREER_OPENING_TAKEN_DOWN",
        entity: "CareerOpening",
        entityId: updated.id,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
        metadata: {
          title: updated.title,
          slug: updated.slug,
          action: "IT_TAKEDOWN",
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: `"${updated.title}" successfully taken down and unpublished from the website.`,
      });
    }

    // -------------------------------------------------------------------------
    // Workflow Action 4: Re-open listing
    // -------------------------------------------------------------------------
    if (body.action === "REOPEN") {
      if (!isHr && !isIt) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const updated = await db.careerOpening.update({
        where: { id: existing.id },
        data: {
          status: "PENDING_IT_APPROVAL",
          published: false,
          takedownNotes: null,
          takedownRequestedAt: null,
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Position reopened and submitted for IT clearance.",
      });
    }

    // -------------------------------------------------------------------------
    // Standard Update: Edit Position Details
    // -------------------------------------------------------------------------
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
      status,
      published,
    } = parsed.data;

    // Check if slug taken by another opening
    if (slug !== existing.slug) {
      const duplicate = await db.careerOpening.findUnique({
        where: { slug },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: `The slug "${slug}" is already in use by another opening.` },
          { status: 409 }
        );
      }
    }

    // Normalizing status
    let normalizedStatus = status || existing.status;
    if (normalizedStatus === "open") normalizedStatus = "OPEN";
    if (normalizedStatus === "closed") normalizedStatus = "CLOSED";

    const updated = await db.careerOpening.update({
      where: { id: existing.id },
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
        status: normalizedStatus,
        published: typeof published === "boolean" ? published : existing.published,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        requirements,
        benefits,
        description,
      },
      message: `"${updated.title}" updated successfully.`,
    });
  } catch (error: any) {
    console.error("PATCH /api/careers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update opening", details: error?.message },
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
    const existing = await db.careerOpening.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Career opening not found" },
        { status: 404 }
      );
    }

    await db.careerOpening.delete({
      where: { id: existing.id },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "CAREER_OPENING_DELETED",
      entity: "CareerOpening",
      entityId: existing.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { title: existing.title, slug: existing.slug },
    });

    return NextResponse.json({
      success: true,
      message: `"${existing.title}" was permanently removed.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/careers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete opening", details: error?.message },
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
