"use client";

import * as React from "react";
import Link from "next/link";
import {
  Compass,
  Building2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Users,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  TrendingUp,
  FileCheck2,
  Check,
  X,
  Filter,
  BarChart3,
  Calendar,
  AlertOctagon,
  ChevronRight,
  Flame,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export interface GmTaskItem {
  id: string;
  reference: string;
  title: string;
  description: string;
  department: string;
  assigneeName: string;
  assignedByName: string;
  priority: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
}

export interface GmOperationsDashboardProps {
  currentUser: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    department?: string;
    jobTitle?: string | null;
  };
  metrics: {
    slaComplianceRate: number;
    totalClearancesPending: number;
    bottlenecksCount: number;
    avgResolutionHours: number;
    workforceOnDuty: number;
    activeLeavesCount: number;
    interDepartmentalClearances: {
      id: string;
      ticketNumber: string;
      title: string;
      fromDepartment: string;
      toDepartment: string;
      requesterName: string;
      amount?: number | null;
      priority: string;
      createdAt: string;
      hoursPending: number;
      isBottleneck: boolean;
      status: string;
    }[];
    departmentSlaList: {
      department: string;
      activePending: number;
      compliancePct: number;
      slaStatus: "HEALTHY" | "WATCH" | "CRITICAL";
      avgLeadTime: string;
    }[];
    infrastructureDeliveries: {
      id: string;
      code: string;
      name: string;
      location: string;
      status: string;
      progressPct: number;
      milestone: string;
      leadEngineer?: string | null;
    }[];
    systemHealthScore: number;
    tasks?: GmTaskItem[];
    assignableStaff?: {
      id: string;
      fullName: string;
      department: string;
      jobTitle?: string | null;
    }[];
  };
}

