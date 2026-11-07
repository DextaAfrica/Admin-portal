import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  Briefcase,
  Users,
  ShieldCheck,
  MessageSquare,
  Globe,
  PlusCircle,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getCurrentSession } from "@/lib/auth/session";
import { backendApi } from "@/lib/backend-api";
import { DepartmentDashboardView } from "@/components/dashboard/DepartmentDashboardView";
import { ensureDefaultAutomationRules, ensureInitialEnterpriseData } from "@/lib/automation/engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/login");
  }

  // Detect Host / Portal Subdomain from Incoming Request
  const headersList = await headers();
  const host = (headersList.get("host") || "").toLowerCase();

  const isAdminHost = host.startsWith("admin.") || host.includes("admin.dextafrica") || host.includes("admin.localhost");
  const isOpsHost = host.startsWith("ops.") || host.includes("ops.dextaafrica") || host.includes("ops.localhost");

  const userDept = (user?.department || "").toUpperCase();
  const userRole = (user?.role || "").toUpperCase();
  const isSuperAdmin = userRole === "SUPER_ADMIN" || userDept === "EXECUTIVE";

  // STRICT DOMAIN ISOLATION ARCHITECTURE:
  // Non-IT, non-executive users (Operations, Finance, HR) accessing admin.* must be routed to ops.*
  if (isAdminHost && !isSuperAdmin && userDept !== "IT") {
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    const port = host.split(":")[1] ? `:${host.split(":")[1]}` : "";
    const targetUrl = isLocal ? `http://ops.localhost${port}/dashboard` : `https://ops.dextaafrica.org/dashboard`;
    redirect(targetUrl);
  }

  // IT personnel accessing ops.* must be routed to admin.*
  if (isOpsHost && !isSuperAdmin && userDept === "IT") {
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    const port = host.split(":")[1] ? `:${host.split(":")[1]}` : "";
    const targetUrl = isLocal ? `http://admin.localhost${port}/dashboard` : `https://admin.dextaafrica.org/dashboard`;
    redirect(targetUrl);
  }

  let initialPlatform: "systems" | "operations" | "executive" | "finance" | "hr" = "operations";
  let initialTab: "overview" | "systems" | "operations" | "approvals" | "treasury" | "communications" | "personal" = "operations";

  if (isSuperAdmin) {
    // Super Admins & Executive Leadership have cross-directorate oversight
    initialPlatform = isAdminHost ? "systems" : isOpsHost ? "operations" : "executive";
    initialTab = isAdminHost ? "systems" : isOpsHost ? "operations" : "overview";
  } else if (userDept === "FINANCE" || userDept === "ACCOUNTING" || userDept === "ACCOUNTS") {
    // Finance & Accounts personnel strictly default to Treasury & Ledger
    initialPlatform = "finance";
    initialTab = "treasury";
  } else if (userDept === "IT") {
    // IT Officers are locked to Systems IT Command
    initialPlatform = "systems";
    initialTab = "systems";
  } else if (userDept === "HR") {
    // People & Culture personnel strictly default to HR & Workforce Clearances
    initialPlatform = "hr";
    initialTab = "approvals";
  } else {
    // Operations personnel are strictly locked to Operations Fleet
    initialPlatform = "operations";
    initialTab = "operations";
  }

  // 1. Calculate Real 7-Day Activity Aggregation from AuditLog
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const db = prisma as any;
  await ensureDefaultAutomationRules();
  await ensureInitialEnterpriseData();

  // 2. Query Local Database Records & Aggregations (Production Backed, 0 Mock Data)
  let totalUsers = 0;
  let mfaUsers = 0;
  let storageAggregate: { _sum: { fileSize: number | null }; _count: { id: number } } = {
    _sum: { fileSize: 0 },
    _count: { id: 0 },
  };
  let totalEndpoints = 0;
  let healthyEndpoints = 0;
  let recentAssets: any[] = [];
  let recentLogs: any[] = [];
  let pastWeekLogs: { createdAt: Date }[] = [];
  let dealsAgg: { _sum: { value: number | null }; _count: { id: number } } = {
    _sum: { value: 0 },
    _count: { id: 0 },
  };
  let clientsCount = 0;
  let recentDealsList: any[] = [];
  let pendingLeavesCount = 0;
  let openAlertsCount = 0;
  let staffCount = 0;

  let financialTransactionsList: any[] = [];
  let approvalsList: any[] = [];
  let corporateEmailsList: any[] = [];
  let automationRulesList: any[] = [];
  let totalInflow = 0;
  let totalDisbursed = 0;

  try {
    const [
      tu,
      mu,
      sa,
      te,
      he,
      ra,
      rl,
      pwl,
      da,
      cc,
      rd,
      plc,
      oac,
      sc,
      txns,
      apprs,
      emls,
      autms,
      infAgg,
      disbAgg,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { twoFactorEnabled: true } }),
      prisma.storageAsset.aggregate({
        _sum: { fileSize: true },
        _count: { id: true },
      }),
      prisma.apiEndpoint.count(),
      prisma.apiEndpoint.count({ where: { healthStatus: "HEALTHY" } }),
      prisma.storageAsset.findMany({
        take: 4,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
      prisma.crmDeal.aggregate({
        _sum: { value: true },
        _count: { id: true },
      }),
      prisma.crmClient.count(),
      prisma.crmDeal.findMany({
        take: 4,
        orderBy: { createdAt: "desc" },
        include: { client: true },
      }),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.policyAlert.count({ where: { status: "OPEN" } }),
      prisma.employeeProfile.count(),
      db.financialTransaction.findMany({
        take: 20,
        orderBy: { transactionDate: "desc" },
      }),
      db.interDeptApproval.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
      db.corporateEmail.findMany({
        take: 15,
        orderBy: { createdAt: "desc" },
      }),
      db.workflowAutomationRule.findMany({
        orderBy: { executionCount: "desc" },
      }),
      db.financialTransaction.aggregate({
        where: { type: "CAPITAL_INFLOW", status: "SETTLED" },
        _sum: { amount: true },
      }),
      db.financialTransaction.aggregate({
        where: {
          type: { in: ["PROJECT_DISBURSEMENT", "CONTRACTOR_PAYOUT", "PAYROLL", "TREASURY_TRANSFER"] },
          status: "SETTLED",
        },
        _sum: { amount: true },
      }),
    ]);

    totalUsers = tu;
    mfaUsers = mu;
    storageAggregate = sa;
    totalEndpoints = te;
    healthyEndpoints = he;
    recentAssets = ra;
    recentLogs = rl;
    pastWeekLogs = pwl;
    dealsAgg = da;
    clientsCount = cc;
    recentDealsList = rd;
    pendingLeavesCount = plc;
    openAlertsCount = oac;
    staffCount = sc;

    financialTransactionsList = txns || [];
    approvalsList = apprs || [];
    corporateEmailsList = emls || [];
    automationRulesList = autms || [];
    totalInflow = infAgg?._sum?.amount || 0;
    totalDisbursed = disbAgg?._sum?.amount || 0;
  } catch (error) {
    console.warn("[Dashboard] Database queries deferred or unavailable during initial bootstrap:", error);
  }

  // Aggregate past week's audit logs by day of week
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayBuckets: Record<string, number> = {};

  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dayName = daysOfWeek[d.getDay()];
    dayBuckets[dayName] = 0;
  }

  for (const log of pastWeekLogs) {
    const dayName = daysOfWeek[new Date(log.createdAt).getDay()];
    if (dayBuckets[dayName] !== undefined) {
      dayBuckets[dayName] += 1;
    }
  }

  const weeklyActivityData = Object.entries(dayBuckets).map(([label, value]) => ({
    label,
    value,
  }));

  // 3. Query Go Core Backend API Surface with zero crash fallback
  const [backendHealthRes, portfolioRes, enquiriesRes] = await Promise.allSettled([
    backendApi.health(),
    backendApi.portfolio.list({ perPage: 20 }),
    backendApi.enquiries.list({ perPage: 20 }),
  ]);

  const backendHealthy =
    backendHealthRes.status === "fulfilled" && backendHealthRes.value.status === "HEALTHY";
  const backendLatency =
    backendHealthRes.status === "fulfilled" ? backendHealthRes.value.latencyMs : 0;

  const developmentsCount =
    portfolioRes.status === "fulfilled" ? portfolioRes.value.meta.totalItems : 0;

  const portfolioItems =
    portfolioRes.status === "fulfilled" && Array.isArray(portfolioRes.value?.data)
      ? portfolioRes.value.data
      : [];

  const enquiriesCount =
    enquiriesRes.status === "fulfilled" ? enquiriesRes.value.meta.totalItems : 0;

  // Real Financial Calculations (No Mock Data)
  const grossPipelineValue = dealsAgg._sum.value || 0;
  const totalDeals = dealsAgg._count.id || 0;
  const avgDealSize = totalDeals > 0 ? Math.round(grossPipelineValue / totalDeals) : 0;

  const mfaPercent = totalUsers > 0 ? Math.round((mfaUsers / totalUsers) * 100) : 0;
  const totalStorageBytes = storageAggregate._sum.fileSize || 0;
  const totalStorageFiles = storageAggregate._count.id || 0;
  const maxQuotaBytes = 50 * 1024 * 1024 * 1024;
  const storagePercent = Math.min(Math.round((totalStorageBytes / maxQuotaBytes) * 100), 100) || 1;

  const currentUser = user || {
    id: "system",
    fullName: "Executive Director",
    email: "executive@dextaafrica.com",
    role: "SUPER_ADMIN",
    department: "EXECUTIVE",
    seniorityLevel: "EXECUTIVE",
  };

  // 4. Personalized User Context (Requisitions submitted by user, actions pending for their department, personal audit trail)
  let userSubmittedApprovals: any[] = [];
  let userPendingActionApprovals: any[] = [];
  let userAuditLogs: any[] = [];
  let userLeaveRequests: any[] = [];

  if (user?.id) {
    try {
      const [usa, upa, ual, ulr] = await Promise.all([
        db.interDeptApproval.findMany({
          where: {
            OR: [
              { requesterId: user.id },
              { requesterEmail: user.email },
            ],
          },
          take: 8,
          orderBy: { createdAt: "desc" },
        }),
        db.interDeptApproval.findMany({
          where: {
            toDepartment: userDept,
            status: "PENDING",
          },
          take: 8,
          orderBy: { createdAt: "desc" },
        }),
        prisma.auditLog.findMany({
          where: {
            OR: [
              { actorId: user.id },
              { actorEmail: user.email },
            ],
          },
          take: 8,
          orderBy: { createdAt: "desc" },
        }),
        prisma.leaveRequest.findMany({
          where: { userId: user.id },
          take: 5,
          orderBy: { createdAt: "desc" },
        }),
      ]);

      userSubmittedApprovals = usa || [];
      userPendingActionApprovals = upa || [];
      userAuditLogs = ual || [];
      userLeaveRequests = ulr || [];
    } catch {
      // Deferred
    }
  }

  return (
    <div className="pb-12 animate-fade-in w-full min-w-0">
      {/* Unified Executive & Operations Command Workspace */}
      <DepartmentDashboardView
        currentUser={currentUser}
        initialPlatform={initialPlatform}
        initialTab={initialTab}
        portfolioItems={portfolioItems}
        userSubmittedApprovals={userSubmittedApprovals}
        userPendingActionApprovals={userPendingActionApprovals}
        userAuditLogs={userAuditLogs}
        userLeaveRequests={userLeaveRequests}
        executiveMetrics={{
          grossPipelineValue,
          totalDeals,
          totalClients: clientsCount,
          totalStaff: staffCount || totalUsers,
          mfaPercent,
          openAlerts: openAlertsCount,
          developmentsCount,
          backendHealthy,
          backendLatency,
        }}
        operationsMetrics={{
          developmentsCount,
          enquiriesCount,
          pendingLeaves: pendingLeavesCount,
          storageBytes: totalStorageBytes,
          totalStorageFiles,
        }}
        financeMetrics={{
          grossPipelineValue,
          wonValue: 0,
          closingValue: grossPipelineValue,
          totalDeals,
          avgDealSize,
        }}
        itMetrics={{
          mfaPercent,
          totalUsers,
          mfaUsers,
          openAlerts: openAlertsCount,
          healthyEndpoints,
          totalEndpoints,
          totalStorageBytes,
          storagePercent,
          backendHealthy,
          backendLatency,
        }}
        weeklyActivityData={weeklyActivityData}
        recentLogs={recentLogs}
        recentAssets={recentAssets}
        recentDeals={recentDealsList}
        treasuryMetrics={{
          totalInflow,
          totalDisbursed,
          netBalance: totalInflow - totalDisbursed,
        }}
        financialTransactions={financialTransactionsList}
        approvals={approvalsList}
        corporateEmails={corporateEmailsList}
        automationRules={automationRulesList}
      />
    </div>
  );
}
