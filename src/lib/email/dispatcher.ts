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

  const whereClause: any = { status: "SUBSCRIBED" };
  if (targetCategory && targetCategory !== "ALL") {
    whereClause.category = targetCategory;
  }

  const subscribers = await prisma.audienceSubscriber.findMany({
    where: whereClause,
  });

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: "SENDING",
      recipientCount: subscribers.length,
    },
  });

  const portalUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  for (const sub of subscribers) {
    const fullName = [sub.firstName, sub.lastName].filter(Boolean).join(" ") || sub.company || "Valued Partner";
    const personalizedHtml = compileTemplate(campaign.contentHtml, {
      firstName: sub.firstName || sub.company || "Valued Partner",
      lastName: sub.lastName || "",
      fullName,
      company: sub.company || "Partner",
      category: sub.category || "General",
      portalUrl,
      unsubscribeLink: `${portalUrl}/unsubscribe?email=${encodeURIComponent(sub.email)}`,
    });

    await sendEmail({
      to: sub.email,
      subject: campaign.subject,
      html: personalizedHtml,
    });
  }

  return prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: "SENT",
      sentAt: new Date(),
    },
  });
}

