import { prisma } from "@/lib/prisma";

let emailCampaignSchemaEnsured = false;

/**
 * Self-healing schema guard for EmailCampaign scheduling columns.
 * Each statement is executed individually for PostgreSQL prepared-statement compatibility.
 */
export async function ensureEmailCampaignsSchema() {
  if (emailCampaignSchemaEnsured) return;
  const statements = [
    `ALTER TABLE "EmailCampaign" ADD COLUMN IF NOT EXISTS "scheduledTarget" TEXT DEFAULT 'ALL';`,
    `ALTER TABLE "EmailCampaign" ADD COLUMN IF NOT EXISTS "scheduledRecipients" TEXT;`,
  ];
  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err) {
      console.warn("[ensureEmailCampaignsSchema statement warning]:", err);
    }
  }
  emailCampaignSchemaEnsured = true;
}
