import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cleanSlug = slug.toLowerCase().trim();

    const form = await prisma.customForm.findUnique({
      where: { slug: cleanSlug },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        formType: true,
        status: true,
        coverImageUrl: true,
        eventDate: true,
        eventLocation: true,
        fields: true,
        metadata: true,
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Registration portal not found" }, { status: 404 });
    }

    return NextResponse.json({
      form: {
        ...form,
        fields: JSON.parse(form.fields || "[]"),
        metadata: JSON.parse(form.metadata || "{}"),
      },
    });
  } catch (err: any) {
    console.error("Public form get error:", err);
    return NextResponse.json({ error: "Failed to load registration details" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cleanSlug = slug.toLowerCase().trim();

    const form = await prisma.customForm.findUnique({
      where: { slug: cleanSlug },
    });

    if (!form) {
      return NextResponse.json({ error: "Registration portal not found" }, { status: 404 });
    }

    if (form.status !== "active") {
      return NextResponse.json(
        { error: "This registration link is currently closed or inactive." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and a valid email address are required." },
        { status: 400 }
      );
    }

    const phone = body.phone?.trim() || "";
    const company = body.company?.trim() || "";
    const jobTitle = body.jobTitle?.trim() || "";
    const category = body.category?.trim() || "Attendee";
    const attendanceMode = body.attendanceMode?.trim() || "in-person";
    const answers = body.answers ? JSON.stringify(body.answers) : "{}";
    const notes = body.notes?.trim() || `Registered via form: ${form.title}`;

    // 1. Create form submission
    const submission = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        fullName,
        email,
        phone,
        company,
        jobTitle,
        category,
        attendanceMode,
        answers,
        notes,
        status: "registered",
      },
    });

    // 2. Seamlessly upsert into Audience Directory so lead is immediately contactable
    try {
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || fullName;
      const lastName = nameParts.slice(1).join(" ") || "";

      const existingSubscriber = await prisma.audienceSubscriber.findUnique({
        where: { email },
      });

      if (existingSubscriber) {
        await prisma.audienceSubscriber.update({
          where: { email },
          data: {
            firstName: firstName || existingSubscriber.firstName,
            lastName: lastName || existingSubscriber.lastName,
            phone: phone || existingSubscriber.phone,
            company: company || existingSubscriber.company,
            category: category.toUpperCase() || existingSubscriber.category,
            notes: existingSubscriber.notes
              ? `${existingSubscriber.notes}\n[${new Date().toLocaleDateString()} Form: ${form.title}]`
              : `[${new Date().toLocaleDateString()} Form: ${form.title}]`,
          },
        });
      } else {
        await prisma.audienceSubscriber.create({
          data: {
            email,
            firstName,
            lastName,
            phone,
            company,
            category: category.toUpperCase(),
            tags: JSON.stringify([form.slug, form.formType]),
            notes: `Registered via portal: ${form.title} (${cleanSlug})`,
          },
        });
      }
    } catch (syncErr) {
      console.warn("Audience sync notice:", syncErr);
    }

    return NextResponse.json({
      success: true,
      message: "Registration received successfully!",
      submissionId: submission.id,
    });
  } catch (err: any) {
    console.error("Public submission error:", err);
    return NextResponse.json({ error: "Failed to submit registration. Please try again." }, { status: 500 });
  }
}
