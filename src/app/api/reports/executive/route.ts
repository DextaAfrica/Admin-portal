import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { ensureInitialEnterpriseData } from "@/lib/automation/engine";

export const dynamic = "force-dynamic";

const db = prisma as any;

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureInitialEnterpriseData();

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

    const [
      transactions,
      approvals,
      deals,
      employees,
      automations,
    ] = await Promise.all([
      db.financialTransaction.findMany({ orderBy: { transactionDate: "desc" }, take: 100 }),
      db.interDeptApproval.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.crmDeal.findMany({ orderBy: { createdAt: "desc" }, include: { client: true } }),
      prisma.employeeProfile.findMany(),
      db.workflowAutomationRule.findMany(),
    ]);

    const totalInflow = transactions
      .filter((t: any) => t.type === "CAPITAL_INFLOW" && t.status === "SETTLED")
      .reduce((acc: number, t: any) => acc + t.amount, 0);

    const totalDisbursed = transactions
      .filter((t: any) => t.type !== "CAPITAL_INFLOW" && t.status === "SETTLED")
      .reduce((acc: number, t: any) => acc + t.amount, 0);

    const grossPipelineValue = deals.reduce((acc: number, d: any) => acc + (Number(d.value) || 0), 0);

    const reportData = {
      generatedAt: new Date().toISOString(),
      generatedBy: user.fullName,
      organization: "Dexta Africa Enterprise Gateway",
      treasury: {
        totalInflow,
        totalDisbursed,
        netTreasuryBalance: totalInflow - totalDisbursed,
        currency: "USD",
      },
      capitalPipeline: {
        grossValue: grossPipelineValue,
        activeDealsCount: deals.length,
      },
      workforce: {
        totalStaff: employees.length,
      },
      approvals: {
        totalRequests: approvals.length,
        approved: approvals.filter((a: any) => a.status === "APPROVED").length,
        pending: approvals.filter((a: any) => a.status === "PENDING").length,
      },
      automations: {
        activeRulesCount: automations.filter((a: any) => a.isEnabled).length,
        totalExecutions: automations.reduce((acc: number, a: any) => acc + a.executionCount, 0),
      },
      recentTransactions: transactions.slice(0, 15),
      recentApprovals: approvals.slice(0, 15),
    };

    if (format === "csv") {
      // Generate clean CSV of all financial transactions
      const headers = "Reference,Date,Type,Title,Amount,Currency,Department,Status,Recipient,AuthorizedBy\n";
      const rows = transactions
        .map(
          (t: any) =>
            `"${t.reference}","${new Date(t.transactionDate).toISOString().slice(0, 10)}","${t.type}","${t.title.replace(/"/g, '""')}",${t.amount},"${t.currency}","${t.department}","${t.status}","${t.recipientOrEntity.replace(/"/g, '""')}","${t.authorizedBy}"`
        )
        .join("\n");

      return new NextResponse(headers + rows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="Dexta-Executive-Report-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("GET /api/reports/executive error:", error);
    return NextResponse.json({ error: "Failed to generate executive report" }, { status: 500 });
  }
}

