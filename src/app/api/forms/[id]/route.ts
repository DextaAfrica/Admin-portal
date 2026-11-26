import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ensureCustomFormsSchema } from "@/lib/forms/schema";

function parseSafeDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureCustomFormsSchema();
    const { id } = await params;
    const form = await prisma.customForm.findUnique({
      where: { id },
      include: {
        submissions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json({
      form: {
        ...form,
        fields: JSON.parse(form.fields || "[]"),
        metadata: JSON.parse(form.metadata || "{}"),
        submissionsCount: form.submissions.length,
      },
    });
  } catch (err: any) {
    console.error("Form fetch error:", err);
    return NextResponse.json({ error: "Failed to load form details" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureCustomFormsSchema();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.customForm.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    let cleanSlug = existing.slug;
    if (body.slug && body.slug !== existing.slug) {
      cleanSlug = sanitizeSlug(body.slug);
      const collision = await prisma.customForm.findUnique({ where: { slug: cleanSlug } });
      if (collision && collision.id !== id) {
        return NextResponse.json({ error: "This link slug is already taken" }, { status: 409 });
      }
    }

    const updated = await prisma.customForm.update({
      where: { id },
      data: {
        slug: cleanSlug,
        title: body.title !== undefined ? body.title : existing.title,
        description: body.description !== undefined ? body.description : existing.description,
        formType: body.formType || existing.formType,
        status: body.status || existing.status,
        groupId: body.groupId !== undefined ? body.groupId : existing.groupId,
        groupSlug: body.groupSlug !== undefined ? body.groupSlug : existing.groupSlug,
        routePrefix: body.routePrefix !== undefined ? body.routePrefix : existing.routePrefix,
        coverImageUrl: body.coverImageUrl !== undefined ? body.coverImageUrl : existing.coverImageUrl,
        eventDate: body.eventDate !== undefined ? parseSafeDate(body.eventDate) : existing.eventDate,
        eventLocation: body.eventLocation !== undefined ? body.eventLocation : existing.eventLocation,
        activeFrom: body.activeFrom !== undefined ? parseSafeDate(body.activeFrom) : existing.activeFrom,
        activeUntil: body.activeUntil !== undefined ? parseSafeDate(body.activeUntil) : existing.activeUntil,
        fields: body.fields !== undefined ? (typeof body.fields === "string" ? body.fields : JSON.stringify(body.fields)) : existing.fields,
        metadata: body.metadata !== undefined ? (typeof body.metadata === "string" ? body.metadata : JSON.stringify(body.metadata)) : existing.metadata,
        sendConfirmationEmail: body.sendConfirmationEmail !== undefined ? Boolean(body.sendConfirmationEmail) : existing.sendConfirmationEmail,
        confirmationSubject: body.confirmationSubject !== undefined ? body.confirmationSubject : existing.confirmationSubject,
        confirmationMessage: body.confirmationMessage !== undefined ? body.confirmationMessage : existing.confirmationMessage,
        consentNotice: body.consentNotice !== undefined ? body.consentNotice : existing.consentNotice,
        requireConsent: body.requireConsent !== undefined ? Boolean(body.requireConsent) : existing.requireConsent,
      },
    });

    return NextResponse.json({ success: true, form: updated });
  } catch (err: any) {
    console.error("Form update error:", err);
    return NextResponse.json({ error: "Failed to update form" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRole = (user.role || "").toUpperCase();
    const userDept = (user.department || "").toUpperCase();
    const canDeleteForm =
      userRole === "SUPER_ADMIN" ||
      userRole === "ADMIN" ||
      userRole === "IT_ADMIN" ||
      userDept === "IT" ||
      userDept === "EXECUTIVE";

    if (!canDeleteForm) {
      return NextResponse.json(
        { error: "Forbidden: Only authorized Administrators can permanently delete registration forms." },
        { status: 403 }
      );
    }

    await ensureCustomFormsSchema();
    const { id } = await params;

    const existing = await prisma.customForm.findUnique({
      where: { id },
      include: { _count: { select: { submissions: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    await prisma.customForm.delete({ where: { id } });

    try {
      const { logAuditEvent } = await import("@/lib/auth/audit");
      await logAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: "FORM_DELETED",
        entity: "CustomForm",
        entityId: id,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
        metadata: {
          title: existing.title,
          slug: existing.slug,
          submissionsCount: existing._count.submissions,
        },
      });
    } catch (auditErr) {
      console.warn("[Form Delete Audit Warning]:", auditErr);
    }

    return NextResponse.json({ success: true, message: "Form and associated submissions permanently deleted" });
  } catch (err: any) {
    console.error("Form delete error:", err);
    return NextResponse.json({ error: "Failed to delete form" }, { status: 500 });
  }
}
