import { prisma } from "@/lib/prisma";

let crmSchemaEnsured = false;

/**
 * Self-healing schema guard for Dexta Enterprise CRM tables.
 * Each statement is executed individually for PostgreSQL prepared-statement compatibility.
 */
export async function ensureCrmSchema() {
  if (crmSchemaEnsured) return;
  const statements = [
    `ALTER TABLE "CrmClient" ADD COLUMN IF NOT EXISTS "assignedToUserId" TEXT;`,
    `ALTER TABLE "CrmClient" ADD COLUMN IF NOT EXISTS "leadSource" TEXT NOT NULL DEFAULT 'DIRECT';`,
    `ALTER TABLE "CrmDeal" ADD COLUMN IF NOT EXISTS "ownerUserId" TEXT;`,
  ];
  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err) {
      console.warn("[ensureCrmSchema statement warning]:", err);
    }
  }
  crmSchemaEnsured = true;
}
