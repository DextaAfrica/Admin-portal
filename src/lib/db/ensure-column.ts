import { prisma } from "@/lib/prisma";

/**
 * Safely adds a column to a table in BOTH SQLite and PostgreSQL.
 * SQLite does not support `ADD COLUMN IF NOT EXISTS`, so we execute
 * `ALTER TABLE ... ADD COLUMN ...` and ignore duplicate-column errors.
 */
export async function ensureColumn(
  table: string,
  column: string,
  definition: string
): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition};`
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    if (
      msg.includes("duplicate column") ||
      msg.includes("already exists")
    ) {
      return;
    }
    console.warn(`[ensureColumn ${table}.${column}]:`, err);
  }
}
