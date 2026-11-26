import { prisma } from "@/lib/prisma";

let userSchemaEnsured = false;

/**
 * Self-healing schema guard for User workspace isolation columns.
 * Each statement is executed individually for PostgreSQL prepared-statement compatibility.
 */
export async function ensureUserWorkspaceSchema() {
  if (userSchemaEnsured) return;
  const statements = [
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "primaryWorkspace" TEXT NOT NULL DEFAULT 'operations';`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "assignedModules" TEXT NOT NULL DEFAULT '["operations","approvals","personal"]';`,
  ];
  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err) {
      console.warn("[ensureUserWorkspaceSchema statement warning]:", err);
    }
  }
  userSchemaEnsured = true;
}
