import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { backendApi } from "@/lib/backend-api";
import { prisma } from "@/lib/prisma";
import { ensureCustomFormsSchema } from "@/lib/forms/schema";

export const dynamic = "force-dynamic";

function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseSafeDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function safeJsonParse<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string") return (raw as T) ?? fallback;
  try {
    return JSON.parse(raw || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureCustomFormsSchema();

    const forms = await prisma.customForm.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });

    const formatted = forms.map((f) => ({
      id: f.id,
      slug: f.slug,
      title: f.title,
      description: f.description || "",
      formType: f.formType,
      status: f.status,
      groupId: f.groupId || "",
      groupSlug: f.groupSlug || "general",
      routePrefix: f.routePrefix || "/events",
      coverImageUrl: f.coverImageUrl || "",
      eventDate: f.eventDate ? f.eventDate.toISOString() : null,
      eventLocation: f.eventLocation || "",
      activeFrom: f.activeFrom ? f.activeFrom.toISOString() : null,
      activeUntil: f.activeUntil ? f.activeUntil.toISOString() : null,
      fields: safeJsonParse(f.fields, []),
      metadata: safeJsonParse(f.metadata, {}),
      sendConfirmationEmail: f.sendConfirmationEmail,
      confirmationSubject: f.confirmationSubject || "",
      confirmationMessage: f.confirmationMessage || "",
      consentNotice: f.consentNotice || "",
      requireConsent: f.requireConsent,
      submissionsCount: f._count.submissions,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }));

    return NextResponse.json({ forms: formatted });
  } catch (err: any) {
    console.error("Forms list error:", err);
    return NextResponse.json({ forms: [], error: err?.message || "Failed to list forms" });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role === "AUDITOR") {
      return NextResponse.json(
        { error: "Reviewer (AUDITOR) role has read-only permissions." },
        { status: 403 }
      );
    }

    await ensureCustomFormsSchema();

    const body = await req.json();
    let rawSlug = body.slug ? String(body.slug) : "";
    if (!rawSlug && body.title) {
      rawSlug = String(body.title);
    }
    const cleanSlug = sanitizeSlug(rawSlug);

    if (!cleanSlug) {
      return NextResponse.json({ error: "A valid link name or title is required" }, { status: 400 });
    }

    // Check slug collision
    const existing = await prisma.customForm.findUnique({
      where: { slug: cleanSlug },
    });
    if (existing) {
      return NextResponse.json(
        { error: `The link "${cleanSlug}" is already taken. Please choose another link name.` },
        { status: 409 }
      );
    }

    const newForm = await prisma.customForm.create({
      data: {
        slug: cleanSlug,
        title: body.title?.trim() || cleanSlug,
        description: body.description?.trim() || "",
        formType: body.formType || "event",
        status: body.status || "active",
        groupId: body.groupId?.trim() || "",
        groupSlug: body.groupSlug?.trim() || "general",
        routePrefix: body.routePrefix?.trim() || "/events",
        coverImageUrl: body.coverImageUrl?.trim() || "",
        eventDate: parseSafeDate(body.eventDate),
        eventLocation: body.eventLocation?.trim() || "",
        activeFrom: parseSafeDate(body.activeFrom),
        activeUntil: parseSafeDate(body.activeUntil),
        fields: typeof body.fields === "string" ? body.fields : JSON.stringify(body.fields || []),
        metadata: typeof body.metadata === "string" ? body.metadata : JSON.stringify(body.metadata || {}),
        sendConfirmationEmail: body.sendConfirmationEmail !== undefined ? Boolean(body.sendConfirmationEmail) : true,
        confirmationSubject: body.confirmationSubject?.trim() || "",
        confirmationMessage: body.confirmationMessage?.trim() || "",
        consentNotice:
          body.consentNotice?.trim() ||
          "I hereby consent to Dexta Africa collecting, storing, and processing my personal data strictly in accordance with NDPR & GDPR regulatory standards. I acknowledge this information will only be used for official enterprise communications and event coordination.",
        requireConsent: body.requireConsent !== undefined ? Boolean(body.requireConsent) : true,
      },
    });

    // Sync to Go Core Backend (non-blocking resilient dual-write)
    backendApi.forms
      .create(
        {
          slug: newForm.slug,
          title: newForm.title,
          description: newForm.description,
          formType: newForm.formType,
          status: newForm.status,
          coverImageUrl: newForm.coverImageUrl,
          eventDate: newForm.eventDate?.toISOString() || null,
          eventLocation: newForm.eventLocation,
          activeFrom: newForm.activeFrom?.toISOString() || null,
          activeUntil: newForm.activeUntil?.toISOString() || null,
          fields: safeJsonParse(newForm.fields, []),
          metadata: safeJsonParse(newForm.metadata, {}),
        },
        user.id,
        user.email
      )
      .catch((err) => console.warn("[Forms] Go Backend sync deferred:", err?.message));

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "FORM_PORTAL_CREATED",
      entity: "CustomForm",
      entityId: newForm.id,
      metadata: { slug: newForm.slug, formType: newForm.formType, routePrefix: newForm.routePrefix },
    });

    return NextResponse.json({
      success: true,
      form: {
        ...newForm,
        eventDate: newForm.eventDate?.toISOString() || null,
        activeFrom: newForm.activeFrom?.toISOString() || null,
        activeUntil: newForm.activeUntil?.toISOString() || null,
        fields: safeJsonParse(newForm.fields, []),
        metadata: safeJsonParse(newForm.metadata, {}),
        submissionsCount: 0,
      },
    });
  } catch (err: any) {
    console.error("Form creation error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create registration link" },
      { status: 500 }
    );
  }
}
