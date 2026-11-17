"use client";

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  CheckCircle2,
  Clock,
  HardHat,
  Cpu,
  Landmark,
  Users,
  ShieldCheck,
  ChevronRight,
  Layers,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
  AlertCircle,
  X,
  Check,
  Send,
  Building2,
  Lock,
  ArrowUpDown,
  Tag,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

type PeriodType = "daily" | "weekly" | "monthly";

interface TimeSeriesPoint {
  label: string;
  shortLabel: string;
  inflow: number;
  disbursement: number;
  approvals: number;
  deliveries: number;
  volume: number;
}

interface DepartmentStat {
  department: string;
  name: string;
  budgetAllocated: number;
  budgetUtilized: number;
  activeProjects: number;
  completedDeliveries: number;
  approvalThroughput: string;
  color: string;
}

interface CategoryStat {
  category: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

interface ClearanceTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  fromDepartment: string;
  toDepartment: string;
  requesterId?: string;
  requesterName: string;
  requesterEmail: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  amount?: number;
  currency: string;
  approvedById?: string;
  approvedByName?: string;
  decisionNotes?: string;
  decidedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface FinancialTransactionTicket {
  id: string;
  reference: string;
  type: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  department: string;
  status: "SETTLED" | "PENDING_APPROVAL" | "RECONCILED" | "FLAGGED";
  recipientOrEntity: string;
  authorizedBy: string;
  approvedBy?: string;
  transactionDate: string;
  createdAt: string;
}

interface ReportAnalytics {
  period: PeriodType;
  domain: string;
  generatedAt: string;
  generatedBy: string;
  summary: {
    totalCapitalInflow: number;
    totalDisbursed: number;
    netTreasury: number;
    inflowDelta: string;
    disbursementDelta: string;
    totalApprovals: number;
    approvedCount: number;
    pendingCount: number;
    rejectedCount: number;
    cancelledCount: number;
    approvalRate: number;
    activeStaffCount: number;
    totalAutomationExecutions: number;
    dispatchLatency: string;
    slaCompliance: string;
  };
  timeSeries: TimeSeriesPoint[];
  departmentBreakdown: DepartmentStat[];
  categoryDistribution: CategoryStat[];
  notifications: any[];
  approvals: ClearanceTicket[];
  transactions: FinancialTransactionTicket[];
  counts: {
    totalApprovals: number;
    totalTransactions: number;
  };
}

export default function ReportsPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  // Primary Controls State
  const [period, setPeriod] = React.useState<PeriodType>("daily");
  const [activeTab, setActiveTab] = React.useState<"clearance" | "financial">("clearance");
  const [data, setData] = React.useState<ReportAnalytics | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Filter & Search State
  const [departmentFilter, setDepartmentFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [priorityFilter, setPriorityFilter] = React.useState("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"createdAt" | "amount" | "priority" | "status">("createdAt");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  // Chart Hover State
  const [hoveredPointIndex, setHoveredPointIndex] = React.useState<number | null>(null);

  // Mutation Modal State
  const [selectedTicket, setSelectedTicket] = React.useState<ClearanceTicket | FinancialTransactionTicket | null>(null);
  const [isMutationModalOpen, setIsMutationModalOpen] = React.useState(false);
  const [mutationActionNotes, setMutationActionNotes] = React.useState("");
  const [isMutating, setIsMutating] = React.useState(false);

  // Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [createTicketType, setCreateTicketType] = React.useState<"clearance" | "financial">("clearance");
  const [createTitle, setCreateTitle] = React.useState("");
  const [createDescription, setCreateDescription] = React.useState("");
  const [createCategory, setCreateCategory] = React.useState("CONTRACTOR_CLEARANCE");
  const [createFromDept, setCreateFromDept] = React.useState("OPERATIONS");
  const [createToDept, setCreateToDept] = React.useState("FINANCE");
  const [createPriority, setCreatePriority] = React.useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [createAmount, setCreateAmount] = React.useState("");
  const [createRecipient, setCreateRecipient] = React.useState("");
  const [isCreatingTicket, setIsCreatingTicket] = React.useState(false);

  // Fetch Telemetry Function
  const fetchAnalytics = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        period,
        domain: activeTab,
        department: departmentFilter,
        status: statusFilter,
        priority: priorityFilter,
        search: searchQuery,
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/reports/analytics?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to load operational report telemetry");
      }
      const json: ReportAnalytics = await res.json();
      setData(json);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Error connecting to telemetry service");
    } finally {
      setIsLoading(false);
    }
  }, [period, activeTab, departmentFilter, statusFilter, priorityFilter, searchQuery, sortBy, sortOrder, toastError]);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Handle Ticket Mutation (Approve / Reject / Change Priority)
  const handleMutateTicket = async (newStatus?: string, newPriority?: string) => {
    if (!selectedTicket) return;
    setIsMutating(true);
    try {
      const isClearance = "ticketNumber" in selectedTicket;
      const res = await fetch("/api/reports/analytics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          ticketType: isClearance ? "clearance" : "financial",
          status: newStatus,
          priority: newPriority,
          decisionNotes: mutationActionNotes.trim() || undefined,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Ticket mutation failed");

      toastSuccess(
        "Ticket Mutated",
        resJson.message || "Operational ticket updated with persistent audit trail."
      );
      setIsMutationModalOpen(false);
      setSelectedTicket(null);
      setMutationActionNotes("");
      fetchAnalytics();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Mutation failed");
    } finally {
      setIsMutating(false);
    }
  };

  // Handle Ticket Creation
  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      toastError("Title is required for ticket creation");
      return;
    }

    setIsCreatingTicket(true);
    try {
      const res = await fetch("/api/reports/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketType: createTicketType,
          title: createTitle,
          description: createDescription,
          category: createCategory,
          fromDepartment: createFromDept,
          toDepartment: createToDept,
          priority: createPriority,
          amount: parseFloat(createAmount) || 0,
          recipientOrEntity: createRecipient,
          type: createTicketType === "financial" ? "PROJECT_DISBURSEMENT" : undefined,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Failed to create ticket");

      toastSuccess("Ticket Issued", resJson.message || "Ticket persisted to enterprise ledger.");
      setIsCreateModalOpen(false);
      setCreateTitle("");
      setCreateDescription("");
      setCreateAmount("");
      setCreateRecipient("");
      fetchAnalytics();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Ticket creation failed");
    } finally {
      setIsCreatingTicket(false);
    }
  };

  // CSV Export Handler
  const handleExportCsv = () => {
    if (!data) return;
    const isClearance = activeTab === "clearance";
    let headers = "";
    let rows = "";

    if (isClearance) {
      headers = "Ticket Number,Title,Category,From Department,To Department,Priority,Status,Amount ($),Requester,Date\n";
      rows = (data.approvals || [])
        .map(
          (a) =>
            `"${a.ticketNumber}","${a.title.replace(/"/g, '""')}","${a.category}","${a.fromDepartment}","${a.toDepartment}","${a.priority}","${a.status}",${a.amount || 0},"${a.requesterName}","${a.createdAt}"`
        )
        .join("\n");
    } else {
      headers = "Reference,Title,Type,Department,Status,Amount ($),Recipient,Authorized By,Date\n";
      rows = (data.transactions || [])
        .map(
          (t) =>
            `"${t.reference}","${t.title.replace(/"/g, '""')}","${t.type}","${t.department}","${t.status}",${t.amount},"${t.recipientOrEntity}","${t.authorizedBy}","${t.transactionDate}"`
        )
        .join("\n");
    }

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Dexta-${activeTab}-tickets-${period}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess("CSV Exported", `Downloaded ${activeTab} operational tickets.`);
  };

  // Chart Scales
  const maxFinancial = React.useMemo(() => {
    if (!data?.timeSeries?.length) return 1000;
    const maxIn = Math.max(...data.timeSeries.map((p) => p.inflow));
    const maxOut = Math.max(...data.timeSeries.map((p) => p.disbursement));
    return Math.max(maxIn, maxOut, 100);
  }, [data]);

  const maxVolume = React.useMemo(() => {
    if (!data?.timeSeries?.length) return 10;
    return Math.max(...data.timeSeries.map((p) => p.volume), 5);
  }, [data]);

  return (
    <div className="w-full min-w-0 space-y-8 animate-fade-in pb-16">
      {/* ===================================================================== */}
      {/* 1. EXECUTIVE HEADER & ACTIONS */}
      {/* ===================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ED2618]/10 text-[#ED2618] border border-[#ED2618]/20 shadow-sm">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Executive Reports &amp; Operational Analytics
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Ticket-defined infrastructure telemetry, capital treasury trajectory, and inter-department clearances.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Cadence Selector */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-white/[0.04] p-1 border border-slate-200/80 dark:border-white/[0.08]">
            {(["daily", "weekly", "monthly"] as const).map((p) => {
              const isActive = period === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#ED2618] text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics()}
            className="flex items-center gap-1.5 border-slate-200 dark:border-white/10"
            title="Refresh Real-Time Telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 border-slate-200 dark:border-white/10"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setCreateTicketType(activeTab);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 shadow-sm shadow-red-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Issue Ticket</span>
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. GENUINE KPI STATS RIBBON (Strictly Database Derived) */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Capital Inflow */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Capital Inflow</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {formatCurrency(data?.summary.totalCapitalInflow || 0, "USD")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            {data?.summary.inflowDelta && data.summary.inflowDelta !== "0.0%" ? (
              <span className={data.summary.inflowDelta.startsWith("+") ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                {data.summary.inflowDelta} vs prior {period}
              </span>
            ) : (
              <span>Baseline settled inflow</span>
            )}
          </div>
        </div>

        {/* Card 2: Milestone Outflows */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Milestone Outflows</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {formatCurrency(data?.summary.totalDisbursed || 0, "USD")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Clock className="h-3.5 w-3.5" />
            <span>Net Treasury: {formatCurrency(data?.summary.netTreasury || 0, "USD")}</span>
          </div>
        </div>

        {/* Card 3: Clearance Throughput */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Approval Throughput</span>
            <div className="p-1.5 rounded-lg bg-[#ED2618]/10 text-[#ED2618]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {data?.summary.approvalRate || 0}%
            </span>
            <span className="text-xs text-slate-400">
              ({data?.summary.approvedCount || 0} / {data?.summary.totalApprovals || 0} tickets)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Zero-Trust Protocol Guard</span>
          </div>
        </div>

        {/* Card 4: Operational SLA & Velocity */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Operational SLA</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {data?.summary.slaCompliance || "100%"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            <Clock className="h-3.5 w-3.5" />
            <span>Avg ticket dispatch: {data?.summary.dispatchLatency || "0.0 hrs"}</span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. INTERACTIVE VISUAL CHARTS */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Financial Telemetry Trajectory */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#ED2618]" />
                <span>Capital Inflows vs. Milestone Disbursements</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Financial telemetry distribution across active {period} operational cadence.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">Capital Inflow</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ED2618]" />
                <span className="text-slate-600 dark:text-slate-400">Disbursement</span>
              </div>
            </div>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="relative h-64 w-full pt-4">
            {data?.timeSeries && data.timeSeries.length > 0 ? (
              <div className="h-full flex items-end justify-between gap-2 sm:gap-4 px-2">
                {data.timeSeries.map((point, idx) => {
                  const inflowPct = maxFinancial > 0 ? Math.min(100, Math.max(4, (point.inflow / maxFinancial) * 100)) : 4;
                  const disbPct = maxFinancial > 0 ? Math.min(100, Math.max(4, (point.disbursement / maxFinancial) * 100)) : 4;
                  const isHovered = hoveredPointIndex === idx;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                      onMouseEnter={() => setHoveredPointIndex(idx)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                    >
                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-14 z-30 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-xl shadow-xl text-[11px] whitespace-nowrap pointer-events-none transition-all">
                          <p className="font-bold">{point.label}</p>
                          <p className="text-emerald-400 dark:text-emerald-600 font-mono">
                            Inflow: {formatCurrency(point.inflow, "USD")}
                          </p>
                          <p className="text-red-400 dark:text-red-600 font-mono">
                            Outflow: {formatCurrency(point.disbursement, "USD")}
                          </p>
                        </div>
                      )}

                      {/* Side by side Bars */}
                      <div className="w-full flex items-end justify-center gap-1 h-5/6">
                        {/* Inflow Bar */}
                        <div
                          style={{ height: `${point.inflow > 0 ? inflowPct : 4}%` }}
                          className={`w-1/2 rounded-t-md transition-all duration-300 ${
                            point.inflow > 0
                              ? "bg-emerald-500 group-hover:bg-emerald-400"
                              : "bg-slate-200/50 dark:bg-white/5"
                          }`}
                        />
                        {/* Disbursement Bar */}
                        <div
                          style={{ height: `${point.disbursement > 0 ? disbPct : 4}%` }}
                          className={`w-1/2 rounded-t-md transition-all duration-300 ${
                            point.disbursement > 0
                              ? "bg-[#ED2618] group-hover:bg-red-400"
                              : "bg-slate-200/50 dark:bg-white/5"
                          }`}
                        />
                      </div>

                      {/* X-Axis Label */}
                      <span className="text-[10px] sm:text-xs font-medium text-slate-500 mt-2 truncate max-w-full">
                        {point.shortLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No financial telemetry records in this period.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-white/[0.06] pt-3">
            <span>Timeline: Active {period} cadence</span>
            <span>All figures strictly ledger-settled in USD ($)</span>
          </div>
        </div>

        {/* Chart 2: Category & Directorate Distribution */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-white/[0.06] pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="h-4 w-4 text-[#ED2618]" />
              <span>Clearance Categories</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Inter-department clearance allocation &amp; permits.
            </p>
          </div>

          <div className="space-y-4">
            {data?.categoryDistribution && data.categoryDistribution.length > 0 ? (
              data.categoryDistribution.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                      {cat.label}
                    </span>
                    <span className="font-mono text-slate-500 font-bold">
                      {cat.count} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/[0.05] overflow-hidden">
                    <div
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No clearance categories registered.</p>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. TICKET-DEFINED ARCHITECTURE CONSOLE (Clearance & Treasury) */}
      {/* ===================================================================== */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] p-6 shadow-sm space-y-6">
        {/* Domain Navigation & Search / Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/[0.06] pb-5">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("clearance")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "clearance"
                  ? "bg-[#ED2618] text-white shadow-sm shadow-red-500/25"
                  : "bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <HardHat className="h-3.5 w-3.5" />
              <span>Operational Clearance Tickets ({data?.counts?.totalApprovals || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("financial")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "financial"
                  ? "bg-[#ED2618] text-white shadow-sm shadow-red-500/25"
                  : "bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span>Capital Ledger Tickets ({data?.counts?.totalTransactions || 0})</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search ticket #, title, directorate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED2618]/30 transition-all"
            />
          </div>
        </div>

        {/* Filter & Sorting Ribbon */}
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <Filter className="h-3 w-3 text-[#ED2618]" />
            <span>Filters:</span>
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Directorates</option>
            <option value="OPERATIONS">Operations &amp; Fleet</option>
            <option value="ENGINEERING">Civil &amp; Engineering</option>
            <option value="FINANCE">Finance &amp; Treasury</option>
            <option value="IT">Systems IT Defense</option>
            <option value="HR">People &amp; Culture</option>
            <option value="EXECUTIVE">Executive Board</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            {activeTab === "clearance" ? (
              <>
                <option value="PENDING">Pending Clearance</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </>
            ) : (
              <>
                <option value="SETTLED">Settled</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="RECONCILED">Reconciled</option>
                <option value="FLAGGED">Flagged</option>
              </>
            )}
          </select>

          {/* Priority Filter (Clearance only) */}
          {activeTab === "clearance" && (
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="NORMAL">Normal Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          )}

          {/* Sort By */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="createdAt">Date Created</option>
              <option value="amount">Amount ($)</option>
              {activeTab === "clearance" && <option value="priority">Priority Level</option>}
              <option value="status">Status</option>
            </select>

            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* TICKET DATA TABLE */}
        {/* ===================================================================== */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/[0.08]">
          {activeTab === "clearance" ? (
            /* Clearance Tickets Table */
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/[0.08] text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="px-4 py-3">Ticket #</th>
                  <th className="px-4 py-3">Title &amp; Category</th>
                  <th className="px-4 py-3">Directorate Route</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Requester</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {data?.approvals && data.approvals.length > 0 ? (
                  data.approvals.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-[#ED2618]">
                        {ticket.ticketNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white max-w-xs truncate">
                          {ticket.title}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                          {ticket.category.replace(/_/g, " ")}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {ticket.fromDepartment} &rarr; {ticket.toDepartment}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ticket.priority === "URGENT"
                              ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20"
                              : ticket.priority === "HIGH"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : ticket.priority === "NORMAL"
                              ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              : "bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20"
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {ticket.amount ? formatCurrency(ticket.amount, ticket.currency) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            ticket.status === "APPROVED"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : ticket.status === "REJECTED"
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : ticket.status === "CANCELLED"
                              ? "bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {ticket.requesterName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setIsMutationModalOpen(true);
                          }}
                          className="text-[#ED2618] hover:text-white hover:bg-[#ED2618]"
                        >
                          Inspect &amp; Mutate
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="h-12 w-12 rounded-2xl bg-red-500/10 text-[#ED2618] mx-auto flex items-center justify-center">
                          <HardHat className="h-6 w-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          No Operational Clearance Tickets Recorded
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          No clearance tickets found matching your filter criteria. Issue an enterprise clearance ticket to initiate zero-trust workflow validation.
                        </p>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setCreateTicketType("clearance");
                            setIsCreateModalOpen(true);
                          }}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          <span>Issue Clearance Ticket</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            /* Capital Financial Ledger Tickets Table */
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/[0.08] text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Transaction Title &amp; Entity</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Directorate</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Authorized By</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {data?.transactions && data.transactions.length > 0 ? (
                  data.transactions.map((txn) => (
                    <tr
                      key={txn.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-[#ED2618]">
                        {txn.reference}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white max-w-xs truncate">
                          {txn.title}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Recipient: {txn.recipientOrEntity}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {txn.type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {txn.department}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(txn.amount, txn.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            txn.status === "SETTLED"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : txn.status === "FLAGGED"
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {txn.authorizedBy}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(txn.transactionDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(txn);
                            setIsMutationModalOpen(true);
                          }}
                          className="text-[#ED2618] hover:text-white hover:bg-[#ED2618]"
                        >
                          Inspect &amp; Mutate
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="h-12 w-12 rounded-2xl bg-red-500/10 text-[#ED2618] mx-auto flex items-center justify-center">
                          <DollarSign className="h-6 w-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          No Capital Ledger Tickets Recorded
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          No financial ledger entries match your parameters. Post an authorized capital transaction to initiate live treasury tracking.
                        </p>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setCreateTicketType("financial");
                            setIsCreateModalOpen(true);
                          }}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          <span>Issue Ledger Ticket</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. TICKET MUTATION & AUDIT INSPECTION MODAL */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isMutationModalOpen}
        onClose={() => {
          setIsMutationModalOpen(false);
          setSelectedTicket(null);
        }}
        title="Zero-Trust Ticket Inspection &amp; Mutation"
        description="Inspect verified ticket telemetry, audit trail, and execute state mutations."
        maxWidth="lg"
      >
        {selectedTicket && (
          <div className="space-y-5 text-slate-900 dark:text-white text-xs pt-2">
            {/* Header info */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-extrabold text-[#ED2618]">
                  {"ticketNumber" in selectedTicket ? selectedTicket.ticketNumber : selectedTicket.reference}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-white/10">
                  {selectedTicket.status}
                </span>
              </div>
              <h3 className="text-sm font-bold">{selectedTicket.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {selectedTicket.description || "No extended operational brief provided."}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06]">
                <span className="text-slate-400 block text-[9px] uppercase">Amount:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedTicket.amount ? formatCurrency(selectedTicket.amount, selectedTicket.currency) : "N/A"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06]">
                <span className="text-slate-400 block text-[9px] uppercase">Initiated By:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {"requesterName" in selectedTicket ? selectedTicket.requesterName : selectedTicket.authorizedBy}
                </span>
              </div>
            </div>

            {/* Mutation Memo Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Audit Decision Memo / Justification Notes
              </label>
              <textarea
                rows={2}
                value={mutationActionNotes}
                onChange={(e) => setMutationActionNotes(e.target.value)}
                placeholder="Enter justification for ticket approval, decline, or priority escalation..."
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED2618]/30 transition-all"
              />
            </div>

            {/* Action Mutation Buttons */}
            {"ticketNumber" in selectedTicket ? (
              /* Clearance Ticket Actions */
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Execute State Mutation:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isMutating || selectedTicket.status === "APPROVED"}
                    onClick={() => handleMutateTicket("APPROVED")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    <span>Approve</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isMutating || selectedTicket.status === "REJECTED"}
                    onClick={() => handleMutateTicket("REJECTED")}
                    className="border-rose-400 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    <span>Reject</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isMutating || (selectedTicket as ClearanceTicket).priority === "URGENT"}
                    onClick={() => handleMutateTicket(undefined, "URGENT")}
                    className="border-red-400 text-[#ED2618] hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <TrendingUp className="h-3.5 w-3.5 mr-1" />
                    <span>Escalate Urgent</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isMutating || selectedTicket.status === "CANCELLED"}
                    onClick={() => handleMutateTicket("CANCELLED")}
                  >
                    <span>Cancel Ticket</span>
                  </Button>
                </div>
              </div>
            ) : (
              /* Financial Ticket Actions */
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Execute Ledger Mutation:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isMutating || selectedTicket.status === "SETTLED"}
                    onClick={() => handleMutateTicket("SETTLED")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    <span>Settle Ledger</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isMutating || selectedTicket.status === "FLAGGED"}
                    onClick={() => handleMutateTicket("FLAGGED")}
                    className="border-amber-400 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  >
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    <span>Flag Audit</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isMutating || selectedTicket.status === "RECONCILED"}
                    onClick={() => handleMutateTicket("RECONCILED")}
                  >
                    <span>Reconcile</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ===================================================================== */}
      {/* 6. CREATE OPERATIONAL TICKET MODAL */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Issue Operational Enterprise Ticket"
        description="Provision a cryptographic clearance or capital transaction ticket with real-time audit logging."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTicketSubmit} className="space-y-4 pt-2 text-xs">
          {/* Ticket Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04]">
            <button
              type="button"
              onClick={() => setCreateTicketType("clearance")}
              className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                createTicketType === "clearance"
                  ? "bg-white dark:bg-[#0c0d12] text-[#ED2618] shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Clearance Permit Ticket
            </button>
            <button
              type="button"
              onClick={() => setCreateTicketType("financial")}
              className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                createTicketType === "financial"
                  ? "bg-white dark:bg-[#0c0d12] text-[#ED2618] shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Capital Ledger Ticket
            </button>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Ticket Title / Subject <span className="text-[#ED2618]">*</span>
            </label>
            <input
              type="text"
              required
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="e.g. Lekki Coastal Expressway Asphalt Delivery Milestone Clearance"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED2618]/30 transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Operational Scope &amp; Specifications
            </label>
            <textarea
              rows={2}
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="Provide engineering milestone details, inspection verification criteria, and partner references..."
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED2618]/30 transition-all"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {createTicketType === "clearance" ? (
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Clearance Category</label>
                <select
                  value={createCategory}
                  onChange={(e) => setCreateCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] px-3 py-2 text-xs font-medium cursor-pointer"
                >
                  <option value="CONTRACTOR_CLEARANCE">Contractor Site Clearance</option>
                  <option value="PROCUREMENT_LOGISTICS">Procurement &amp; Site Logistics</option>
                  <option value="BUDGET_DISBURSEMENT">Capital Budget Disbursement</option>
                  <option value="HEADCOUNT_HIRE">Field Personnel Deployment</option>
                  <option value="POLICY_EXCEPTION">Regulatory &amp; Compliance Clearance</option>
                  <option value="TRAVEL_EXPENSE">Executive Travel &amp; Field Mission</option>
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Entity / Recipient</label>
                <input
                  type="text"
                  value={createRecipient}
                  onChange={(e) => setCreateRecipient(e.target.value)}
                  placeholder="e.g. Apex Africa Logistics Consortium"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] px-3 py-2 text-xs"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">Priority Level</label>
              <select
                value={createPriority}
                onChange={(e) => setCreatePriority(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] px-3 py-2 text-xs font-medium cursor-pointer"
              >
                <option value="URGENT">Urgent Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="NORMAL">Normal Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Department Routing & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">From Directorate</label>
              <select
                value={createFromDept}
                onChange={(e) => setCreateFromDept(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] px-3 py-2 text-xs font-medium cursor-pointer"
              >
                <option value="OPERATIONS">Operations</option>
                <option value="ENGINEERING">Engineering</option>
                <option value="FINANCE">Finance</option>
                <option value="IT">Systems IT</option>
                <option value="HR">People &amp; Culture</option>
                <option value="EXECUTIVE">Executive</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">Target Directorate</label>
              <select
                value={createToDept}
                onChange={(e) => setCreateToDept(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] px-3 py-2 text-xs font-medium cursor-pointer"
              >
                <option value="FINANCE">Finance &amp; Treasury</option>
                <option value="OPERATIONS">Operations</option>
                <option value="ENGINEERING">Engineering</option>
                <option value="EXECUTIVE">Executive Board</option>
                <option value="IT">Systems IT</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">Amount ($ USD)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={createAmount}
                onChange={(e) => setCreateAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isCreatingTicket}
              className="bg-[#ED2618] hover:bg-red-700 text-white"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              <span>Issue &amp; Dispatch Ticket</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
