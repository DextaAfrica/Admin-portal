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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
        coverImageUrl: body.coverImageUrl !== undefined ? body.coverImageUrl : existing.coverImageUrl,
        eventDate: body.eventDate ? new Date(body.eventDate) : body.eventDate === null ? null : existing.eventDate,
        eventLocation: body.eventLocation !== undefined ? body.eventLocation : existing.eventLocation,
        activeFrom: body.activeFrom ? new Date(body.activeFrom) : body.activeFrom === null ? null : existing.activeFrom,
        activeUntil: body.activeUntil ? new Date(body.activeUntil) : body.activeUntil === null ? null : existing.activeUntil,
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

    const { id } = await params;
    await prisma.customForm.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Form deleted" });
  } catch (err: any) {
    console.error("Form delete error:", err);
    return NextResponse.json({ error: "Failed to delete form" }, { status: 500 });
  }
}
