import { ensureColumn } from "@/lib/db/ensure-column";

let crmSchemaEnsured = false;

/**
 * Self-healing schema guard for Dexta Enterprise CRM columns (SQLite + PostgreSQL).
 */
export async function ensureCrmSchema() {
  if (crmSchemaEnsured) return;
  await ensureColumn("CrmClient", "assignedToUserId", "TEXT");
  await ensureColumn("CrmClient", "leadSource", "TEXT NOT NULL DEFAULT 'DIRECT'");
  await ensureColumn("CrmDeal", "ownerUserId", "TEXT");
  crmSchemaEnsured = true;
}
