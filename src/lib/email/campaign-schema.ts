import { ensureColumn } from "@/lib/db/ensure-column";

let emailCampaignSchemaEnsured = false;

/**
 * Self-healing schema guard for EmailCampaign scheduling columns (SQLite + PostgreSQL).
 */
export async function ensureEmailCampaignsSchema() {
  if (emailCampaignSchemaEnsured) return;
  await ensureColumn("EmailCampaign", "scheduledTarget", "TEXT DEFAULT 'ALL'");
  await ensureColumn("EmailCampaign", "scheduledRecipients", "TEXT");
  await ensureColumn("EmailCampaign", "batchConfig", "TEXT");
  await ensureColumn("EmailCampaign", "totalBatches", "INTEGER DEFAULT 0");
  await ensureColumn("EmailCampaign", "completedBatches", "INTEGER DEFAULT 0");
  await ensureColumn("EmailCampaign", "sentCount", "INTEGER DEFAULT 0");
  await ensureColumn("EmailCampaign", "failedCount", "INTEGER DEFAULT 0");
  emailCampaignSchemaEnsured = true;
}
