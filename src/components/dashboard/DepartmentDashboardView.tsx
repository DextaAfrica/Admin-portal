"use client";

import * as React from "react";
import Link from "next/link";
import {
  Crown,
  Briefcase,
  Building2,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Users,
  HardDrive,
  Globe,
  ArrowRight,
  TrendingUp,
  FolderOpen,
  FileText,
  MessageSquare,
  KeyRound,
  Activity,
  CheckCircle2,
  Sparkles,
  Layers,
  Clock,
  ExternalLink,
} from "lucide-react";
import { StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TelemetryChart, RadialGauge } from "@/components/ui/TelemetryChart";
import { formatBytes, timeAgo } from "@/lib/utils";

interface DepartmentDashboardViewProps {
  currentUser: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    department?: string;
  };
  executiveMetrics: {
    grossPipelineValue: number;
    totalDeals: number;
    totalClients: number;
    totalStaff: number;
    mfaPercent: number;
    openAlerts: number;
    developmentsCount: number;
    backendHealthy: boolean;
    backendLatency: number;
  };
  operationsMetrics: {
    developmentsCount: number;
    enquiriesCount: number;
    pendingLeaves: number;
    storageBytes: number;
    totalStorageFiles: number;
  };
  financeMetrics: {
    grossPipelineValue: number;
    wonValue: number;
    closingValue: number;
    totalDeals: number;
    avgDealSize: number;
  };
  itMetrics: {
    mfaPercent: number;
    totalUsers: number;
    mfaUsers: number;
    openAlerts: number;
    healthyEndpoints: number;
    totalEndpoints: number;
    totalStorageBytes: number;
    storagePercent: number;
    backendHealthy: boolean;
    backendLatency: number;
  };
  weeklyActivityData: { label: string; value: number }[];
  recentLogs: any[];
  recentAssets: any[];
  recentDeals: any[];
}

