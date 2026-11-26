import { ensureColumn } from "@/lib/db/ensure-column";

let emailCampaignSchemaEnsured = false;

/**
 * Self-healing schema guard for EmailCampaign scheduling columns (SQLite + PostgreSQL).
 */
export async function ensureEmailCampaignsSchema() {
  if (emailCampaignSchemaEnsured) return;
  await ensureColumn("EmailCampaign", "scheduledTarget", "TEXT DEFAULT 'ALL'");
  await ensureColumn("EmailCampaign", "scheduledRecipients", "TEXT");
  emailCampaignSchemaEnsured = true;
}
