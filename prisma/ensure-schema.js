/**
 * Production Database Schema Guardian & Bootstrap
 * Runs automatically during container startup before the Next.js server starts.
 * Guarantees that all required tables and columns exist in SQLite.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function ensureSchema() {
  try {
    // 1. User Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'ADMIN',
        "department" TEXT NOT NULL DEFAULT 'OPERATIONS',
        "seniorityLevel" TEXT NOT NULL DEFAULT 'SENIOR',
        "jobTitle" TEXT,
        "phone" TEXT,
        "avatarUrl" TEXT,
        "bio" TEXT,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
        "twoFactorSecret" TEXT,
        "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
        "activationKey" TEXT,
        "lastLoginAt" DATETIME,
        "assignedModules" TEXT NOT NULL DEFAULT '["operations","approvals","personal"]',
        "signatureUrl" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`);

    // 2. Ensure assignedModules & signatureUrl exist on User
    const cols = await prisma.$queryRawUnsafe('PRAGMA table_info("User");');
    const colNames = cols.map(c => c.name);
    if (!colNames.includes("assignedModules")) {
      await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "assignedModules" TEXT NOT NULL DEFAULT \'["operations","approvals","personal"]\';');
    }
    if (!colNames.includes("signatureUrl")) {
      await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "signatureUrl" TEXT;');
    }

    // 3. Session Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "sessionToken" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "expiresAt" DATETIME NOT NULL,
        "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");`);

    // 4. AuditLog Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "actorId" TEXT,
        "actorEmail" TEXT,
        "action" TEXT NOT NULL,
        "entity" TEXT NOT NULL,
        "entityId" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "metadata" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. SystemSetting Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemSetting" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "key" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "description" TEXT,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "SystemSetting_key_key" ON "SystemSetting"("key");`);

    // 6. DashboardAccessRequest Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DashboardAccessRequest" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "ticketNumber" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "requesterName" TEXT NOT NULL,
        "requesterEmail" TEXT NOT NULL,
        "department" TEXT NOT NULL,
        "jobTitle" TEXT,
        "requestedModules" TEXT NOT NULL,
        "justification" TEXT NOT NULL,
        "signatureData" TEXT NOT NULL,
        "signatureType" TEXT NOT NULL DEFAULT 'DRAWN',
        "signedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "status" TEXT NOT NULL DEFAULT 'PENDING_IT_APPROVAL',
        "reviewedById" TEXT,
        "approvedModules" TEXT,
        "itNotes" TEXT,
        "resolvedAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. StorageAsset Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "StorageAsset" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "bucket" TEXT NOT NULL,
        "key" TEXT NOT NULL,
        "fileName" TEXT NOT NULL,
        "fileSize" INTEGER NOT NULL,
        "mimeType" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "folder" TEXT NOT NULL DEFAULT 'general',
        "uploadedById" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "StorageAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "StorageAsset_key_key" ON "StorageAsset"("key");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StorageAsset_folder_idx" ON "StorageAsset"("folder");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StorageAsset_createdAt_idx" ON "StorageAsset"("createdAt");`);

    // 8. EmailCampaign Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EmailCampaign" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "contentHtml" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'DRAFT',
        "recipientCount" INTEGER NOT NULL DEFAULT 0,
        "openCount" INTEGER NOT NULL DEFAULT 0,
        "clickCount" INTEGER NOT NULL DEFAULT 0,
        "sentAt" DATETIME,
        "createdById" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "EmailCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EmailCampaign_status_idx" ON "EmailCampaign"("status");`);

    // 9. EmailTemplate Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EmailTemplate" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "contentHtml" TEXT NOT NULL,
        "occasion" TEXT NOT NULL DEFAULT 'birthday',
        "categoryBadge" TEXT,
        "thumbnailUrl" TEXT,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 10. AudienceSubscriber Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AudienceSubscriber" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL,
        "fullName" TEXT,
        "category" TEXT NOT NULL DEFAULT 'CLIENT',
        "status" TEXT NOT NULL DEFAULT 'SUBSCRIBED',
        "tags" TEXT NOT NULL DEFAULT '[]',
        "subscribedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "unsubscribedAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "AudienceSubscriber_email_key" ON "AudienceSubscriber"("email");`);

    // 11. CustomForm Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CustomForm" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "slug" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT DEFAULT '',
        "formType" TEXT NOT NULL DEFAULT 'event',
        "status" TEXT NOT NULL DEFAULT 'active',
        "coverImageUrl" TEXT DEFAULT '',
        "eventDate" DATETIME,
        "eventLocation" TEXT DEFAULT '',
        "activeFrom" DATETIME,
        "activeUntil" DATETIME,
        "fields" TEXT NOT NULL DEFAULT '[]',
        "metadata" TEXT NOT NULL DEFAULT '{}',
        "sendConfirmationEmail" BOOLEAN NOT NULL DEFAULT true,
        "confirmationSubject" TEXT DEFAULT '',
        "confirmationMessage" TEXT DEFAULT '',
        "consentNotice" TEXT DEFAULT 'I hereby consent to Dexta Africa collecting, storing, and processing my personal data strictly in accordance with NDPR & GDPR regulatory standards. I acknowledge this information will only be used for official enterprise communications and event coordination.',
        "requireConsent" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "CustomForm_slug_key" ON "CustomForm"("slug");`);

    // 12. FormSubmission Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FormSubmission" (
        "id" TEXT NOT NULL PRIMARY KEY,
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
        "consentTimestamp" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "ipAddress" TEXT DEFAULT '',
        "userAgent" TEXT DEFAULT '',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FormSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CustomForm" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // 13. ProductionReleaseRequest Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProductionReleaseRequest" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "ticketNumber" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "targetSystem" TEXT NOT NULL DEFAULT 'PORTAL_CORE',
        "adminId" TEXT NOT NULL,
        "adminName" TEXT NOT NULL,
        "adminEmail" TEXT NOT NULL,
        "superAdminId" TEXT,
        "superAdminName" TEXT,
        "superAdminEmail" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING_SUPER_ADMIN',
        "stage" INTEGER NOT NULL DEFAULT 1,
        "justification" TEXT NOT NULL,
        "payloadDiff" TEXT,
        "rejectionReason" TEXT,
        "scheduledFor" DATETIME,
        "approvedAt" DATETIME,
        "rejectedAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ProductionReleaseRequest_ticketNumber_key" ON "ProductionReleaseRequest"("ticketNumber");`);

    // 14. VisitorLog Table (required by the public reception check-in API)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "VisitorLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "passCode" TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "company" TEXT NOT NULL DEFAULT '',
        "position" TEXT NOT NULL DEFAULT '',
        "purpose" TEXT NOT NULL,
        "purposeOther" TEXT NOT NULL DEFAULT '',
        "hostName" TEXT NOT NULL,
        "department" TEXT NOT NULL,
        "hasAppointment" BOOLEAN NOT NULL DEFAULT false,
        "invitedBy" TEXT NOT NULL DEFAULT '',
        "visitDescription" TEXT NOT NULL DEFAULT '',
        "visitDate" TEXT NOT NULL,
        "checkInAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "checkOutAt" DATETIME,
        "status" TEXT NOT NULL DEFAULT 'checked_in',
        "agreedGuidelines" BOOLEAN NOT NULL DEFAULT false,
        "consentedData" BOOLEAN NOT NULL DEFAULT false,
        "declaredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ipAddress" TEXT NOT NULL DEFAULT '',
        "userAgent" TEXT NOT NULL DEFAULT '',
        "checkedOutBy" TEXT NOT NULL DEFAULT '',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "VisitorLog_passCode_key" ON "VisitorLog"("passCode");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "VisitorLog_status_idx" ON "VisitorLog"("status");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "VisitorLog_visitDate_idx" ON "VisitorLog"("visitDate");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "VisitorLog_department_idx" ON "VisitorLog"("department");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "VisitorLog_email_idx" ON "VisitorLog"("email");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "VisitorLog_phone_idx" ON "VisitorLog"("phone");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "VisitorLog_checkInAt_idx" ON "VisitorLog"("checkInAt");`);

    // 15. Initial Admin Provisioning if database has zero users
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const defaultHash = "$2a$10$tmASOhlWEzRPF55G2msYQ.b2zIacNFO3D9A/Su4pqgks5/rrxHZ7q"; // Admin@Dexta2026!
      await prisma.user.create({
        data: {
          id: "0946a672-28af-421a-aa97-925c6b8ff5e6",
          email: "it.admin@dextaafrica.com",
          fullName: "Systems IT Administrator",
          passwordHash: defaultHash,
          role: "ADMIN",
          department: "IT",
          status: "ACTIVE",
          twoFactorEnabled: false,
          mustChangePassword: false,
        },
      });
      await prisma.user.create({
        data: {
          id: "518a7337-2cb8-4b4f-a6f2-c099cb551237",
          email: "admin@dextaafrica.com",
          fullName: "Dexta Super Admin",
          passwordHash: defaultHash,
          role: "SUPER_ADMIN",
          department: "EXECUTIVE",
          status: "ACTIVE",
          twoFactorEnabled: false,
          mustChangePassword: false,
        },
      });
      console.log("✔ [Schema] Initial admin users auto-provisioned.");
    }

    console.log("✔ [Schema] Database schema validated and in sync.");
  } catch (err) {
    console.error("⚠️  [Schema] Warning: Schema guardian encountered an error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

ensureSchema();
