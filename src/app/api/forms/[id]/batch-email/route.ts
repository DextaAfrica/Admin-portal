import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/dispatcher";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const form = await prisma.customForm.findUnique({
      where: { id },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const body = await req.json();
    const submissionIds: string[] = Array.isArray(body.submissionIds) ? body.submissionIds : [];
    const subjectTemplate = body.subject?.trim() || `Update regarding ${form.title}`;
    const messageTemplate = body.message?.trim();

    if (!messageTemplate) {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    if (submissionIds.length === 0) {
      return NextResponse.json({ error: "No recipients selected" }, { status: 400 });
    }

    const submissions = await prisma.formSubmission.findMany({
      where: {
        id: { in: submissionIds },
        formId: form.id,
      },
    });

    if (submissions.length === 0) {
      return NextResponse.json({ error: "No valid submissions found for selection" }, { status: 404 });
    }

    let successCount = 0;
    let failureCount = 0;

    for (const sub of submissions) {
      const firstName = sub.fullName ? sub.fullName.split(" ")[0] : "Registrant";
      const customizedSubject = subjectTemplate
        .replace(/\{\{fullName\}\}/g, sub.fullName)
        .replace(/\{\{firstName\}\}/g, firstName)
        .replace(/\{\{company\}\}/g, sub.company || "Your Organization")
        .replace(/\{\{portalTitle\}\}/g, form.title)
        .replace(/\{\{category\}\}/g, sub.category);

      const customizedMessage = messageTemplate
        .replace(/\{\{fullName\}\}/g, sub.fullName)
        .replace(/\{\{firstName\}\}/g, firstName)
        .replace(/\{\{company\}\}/g, sub.company || "Your Organization")
        .replace(/\{\{portalTitle\}\}/g, form.title)
        .replace(/\{\{category\}\}/g, sub.category);

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0c1017; color: #f1f5f9; padding: 32px 24px; border-radius: 16px; border: 1px solid #1e293b;">
          <div style="margin-bottom: 24px; border-bottom: 1px solid #1e293b; padding-bottom: 16px;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #ef4444; font-weight: 700; margin-bottom: 4px;">
              ${form.title}
            </div>
            <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">
              Official Communication
            </h2>
          </div>

          <div style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px;">
            <p style="margin-top: 0;">Dear <strong>${sub.fullName}</strong>,</p>
            <div style="white-space: pre-wrap; margin: 16px 0; color: #e2e8f0; font-size: 14px; line-height: 1.6;">
${customizedMessage}
            </div>
          </div>

          <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: #94a3b8;">Registration Category:</span>
              <span style="color: #f8fafc; font-weight: 600;">${sub.category}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: #94a3b8;">Reference ID:</span>
              <span style="color: #f8fafc; font-family: monospace;">${sub.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Data Compliance:</span>
              <span style="color: #10b981; font-weight: 600;">NDPR / GDPR Verified</span>
            </div>
          </div>

          <div style="border-top: 1px solid #1e293b; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center;">
            <p style="margin: 0;">&copy; 2026 Dexta Africa Enterprise Systems. Sent to ${sub.email}.</p>
          </div>
        </div>
      `;

      try {
        const sent = await sendEmail({
          to: sub.email,
          subject: customizedSubject,
          html: emailHtml,
        });
        if (sent) successCount++;
        else failureCount++;
      } catch (e) {
        failureCount++;
      }
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorEmail: user.email,
        action: "FORM_BATCH_EMAIL_DISPATCH",
        entity: "CustomForm",
        entityId: form.id,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent") || "Admin Portal",
        metadata: JSON.stringify({
          portalSlug: form.slug,
          portalTitle: form.title,
          recipientsCount: submissions.length,
          successCount,
          failureCount,
          subject: subjectTemplate,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      recipientsCount: submissions.length,
      successCount,
      failureCount,
      message: `Batch email successfully dispatched to ${successCount} registrant${successCount === 1 ? "" : "s"}.`,
    });
  } catch (err: any) {
    console.error("Batch email dispatch error:", err);
    return NextResponse.json({ error: err.message || "Failed to dispatch batch emails" }, { status: 500 });
  }
}
