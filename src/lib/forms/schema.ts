import { prisma } from "@/lib/prisma";
import { ensureColumn } from "@/lib/db/ensure-column";

let formsSchemaEnsured = false;

/**
 * Self-healing schema guard for CustomFormGroup, CustomForm & FormSubmission tables.
 * Compatible with BOTH SQLite and PostgreSQL.
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
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
        "eventDate" DATETIME,
        "eventLocation" TEXT DEFAULT '',
        "activeFrom" DATETIME,
        "activeUntil" DATETIME,
        "fields" TEXT NOT NULL DEFAULT '[]',
        "metadata" TEXT NOT NULL DEFAULT '{}',
        "sendConfirmationEmail" BOOLEAN NOT NULL DEFAULT 1,
        "confirmationSubject" TEXT DEFAULT '',
        "confirmationMessage" TEXT DEFAULT '',
        "consentNotice" TEXT DEFAULT '',
        "requireConsent" BOOLEAN NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const columns: Array<[string, string]> = [
      ["description", "TEXT DEFAULT ''"],
      ["formType", "TEXT NOT NULL DEFAULT 'event'"],
      ["status", "TEXT NOT NULL DEFAULT 'active'"],
      ["groupId", "TEXT DEFAULT ''"],
      ["groupSlug", "TEXT DEFAULT 'general'"],
      ["routePrefix", "TEXT NOT NULL DEFAULT '/events'"],
      ["coverImageUrl", "TEXT DEFAULT ''"],
      ["eventDate", "DATETIME"],
      ["eventLocation", "TEXT DEFAULT ''"],
      ["activeFrom", "DATETIME"],
      ["activeUntil", "DATETIME"],
      ["fields", "TEXT NOT NULL DEFAULT '[]'"],
      ["metadata", "TEXT NOT NULL DEFAULT '{}'"],
      ["sendConfirmationEmail", "BOOLEAN NOT NULL DEFAULT 1"],
      ["confirmationSubject", "TEXT DEFAULT ''"],
      ["confirmationMessage", "TEXT DEFAULT ''"],
      ["consentNotice", "TEXT DEFAULT ''"],
      ["requireConsent", "BOOLEAN NOT NULL DEFAULT 1"],
    ];
    for (const [col, def] of columns) {
      await ensureColumn("CustomForm", col, def);
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
        "consentAcknowledged" BOOLEAN NOT NULL DEFAULT 1,
        "consentTimestamp" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "ipAddress" TEXT DEFAULT '',
        "userAgent" TEXT DEFAULT '',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default enterprise groups if none exist
    const groupCountRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) AS count FROM "CustomFormGroup";`
    );
    const groupCount = Number(groupCountRows?.[0]?.count || 0);
    if (groupCount === 0) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "CustomFormGroup" ("id", "name", "slug", "description", "routePrefix", "color", "createdAt", "updatedAt")
        VALUES
          ('grp-visitors', 'Visitor Check-In & Reception', 'visitors', 'Front-desk QR tap-in, office guest logs, and site tour check-ins.', '/visit', '#dc2626', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ('grp-academy', 'Dexta Clan & Academy', 'academy', 'Masterclass cohorts, realtor certifications, and training intakes.', '/academy', '#ea580c', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ('grp-events', 'Events & Masterclasses', 'events', 'Executive summits, open houses, and corporate symposiums.', '/events', '#2563eb', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ('grp-onboarding', 'Client & Partner Onboarding', 'onboarding', 'KYC briefs, vendor compliance, and partner intake portals.', '/onboarding', '#059669', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
