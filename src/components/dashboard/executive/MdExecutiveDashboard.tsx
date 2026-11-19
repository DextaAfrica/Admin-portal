"use client";

import * as React from "react";
import Link from "next/link";
import {
  Crown,
  Building2,
  TrendingUp,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Briefcase,
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  Landmark,
  Compass,
  Award,
  ChevronRight,
  Send,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatBytes, formatDate } from "@/lib/utils";

export interface MdExecutiveDashboardProps {
  currentUser: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    department?: string;
    jobTitle?: string | null;
  };
  metrics: {
    grossPipelineValue: number;
    activeDealsCount: number;
    corporateAccountsCount: number;
    totalStaff: number;
    departmentBreakdown: { department: string; count: number }[];
    totalCapitalDeployed: number;
    activeProjects: {
      id: string;
      code: string;
      name: string;
      location: string;
      category: string;
      status: string;
      progressPct: number;
      budget?: number | null;
      currency?: string;
      leadEngineer?: string | null;
    }[];
    highPriorityClearances: {
      id: string;
      ticketNumber: string;
      title: string;
      fromDepartment: string;
      toDepartment: string;
      requesterName: string;
      amount?: number | null;
      priority: string;
      createdAt: string;
    }[];
    pendingProductionReleases: {
      id: string;
      ticketNumber: string;
      title: string;
      targetSystem: string;
      adminName: string;
      justification: string;
      createdAt: string;
    }[];
    complianceScore: number;
    openRiskIncidents: number;
  };
}

