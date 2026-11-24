import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ensureClanSchema } from "../cohorts/route";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureClanSchema();

    // Fetch team members who could be assigned
    const staffMembers = await prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        avatarUrl: true,
      },
      orderBy: { fullName: "asc" },
    });

    // Fetch current assigned staff from latest cohort
    const activeCohort = await prisma.$queryRawUnsafe<any[]>(`
      SELECT "assignedStaffId", "assignedStaffName", "assignedStaffEmail" 
      FROM "DextaClanCohort" 
      WHERE status = 'in_progress' OR status = 'open' 
      ORDER BY "cohortNumber" DESC 
      LIMIT 1;
    `);

    return NextResponse.json({
      success: true,
      staffMembers,
      assignedLead: activeCohort?.[0] || {
        assignedStaffName: "Systems IT Administrator",
        assignedStaffEmail: "admin@dextaafrica.org",
      },
    });
  } catch (err: any) {
    console.error("[Clan Staff GET Error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch staff" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureClanSchema();

    const body = await req.json();
    const { staffId, staffName, staffEmail, cohortId } = body;

    if (!staffName || !staffEmail) {
      return NextResponse.json({ error: "Staff Name and Email are required" }, { status: 400 });
    }

    if (cohortId && cohortId !== "ALL") {
      await prisma.$executeRawUnsafe(`
        UPDATE "DextaClanCohort"
        SET 
          "assignedStaffId" = $1,
          "assignedStaffName" = $2,
          "assignedStaffEmail" = $3,
          "updatedAt" = NOW()
        WHERE id = $4;
      `, staffId || "", staffName, staffEmail, cohortId);
    } else {
      await prisma.$executeRawUnsafe(`
        UPDATE "DextaClanCohort"
        SET 
          "assignedStaffId" = $1,
          "assignedStaffName" = $2,
          "assignedStaffEmail" = $3,
          "updatedAt" = NOW()
        WHERE status IN ('open', 'in_progress');
      `, staffId || "", staffName, staffEmail);
    }

    return NextResponse.json({
      success: true,
      message: `Dexta Clan desk successfully delegated to ${staffName} (${staffEmail})`,
    });
  } catch (err: any) {
    console.error("[Clan Staff POST Error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to delegate staff" }, { status: 500 });
  }
}
