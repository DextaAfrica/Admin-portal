import { prisma } from "@/lib/prisma";

let formsSchemaEnsured = false;

/**
 * Self-healing schema guard for CustomForm & FormSubmission tables.
 * Ensures newly added columns exist in production PostgreSQL even if
 * `prisma db push` / migrations have not yet been applied.
 */
export async function ensureCustomFormsSchema() {
  if (formsSchemaEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CustomForm" (
        "id" TEXT PRIMARY KEY,
        "slug" TEXT UNIQUE NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT DEFAULT '',
        "formType" TEXT NOT NULL DEFAULT 'event',
        "status" TEXT NOT NULL DEFAULT 'active',
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

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "description" TEXT DEFAULT '';
      ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "formType" TEXT NOT NULL DEFAULT 'event';
      ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';
      ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT DEFAULT '';
      ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP(3);
      ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "eventLocation" TEXT DEFAULT '';
      ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "activeFrom" TIMESTAMP(3);
      ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "activeUntil" TIMESTAMP(3);
      ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "fields" TEXT NOT NULL DEFAULT '[]';
      ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "metadata" TEXT NOT NULL DEFAULT '{}';
      ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "sendConfirmationEmail" BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "confirmationSubject" TEXT DEFAULT '';
      ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "confirmationMessage" TEXT DEFAULT '';
      ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "consentNotice" TEXT DEFAULT '';
      ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "requireConsent" BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE "CustomForm" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);

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

    formsSchemaEnsured = true;
  } catch (err) {
    console.warn("[ensureCustomFormsSchema warning]:", err);
  }
}
