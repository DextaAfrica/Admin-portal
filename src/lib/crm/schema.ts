import { prisma } from "@/lib/prisma";

let crmSchemaEnsured = false;

/**
 * Self-healing schema guard for Dexta Enterprise CRM tables.
 */
export async function ensureCrmSchema() {
  if (crmSchemaEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CrmClient" ADD COLUMN IF NOT EXISTS "assignedToUserId" TEXT;
      ALTER TABLE "CrmClient" ADD COLUMN IF NOT EXISTS "leadSource" TEXT NOT NULL DEFAULT 'DIRECT';
      ALTER TABLE "CrmDeal" ADD COLUMN IF NOT EXISTS "ownerUserId" TEXT;
    `);
    crmSchemaEnsured = true;
  } catch (err) {
    console.warn("[ensureCrmSchema warning]:", err);
  }
}
