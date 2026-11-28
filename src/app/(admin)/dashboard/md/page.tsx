import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { MdExecutiveDashboard } from "@/components/dashboard/executive/MdExecutiveDashboard";
import { ensureExecutiveSchema } from "@/lib/executive/schema";
import { generateExecutiveInsights } from "@/lib/executive/insights";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const db = prisma as any;

export default async function MdExecutiveDashboardPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/api/auth/logout?next=/login");
  }

  // Strict Discreet RBAC Gate:
  // Only Managing Director, CEO, Super Admin, or Executive Directorate have access
  const role = (user.role || "").toUpperCase();
  const title = (user.jobTitle || "").toUpperCase();
  const dept = (user.department || "").toUpperCase();

  const isMdOrCeo =
    role === "MD" ||
    role === "CEO" ||
    role === "SUPER_ADMIN" ||
    dept === "EXECUTIVE" ||
    title.includes("MANAGING DIRECTOR") ||
    title.includes("CEO") ||
    title.includes("CHIEF EXECUTIVE");

  if (!isMdOrCeo) {
    redirect("/dashboard");
  }

  await ensureExecutiveSchema();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  // Real Cross-Departmental Database Aggregations
  const [
    dealsList,
    clientCount,
    users,
    inflowAgg,
    disbursedAgg,
    recentTxns,
    activeProjects,
    clearances,
    pendingReleases,
    openAlertsCount,
    pendingLeavesCount,
    directivesList,
    tasksList,
  ] = await Promise.all([
    prisma.crmDeal.findMany({
      select: { id: true, stage: true, value: true },
    }).catch(() => []),
    prisma.crmClient.count().catch(() => 0),
    prisma.user.findMany({
      select: { id: true, department: true, status: true, twoFactorEnabled: true },
    }).catch(() => []),
    db.financialTransaction.aggregate({
      where: { type: "CAPITAL_INFLOW", status: "SETTLED" },
      _sum: { amount: true },
    }).catch(() => ({ _sum: { amount: 0 } })),
    db.financialTransaction.aggregate({
      where: {
        type: { in: ["PROJECT_DISBURSEMENT", "CONTRACTOR_PAYOUT", "PAYROLL", "TREASURY_TRANSFER"] },
        status: "SETTLED",
      },
      _sum: { amount: true },
    }).catch(() => ({ _sum: { amount: 0 } })),
    db.financialTransaction.findMany({
      where: { transactionDate: { gte: sixMonthsAgo }, status: "SETTLED" },
      select: { type: true, amount: true, transactionDate: true },
      orderBy: { transactionDate: "asc" },
    }).catch(() => []),
    prisma.infrastructureProject.findMany({
      take: 8,
      orderBy: { updatedAt: "desc" },
    }).catch(() => []),
    prisma.interDeptApproval.findMany({
      where: { status: "PENDING" },
      take: 12,
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
    prisma.productionReleaseRequest.findMany({
      where: { status: "PENDING_SUPER_ADMIN" },
      take: 6,
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
    prisma.policyAlert.count({
      where: { status: "OPEN" },
    }).catch(() => 0),
    prisma.leaveRequest.count({
      where: { status: "PENDING" },
    }).catch(() => 0),
    db.executiveDirective.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
    }).catch(() => []),
    db.departmentTask.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
    }).catch(() => []),
  ]);

  // 1. Directorate Headcount & MFA
  const deptCounts: Record<string, number> = {};
  let mfaEnabledCount = 0;
  users.forEach((u: any) => {
    const d = (u.department || "OPERATIONS").toUpperCase();
    deptCounts[d] = (deptCounts[d] || 0) + 1;
    if (u.twoFactorEnabled) mfaEnabledCount++;
  });

  const departmentBreakdown = Object.entries(deptCounts).map(([department, count]) => ({
    department,
    count,
  }));

  // 2. Treasury Cashflow 6-Month Series
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const cashflowBuckets: { key: string; month: string; inflow: number; disbursed: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    cashflowBuckets.push({
      key,
      month: monthNames[d.getMonth()],
      inflow: 0,
      disbursed: 0,
    });
  }

  for (const txn of recentTxns) {
    const dt = new Date(txn.transactionDate);
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    const bucket = cashflowBuckets.find((b) => b.key === key);
    if (bucket) {
      if (txn.type === "CAPITAL_INFLOW") {
        bucket.inflow += Number(txn.amount || 0);
      } else {
        bucket.disbursed += Number(txn.amount || 0);
      }
    }
  }

  // 3. CRM Pipeline Stage Breakdown
  const stageConfig = [
    { stage: "PROPOSAL", label: "Proposal Sent", colorClass: "bg-blue-500" },
    { stage: "DUE_DILIGENCE", label: "Due Diligence", colorClass: "bg-indigo-500" },
    { stage: "CLOSING", label: "Closing / Legal", colorClass: "bg-amber-500" },
    { stage: "WON", label: "Won & Signed", colorClass: "bg-emerald-500" },
  ];

  const pipelineFunnel = stageConfig.map((sc) => {
    const matching = dealsList.filter((d: any) => (d.stage || "PROPOSAL").toUpperCase() === sc.stage);
    return {
      ...sc,
      count: matching.length,
      value: matching.reduce((acc: number, d: any) => acc + Number(d.value || 0), 0),
    };
  });

  const grossPipeline = dealsList.reduce((acc: number, d: any) => acc + Number(d.value || 0), 0);
  const closingStage = pipelineFunnel.find((s) => s.stage === "CLOSING");
  const totalInflow = inflowAgg?._sum?.amount || 0;
  const totalCapitalDeployed = disbursedAgg?._sum?.amount || 0;
  const netLiquidity = totalInflow - totalCapitalDeployed;

  // 4. Clearances & Bottlenecks
  const now = Date.now();
  let bottleneckApprovalsCount = 0;
  const formattedClearances = clearances.map((c: any) => {
    const createdMs = c.createdAt ? new Date(c.createdAt).getTime() : now;
    const hoursPending = Math.max(1, Math.round((now - createdMs) / (1000 * 60 * 60)));
    if (hoursPending >= 24) bottleneckApprovalsCount++;
    return {
      id: c.id,
      ticketNumber: c.ticketNumber || `CLR-${c.id.slice(0, 6)}`,
      title: c.title || "Cross-Directorate Requisition",
      fromDepartment: c.fromDepartment || "Operations",
      toDepartment: c.toDepartment || "Executive",
      requesterName: c.requesterName || "Department Head",
      amount: c.amount || null,
      priority: c.priority || "HIGH",
      createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Today",
      hoursPending,
    };
  });

  // 5. Stealth Tasks Enrichment (Overdue detection)
  let overdueTasksCount = 0;
  const formattedTasks = tasksList.map((t: any) => {
    const isOverdue = t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate).getTime() < now;
    if (isOverdue) overdueTasksCount++;
    return {
      id: t.id,
      reference: t.reference,
      title: t.title,
      description: t.description,
      department: t.department,
      assigneeName: t.assigneeName || `${t.department} Team`,
      assignedByName: t.assignedByName,
      assignedByRole: t.assignedByRole,
      priority: t.priority,
      status: isOverdue ? "OVERDUE" : t.status,
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
      completionNotes: t.completionNotes || null,
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
    };
  });

  // 6. Cross-Department Health Scorecard
  const mfaPct = users.length > 0 ? Math.round((mfaEnabledCount / users.length) * 100) : 100;
  const stalledProjectsCount = activeProjects.filter(
    (p: any) => p.status === "ON_HOLD" || (p.status === "IN_PROGRESS" && (p.progressPct || 0) < 15)
  ).length;

  const financePending = formattedClearances.filter((c: any) => c.toDepartment.toUpperCase() === "FINANCE").length;
  const opsPending = formattedClearances.filter((c: any) => c.toDepartment.toUpperCase() === "OPERATIONS").length;

  const departmentHealth = [
    {
      department: "Finance & Treasury",
      score: Math.max(55, (netLiquidity >= 0 ? 98 : 72) - financePending * 4),
      status: (netLiquidity < 0 ? "WATCH" : financePending > 3 ? "WATCH" : "OPTIMAL") as "OPTIMAL" | "WATCH" | "CRITICAL",
      metricLabel: `${financePending} pending payouts`,
      pendingCount: financePending,
    },
    {
      department: "Operations & Field",
      score: Math.max(50, 97 - bottleneckApprovalsCount * 6 - overdueTasksCount * 5),
      status: (bottleneckApprovalsCount > 2 || overdueTasksCount > 2 ? "CRITICAL" : bottleneckApprovalsCount > 0 ? "WATCH" : "OPTIMAL") as "OPTIMAL" | "WATCH" | "CRITICAL",
      metricLabel: `${activeProjects.length} active sites`,
      pendingCount: opsPending,
    },
    {
      department: "Commercial & CRM",
      score: dealsList.length > 0 ? Math.min(98, 82 + (closingStage?.count || 0) * 4) : 85,
      status: "OPTIMAL" as const,
      metricLabel: `${dealsList.length} deals • ${clientCount} clients`,
      pendingCount: closingStage?.count || 0,
    },
    {
      department: "People & Culture (HR)",
      score: Math.max(65, 98 - pendingLeavesCount * 4),
      status: (pendingLeavesCount > 4 ? "WATCH" : "OPTIMAL") as "OPTIMAL" | "WATCH" | "CRITICAL",
      metricLabel: `${users.length} staff • ${pendingLeavesCount} leaves`,
      pendingCount: pendingLeavesCount,
    },
    {
      department: "Systems IT & Security",
      score: Math.max(50, 100 - openAlertsCount * 10 - (mfaPct < 80 ? 10 : 0)),
      status: (openAlertsCount > 0 ? "CRITICAL" : mfaPct < 80 ? "WATCH" : "OPTIMAL") as "OPTIMAL" | "WATCH" | "CRITICAL",
      metricLabel: `${mfaPct}% MFA • ${openAlertsCount} alerts`,
      pendingCount: openAlertsCount,
    },
  ];

  // 7. Automated Business Insights
  const insights = generateExecutiveInsights({
    totalInflow,
    totalDisbursed: totalCapitalDeployed,
    grossPipelineValue: grossPipeline,
    closingDealsValue: closingStage?.value || 0,
    closingDealsCount: closingStage?.count || 0,
    totalDealsCount: dealsList.length,
    pendingApprovalsCount: formattedClearances.length,
    bottleneckApprovalsCount,
    overdueTasksCount,
    pendingLeavesCount,
    totalStaff: users.length,
    mfaEnabledCount,
    openAlertsCount,
    activeProjectsCount: activeProjects.length,
    stalledProjectsCount,
  });

  const formattedReleases = pendingReleases.map((r: any) => ({
    id: r.id,
    ticketNumber: r.ticketNumber || `PRD-${r.id.slice(0, 6)}`,
    title: r.title || "Production Service Deployment",
    targetSystem: r.targetSystem || "Core Cloud Cluster",
    adminName: r.adminName || "Systems IT Officer",
    justification: r.justification || "Production infrastructure change",
    createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Today",
  }));

  const formattedProjects = activeProjects.map((p: any) => ({
    id: p.id,
    code: p.code || `CON-${p.id.slice(0, 4)}`,
    name: p.name,
    location: p.location || "West Africa Region",
    category: p.category || "Concession",
    status: p.status || "In Execution",
    progressPct: p.progressPct || 0,
    budget: p.budget || null,
    currency: p.currency || "USD",
    leadEngineer: p.leadEngineer || "Project Director",
  }));

  const formattedDirectives = directivesList.map((d: any) => ({
    id: d.id,
    reference: d.reference,
    title: d.title,
    instruction: d.instruction,
    targetDepartment: d.targetDepartment,
    priority: d.priority,
    status: d.status,
    dueDate: d.dueDate ? new Date(d.dueDate).toISOString() : null,
    issuedByName: d.issuedByName,
    acknowledgedBy: d.acknowledgedBy || null,
    completionNotes: d.completionNotes || null,
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
  }));

  const complianceScore = Math.max(82, 100 - openAlertsCount * 4 - (mfaPct < 80 ? 5 : 0));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <MdExecutiveDashboard
        currentUser={{
          id: user.id,
          fullName: user.fullName || "Managing Director",
          email: user.email,
          role: user.role,
          department: user.department || "Executive",
          jobTitle: user.jobTitle || "Managing Director & CEO",
        }}
        metrics={{
          grossPipelineValue: grossPipeline,
          activeDealsCount: dealsList.length,
          corporateAccountsCount: clientCount,
          totalStaff: users.length,
          departmentBreakdown,
          totalInflow,
          totalCapitalDeployed,
          netLiquidity,
          cashflowSeries: cashflowBuckets.map(({ month, inflow, disbursed }) => ({ month, inflow, disbursed })),
          pipelineFunnel,
          departmentHealth,
          insights,
          activeProjects: formattedProjects,
          highPriorityClearances: formattedClearances,
          pendingProductionReleases: formattedReleases,
          directives: formattedDirectives,
          stealthTasks: formattedTasks,
          complianceScore,
          openRiskIncidents: openAlertsCount,
        }}
      />
    </div>
  );
}
