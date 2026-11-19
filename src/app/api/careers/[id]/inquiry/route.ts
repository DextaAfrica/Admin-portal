import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerCareerInquiryReceivedWorkflow } from "@/lib/automation/engine";
import { CareerInquirySchema, formatZodError } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

const db = prisma as any;

/**
 * Public Inbound Website Endpoint:
 * Triggered when a candidate clicks apply, submits resume, or inquires on the website.
 * Dispatches an instant real-time notification to the HR Department.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const opening = await db.careerOpening.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!opening) {
      return NextResponse.json(
        { error: "Career opening not found" },
        { status: 404 }
      );
    }

    if (!opening.published || opening.status !== "OPEN") {
      return NextResponse.json(
        { error: "This position is currently not accepting new applications." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // If it's a simple click event from website
    const isClickOnly = body.clickOnly === true;

    if (isClickOnly) {
      await db.careerOpening.update({
        where: { id: opening.id },
        data: {
          applicantClickCount: { increment: 1 },
        },
      });

      // Notify HR of interest spike if desired
      await triggerCareerInquiryReceivedWorkflow({
        openingId: opening.id,
        openingTitle: opening.title,
        applicantName: body.applicantName || "Website Visitor",
        applicantEmail: body.applicantEmail || "applicant-click@dexta.website",
        source: "WEBSITE_CLICK",
      });

      return NextResponse.json({
        success: true,
        message: "Click tracked and HR notified.",
      });
    }

    // Full application submission validation
    const parsed = CareerInquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }

    const {
      applicantName,
      applicantEmail,
      applicantPhone,
      resumeUrl,
      coverLetter,
      source,
    } = parsed.data;

    const [inquiry] = await Promise.all([
      db.careerInquiry.create({
        data: {
          careerOpeningId: opening.id,
          applicantName,
          applicantEmail,
          applicantPhone: applicantPhone || null,
          resumeUrl: resumeUrl || null,
          coverLetter: coverLetter || null,
          source: source || "WEBSITE_CLICK",
        },
      }),
      db.careerOpening.update({
        where: { id: opening.id },
        data: {
          applicantClickCount: { increment: 1 },
        },
      }),
    ]);

    // Instantly notify HR Department in real time
    await triggerCareerInquiryReceivedWorkflow({
      openingId: opening.id,
      openingTitle: opening.title,
      applicantName,
      applicantEmail,
      source: source || "WEBSITE_APPLICATION",
    });

    return NextResponse.json(
      {
        success: true,
        data: inquiry,
        message:
          "Thank you for your application. The HR talent team has been notified.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/careers/[id]/inquiry error:", error);
    return NextResponse.json(
      { error: "Failed to process candidate inquiry", details: error?.message },
      { status: 500 }
    );
  }
}
