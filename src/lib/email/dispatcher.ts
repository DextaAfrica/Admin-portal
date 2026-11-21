import nodemailer from "nodemailer";
import { prisma } from "../prisma";

const smtpHost = process.env.SMTP_HOST || "127.0.0.1";
const smtpPort = Number(process.env.SMTP_PORT) || 1025;
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const emailFrom = process.env.EMAIL_FROM || "Dexta Operations <operations@dextaafrica.com>";

// Internal relays (Postfix, Mailpit, local daemon) do NOT require authentication credentials
const isInternalRelay =
  smtpHost === "127.0.0.1" ||
  smtpHost === "localhost" ||
  smtpHost === "mailpit" ||
  smtpHost === "postfix" ||
  smtpPort === 1025 ||
  (!smtpUser && !smtpPass);

export const isEmailConfigured = Boolean(smtpHost && (isInternalRelay || (smtpUser && smtpPass)));

export const emailTransporter = isEmailConfigured
  ? isInternalRelay
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: false,
        ignoreTLS: true,
      })
    : nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })
  : null;

export function compileTemplate(html: string, variables: Record<string, string>): string {
  let result = html;
  for (const [key, val] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(regex, val);
  }
  return result;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const recipients = Array.isArray(to) ? to.join(", ") : to;

  if (!emailTransporter || !isEmailConfigured) {
    const err = "SMTP dispatcher is not configured. Please verify SMTP_HOST and SMTP_PORT in environment variables.";
    console.error(`[Email Dispatcher Error] ${err}`);
    return { success: false, error: err };
  }

  try {
    const info = await emailTransporter.sendMail({
      from: emailFrom,
      to: recipients,
      subject,
      html,
    });
    console.log(`[Email Dispatcher] Dispatched email to "${recipients}" via SMTP on ${smtpHost}:${smtpPort} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "SMTP send failed";
    console.error(`[Email Dispatcher SMTP Error] Delivery to "${recipients}" failed:`, err);
    return { success: false, error: errorMsg };
  }
}

export async function dispatchCampaign(campaignId: string, targetCategory?: string) {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) throw new Error("Campaign not found");

  // Build target recipient list from AudienceSubscribers and FormSubmissions
  const recipientMap = new Map<string, {
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    company: string;
    category: string;
  }>();

  // 1. If targeting a specific form: targetCategory = "FORM:<slug>"
  if (targetCategory && targetCategory.startsWith("FORM:")) {
    const formSlug = targetCategory.replace("FORM:", "").trim();
    const form = await prisma.customForm.findUnique({
      where: { slug: formSlug },
      include: { submissions: true },
    });
    if (form) {
      for (const sub of form.submissions) {
        if (sub.email) {
          const parts = (sub.fullName || "").trim().split(/\s+/);
          recipientMap.set(sub.email.toLowerCase(), {
            email: sub.email.toLowerCase(),
            firstName: parts[0] || sub.fullName || "Valued Partner",
            lastName: parts.slice(1).join(" ") || "",
            fullName: sub.fullName || "Valued Partner",
            company: sub.company || "Partner",
            category: sub.category || "Attendee",
          });
        }
      }
    }
  } else {
    // 2. Query AudienceSubscriber directory
    const whereClause: any = { status: "SUBSCRIBED" };
    if (targetCategory && targetCategory !== "ALL") {
      whereClause.category = targetCategory;
    }

    const subscribers = await prisma.audienceSubscriber.findMany({
      where: whereClause,
    });

    for (const sub of subscribers) {
      if (sub.email) {
        recipientMap.set(sub.email.toLowerCase(), {
          email: sub.email.toLowerCase(),
          firstName: sub.firstName || sub.company || "Valued Partner",
          lastName: sub.lastName || "",
          fullName: [sub.firstName, sub.lastName].filter(Boolean).join(" ") || sub.company || "Valued Partner",
          company: sub.company || "Partner",
          category: sub.category || "General",
        });
      }
    }

    // 3. If target is ALL and audience has few/no records, also include unique FormSubmission contacts
    if (!targetCategory || targetCategory === "ALL") {
      const submissions = await prisma.formSubmission.findMany({
        select: { email: true, fullName: true, company: true, category: true },
      });
      for (const sub of submissions) {
        if (sub.email && !recipientMap.has(sub.email.toLowerCase())) {
          const parts = (sub.fullName || "").trim().split(/\s+/);
          recipientMap.set(sub.email.toLowerCase(), {
            email: sub.email.toLowerCase(),
            firstName: parts[0] || sub.fullName || "Valued Partner",
            lastName: parts.slice(1).join(" ") || "",
            fullName: sub.fullName || "Valued Partner",
            company: sub.company || "Partner",
            category: sub.category || "Attendee",
          });
        }
      }
    }
  }

  const recipients = Array.from(recipientMap.values());

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: "SENDING",
      recipientCount: recipients.length,
    },
  });

  const portalUrl = process.env.NEXT_PUBLIC_APP_URL || "https://admin.dextaafrica.com";

  let successfulDispatches = 0;
  for (const rec of recipients) {
    const personalizedHtml = compileTemplate(campaign.contentHtml, {
      firstName: rec.firstName,
      lastName: rec.lastName,
      fullName: rec.fullName,
      company: rec.company,
      category: rec.category,
      portalUrl,
      unsubscribeLink: `${portalUrl}/unsubscribe?email=${encodeURIComponent(rec.email)}`,
    });

    try {
      const sendRes = await sendEmail({
        to: rec.email,
        subject: campaign.subject,
        html: personalizedHtml,
      });
      if (sendRes.success) {
        successfulDispatches++;
      }
    } catch (err) {
      console.error(`Failed to dispatch to ${rec.email}:`, err);
    }
  }

  return prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: "SENT",
      sentAt: new Date(),
      recipientCount: recipients.length,
    },
  });
}