export function DepartmentDashboardView({
  currentUser,
  executiveMetrics,
  operationsMetrics,
  financeMetrics,
  itMetrics,
  weeklyActivityData,
  recentLogs,
  recentAssets,
  recentDeals,
}: DepartmentDashboardViewProps) {
  // Determine default tab based on user's role and department
  const isExecutive =
    currentUser.role === "SUPER_ADMIN" ||
    currentUser.department === "EXECUTIVE" ||
    currentUser.role === "ADMIN";

  const defaultTab = isExecutive
    ? "executive"
    : currentUser.department === "OPERATIONS"
    ? "operations"
    : currentUser.department === "FINANCE"
    ? "finance"
    : currentUser.department === "IT" || currentUser.department === "TECHNOLOGY"
    ? "it"
    : "executive";

  const [activeTab, setActiveTab] = React.useState<"executive" | "operations" | "finance" | "it">(defaultTab);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Department & Executive Command Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest uppercase text-slate-400">
              Department Workflow &amp; Analytics
            </span>
            {isExecutive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <Crown className="h-3 w-3" />
                Executive Access
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            {activeTab === "executive"
              ? "Executive Leadership Command (MD & CEO)"
              : activeTab === "operations"
              ? "Enterprise Operations & Project Delivery Hub"
              : activeTab === "finance"
              ? "Capital Allocation & Treasury Management"
              : "Systems Infrastructure & IT Governance"}
          </h2>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("executive")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "executive"
                ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Crown className="h-3.5 w-3.5 text-amber-400" />
            <span>MD / CEO Command</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("operations")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "operations"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Operations</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("finance")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "finance"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Finance &amp; Treasury</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("it")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "it"
                ? "bg-[#ED2618] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Systems &amp; IT</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* VIEW 1: EXECUTIVE MD & CEO COMMAND */}
      {/* ===================================================================== */}
      {activeTab === "executive" && (
        <div className="space-y-6">
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/crm" className="block group">
              <StatCard
                title="Gross Capital Pipeline"
                value={formatCurrency(executiveMetrics.grossPipelineValue)}
                icon={<Briefcase className="h-5 w-5 text-amber-500" />}
                trend={{
                  value: `${executiveMetrics.totalDeals} In-Flight Deals`,
                  isPositive: true,
                }}
                description={`${executiveMetrics.totalClients} institutional clients`}
              />
            </Link>

            <Link href="/portfolio" className="block group">
              <StatCard
                title="Landmark Developments"
                value={executiveMetrics.developmentsCount}
                icon={<Building2 className="h-5 w-5 text-[#ED2618]" />}
                trend={{
                  value: "Go Core Sync",
                  isPositive: true,
                }}
                description="Active real estate projects"
              />
            </Link>

            <Link href="/hr" className="block group">
              <StatCard
                title="Enterprise Workforce"
                value={executiveMetrics.totalStaff}
                icon={<Users className="h-5 w-5 text-blue-500" />}
                trend={{
                  value: `${executiveMetrics.mfaPercent}% 2FA Active`,
                  isPositive: true,
                }}
                description="Verified staff in directory"
              />
            </Link>

            <Link href="/it" className="block group">
              <StatCard
                title="Perimeter Security"
                value={
                  executiveMetrics.openAlerts === 0
                    ? "SECURE"
                    : `${executiveMetrics.openAlerts} Incidents`
                }
                icon={<ShieldCheck className="h-5 w-5 text-emerald-500" />}
                trend={{
                  value: executiveMetrics.openAlerts === 0 ? "Zero Threats" : "Action Required",
                  isPositive: executiveMetrics.openAlerts === 0,
                }}
                description="IT policy watchdog status"
              />
            </Link>
          </div>

          {/* Executive Radar & Strategic Pipelines */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Real 7-Day Operations Activity Chart */}
            <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#ED2618]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Executive Enterprise Telemetry (Past 7 Days)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Real audit log actions across operations, HR approvals, and IT governance.
                  </p>
                </div>
                <Badge variant={executiveMetrics.backendHealthy ? "success" : "warning"}>
                  {executiveMetrics.backendHealthy ? "Real-Time Telemetry" : "Local Database Mode"}
                </Badge>
              </div>

              <TelemetryChart data={weeklyActivityData} />
            </div>

            {/* Strategic Partner Deals in Pipeline */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Institutional Capital Deals
                </h3>
                <Link href="/crm" className="text-xs font-bold text-amber-500 hover:underline">
                  View All &rarr;
                </Link>
              </div>

              {recentDeals.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                  <Briefcase className="h-6 w-6 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">No active deals registered</p>
                  <p className="text-[11px] text-slate-400">Add an institutional client in CRM to track deals.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {deal.title}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-500">
                          {formatCurrency(deal.value)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{deal.client?.name || "Private Client"}</span>
                        <span className="uppercase font-mono">{deal.stage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: OPERATIONS & INFRASTRUCTURE */}
      {/* ===================================================================== */}
      {activeTab === "operations" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Real Estate Developments"
              value={operationsMetrics.developmentsCount}
              icon={<Building2 className="h-5 w-5 text-amber-500" />}
              trend={{
                value: "Active Portfolio",
                isPositive: true,
              }}
              description="Landmark construction sites"
            />

            <StatCard
              title="Client Inquiries & Leads"
              value={operationsMetrics.enquiriesCount}
              icon={<MessageSquare className="h-5 w-5 text-blue-500" />}
              trend={{
                value: "Investor Leads",
                isPositive: true,
              }}
              description="Property inquiries received"
            />

            <StatCard
              title="Field Team Capacity"
              value={
                operationsMetrics.pendingLeaves === 0
                  ? "Full Capacity"
                  : `${operationsMetrics.pendingLeaves} Leave Pending`
              }
              icon={<Users className="h-5 w-5 text-emerald-500" />}
              trend={{
                value: operationsMetrics.pendingLeaves === 0 ? "100% Available" : "Review Required",
                isPositive: operationsMetrics.pendingLeaves === 0,
              }}
              description="Human resources fleet allocation"
            />
          </div>

          {/* Operations Actions & File Vault */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/[0.06] pb-3">
                Operations Quick Execution
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href="/portfolio"
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all block"
                >
                  <Building2 className="h-5 w-5 text-amber-500 mb-2" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Landmark Projects</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Manage portfolio assets and engineering updates.</p>
                </Link>

                <Link
                  href="/crm"
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-red-500/50 hover:bg-red-500/5 transition-all block"
                >
                  <Briefcase className="h-5 w-5 text-[#ED2618] mb-2" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Client Deals Pipeline</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Track institutional partner milestones.</p>
                </Link>

                <Link
                  href="/hr"
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all block"
                >
                  <Users className="h-5 w-5 text-blue-500 mb-2" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">People &amp; Leave Approvals</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Authorize staff time-off and view roster.</p>
                </Link>

                <Link
                  href="/storage"
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all block"
                >
                  <FolderOpen className="h-5 w-5 text-emerald-500 mb-2" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Cloud Media Vault</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Upload architectural blueprints &amp; media.</p>
                </Link>
              </div>
            </div>

            {/* Cloud Storage Usage */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Operational Asset Vault
                </h3>
                <Link href="/storage" className="text-xs font-bold text-[#ED2618] hover:underline">
                  Browse Files &rarr;
                </Link>
              </div>

              {recentAssets.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                  <FolderOpen className="h-6 w-6 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">No assets uploaded yet</p>
                  <p className="text-[11px] text-slate-400">Upload blueprints, drawings, and corporate media.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                          {asset.fileName}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono shrink-0 ml-2">
                        {formatBytes(asset.fileSize)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 3: FINANCE & TREASURY */}
      {/* ===================================================================== */}
      {activeTab === "finance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Gross Deal Pipeline"
              value={formatCurrency(financeMetrics.grossPipelineValue)}
              icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
              trend={{
                value: `${financeMetrics.totalDeals} Deals`,
                isPositive: true,
              }}
              description="Total institutional commitments"
            />

            <StatCard
              title="Closed / Won Capital"
              value={formatCurrency(financeMetrics.wonValue)}
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              trend={{
                value: "Executed",
                isPositive: true,
              }}
              description="Legally bound contracts"
            />

            <StatCard
              title="Closing Escrow Phase"
              value={formatCurrency(financeMetrics.closingValue)}
              icon={<Clock className="h-5 w-5 text-amber-500" />}
              trend={{
                value: "Due Diligence Stage",
                isPositive: true,
              }}
              description="Pending settlement"
            />

            <StatCard
              title="Average Deal Ticket"
              value={formatCurrency(financeMetrics.avgDealSize)}
              icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
              trend={{
                value: "Institutional Scale",
                isPositive: true,
              }}
              description="Average contract valuation"
            />
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Institutional Capital &amp; Treasury Ledger
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real contracts and stage velocity synced with the CRM pipeline.
                </p>
              </div>
              <Link href="/crm" className="text-xs font-bold text-emerald-500 hover:underline">
                Manage Deals &rarr;
              </Link>
            </div>

            {recentDeals.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                <DollarSign className="h-6 w-6 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No deals in pipeline</p>
                <p className="text-[11px] text-slate-400">All data is production backed. Create deals in CRM to populate financial reports.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/[0.06] text-slate-400 text-[11px]">
                      <th className="py-2.5 px-3">Deal Title</th>
                      <th className="py-2.5 px-3">Client Entity</th>
                      <th className="py-2.5 px-3">Contract Value</th>
                      <th className="py-2.5 px-3">Stage</th>
                      <th className="py-2.5 px-3">Probability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {recentDeals.map((deal) => (
                      <tr key={deal.id}>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                          {deal.title}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {deal.client?.name || "Private Syndicate"}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-500">
                          {formatCurrency(deal.value)}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {deal.stage}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">
                          {deal.probability}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 4: SYSTEMS & IT INFRASTRUCTURE */}
      {/* ===================================================================== */}
      {activeTab === "it" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Two-Factor Protection"
              value={`${itMetrics.mfaPercent}%`}
              icon={<ShieldCheck className="h-5 w-5 text-emerald-500" />}
              trend={{
                value: `${itMetrics.mfaUsers} of ${itMetrics.totalUsers} Protected`,
                isPositive: true,
              }}
              description="NIST TOTP enrollment rate"
            />

            <StatCard
              title="Watchdog Threat Alerts"
              value={itMetrics.openAlerts}
              icon={<ShieldAlert className="h-5 w-5 text-[#ED2618]" />}
              trend={{
                value: itMetrics.openAlerts === 0 ? "Clean Perimeter" : "Investigate",
                isPositive: itMetrics.openAlerts === 0,
              }}
              description="Unresolved security alerts"
            />

            <StatCard
              title="Monitored Gateways"
              value={`${itMetrics.healthyEndpoints} / ${itMetrics.totalEndpoints}`}
              icon={<Globe className="h-5 w-5 text-sky-500" />}
              trend={{
                value: itMetrics.backendHealthy ? "Go Core Online" : "Syncing",
                isPositive: itMetrics.backendHealthy,
              }}
              description="API endpoints availability"
            />

            <StatCard
              title="Storage Vault Quota"
              value={formatBytes(itMetrics.totalStorageBytes)}
              icon={<HardDrive className="h-5 w-5 text-amber-500" />}
              trend={{
                value: `${itMetrics.storagePercent}% Quota Used`,
                isPositive: itMetrics.storagePercent < 80,
              }}
              description="AWS S3 cloud asset volume"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* IT Controls */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/[0.06] pb-3">
                Systems &amp; Governance Tools
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href="/it"
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-red-500/50 hover:bg-red-500/5 transition-all block"
                >
                  <KeyRound className="h-5 w-5 text-[#ED2618] mb-2" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Access Governance</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Provision staff accounts and manage IT keys.</p>
                </Link>

                <Link
                  href="/security"
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all block"
                >
                  <ShieldCheck className="h-5 w-5 text-emerald-500 mb-2" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Active Sessions</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Revoke compromised device tokens.</p>
                </Link>

                <Link
                  href="/audit-logs"
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all block"
                >
                  <Activity className="h-5 w-5 text-sky-500 mb-2" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Compliance Audit Trail</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Inspect immutable administrative logs.</p>
                </Link>

                <Link
                  href="/endpoints"
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all block"
                >
                  <Globe className="h-5 w-5 text-amber-500 mb-2" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">API Gateways</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ping service endpoints &amp; verify latency.</p>
                </Link>
              </div>
            </div>

            {/* Live Audit Log Feed */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Live Audit Activity
                </h3>
                <Link href="/audit-logs" className="text-xs font-bold text-red-500 hover:underline">
                  Full Audit &rarr;
                </Link>
              </div>

              {recentLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No audit events recorded yet.
                </div>
              ) : (
                <div className="space-y-2.5 font-mono text-xs">
                  {recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">
                          {log.action}
                        </span>
                        <span className="text-[11px] text-slate-400 font-sans block">
                          Actor: {log.actorEmail || "SYSTEM"}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                        {timeAgo(log.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
