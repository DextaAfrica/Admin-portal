import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

let schemaInitialized = false;

/**
 * Self-healing DB initialization for Dexta Clan tables in PostgreSQL.
 */
export async function ensureClanSchema() {
  if (schemaInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DextaClanCohort" (
        "id" TEXT PRIMARY KEY,
        "cohortNumber" INTEGER NOT NULL,
        "name" TEXT NOT NULL,
        "theme" TEXT DEFAULT '',
        "description" TEXT DEFAULT '',
        "status" TEXT NOT NULL DEFAULT 'open',
        "startDate" TIMESTAMP(3),
        "endDate" TIMESTAMP(3),
        "certificationDate" TIMESTAMP(3),
        "targetCapacity" INTEGER DEFAULT 100,
        "formId" TEXT DEFAULT '',
        "assignedStaffId" TEXT DEFAULT '',
        "assignedStaffName" TEXT DEFAULT '',
        "assignedStaffEmail" TEXT DEFAULT '',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DextaClanMember" (
        "id" TEXT PRIMARY KEY,
        "cohortId" TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT DEFAULT '',
        "company" TEXT DEFAULT '',
        "jobTitle" TEXT DEFAULT '',
        "specialization" TEXT DEFAULT '',
        "status" TEXT NOT NULL DEFAULT 'applied',
        "attendanceScore" INTEGER DEFAULT 100,
        "certificateNumber" TEXT DEFAULT '',
        "notes" TEXT DEFAULT '',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_clan_cohort_number" ON "DextaClanCohort"("cohortNumber");
      CREATE INDEX IF NOT EXISTS "idx_clan_member_cohort" ON "DextaClanMember"("cohortId");
      CREATE INDEX IF NOT EXISTS "idx_clan_member_email" ON "DextaClanMember"("email");
      CREATE INDEX IF NOT EXISTS "idx_clan_member_status" ON "DextaClanMember"("status");
    `);

    // Check if initial cohorts exist; if not, seed Cohorts 1 through 4
    const count = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) as count FROM "DextaClanCohort";`);
    const total = Number(count?.[0]?.count || 0);

    if (total === 0) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "DextaClanCohort" (
          "id", "cohortNumber", "name", "theme", "description", "status",
          "startDate", "endDate", "certificationDate", "targetCapacity",
          "assignedStaffName", "assignedStaffEmail", "createdAt", "updatedAt"
        ) VALUES 
        (
          'clan-cohort-1', 1, 'Cohort 1: Foundations of Real Estate Advisory',
          'Real Estate Certification Masterclass 1.0',
          'Inaugural certification cohort establishing core Nigerian land title, legal due diligence, and capital structuring.',
          'completed', '2025-03-01 09:00:00', '2025-03-29 17:00:00', '2025-04-05 12:00:00', 50,
          'Dexta Africa Executive Desk', 'clan@dextaafrica.com', NOW(), NOW()
        ),
        (
          'clan-cohort-2', 2, 'Cohort 2: Commercial & High-Yield Asset Acquisition',
          'Real Estate Certification Masterclass 2.0',
          'Advanced property modeling, feasibility analyses, and corporate client deal closing.',
          'completed', '2025-08-01 09:00:00', '2025-08-30 17:00:00', '2025-09-06 12:00:00', 75,
          'Dexta Africa Executive Desk', 'clan@dextaafrica.com', NOW(), NOW()
        ),
        (
          'clan-cohort-3', 3, 'Cohort 3: Syndication & Sovereign Developer Partnerships',
          'Real Estate Certification Masterclass 3.0',
          'Cross-border investor relations, diaspora real estate portfolios, and high-value transactions.',
          'completed', '2026-02-01 09:00:00', '2026-02-28 17:00:00', '2026-03-07 12:00:00', 85,
          'Dexta Africa Executive Desk', 'clan@dextaafrica.com', NOW(), NOW()
        ),
        (
          'clan-cohort-4', 4, 'Cohort 4: The High-Performing Realtor',
          'Real Estate Certification Masterclass 4.0',
          'Active flagship cohort focused on scaling enterprise brokerage, luxury listings, digital marketing automation, and institutional closing.',
          'in_progress', '2026-11-25 19:00:00', '2026-12-15 21:00:00', '2026-12-20 14:00:00', 120,
          'Systems IT Administrator', 'admin@dextaafrica.org', NOW(), NOW()
        );
      `);

      // Seed representative member records for Cohort 4 & historical alumni
      await prisma.$executeRawUnsafe(`
        INSERT INTO "DextaClanMember" (
          "id", "cohortId", "fullName", "email", "phone", "company", "jobTitle", "specialization", "status", "attendanceScore", "certificateNumber", "notes"
        ) VALUES 
        (
          'mem-401', 'clan-cohort-4', 'Olamide Adeleke', 'olamide@adelekeproperties.com', '+234 803 123 4567',
          'Adeleke Prime Realty', 'Principal Broker', 'Luxury Residential', 'selected', 100, 'DXC-2026-04-001', 'Selected for Cohort 4 Masterclass'
        ),
        (
          'mem-402', 'clan-cohort-4', 'Chinedu Eze', 'chinedu.eze@horizoncapital.ng', '+234 812 987 6543',
          'Horizon Capital Partners', 'Senior Investment Analyst', 'Commercial Real Estate', 'enrolled', 100, 'DXC-2026-04-002', 'Enrolled & confirmed attendance'
        ),
        (
          'mem-403', 'clan-cohort-4', 'Amina Bello', 'amina@bellorealtors.com', '+234 809 555 4321',
          'Bello & Associates', 'Managing Partner', 'Land Syndication', 'selected', 100, 'DXC-2026-04-003', 'Candidate selected'
        ),
        (
          'mem-404', 'clan-cohort-4', 'Tunde Williams', 'tunde@apexdevelopments.ng', '+234 802 333 7788',
          'Apex Developments', 'Acquisitions Director', 'Urban Redevelopment', 'applied', 90, '', 'New applicant under evaluation'
        ),
        (
          'mem-301', 'clan-cohort-3', 'Folake Badmus', 'folake@crestview.ng', '+234 805 111 2233',
          'Crestview Estates', 'Executive Director', 'Diaspora Portfolios', 'certified', 100, 'DXC-2026-03-018', 'Graduated with Distinction'
        );
      `);
    }

    // Ensure dedicated registration form exists for Cohort 4
    const formCheck = await prisma.customForm.findUnique({ where: { slug: "dexta-clan-cohort-4" } });
    if (!formCheck) {
      await prisma.customForm.create({
        data: {
          slug: "dexta-clan-cohort-4",
          title: "Dexta Clan: Real Estate Certification Masterclass 4.0",
          description: "Official cohort registration portal for Dexta Clan Cohort 4 — The High-Performing Realtor. Submit your credentials to apply for this executive certification program.",
          formType: "event",
          status: "active",
          eventLocation: "Dexta Africa Executive Gallery, Victoria Island, Lagos & Live Hybrid Stream",
          eventDate: new Date("2026-11-25T19:00:00Z"),
          confirmationSubject: "Congratulations! Application Received: Dexta Clan Cohort 4",
          confirmationMessage: "Thank you for applying to Dexta Clan Cohort 4. Our admissions committee is evaluating submissions and will communicate selection status shortly.",
          fields: JSON.stringify([
            { id: "specialization", label: "Real Estate Specialization", type: "select", required: true, options: ["Luxury Residential & Waterfront", "Commercial Properties & Office Complexes", "Land Banking & Syndication", "Diaspora Investment Portfolios"] },
            { id: "brokerage", label: "Agency / Firm / Independent Practice", type: "text", required: true, placeholder: "e.g. Adeleke Prime Realty" },
            { id: "experience", label: "Years in Real Estate Practice", type: "select", required: true, options: ["Under 2 Years", "2 - 5 Years", "5 - 10 Years", "Over 10 Years (Principal)"] },
            { id: "license", label: "Association / License ID (e.g. NIESV, REDAN)", type: "text", required: false, placeholder: "Optional license or credential" }
          ]),
          metadata: JSON.stringify({
            bannerTitle: "Dexta Clan Academy",
            cohort: "Cohort 4",
            primaryColor: "#DC2626"
          })
        }
      });
    }

    schemaInitialized = true;
  } catch (err) {
    console.warn("[ensureClanSchema warning]:", err);
  }
}

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureClanSchema();

    const cohorts = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        c.*,
        COUNT(m.id)::int as "totalMembers",
        COUNT(CASE WHEN m.status = 'applied' THEN 1 END)::int as "appliedCount",
        COUNT(CASE WHEN m.status = 'selected' THEN 1 END)::int as "selectedCount",
        COUNT(CASE WHEN m.status = 'enrolled' THEN 1 END)::int as "enrolledCount",
        COUNT(CASE WHEN m.status = 'attended' THEN 1 END)::int as "attendedCount",
        COUNT(CASE WHEN m.status = 'certified' THEN 1 END)::int as "certifiedCount"
      FROM "DextaClanCohort" c
      LEFT JOIN "DextaClanMember" m ON c.id = m."cohortId"
      GROUP BY c.id
      ORDER BY c."cohortNumber" DESC;
    `);

    return NextResponse.json({ success: true, cohorts });
  } catch (err: any) {
    console.error("[Clan Cohorts GET Error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch cohorts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureClanSchema();

    const body = await req.json();
    const cohortNumber = Number(body.cohortNumber);
    const name = body.name?.trim();

    if (!cohortNumber || !name) {
      return NextResponse.json({ error: "Cohort Number and Name are required" }, { status: 400 });
    }

    const id = body.id || `clan-cohort-${cohortNumber}`;
    const theme = body.theme?.trim() || `Real Estate Certification Masterclass ${cohortNumber}.0`;
    const description = body.description?.trim() || "";
    const status = body.status || "open";
    const startDate = body.startDate ? new Date(body.startDate).toISOString() : null;
    const endDate = body.endDate ? new Date(body.endDate).toISOString() : null;
    const certificationDate = body.certificationDate ? new Date(body.certificationDate).toISOString() : null;
    const targetCapacity = Number(body.targetCapacity) || 100;
    const formId = body.formId?.trim() || "";
    const assignedStaffName = body.assignedStaffName?.trim() || user.fullName || "Dexta Admin";
    const assignedStaffEmail = body.assignedStaffEmail?.trim() || user.email || "clan@dextaafrica.com";

    // Upsert cohort record
    await prisma.$executeRawUnsafe(`
      INSERT INTO "DextaClanCohort" (
        "id", "cohortNumber", "name", "theme", "description", "status",
        "startDate", "endDate", "certificationDate", "targetCapacity",
        "formId", "assignedStaffName", "assignedStaffEmail", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7::timestamp, $8::timestamp, $9::timestamp, $10,
        $11, $12, $13, NOW(), NOW()
      )
      ON CONFLICT ("id") DO UPDATE SET
        "name" = EXCLUDED."name",
        "theme" = EXCLUDED."theme",
        "description" = EXCLUDED."description",
        "status" = EXCLUDED."status",
        "startDate" = EXCLUDED."startDate",
        "endDate" = EXCLUDED."endDate",
        "certificationDate" = EXCLUDED."certificationDate",
        "targetCapacity" = EXCLUDED."targetCapacity",
        "formId" = EXCLUDED."formId",
        "assignedStaffName" = EXCLUDED."assignedStaffName",
        "assignedStaffEmail" = EXCLUDED."assignedStaffEmail",
        "updatedAt" = NOW();
    `, id, cohortNumber, name, theme, description, status, startDate, endDate, certificationDate, targetCapacity, formId, assignedStaffName, assignedStaffEmail);

    return NextResponse.json({ success: true, message: "Cohort saved successfully", id });
  } catch (err: any) {
    console.error("[Clan Cohort POST Error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to save cohort" }, { status: 500 });
  }
}