export function MdExecutiveDashboard({
  currentUser,
  metrics,
}: MdExecutiveDashboardProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000_000) {
      return `$${(val / 1_000_000_000).toFixed(2)}B`;
    }
    if (val >= 1_000_000) {
      return `$${(val / 1_000_000).toFixed(2)}M`;
    }
    if (val >= 1_000) {
      return `$${(val / 1_000).toFixed(1)}K`;
    }
    return `$${val.toLocaleString()}`;
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-slate-900 dark:text-white">
      {/* C-Suite Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="flex items-center gap-1 text-[#ED2618]">
              <Crown className="w-3.5 h-3.5" />
              <span>Office of the Managing Director & Chief Executive</span>
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-mono text-slate-700 dark:text-slate-300">Executive Command</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Enterprise Strategic Cockpit
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time cross-directorate intelligence: capital allocation, infrastructure portfolios, talent strength, and executive governance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-slate-200 dark:border-white/10 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Sync Pulse</span>
          </Button>

          <Link href="/reports">
            <Button
              size="sm"
              className="bg-[#ED2618] hover:bg-[#d01f12] text-white text-xs font-bold shadow-md shadow-red-600/20"
            >
              <span>Executive Briefs</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Strategic Pulse Matrix (Fortune 500 Cockpit Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Commercial Pipeline */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0D1017] border border-slate-200/80 dark:border-white/[0.08] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            <span>Commercial Pipeline</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {formatCurrency(metrics.grossPipelineValue)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>{metrics.activeDealsCount} active concessions</span>
            <span className="text-blue-500 font-semibold">{metrics.corporateAccountsCount} accounts</span>
          </div>
          <div className="h-1 w-full bg-blue-500/20 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full w-3/4" />
          </div>
        </div>

        {/* Card 2: Capital Deployed & Settled Treasury */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0D1017] border border-slate-200/80 dark:border-white/[0.08] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            <span>Capital Deployed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {formatCurrency(metrics.totalCapitalDeployed)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Settled Treasury Outflow</span>
            <span className="text-emerald-500 font-semibold font-mono">100% Reconciled</span>
          </div>
          <div className="h-1 w-full bg-emerald-500/20 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-full" />
          </div>
        </div>

        {/* Card 3: Workforce Strength & Talent Scale */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0D1017] border border-slate-200/80 dark:border-white/[0.08] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            <span>Enterprise Headcount</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {metrics.totalStaff}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Across 5 Directorates</span>
            <span className="text-purple-400 font-semibold">Active Capacity</span>
          </div>
          <div className="h-1 w-full bg-purple-500/20 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full w-4/5" />
          </div>
        </div>

        {/* Card 4: Governance & Compliance Barometer */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0D1017] border border-slate-200/80 dark:border-white/[0.08] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            <span>Compliance & Health</span>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-[#ED2618] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {metrics.complianceScore}%
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>NDPR & Audit Health</span>
            <span className={metrics.openRiskIncidents > 0 ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"}>
              {metrics.openRiskIncidents === 0 ? "Zero Open Breaches" : `${metrics.openRiskIncidents} Incidents`}
            </span>
          </div>
          <div className="h-1 w-full bg-red-500/20 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-[#ED2618] rounded-full w-full" />
          </div>
        </div>
      </div>

      {/* CEO Decision Desk (Urgent High-Impact Sign-offs) */}
      {(metrics.pendingProductionReleases.length > 0 || metrics.highPriorityClearances.length > 0) && (
        <div className="p-6 rounded-3xl border border-red-500/30 bg-red-500/[0.03] dark:bg-red-500/[0.02] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Chief Executive Decision Desk
              </h2>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-[#ED2618] border border-red-500/20">
              {metrics.pendingProductionReleases.length + metrics.highPriorityClearances.length} Action Items Pending
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Critical matters requiring Chief Executive / Super Administrative Stage-2 sign-off before executing to live production.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {metrics.pendingProductionReleases.map((rel) => (
              <div
                key={rel.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 flex items-start justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-500/10 text-[#ED2618] border border-red-500/20">
                      {rel.ticketNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {rel.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{rel.justification}</p>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Initiated by {rel.adminName} &bull; Target: {rel.targetSystem}
                  </div>
                </div>

                <Link href={`/it?tab=production&ticket=${rel.ticketNumber}`}>
                  <Button size="sm" className="bg-[#ED2618] hover:bg-[#d01f12] text-white text-xs h-8 px-3 shrink-0">
                    Review Diff &rarr;
                  </Button>
                </Link>
              </div>
            ))}

            {metrics.highPriorityClearances.map((clr) => (
              <div
                key={clr.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 flex items-start justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      {clr.ticketNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {clr.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    From {clr.fromDepartment} to {clr.toDepartment} &bull; {clr.amount ? `$${clr.amount.toLocaleString()}` : "Operational Request"}
                  </p>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Requester: {clr.requesterName}
                  </div>
                </div>

                <Link href="/dashboard?tab=approvals">
                  <Button size="sm" variant="outline" className="text-xs h-8 px-3 shrink-0">
                    Authorize
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Infrastructure Portfolios & Directorate Velocity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Strategic Portfolios & Concessions */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-[#0D1017] border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#ED2618]" />
                <span>Strategic Concessions & Infrastructure Portfolios</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Multi-year capital works, regional port expansions, and concession asset delivery.
              </p>
            </div>
            <Link
              href="/projects"
              className="text-xs font-semibold text-[#ED2618] hover:underline flex items-center gap-1"
            >
              <span>View All Portfolios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {metrics.activeProjects.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No active infrastructure projects currently initialized.
            </div>
          ) : (
            <div className="space-y-3.5">
              {metrics.activeProjects.map((prj) => (
                <div
                  key={prj.id}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {prj.code}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {prj.name}
                        </h4>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {prj.location} &bull; Lead: {prj.leadEngineer || "Senior Concession Team"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {prj.progressPct}% Complete
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          prj.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        }`}
                      >
                        {prj.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${prj.progressPct}%` }}
                      className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Directorate Talent Distribution */}
        <div className="rounded-3xl bg-white dark:bg-[#0D1017] border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-sm space-y-5">
          <div className="pb-3 border-b border-slate-100 dark:border-white/[0.06]">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Headcount by Directorate</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Active personnel deployment across company arms.
            </p>
          </div>

          <div className="space-y-3.5">
            {metrics.departmentBreakdown.map((dept) => {
              const pct =
                metrics.totalStaff > 0
                  ? Math.round((dept.count / metrics.totalStaff) * 100)
                  : 0;
              return (
                <div key={dept.department} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {dept.department}
                    </span>
                    <span className="font-mono text-slate-900 dark:text-white font-bold">
                      {dept.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.max(pct, 5)}%` }}
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-slate-500">Executive Succession:</span>
            <span className="font-semibold text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Fully Staffed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
