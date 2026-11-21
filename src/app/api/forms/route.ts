import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      coverImageUrl: f.coverImageUrl || "",
      eventDate: f.eventDate ? f.eventDate.toISOString() : null,
      eventLocation: f.eventLocation || "",
      activeFrom: f.activeFrom ? f.activeFrom.toISOString() : null,
      activeUntil: f.activeUntil ? f.activeUntil.toISOString() : null,
      fields: JSON.parse(f.fields || "[]"),
      metadata: JSON.parse(f.metadata || "{}"),
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
    return NextResponse.json({ forms: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
        coverImageUrl: body.coverImageUrl?.trim() || "",
        eventDate: body.eventDate ? new Date(body.eventDate) : null,
        eventLocation: body.eventLocation?.trim() || "",
        activeFrom: body.activeFrom ? new Date(body.activeFrom) : null,
        activeUntil: body.activeUntil ? new Date(body.activeUntil) : null,
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

    return NextResponse.json({
      success: true,
      form: {
        ...newForm,
        eventDate: newForm.eventDate?.toISOString() || null,
        submissionsCount: 0,
      },
    });
  } catch (err: any) {
    console.error("Form creation error:", err);
    return NextResponse.json({ error: err.message || "Failed to create registration link" }, { status: 500 });
  }
}
