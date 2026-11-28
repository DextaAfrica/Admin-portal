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
        pool: true,
        maxConnections: 3,
        maxMessages: 50,
      })
    : nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        pool: true,
        maxConnections: 3,
        maxMessages: 50,
        rateDelta: 1000,
        rateLimit: 5,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })
  : null;

/**
 * Guarantees all relative asset and link paths (e.g. /images/..., /api/storage/...)
 * are converted to absolute public URLs using the configured application domain.
 * This ensures email clients (Gmail, Apple Mail, Outlook) render images crisply.
 */
export function ensureAbsoluteEmailUrls(
  html: string,
  baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://admin.dextaafrica.com"
): string {
  if (!html) return "";
  const cleanBase = baseUrl.replace(/\/+$/, "");

  return html
    .replace(/(src|href|poster)=(["'])\/(?!\/)/gi, `$1=$2${cleanBase}/`)
    .replace(/url\((["']?)\/(?!\/)/gi, `url($1${cleanBase}/`);
}

export function compileTemplate(html: string, variables: Record<string, string>): string {
  let result = html;
  for (const [key, val] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(regex, val);
  }
  return ensureAbsoluteEmailUrls(result, variables.portalUrl);
}

export async function sendEmail({
  to,
  subject,
  html,
  unsubscribeUrl,
}: {
  to: string | string[];
  subject: string;
  html: string;
  unsubscribeUrl?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const recipients = Array.isArray(to) ? to.join(", ") : to;

  if (!emailTransporter || !isEmailConfigured) {
    const err = "SMTP dispatcher is not configured. Please verify SMTP_HOST and SMTP_PORT in environment variables.";
    console.error(`[Email Dispatcher Error] ${err}`);
    return { success: false, error: err };
  }

  try {
    const finalHtml = ensureAbsoluteEmailUrls(html);
    const headers: Record<string, string> = {};
    if (unsubscribeUrl) {
      headers["List-Unsubscribe"] = `<${unsubscribeUrl}>`;
      headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }
    const info = await emailTransporter.sendMail({
      from: emailFrom,
      to: recipients,
      subject,
      html: finalHtml,
      headers,
    });
    console.log(`[Email Dispatcher] Dispatched email to "${recipients}" via SMTP on ${smtpHost}:${smtpPort} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "SMTP send failed";
    console.error(`[Email Dispatcher SMTP Error] Delivery to "${recipients}" failed:`, err);
    return { success: false, error: errorMsg };
  }
}

export async function dispatchCampaign(
  campaignId: string,
  targetCategory?: string,
  customRecipients?: Array<{
    email: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    category?: string;
  }>
) {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) throw new Error("Campaign not found");

  // Build target recipient list from Custom List, Form Submissions, or Audience Directory
  const recipientMap = new Map<string, {
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    company: string;
    category: string;
  }>();

  // 1. If explicit custom list was attached or fetched from external link
  if (customRecipients && Array.isArray(customRecipients) && customRecipients.length > 0) {
    for (const item of customRecipients) {
      if (item.email && item.email.includes("@")) {
        const cleanEmail = item.email.trim().toLowerCase();
        const parts = (item.fullName || "").trim().split(/\s+/);
        recipientMap.set(cleanEmail, {
          email: cleanEmail,
          firstName: item.firstName || parts[0] || item.fullName || "Valued Partner",
          lastName: item.lastName || parts.slice(1).join(" ") || "",
          fullName: item.fullName || [item.firstName, item.lastName].filter(Boolean).join(" ") || "Valued Partner",
          company: item.company || "Partner",
          category: item.category || "Custom List",
        });
      }
    }
  } else if (targetCategory && targetCategory.startsWith("FORM:")) {
    // 2. If targeting a specific form/registration link: targetCategory = "FORM:<slug>"
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
    // 3. Query AudienceSubscriber directory
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

    // 4. If target is ALL and audience has few/no records, also include unique FormSubmission contacts
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

  if (recipients.length === 0) {
    throw new Error(
      "No eligible email recipients found in the selected target group. Please ensure subscribers are active or attach a custom recipient list before broadcasting."
    );
  }

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: "SENDING",
      recipientCount: recipients.length,
    },
  });

  const portalUrl = process.env.NEXT_PUBLIC_APP_URL || "https://admin.dextaafrica.com";

  let successfulDispatches = 0;
  let lastError = "";

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
      } else if (sendRes.error) {
        lastError = sendRes.error;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : "SMTP transport failure";
      console.error(`Failed to dispatch to ${rec.email}:`, err);
    }
  }

  if (successfulDispatches === 0 && recipients.length > 0) {
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: "FAILED" },
    });
    throw new Error(
      `Delivery failed for all ${recipients.length} recipients: ${lastError || "SMTP service unavailable"}. Please verify your SMTP server configuration in environment settings.`
    );
  }

  return prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: "SENT",
      sentAt: new Date(),
      recipientCount: successfulDispatches,
    },
  });
}

