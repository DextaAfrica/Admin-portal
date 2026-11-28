"use client";

import * as React from "react";
import Link from "next/link";
import {
  Crown,
  Building2,
  TrendingUp,
  Users,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Landmark,
  ChevronRight,
  Send,
  EyeOff,
  Sparkles,
  Check,
  X,
  CheckCircle2,
  Clock,
  Activity,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  CashflowTrendChart,
  PipelineFunnelChart,
  DepartmentHealthRadar,
  type CashflowPoint,
  type PipelineStageMetric,
  type DepartmentHealthItem,
} from "./ExecutiveCharts";
import type { ExecutiveInsight } from "@/lib/executive/insights";

export interface ExecutiveDirectiveItem {
  id: string;
  reference: string;
  title: string;
  instruction: string;
  targetDepartment: string;
  priority: string;
  status: string;
  dueDate: string | null;
  issuedByName: string;
  acknowledgedBy: string | null;
  completionNotes: string | null;
  createdAt: string;
}

export interface StealthTaskItem {
  id: string;
  reference: string;
  title: string;
  description: string;
  department: string;
  assigneeName: string;
  assignedByName: string;
  assignedByRole: string;
  priority: string;
  status: string;
  dueDate: string | null;
  completionNotes: string | null;
  createdAt: string;
}

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
    totalInflow: number;
    totalCapitalDeployed: number;
    netLiquidity: number;
    cashflowSeries: CashflowPoint[];
    pipelineFunnel: PipelineStageMetric[];
    departmentHealth: DepartmentHealthItem[];
    insights: ExecutiveInsight[];
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
      hoursPending?: number;
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
    directives: ExecutiveDirectiveItem[];
    stealthTasks: StealthTaskItem[];
    complianceScore: number;
    openRiskIncidents: number;
  };
}

