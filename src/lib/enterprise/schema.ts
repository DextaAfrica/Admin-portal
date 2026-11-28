import { prisma } from "@/lib/prisma";

/**
 * Self-healing SQLite & PostgreSQL schema guard for DailyWorkTelemetry,
 * InternalChannel, and InternalMessage tables.
 */
export async function ensureEnterpriseSchema(): Promise<void> {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "DailyWorkTelemetry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "dateKey" TEXT NOT NULL,
      "activeSeconds" INTEGER NOT NULL DEFAULT 0,
      "idleSeconds" INTEGER NOT NULL DEFAULT 0,
      "verifiedActions" INTEGER NOT NULL DEFAULT 0,
      "heartbeatCount" INTEGER NOT NULL DEFAULT 0,
      "lastRoute" TEXT,
      "lastIpAddress" TEXT,
      "lastHeartbeatAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "status" TEXT NOT NULL DEFAULT 'ONLINE_ACTIVE',
      "authenticityScore" INTEGER NOT NULL DEFAULT 100,
      "flagReason" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "DailyWorkTelemetry_userId_dateKey_key" ON "DailyWorkTelemetry"("userId", "dateKey");`,
    `CREATE TABLE IF NOT EXISTS "InternalChannel" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "slug" TEXT NOT NULL UNIQUE,
      "name" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'DEPARTMENT',
      "department" TEXT,
      "participantIds" TEXT NOT NULL DEFAULT '[]',
      "description" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "InternalMessage" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "channelId" TEXT NOT NULL,
      "senderId" TEXT NOT NULL,
      "senderName" TEXT NOT NULL,
      "senderDepartment" TEXT NOT NULL,
      "senderRole" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "priority" TEXT NOT NULL DEFAULT 'NORMAL',
      "readByIds" TEXT NOT NULL DEFAULT '[]',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("channelId") REFERENCES "InternalChannel"("id") ON DELETE CASCADE
    );`,
  ];

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err) {
      console.warn("[ensureEnterpriseSchema warning]:", err);
    }
  }
}
