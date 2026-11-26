import { prisma } from "@/lib/prisma";

let userSchemaEnsured = false;

/**
 * Self-healing schema guard for User workspace isolation columns.
 */
export async function ensureUserWorkspaceSchema() {
  if (userSchemaEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "primaryWorkspace" TEXT NOT NULL DEFAULT 'operations';
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "assignedModules" TEXT NOT NULL DEFAULT '["operations","approvals","personal"]';
    `);
    userSchemaEnsured = true;
  } catch (err) {
    console.warn("[ensureUserWorkspaceSchema warning]:", err);
  }
}