export function MdExecutiveDashboard({
  currentUser,
  metrics,
}: MdExecutiveDashboardProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Live Interactive State
  const [directives, setDirectives] = React.useState<ExecutiveDirectiveItem[]>(metrics.directives || []);
  const [clearances, setClearances] = React.useState(metrics.highPriorityClearances || []);
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [stealthFilter, setStealthFilter] = React.useState<"ALL" | "GM" | "OVERDUE" | "COMPLETED">("ALL");

  // Issue Directive Modal
  const [directiveModalOpen, setDirectiveModalOpen] = React.useState(false);
  const [isSendingDirective, setIsSendingDirective] = React.useState(false);
  const [directiveForm, setDirectiveForm] = React.useState({
    targetDepartment: "FINANCE",
    priority: "HIGH",
    title: "",
    instruction: "",
    dueDate: "",
  });

  const formatCurrency = (val: number) => {
    const abs = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
    return `${sign}$${abs.toLocaleString()}`;
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const openDirectiveFor = (dept: string) => {
    setDirectiveForm((prev) => ({ ...prev, targetDepartment: dept }));
    setDirectiveModalOpen(true);
  };

  const handleIssueDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directiveForm.title.trim() || !directiveForm.instruction.trim()) {
      toastError("Please provide both a directive title and clear instruction.");
      return;
    }

    setIsSendingDirective(true);
    try {
      const res = await fetch("/api/executive/directives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(directiveForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch directive");

      setDirectives((prev) => [data.directive, ...prev]);
      setDirectiveModalOpen(false);
      setDirectiveForm({
        targetDepartment: "FINANCE",
        priority: "HIGH",
        title: "",
        instruction: "",
        dueDate: "",
      });
      toastSuccess(
        "Executive Directive Dispatched",
        `${data.directive.reference} sent to ${data.directive.targetDepartment} via Dashboard & SMTP.`
      );
    } catch (err: any) {
      toastError(err.message || "Could not dispatch directive");
    } finally {
      setIsSendingDirective(false);
    }
  };

  const handleInlineApproval = async (id: string, status: "APPROVED" | "REJECTED") => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          decisionNotes: `Executive decision by ${currentUser.fullName} from MD/CEO Cockpit`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process approval");

      setClearances((prev) => prev.filter((c) => c.id !== id));
      toastSuccess(
        `Clearance ${status === "APPROVED" ? "Authorized" : "Declined"}`,
        `Target department notified automatically.`
      );
    } catch (err: any) {
      toastError(err.message || "Error updating approval");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredStealthTasks = React.useMemo(() => {
    return (metrics.stealthTasks || []).filter((t) => {
      if (stealthFilter === "GM") return t.assignedByRole === "GM";
      if (stealthFilter === "OVERDUE") return t.status === "OVERDUE";
      if (stealthFilter === "COMPLETED") return t.status === "COMPLETED";
      return true;
    });
  }, [metrics.stealthTasks, stealthFilter]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-slate-900 dark:text-white">
      {/* ===================================================================== */}
      {/* 1. C-SUITE EXECUTIVE HEADER + DIRECTIVE ACTION                        */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="flex items-center gap-1 text-[#ED2618]">
              <Crown className="w-3.5 h-3.5" />
              <span>Office of the Managing Director &amp; Chief Executive</span>
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-mono text-slate-700 dark:text-slate-300">Enterprise Command</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Executive Strategic Cockpit
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated cross-departmental intelligence, live treasury telemetry, direct department instructions, and silent operational oversight.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-slate-200 dark:border-white/10 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Sync Pulse</span>
          </Button>

          <Button
            size="sm"
            onClick={() => openDirectiveFor("FINANCE")}
            className="bg-[#ED2618] hover:bg-[#d01f12] text-white text-xs font-bold shadow-md shadow-red-600/20"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            <span>Issue Directive</span>
          </Button>

          <Link href="/reports">
            <Button variant="outline" size="sm" className="text-xs font-semibold">
              <span>Executive Briefs</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. PRIMARY STRATEGIC PULSE MATRIX                                     */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0D1017] border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Net Treasury Liquidity</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {formatCurrency(metrics.netLiquidity)}
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Inflow: {formatCurrency(metrics.totalInflow)}</span>
            <span className="text-[#ED2618] font-mono font-semibold">
              Out: {formatCurrency(metrics.totalCapitalDeployed)}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0D1017] border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Commercial Pipeline</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {formatCurrency(metrics.grossPipelineValue)}
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>{metrics.activeDealsCount} active deals</span>
            <span className="text-blue-500 font-semibold">{metrics.corporateAccountsCount} accounts</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0D1017] border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Enterprise Workforce</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {metrics.totalStaff}
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>{metrics.departmentBreakdown.length} Directorates</span>
            <span className="text-purple-400 font-semibold">
              {metrics.activeProjects.length} Active Sites
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0D1017] border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Governance &amp; Compliance</span>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-[#ED2618] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {metrics.complianceScore}%
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>NDPR &amp; Audit Health</span>
            <span className={metrics.openRiskIncidents > 0 ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"}>
              {metrics.openRiskIncidents === 0 ? "Zero Breaches" : `${metrics.openRiskIncidents} Open Alerts`}
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. AUTOMATED BUSINESS INSIGHTS ENGINE                                 */}
      {/* ===================================================================== */}
      <div className="rounded-3xl bg-white dark:bg-[#0D1017] border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Automated Executive Decision Insights
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time anomaly detection and strategic recommendations synthesized across all departments.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {metrics.insights.map((ins) => {
            const borderClass =
              ins.severity === "CRITICAL"
                ? "border-red-500/30 bg-red-500/[0.03]"
                : ins.severity === "WARNING"
                ? "border-amber-500/30 bg-amber-500/[0.03]"
                : ins.severity === "OPPORTUNITY"
                ? "border-blue-500/30 bg-blue-500/[0.03]"
                : "border-emerald-500/30 bg-emerald-500/[0.03]";
            const badgeClass =
              ins.severity === "CRITICAL"
                ? "bg-red-500/15 text-[#ED2618]"
                : ins.severity === "WARNING"
                ? "bg-amber-500/15 text-amber-500"
                : ins.severity === "OPPORTUNITY"
                ? "bg-blue-500/15 text-blue-500"
                : "bg-emerald-500/15 text-emerald-500";

            const isDirectiveLink = ins.actionHref.startsWith("#issue-directive");
            const targetDept = ins.actionHref.includes("finance")
              ? "FINANCE"
              : ins.actionHref.includes("it")
              ? "IT"
              : "OPERATIONS";

            return (
              <div key={ins.id} className={`p-4 rounded-2xl border ${borderClass} flex flex-col justify-between gap-3`}>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${badgeClass}`}>
                      {ins.category} • {ins.severity}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">{ins.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{ins.summary}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Recommendation: {ins.recommendation}
                  </p>
                </div>

                <div className="flex justify-end">
                  {isDirectiveLink ? (
                    <button
                      type="button"
                      onClick={() => openDirectiveFor(targetDept)}
                      className="text-xs font-bold text-[#ED2618] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>{ins.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <Link
                      href={ins.actionHref}
                      className="text-xs font-bold text-[#ED2618] hover:underline inline-flex items-center gap-1"
                    >
                      <span>{ins.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. INTERACTIVE ANALYTICS GRID (CASHFLOW, PIPELINE, DEPT HEALTH)       */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#0D1017] border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>6-Month Treasury Cashflow</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Settled capital inflows vs. project &amp; contractor disbursements.
            </p>
          </div>
          <CashflowTrendChart data={metrics.cashflowSeries} />
        </div>

        <div className="lg:col-span-3 rounded-3xl bg-white dark:bg-[#0D1017] border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span>CRM Revenue Funnel</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deal conversion by stage.
            </p>
          </div>
          <PipelineFunnelChart stages={metrics.pipelineFunnel} />
        </div>

        <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-[#0D1017] border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#ED2618]" />
              <span>Departmental Health &amp; SLA</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live efficiency score across all 5 directorates.
            </p>
          </div>
          <DepartmentHealthRadar items={metrics.departmentHealth} />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. EXECUTIVE DIRECTIVES COMMAND & LIVE TRACKER                        */}
      {/* ===================================================================== */}
      <div className="rounded-3xl bg-white dark:bg-[#0D1017] border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-[#ED2618]" />
              <span>Executive Directives &amp; Department Instructions</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Send direct instructions to Finance, Operations, HR, or IT — automatically routed via Dashboard Alert &amp; Corporate SMTP.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {["FINANCE", "OPERATIONS", "HR", "IT"].map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => openDirectiveFor(dept)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] hover:border-[#ED2618] hover:text-[#ED2618] text-[11px] font-bold transition-all cursor-pointer"
              >
                + Instruct {dept}
              </button>
            ))}
          </div>
        </div>

        {directives.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No executive directives issued yet. Use the buttons above to send an instruction to any department.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {directives.slice(0, 6).map((dir) => (
              <div
                key={dir.id}
                className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/10 text-[#ED2618]">
                      {dir.reference}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                      TO: {dir.targetDepartment}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      dir.status === "COMPLETED"
                        ? "bg-emerald-500/15 text-emerald-500"
                        : dir.status === "ACKNOWLEDGED" || dir.status === "IN_PROGRESS"
                        ? "bg-blue-500/15 text-blue-500"
                        : "bg-amber-500/15 text-amber-500"
                    }`}
                  >
                    {dir.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{dir.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{dir.instruction}</p>
                <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-1">
                  <span>Priority: {dir.priority}</span>
                  <span>{dir.acknowledgedBy ? `Ack by ${dir.acknowledgedBy}` : "Awaiting Dept Ack"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 6. INLINE CEO DECISION DESK (APPROVALS & STAGE-2 RELEASES)            */}
      {/* ===================================================================== */}
      {(metrics.pendingProductionReleases.length > 0 || clearances.length > 0) && (
        <div id="decision-desk" className="p-6 rounded-3xl border border-red-500/30 bg-red-500/[0.03] dark:bg-red-500/[0.02] space-y-4">
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
              {metrics.pendingProductionReleases.length + clearances.length} Pending Sign-Off
            </span>
          </div>

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
                    Initiated by {rel.adminName} &bull; {rel.targetSystem}
                  </div>
                </div>
                <Link href={`/it?tab=production&ticket=${rel.ticketNumber}`}>
                  <Button size="sm" className="bg-[#ED2618] hover:bg-[#d01f12] text-white text-xs h-8 px-3 shrink-0">
                    Review &rarr;
                  </Button>
                </Link>
              </div>
            ))}

            {clearances.map((clr) => (
              <div
                key={clr.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      {clr.ticketNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {clr.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {clr.fromDepartment} &rarr; {clr.toDepartment} &bull; {clr.amount ? `$${clr.amount.toLocaleString()}` : "Operational"}
                  </p>
                  <div className="text-[11px] text-slate-400 font-mono">
                    By {clr.requesterName}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={processingId === clr.id}
                    onClick={() => handleInlineApproval(clr.id, "REJECTED")}
                    className="text-xs h-8 px-2.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    disabled={processingId === clr.id}
                    onClick={() => handleInlineApproval(clr.id, "APPROVED")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Authorize
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. STEALTH OPERATIONAL & GM TASK OVERSIGHT (INVISIBLE TO STAFF)       */}
      {/* ===================================================================== */}
      <div id="stealth-oversight" className="rounded-3xl bg-white dark:bg-[#0D1017] border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-purple-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Silent Executive Oversight: GM &amp; Department Task Execution
              </h2>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-500 uppercase">
                Stealth Mode
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Unannounced MD/CEO audit view of all tasks assigned by the General Manager and department heads — completely invisible to staff.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] self-start">
            {(["ALL", "GM", "OVERDUE", "COMPLETED"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStealthFilter(tab)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  stealthFilter === tab
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tab === "GM" ? "GM Assigned" : tab}
              </button>
            ))}
          </div>
        </div>

        {filteredStealthTasks.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No operational tasks matching this filter yet. Tasks assigned by the GM automatically appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.06] text-[10px] font-mono uppercase text-slate-400">
                  <th className="py-2.5 pr-4">Ref</th>
                  <th className="py-2.5 pr-4">Task</th>
                  <th className="py-2.5 pr-4">Assigned By</th>
                  <th className="py-2.5 pr-4">Assignee / Dept</th>
                  <th className="py-2.5 pr-4">Priority</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filteredStealthTasks.slice(0, 12).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                    <td className="py-3 pr-4 font-mono text-[11px] font-bold text-slate-500">{t.reference}</td>
                    <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                      {t.title}
                    </td>
                    <td className="py-3 pr-4 text-slate-500">
                      {t.assignedByName}{" "}
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10">
                        {t.assignedByRole}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                      {t.assigneeName} ({t.department})
                    </td>
                    <td className="py-3 pr-4 font-mono text-[10px] font-bold">{t.priority}</td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          t.status === "COMPLETED"
                            ? "bg-emerald-500/15 text-emerald-500"
                            : t.status === "OVERDUE"
                            ? "bg-red-500/15 text-[#ED2618]"
                            : t.status === "IN_PROGRESS"
                            ? "bg-blue-500/15 text-blue-500"
                            : "bg-amber-500/15 text-amber-500"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 8. INFRASTRUCTURE PORTFOLIOS & DIRECTORATE HEADCOUNT                  */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-[#0D1017] border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#ED2618]" />
                <span>Strategic Concessions &amp; Infrastructure Portfolios</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Multi-year capital works, regional port expansions, and concession asset delivery.
              </p>
            </div>
            <Link href="/projects" className="text-xs font-semibold text-[#ED2618] hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {metrics.activeProjects.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No active infrastructure projects initialized.
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.activeProjects.slice(0, 4).map((prj) => (
                <div key={prj.id} className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-slate-400 mr-2">{prj.code}</span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{prj.name}</span>
                      <div className="text-[11px] text-slate-500">{prj.location} &bull; {prj.leadEngineer}</div>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {prj.progressPct}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div style={{ width: `${prj.progressPct}%` }} className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#0D1017] border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-white/[0.06]">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span>Directorate Workforce</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Active headcount by department.</p>
          </div>
          <div className="space-y-3">
            {metrics.departmentBreakdown.map((item) => (
              <div key={item.department} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{item.department}</span>
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06]">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 9. ISSUE EXECUTIVE DIRECTIVE MODAL                                    */}
      {/* ===================================================================== */}
      <Modal
        isOpen={directiveModalOpen}
        onClose={() => setDirectiveModalOpen(false)}
        title="Issue Executive Directive"
        description="Send a tracked, high-priority instruction directly to a department. Automatically triggers Dashboard Alert & Corporate Email."
      >
        <form onSubmit={handleIssueDirective} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Directorate
              </label>
              <select
                value={directiveForm.targetDepartment}
                onChange={(e) => setDirectiveForm({ ...directiveForm, targetDepartment: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121622] px-3 py-2 text-xs font-semibold"
              >
                <option value="FINANCE">Finance &amp; Treasury</option>
                <option value="OPERATIONS">Operations &amp; Field</option>
                <option value="HR">People &amp; Culture (HR)</option>
                <option value="IT">Systems &amp; IT Security</option>
                <option value="ALL">All Directorates</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Priority Level
              </label>
              <select
                value={directiveForm.priority}
                onChange={(e) => setDirectiveForm({ ...directiveForm, priority: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121622] px-3 py-2 text-xs font-semibold"
              >
                <option value="CRITICAL">CRITICAL (Immediate)</option>
                <option value="HIGH">HIGH (24h SLA)</option>
                <option value="NORMAL">NORMAL</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Directive Subject
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Audit Q4 Contractor Disbursements"
              value={directiveForm.title}
              onChange={(e) => setDirectiveForm({ ...directiveForm, title: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121622] px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Executive Instruction
            </label>
            <textarea
              required
              rows={4}
              placeholder="Specify the exact action required, deliverables, and compliance expectations..."
              value={directiveForm.instruction}
              onChange={(e) => setDirectiveForm({ ...directiveForm, instruction: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121622] px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Target Due Date (Optional)
            </label>
            <input
              type="date"
              value={directiveForm.dueDate}
              onChange={(e) => setDirectiveForm({ ...directiveForm, dueDate: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121622] px-3 py-2 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDirectiveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSendingDirective}
              className="bg-[#ED2618] hover:bg-[#d01f12] text-white font-bold"
            >
              {isSendingDirective ? "Dispatching..." : "Send Executive Directive"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
