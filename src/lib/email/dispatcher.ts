import nodemailer from "nodemailer";
import { prisma } from "../prisma";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM || "Dexta Operations <operations@dextaafrica.com>";

export const isEmailConfigured = Boolean(smtpHost && smtpUser && smtpPass);

export const emailTransporter = isEmailConfigured
  ? nodemailer.createTransport({
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

  if (emailTransporter && isEmailConfigured) {
    try {
      const info = await emailTransporter.sendMail({
        from: emailFrom,
        to: recipients,
        subject,
        html,
      });
      return { success: true, messageId: info.messageId };
    } catch (err: unknown) {
      console.error("SMTP error:", err);
      return { success: false, error: err instanceof Error ? err.message : "SMTP send failed" };
    }
  }

  // Development simulation / console logging
  console.log(`[Email Dispatcher DEV Mode] Sent to: ${recipients} | Subject: "${subject}"`);
  return { success: true, messageId: `dev-sim-${Date.now()}` };
}

export async function dispatchCampaign(campaignId: string) {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) throw new Error("Campaign not found");

  const subscribers = await prisma.audienceSubscriber.findMany({
    where: { status: "SUBSCRIBED" },
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
    const personalizedHtml = compileTemplate(campaign.contentHtml, {
      firstName: sub.firstName || "Customer",
      lastName: sub.lastName || "",
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

