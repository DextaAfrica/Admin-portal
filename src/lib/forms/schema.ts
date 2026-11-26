import { prisma } from "@/lib/prisma";

let formsSchemaEnsured = false;

/**
 * Self-healing schema guard for CustomFormGroup, CustomForm & FormSubmission tables.
 * Ensures newly added columns and grouping tables exist in production PostgreSQL
 * even if `prisma db push` / migrations have not yet been applied.
 */
export async function ensureCustomFormsSchema() {
  if (formsSchemaEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CustomFormGroup" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT UNIQUE NOT NULL,
        "description" TEXT DEFAULT '',
        "routePrefix" TEXT NOT NULL DEFAULT '/events',
        "color" TEXT NOT NULL DEFAULT '#dc2626',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CustomForm" (
        "id" TEXT PRIMARY KEY,
        "slug" TEXT UNIQUE NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT DEFAULT '',
        "formType" TEXT NOT NULL DEFAULT 'event',
        "status" TEXT NOT NULL DEFAULT 'active',
        "groupId" TEXT DEFAULT '',
        "groupSlug" TEXT DEFAULT 'general',
        "routePrefix" TEXT NOT NULL DEFAULT '/events',
        "coverImageUrl" TEXT DEFAULT '',
        "eventDate" TIMESTAMP(3),
        "eventLocation" TEXT DEFAULT '',
        "activeFrom" TIMESTAMP(3),
        "activeUntil" TIMESTAMP(3),
        "fields" TEXT NOT NULL DEFAULT '[]',
        "metadata" TEXT NOT NULL DEFAULT '{}',
        "sendConfirmationEmail" BOOLEAN NOT NULL DEFAULT true,
        "confirmationSubject" TEXT DEFAULT '',
        "confirmationMessage" TEXT DEFAULT '',
        "consentNotice" TEXT DEFAULT 'I hereby consent to Dexta Africa collecting, storing, and processing my personal data strictly in accordance with NDPR & GDPR regulatory standards.',
        "requireConsent" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const alterStatements = [
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "description" TEXT DEFAULT '';`,
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "formType" TEXT NOT NULL DEFAULT 'event';`,
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';`,
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "groupId" TEXT DEFAULT '';`,
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "groupSlug" TEXT DEFAULT 'general';`,
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "routePrefix" TEXT NOT NULL DEFAULT '/events';`,
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT DEFAULT '';`,
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP(3);`,
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "eventLocation" TEXT DEFAULT '';`,
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "activeFrom" TIMESTAMP(3);`,
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "activeUntil" TIMESTAMP(3);`,
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "fields" TEXT NOT NULL DEFAULT '[]';`,
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "metadata" TEXT NOT NULL DEFAULT '{}';`,
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "sendConfirmationEmail" BOOLEAN NOT NULL DEFAULT true;`,
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "confirmationSubject" TEXT DEFAULT '';`,
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "confirmationMessage" TEXT DEFAULT '';`,
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "consentNotice" TEXT DEFAULT '';`,
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "requireConsent" BOOLEAN NOT NULL DEFAULT true;`,
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`,
      `ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`,
    ];
    for (const sql of alterStatements) {
      await prisma.$executeRawUnsafe(sql).catch(() => {});
    }

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FormSubmission" (
        "id" TEXT PRIMARY KEY,
        "formId" TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT DEFAULT '',
        "company" TEXT DEFAULT '',
        "jobTitle" TEXT DEFAULT '',
        "category" TEXT NOT NULL DEFAULT 'Attendee',
        "attendanceMode" TEXT NOT NULL DEFAULT 'in-person',
        "answers" TEXT NOT NULL DEFAULT '{}',
        "notes" TEXT DEFAULT '',
        "status" TEXT NOT NULL DEFAULT 'registered',
        "consentAcknowledged" BOOLEAN NOT NULL DEFAULT true,
        "consentTimestamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "ipAddress" TEXT DEFAULT '',
        "userAgent" TEXT DEFAULT '',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default enterprise groups if none exist
    const groupCountRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*)::int AS count FROM "CustomFormGroup";`
    );
    const groupCount = Number(groupCountRows?.[0]?.count || 0);
    if (groupCount === 0) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "CustomFormGroup" ("id", "name", "slug", "description", "routePrefix", "color", "createdAt", "updatedAt")
        VALUES
          ('grp-visitors', 'Visitor Check-In & Reception', 'visitors', 'Front-desk QR tap-in, office guest logs, and site tour check-ins.', '/visit', '#dc2626', NOW(), NOW()),
          ('grp-academy', 'Dexta Clan & Academy', 'academy', 'Masterclass cohorts, realtor certifications, and training intakes.', '/academy', '#ea580c', NOW(), NOW()),
          ('grp-events', 'Events & Masterclasses', 'events', 'Executive summits, open houses, and corporate symposiums.', '/events', '#2563eb', NOW(), NOW()),
          ('grp-onboarding', 'Client & Partner Onboarding', 'onboarding', 'KYC briefs, vendor compliance, and partner intake portals.', '/onboarding', '#059669', NOW(), NOW())
        ON CONFLICT ("slug") DO NOTHING;
      `);
    }

    formsSchemaEnsured = true;
  } catch (err) {
    console.warn("[ensureCustomFormsSchema warning]:", err);
  }
}

export function getFormPublicPath(form: {
  slug: string;
  routePrefix?: string | null;
  groupSlug?: string | null;
}): string {
  const prefix = (form.routePrefix || "/events").replace(/\/$/, "");
  if (prefix === "/f") {
    const grp = (form.groupSlug || "general").replace(/^\/+|\/+$/g, "");
    return `/f/${grp}/${form.slug}`;
  }
  return `${prefix}/${form.slug}`;
}
