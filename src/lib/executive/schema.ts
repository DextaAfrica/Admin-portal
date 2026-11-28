import { prisma } from "@/lib/prisma";

/**
 * Self-healing SQLite & PostgreSQL schema guard for ExecutiveDirective
 * and DepartmentTask tables so production deployments never fail on missing tables.
 */
export async function ensureExecutiveSchema(): Promise<void> {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "ExecutiveDirective" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "reference" TEXT NOT NULL UNIQUE,
      "title" TEXT NOT NULL,
      "instruction" TEXT NOT NULL,
      "targetDepartment" TEXT NOT NULL,
      "targetUserId" TEXT,
      "targetUserName" TEXT,
      "priority" TEXT NOT NULL DEFAULT 'HIGH',
      "status" TEXT NOT NULL DEFAULT 'ISSUED',
      "dueDate" DATETIME,
      "issuedById" TEXT NOT NULL,
      "issuedByName" TEXT NOT NULL,
      "issuedByEmail" TEXT NOT NULL,
      "acknowledgedBy" TEXT,
      "acknowledgedAt" DATETIME,
      "completionNotes" TEXT,
      "completedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "DepartmentTask" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "reference" TEXT NOT NULL UNIQUE,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "department" TEXT NOT NULL,
      "assigneeId" TEXT,
      "assigneeName" TEXT,
      "assigneeEmail" TEXT,
      "assignedById" TEXT NOT NULL,
      "assignedByName" TEXT NOT NULL,
      "assignedByRole" TEXT NOT NULL,
      "priority" TEXT NOT NULL DEFAULT 'NORMAL',
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "dueDate" DATETIME,
      "completionNotes" TEXT,
      "completedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  ];

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err) {
      console.warn("[ensureExecutiveSchema warning]:", err);
    }
  }
}
