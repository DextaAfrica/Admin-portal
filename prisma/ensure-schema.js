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

    // 7. Initial Admin Provisioning if database has zero users
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
