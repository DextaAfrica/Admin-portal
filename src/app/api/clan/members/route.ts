import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ensureClanSchema } from "../cohorts/route";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureClanSchema();

    const { searchParams } = new URL(req.url);
    const cohortId = searchParams.get("cohortId") || "";
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search")?.toLowerCase().trim() || "";

    let sql = `
      SELECT 
        m.*,
        c.name as "cohortName",
        c."cohortNumber"
      FROM "DextaClanMember" m
      LEFT JOIN "DextaClanCohort" c ON m."cohortId" = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (cohortId && cohortId !== "ALL") {
      params.push(cohortId);
      sql += ` AND m."cohortId" = $${params.length}`;
    }

    if (status && status !== "ALL") {
      params.push(status);
      sql += ` AND m.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (
        LOWER(m."fullName") LIKE $${params.length} OR 
        LOWER(m.email) LIKE $${params.length} OR 
        LOWER(m.company) LIKE $${params.length} OR 
        LOWER(m."jobTitle") LIKE $${params.length} OR
        LOWER(m."certificateNumber") LIKE $${params.length}
      )`;
    }

    sql += ` ORDER BY m."createdAt" DESC LIMIT 500;`;

    const members = await prisma.$queryRawUnsafe<any[]>(sql, ...params);

    return NextResponse.json({ success: true, members });
  } catch (err: any) {
    console.error("[Clan Members GET Error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch clan members" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureClanSchema();

    const body = await req.json();
    const rawItems = Array.isArray(body)
      ? body
      : Array.isArray(body?.items)
      ? body.items
      : Array.isArray(body?.members)
      ? body.members
      : [body];

    if (!rawItems || rawItems.length === 0) {
      return NextResponse.json({ error: "No member details provided" }, { status: 400 });
    }

    let addedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rawItems.length; i++) {
      const row = rawItems[i];
      const fullName = (row.fullName || row.name || row["Full Name"] || row["Name"] || "").trim();
      const email = (row.email || row["Email"] || row["Email Address"] || "").toLowerCase().trim();

      if (!fullName || !email) {
        errors.push(`Row ${i + 1}: Missing Full Name or Email`);
        continue;
      }

      const cohortId = (row.cohortId || row.cohort || row["Cohort"] || "clan-cohort-4").trim();
      const phone = (row.phone || row["Phone"] || "").trim();
      const company = (row.company || row.agency || row.brokerage || row["Company"] || row["Brokerage"] || "").trim();
      const jobTitle = (row.jobTitle || row.role || row["Job Title"] || row["Role"] || "").trim();
      const specialization = (row.specialization || row.track || row["Specialization"] || "General Practice").trim();
      const status = (row.status || row["Status"] || "applied").toLowerCase().trim();
      const attendanceScore = Number(row.attendanceScore || row["Attendance Score"]) || 100;
      const certificateNumber = (row.certificateNumber || row["Certificate Number"] || "").trim();
      const notes = (row.notes || row["Notes"] || `Ingested by ${user.email}`).trim();
      const id = row.id || `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      // Check for existing member in this cohort
      const existing = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM "DextaClanMember" WHERE "cohortId" = $1 AND LOWER(email) = $2 LIMIT 1;`,
        cohortId, email
      );

      if (existing && existing.length > 0) {
        await prisma.$executeRawUnsafe(`
          UPDATE "DextaClanMember"
          SET 
            "fullName" = $1,
            "phone" = $2,
            "company" = $3,
            "jobTitle" = $4,
            "specialization" = $5,
            "status" = $6,
            "attendanceScore" = $7,
            "certificateNumber" = $8,
            "notes" = $9,
            "updatedAt" = NOW()
          WHERE id = $10;
        `, fullName, phone, company, jobTitle, specialization, status, attendanceScore, certificateNumber, notes, existing[0].id);
        updatedCount++;
      } else {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "DextaClanMember" (
            "id", "cohortId", "fullName", "email", "phone", "company", "jobTitle",
            "specialization", "status", "attendanceScore", "certificateNumber", "notes",
            "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12,
            NOW(), NOW()
          );
        `, id, cohortId, fullName, email, phone, company, jobTitle, specialization, status, attendanceScore, certificateNumber, notes);
        addedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${addedCount + updatedCount} candidate(s)/member(s). (${addedCount} added, ${updatedCount} updated)`,
      totalProcessed: addedCount + updatedCount,
      added: addedCount,
      updated: updatedCount,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (err: any) {
    console.error("[Clan Members POST Error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to process member ingestion" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureClanSchema();

    const body = await req.json();
    const { memberIds, status, notes } = body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: "Member IDs array is required" }, { status: 400 });
    }
    if (!status) {
      return NextResponse.json({ error: "New status is required" }, { status: 400 });
    }

    const placeholders = memberIds.map((_, i) => `$${i + 3}`).join(", ");
    let query = `
      UPDATE "DextaClanMember"
      SET "status" = $1, "updatedAt" = NOW()
    `;
    const params: any[] = [status];

    if (notes) {
      query += `, "notes" = $2`;
      params.push(notes);
    } else {
      query += `, "notes" = "notes"`;
      params.push(null);
    }

    query += ` WHERE id IN (${placeholders});`;
    params.push(...memberIds);

    await prisma.$executeRawUnsafe(query, ...params);

    return NextResponse.json({
      success: true,
      message: `Updated status to "${status}" for ${memberIds.length} candidate(s)`,
    });
  } catch (err: any) {
    console.error("[Clan Members PATCH Error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to update candidate status" }, { status: 500 });
  }
}
