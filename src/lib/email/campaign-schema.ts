import { prisma } from "@/lib/prisma";

let emailCampaignSchemaEnsured = false;

/**
 * Self-healing schema guard for EmailCampaign scheduling columns.
 */
export async function ensureEmailCampaignsSchema() {
  if (emailCampaignSchemaEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "EmailCampaign" ADD COLUMN IF NOT EXISTS "scheduledTarget" TEXT DEFAULT 'ALL';
      ALTER TABLE "EmailCampaign" ADD COLUMN IF NOT EXISTS "scheduledRecipients" TEXT;
    `);
    emailCampaignSchemaEnsured = true;
  } catch (err) {
    console.warn("[ensureEmailCampaignsSchema warning]:", err);
  }
}
