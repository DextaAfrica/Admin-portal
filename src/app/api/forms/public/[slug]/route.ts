import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { backendApi } from "@/lib/backend-api";
import { sendEmail } from "@/lib/email/dispatcher";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params?: { slug?: string } | Promise<{ slug?: string }> }
) {
  try {
    const resolvedParams = context?.params ? await Promise.resolve(context.params) : null;
    const rawSlug =
      resolvedParams?.slug ||
      req.nextUrl.pathname.split("/").filter(Boolean).pop() ||
      "";
    const cleanSlug = String(rawSlug).toLowerCase().trim();

    if (!cleanSlug) {
      return NextResponse.json({ error: "Portal link identifier is required" }, { status: 400 });
    }

    const form = await prisma.customForm.findUnique({
      where: { slug: cleanSlug },
    });

    if (!form) {
      return NextResponse.json({ error: "Registration portal not found" }, { status: 404 });
    }

    let parsedFields = [];
    try {
      parsedFields =
        typeof form.fields === "string" ? JSON.parse(form.fields || "[]") : form.fields || [];
    } catch {
      parsedFields = [];
    }

    let parsedMetadata = {};
    try {
      parsedMetadata =
        typeof form.metadata === "string" ? JSON.parse(form.metadata || "{}") : form.metadata || {};
    } catch {
      parsedMetadata = {};
    }

    return NextResponse.json({
      form: {
        id: form.id,
        slug: form.slug,
        title: form.title,
        description: form.description || "",
        formType: form.formType,
        status: form.status,
        coverImageUrl: form.coverImageUrl || "",
        eventDate: form.eventDate ? form.eventDate.toISOString() : null,
        eventLocation: form.eventLocation || "",
        activeFrom: form.activeFrom ? form.activeFrom.toISOString() : null,
        activeUntil: form.activeUntil ? form.activeUntil.toISOString() : null,
        fields: parsedFields,
        metadata: parsedMetadata,
        sendConfirmationEmail: form.sendConfirmationEmail,
        confirmationSubject: form.confirmationSubject || "",
        confirmationMessage: form.confirmationMessage || "",
        consentNotice: form.consentNotice || "",
        requireConsent: form.requireConsent,
      },
    });
  } catch (err: any) {
    console.error("Public form get error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load registration details" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params?: { slug?: string } | Promise<{ slug?: string }> }
) {
  try {
    const resolvedParams = context?.params ? await Promise.resolve(context.params) : null;
    const rawSlug =
      resolvedParams?.slug ||
      req.nextUrl.pathname.split("/").filter(Boolean).pop() ||
      "";
    const cleanSlug = String(rawSlug).toLowerCase().trim();

    if (!cleanSlug) {
      return NextResponse.json({ error: "Portal link identifier is required" }, { status: 400 });
    }

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

    const now = new Date();
    if (form.activeFrom && now < new Date(form.activeFrom)) {
      return NextResponse.json(
        {
          error: `Registration has not opened yet. Submissions open on ${new Date(
            form.activeFrom
          ).toLocaleDateString(undefined, { dateStyle: "full" })}.`,
        },
        { status: 400 }
      );
    }

    if (form.activeUntil && now > new Date(form.activeUntil)) {
      return NextResponse.json(
        {
          error: `Registration has closed for this portal as of ${new Date(
            form.activeUntil
          ).toLocaleDateString(undefined, { dateStyle: "full" })}.`,
        },
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

    if (form.requireConsent && !body.consentAcknowledged) {
      return NextResponse.json(
        {
          error:
            "Data Protection & Legal Consent is mandatory. Please review and check the data processing acknowledgment before submitting.",
        },
        { status: 400 }
      );
    }

    const forwardedHeader = req.headers.get("x-forwarded-for");
    const ipAddress = forwardedHeader
      ? forwardedHeader.split(",")[0].trim()
      : req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";

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
        consentAcknowledged: Boolean(body.consentAcknowledged),
        consentTimestamp: new Date(),
        ipAddress,
        userAgent,
      },
    });

    // 1b. Forward submission to Go Core Backend (non-blocking)
    backendApi.forms
      .submitPublic(cleanSlug, {
        fullName,
        email,
        phone,
        company,
        jobTitle,
        category,
        attendanceMode,
        answers: body.answers || {},
        notes,
      })
      .catch((err) => console.warn("[Forms Public Submit] Go Backend sync deferred:", err?.message));

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
              ? `${existingSubscriber.notes}\n[${new Date().toISOString().split("T")[0]} Form: ${form.title}]`
              : `[${new Date().toISOString().split("T")[0]} Form: ${form.title}]`,
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

    // 3. Dispatch official automated branded confirmation email
    if (form.sendConfirmationEmail) {
      try {
        const subject =
          form.confirmationSubject?.trim() || `Registration Confirmed: ${form.title}`;
        const customMsg =
          form.confirmationMessage?.trim() ||
          "Thank you for completing your registration. Your submission has been officially recorded in our enterprise registry.";

        const eventDateStr = form.eventDate
          ? new Date(form.eventDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "";

        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="background-color: #0f172a; padding: 24px; text-align: center; border-bottom: 3px solid #dc2626;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">DEXTA AFRICA</h1>
              <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Official Registration Receipt</p>
            </div>
            
            <div style="padding: 32px 28px;">
              <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 8px;">Hello ${escapeHtml(fullName)},</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                ${escapeHtml(customMsg)}
              </p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; width: 140px;">Registration Portal:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${escapeHtml(form.title)}</td>
                  </tr>
                  ${eventDateStr ? `
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Event Date:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${escapeHtml(eventDateStr)}</td>
                  </tr>` : ""}
                  ${form.eventLocation ? `
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Location / Mode:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${escapeHtml(form.eventLocation)} (${escapeHtml(attendanceMode)})</td>
                  </tr>` : ""}
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Attendee Category:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${escapeHtml(category)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Reference ID:</td>
                    <td style="padding: 6px 0; color: #dc2626; font-family: monospace; font-weight: 700;">#${submission.id.substring(0, 8).toUpperCase()}</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; color: #166534; line-height: 1.5;">
                  <strong>Data Protection & Consent Acknowledged:</strong> Your consent to data processing was logged on ${new Date().toUTCString()} under Dexta Africa Privacy & NDPR Standards. Your submitted data will only be utilized for this engagement.
                </p>
              </div>

              <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
                If you have questions or require modifications to your submission, contact us directly at <a href="mailto:support@dextaafrica.com" style="color: #dc2626; text-decoration: none; font-weight: 600;">support@dextaafrica.com</a>.
              </p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                © 2026 Dexta Africa Enterprise Systems &bull; Operations & Infrastructure Directorate
              </p>
            </div>
          </div>
        `;

        await sendEmail({
          to: email,
          subject,
          html: emailHtml,
        });
      } catch (emailErr) {
        console.error("[Form Confirmation Email Dispatch Notice]:", emailErr);
      }
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
