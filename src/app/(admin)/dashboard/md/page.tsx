import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { MdExecutiveDashboard } from "@/components/dashboard/executive/MdExecutiveDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    // Discreetly deny access without exposing executive portal details
    redirect("/dashboard");
  }

  // Real Database Telemetry Aggregations
  const [
    dealStats,
    clientCount,
    users,
    expenseAgg,
    activeProjects,
    clearances,
    pendingReleases,
    openAlertsCount,
  ] = await Promise.all([
    prisma.crmDeal.aggregate({
      _sum: { value: true },
      _count: true,
    }).catch(() => ({ _sum: { value: 0 }, _count: 0 })),
    prisma.crmClient.count().catch(() => 0),
    prisma.user.findMany({
      select: { department: true, status: true },
    }).catch(() => []),
    prisma.financialTransaction.aggregate({
      where: { type: "EXPENSE", status: "COMPLETED" },
      _sum: { amount: true },
    }).catch(() => ({ _sum: { amount: 0 } })),
    prisma.infrastructureProject.findMany({
      take: 6,
      orderBy: { updatedAt: "desc" },
    }).catch(() => []),
    prisma.interDeptApproval.findMany({
      where: { status: "PENDING" },
      take: 5,
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
    prisma.productionReleaseRequest.findMany({
      where: { status: "PENDING_SUPER_ADMIN" },
      take: 5,
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
    prisma.policyAlert.count({
      where: { status: "OPEN" },
    }).catch(() => 0),
  ]);

  // Aggregate Directorate Headcount
  const deptCounts: Record<string, number> = {};
  users.forEach((u) => {
    const d = (u.department || "Operations").toUpperCase();
    deptCounts[d] = (deptCounts[d] || 0) + 1;
  });

  const departmentBreakdown = Object.entries(deptCounts).map(([department, count]) => ({
    department,
    count,
  }));

  const grossPipeline = dealStats._sum.value || 0;
  const capitalDeployed = expenseAgg._sum.amount || 0;

  // Format high priority clearances
  const formattedClearances = clearances.map((c: any) => ({
    id: c.id,
    ticketNumber: c.ticketNumber || `CLR-${c.id.slice(0, 6)}`,
    title: c.title || "Cross-Directorate Requisition",
    fromDepartment: c.fromDepartment || "Operations",
    toDepartment: c.toDepartment || "Executive",
    requesterName: c.requesterName || "Department Head",
    amount: c.amount || null,
    priority: c.priority || "HIGH",
    createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Today",
  }));

  // Format production release requests
  const formattedReleases = pendingReleases.map((r: any) => ({
    id: r.id,
    ticketNumber: r.ticketNumber || `PRD-${r.id.slice(0, 6)}`,
    title: r.title || "Production Service Deployment",
    targetSystem: r.targetSystem || "Core Cloud Cluster",
    adminName: r.adminName || "Systems IT Officer",
    justification: r.justification || "Production infrastructure change",
    createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Today",
  }));

  // Format infrastructure projects
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

  const complianceScore = Math.max(88, 100 - openAlertsCount * 2);

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
          activeDealsCount: dealStats._count || 0,
          corporateAccountsCount: clientCount,
          totalStaff: users.length,
          departmentBreakdown,
          totalCapitalDeployed: capitalDeployed,
          activeProjects: formattedProjects,
          highPriorityClearances: formattedClearances,
          pendingProductionReleases: formattedReleases,
          complianceScore,
          openRiskIncidents: openAlertsCount,
        }}
      />
    </div>
  );
}