export function GmOperationsDashboard({
  currentUser,
  metrics,
}: GmOperationsDashboardProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [activeFilter, setActiveFilter] = React.useState<"ALL" | "BOTTLENECKS" | "URGENT">("ALL");
  const [clearingId, setClearingId] = React.useState<string | null>(null);
  const [clearedIds, setClearedIds] = React.useState<Set<string>>(new Set());

  // GM Operational Task Assignment State
  const [tasksList, setTasksList] = React.useState<GmTaskItem[]>(metrics.tasks || []);
  const [taskModalOpen, setTaskModalOpen] = React.useState(false);
  const [isAssigningTask, setIsAssigningTask] = React.useState(false);
  const [taskForm, setTaskForm] = React.useState({
    title: "",
    description: "",
    department: "OPERATIONS",
    assigneeId: "",
    priority: "HIGH",
    dueDate: "",
  });

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !taskForm.description.trim()) {
      toastError("Task title and description are required.");
      return;
    }

    setIsAssigningTask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign task");

      const created: GmTaskItem = {
        id: data.task.id,
        reference: data.task.reference,
        title: data.task.title,
        description: data.task.description,
        department: data.task.department,
        assigneeName: data.task.assigneeName || `${data.task.department} Team`,
        assignedByName: data.task.assignedByName,
        priority: data.task.priority,
        status: data.task.status,
        dueDate: data.task.dueDate || null,
        createdAt: data.task.createdAt,
      };
      setTasksList((prev) => [created, ...prev]);
      setTaskModalOpen(false);
      setTaskForm({
        title: "",
        description: "",
        department: "OPERATIONS",
        assigneeId: "",
        priority: "HIGH",
        dueDate: "",
      });
      toastSuccess("Operational Task Assigned", `${created.reference} dispatched to ${created.assigneeName}.`);
    } catch (err: any) {
      toastError(err.message || "Error assigning task");
    } finally {
      setIsAssigningTask(false);
    }
  };

  const handleInstantClear = async (clearanceId: string, action: "APPROVE" | "REJECT") => {
    setClearingId(clearanceId);
    try {
      const res = await fetch(`/api/clearances/${clearanceId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: `Operational executive action by GM ${currentUser.fullName}` }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to process operational clearance");
      }
      setClearedIds((prev) => new Set(prev).add(clearanceId));
      toastSuccess(`Clearance #${clearanceId.slice(0, 8)} successfully ${action === "APPROVE" ? "authorized" : "discharged"}`);
    } catch (err: any) {
      toastError(err.message || "Failed to authorize clearance");
    } finally {
      setClearingId(null);
    }
  };

  const filteredClearances = React.useMemo(() => {
    return metrics.interDepartmentalClearances.filter((item) => {
      if (clearedIds.has(item.id)) return false;
      if (activeFilter === "BOTTLENECKS") return item.isBottleneck;
      if (activeFilter === "URGENT") return item.priority === "URGENT" || item.priority === "HIGH";
      return true;
    });
  }, [metrics.interDepartmentalClearances, activeFilter, clearedIds]);

  return (
    <div className="space-y-8 animate-fadeIn pb-16 selection:bg-red-500/30 selection:text-white">
      {/* GM Top Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0c101c] via-[#0f1424] to-[#12192e] border border-neutral-800/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-blue-600/5 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-inner">
            <Compass className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                OPERATIONAL COMMAND SUITE
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                Directorate of Operations
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>General Manager Cockpit</span>
              <span className="text-neutral-500 text-lg font-normal">|</span>
              <span className="text-neutral-300 text-lg font-medium">{currentUser.fullName}</span>
            </h1>
            <p className="text-xs text-neutral-400 mt-1 max-w-xl">
              Cross-departmental execution telemetry, operational SLA clearance queues, bottleneck resolution, and live workforce allocation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 self-start md:self-auto">
          <div className="px-3.5 py-2 rounded-xl bg-[#141a2c] border border-neutral-800 text-right">
            <div className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider">Operational SLA</div>
            <div className="text-base font-bold text-emerald-400 font-mono">
              {metrics.slaComplianceRate.toFixed(1)}% On-Time
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTaskModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-white font-semibold text-xs transition-all shadow-lg shadow-red-600/20 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Assign Task</span>
          </button>
          <Link
            href="/dashboard?tab=approvals"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02]"
          >
            <span>Clearance Desk</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Operational Radar Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pending Clearances */}
        <div className="p-5 rounded-2xl bg-[#0d121f] border border-neutral-800/80 shadow-lg hover:border-neutral-700/80 transition-all">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Awaiting Authorization</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {metrics.totalClearancesPending}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Inter-departmental requests in flight</span>
          </div>
        </div>

        {/* Bottleneck Alert */}
        <div className={`p-5 rounded-2xl border shadow-lg transition-all ${
          metrics.bottlenecksCount > 0
            ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60"
            : "bg-[#0d121f] border-neutral-800/80 hover:border-neutral-700/80"
        }`}>
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Bottlenecks (&gt;24h Lag)</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              metrics.bottlenecksCount > 0 ? "bg-amber-500/20 text-amber-400" : "bg-neutral-800 text-neutral-400"
            }`}>
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono ${metrics.bottlenecksCount > 0 ? "text-amber-400" : "text-white"}`}>
            {metrics.bottlenecksCount}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-2">
            {metrics.bottlenecksCount > 0 ? (
              <span className="text-amber-300 font-medium flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> Requires GM immediate intervention
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> No critical operational delays
              </span>
            )}
          </div>
        </div>

        {/* Average Resolution Turnaround */}
        <div className="p-5 rounded-2xl bg-[#0d121f] border border-neutral-800/80 shadow-lg hover:border-neutral-700/80 transition-all">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Lead Time</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {metrics.avgResolutionHours.toFixed(1)} <span className="text-sm font-normal text-neutral-400">Hours</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Well within 24h operational benchmark</span>
          </div>
        </div>

        {/* Workforce Coverage */}
        <div className="p-5 rounded-2xl bg-[#0d121f] border border-neutral-800/80 shadow-lg hover:border-neutral-700/80 transition-all">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Staff Deployment</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {metrics.workforceOnDuty} <span className="text-sm font-normal text-neutral-400">Active</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-2">
            <span className="text-indigo-400 font-mono">{metrics.activeLeavesCount}</span>
            <span>approved leave{metrics.activeLeavesCount === 1 ? "" : "s"} today</span>
          </div>
        </div>
      </div>

      {/* Main Operational Split: Inter-Departmental Clearance Desk + Departmental SLA Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Inter-Departmental Clearance Queue & Instant GM Actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl bg-[#0c101d] border border-neutral-800 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="text-base font-bold text-white">
                    Operational Handshakes & Clearance Queue
                  </h3>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Inter-departmental requests needing sign-off. As GM, you can authorize or accelerate items directly.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-[#13192b] border border-neutral-800 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveFilter("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    activeFilter === "ALL"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  All ({metrics.interDepartmentalClearances.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("BOTTLENECKS")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                    activeFilter === "BOTTLENECKS"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <span>Bottlenecks</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/30 font-bold">
                    {metrics.bottlenecksCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("URGENT")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    activeFilter === "URGENT"
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Urgent
                </button>
              </div>
            </div>

            {filteredClearances.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[#0f1424] border border-neutral-800 text-neutral-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white mb-1">Queue Fully Clear</h4>
                <p className="text-xs text-neutral-400">
                  No active requests matching this filter requiring executive sign-off.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredClearances.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      item.isBottleneck
                        ? "bg-amber-950/15 border-amber-500/30 hover:border-amber-500/50"
                        : "bg-[#111728] border-neutral-800/80 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-semibold">
                            {item.ticketNumber || `CLR-${item.id.slice(0, 6)}`}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              item.priority === "URGENT"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : item.priority === "HIGH"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-blue-500/10 text-blue-400"
                            }`}
                          >
                            {item.priority}
                          </span>
                          {item.isBottleneck && (
                            <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1 font-semibold">
                              <AlertTriangle className="w-3 h-3" />
                              <span>LAG: {item.hoursPending}h</span>
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>

                        <div className="flex items-center gap-4 text-xs text-neutral-400 flex-wrap">
                          <span>
                            From: <strong className="text-neutral-200">{item.fromDepartment}</strong>
                          </span>
                          <span>→</span>
                          <span>
                            To: <strong className="text-neutral-200">{item.toDepartment}</strong>
                          </span>
                          <span className="text-neutral-600">•</span>
                          <span>Requested by: {item.requesterName}</span>
                          {item.amount && item.amount > 0 && (
                            <>
                              <span className="text-neutral-600">•</span>
                              <span className="font-mono text-emerald-400 font-semibold">
                                ${item.amount.toLocaleString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Instant GM Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          disabled={clearingId === item.id}
                          onClick={() => handleInstantClear(item.id, "REJECT")}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          disabled={clearingId === item.id}
                          onClick={() => handleInstantClear(item.id, "APPROVE")}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                        >
                          {clearingId === item.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>GM Authorize</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Operational Task Delegation Board */}
          <div className="p-6 rounded-2xl bg-[#0c101d] border border-neutral-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span>GM Task Delegation &amp; Execution Board</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Operational tasks assigned to staff and departments with SLA tracking.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTaskModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-white text-xs font-bold transition-all cursor-pointer"
              >
                + Assign Task
              </button>
            </div>

            {tasksList.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-[#111728] border border-neutral-800/80 text-xs text-neutral-400">
                No operational tasks assigned yet. Click &ldquo;+ Assign Task&rdquo; to delegate work to a staff member or department.
              </div>
            ) : (
              <div className="space-y-2.5">
                {tasksList.slice(0, 8).map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl bg-[#111728] border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-bold">
                          {t.reference}
                        </span>
                        <span className="text-xs font-bold text-white truncate">{t.title}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        Assigned to <strong className="text-neutral-200">{t.assigneeName}</strong> ({t.department}) &bull; Priority: {t.priority}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded self-start sm:self-center ${
                        t.status === "COMPLETED"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : t.status === "OVERDUE"
                          ? "bg-red-500/15 text-red-400"
                          : t.status === "IN_PROGRESS"
                          ? "bg-blue-500/15 text-blue-400"
                          : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Infrastructure Concession Operational Milestones */}
          <div className="p-6 rounded-2xl bg-[#0c101d] border border-neutral-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Concessions & Field Operations Delivery</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Real-time engineering progress across strategic regional assets.
                </p>
              </div>
              <Link
                href="/projects"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <span>All Projects</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.infrastructureDeliveries.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-[#111728] border border-neutral-800/80 hover:border-neutral-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      {p.code}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {p.status}
                    </span>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">{p.name}</h5>
                    <p className="text-xs text-neutral-400">{p.location} • Lead: {p.leadEngineer || "Project Office"}</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-neutral-300 mb-1">
                      <span>Milestone Progress</span>
                      <span className="font-mono font-bold text-emerald-400">{p.progressPct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, p.progressPct))}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1 font-mono">
                      Current: {p.milestone}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Directorate SLA Radar & Personnel Attendance */}
        <div className="space-y-6">
          {/* Departmental SLA Radar */}
          <div className="p-6 rounded-2xl bg-[#0c101d] border border-neutral-800 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span>Directorate SLA Radar</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Clearance efficiency and turnaround compliance by division.
              </p>
            </div>

            <div className="space-y-3">
              {metrics.departmentSlaList.map((dept) => (
                <div
                  key={dept.department}
                  className="p-3.5 rounded-xl bg-[#111728] border border-neutral-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-200">{dept.department}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        dept.slaStatus === "HEALTHY"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : dept.slaStatus === "WATCH"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {dept.compliancePct.toFixed(0)}% SLA
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        dept.slaStatus === "HEALTHY"
                          ? "bg-emerald-500"
                          : dept.slaStatus === "WATCH"
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, dept.compliancePct))}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
                    <span>{dept.activePending} Pending</span>
                    <span>Avg: {dept.avgLeadTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick GM Directives Desk */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0e1424] to-[#12192e] border border-neutral-800 shadow-xl space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Operational Mandate & Governance</span>
            </h4>
            <p className="text-xs text-neutral-300 leading-relaxed">
              As General Manager, all operational directorates report SLA compliance to this desk. Urgent approvals bypass standard wait queues to preserve concession delivery milestones.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/audit-logs"
                className="w-full text-center py-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-all"
              >
                Inspect Operations Audit Trail
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Operational Task Modal */}
      <Modal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title="Assign Operational Task"
        description="Delegate a tracked operational task to a specific staff member or department."
      >
        <form onSubmit={handleAssignTask} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={taskForm.department}
                onChange={(e) => setTaskForm({ ...taskForm, department: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121622] px-3 py-2 text-xs font-semibold"
              >
                <option value="OPERATIONS">Operations</option>
                <option value="FINANCE">Finance</option>
                <option value="HR">People &amp; HR</option>
                <option value="CRM">CRM / Sales</option>
                <option value="CLAN">Clan Academy</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121622] px-3 py-2 text-xs font-semibold"
              >
                <option value="URGENT">URGENT</option>
                <option value="HIGH">HIGH</option>
                <option value="NORMAL">NORMAL</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Assign To Staff Member (Optional)
            </label>
            <select
              value={taskForm.assigneeId}
              onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121622] px-3 py-2 text-xs"
            >
              <option value="">Entire Selected Department</option>
              {(metrics.assignableStaff || []).map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.fullName} ({staff.department}{staff.jobTitle ? ` • ${staff.jobTitle}` : ""})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Task Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Complete Lekki Phase 2 Site Inspection"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121622] px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Task Instructions
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide clear deliverables and expectations..."
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121622] px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121622] px-3 py-2 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isAssigningTask} className="bg-[#ED2618] hover:bg-[#d01f12] text-white font-bold">
              {isAssigningTask ? "Assigning..." : "Assign Operational Task"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
