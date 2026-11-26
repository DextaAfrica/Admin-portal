import { ensureColumn } from "@/lib/db/ensure-column";

let userSchemaEnsured = false;

/**
 * Self-healing schema guard for User workspace isolation columns (SQLite + PostgreSQL).
 */
export async function ensureUserWorkspaceSchema() {
  if (userSchemaEnsured) return;
  await ensureColumn("User", "primaryWorkspace", "TEXT NOT NULL DEFAULT 'operations'");
  await ensureColumn(
    "User",
    "assignedModules",
    `TEXT NOT NULL DEFAULT '["operations","approvals","personal"]'`
  );
  userSchemaEnsured = true;
}
