"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Check,
  X,
  FileCheck2,
  Layers,
  Sparkles,
  AlertCircle,
  Mail,
  Coins,
  Building2,
  FolderGit2,
  FileSpreadsheet,
  HardDrive,
  Users2,
  Lock,
  RefreshCw,
  Sliders,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  AVAILABLE_DASHBOARD_MODULES,
  DashboardModuleOption,
} from "@/components/dashboard/RequestDashboardAccessModal";

interface DashboardRequestItem {
  id: string;
  ticketNumber: string;
  userId: string;
  requesterName: string;
  requesterEmail: string;
  department: string;
  jobTitle: string;
  requestedModules: string;
  justification: string;
  signatureData?: string | null;
  signatureType?: string | null;
  signedAt: string;
  status: "PENDING_IT_APPROVAL" | "APPROVED" | "REJECTED";
  reviewedById?: string | null;
  approvedAt?: string | null;
  approvedModules?: string | null;
  itNotes?: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    department: string;
    jobTitle: string;
    role: string;
    assignedModules: string;
  };
  reviewedBy?: {
    fullName: string;
    email: string;
  } | null;
}

interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  department: string;
  jobTitle: string;
  role: string;
  assignedModules?: string;
  status: string;
}

export function DashboardProvisioningStudio() {
  const [activeTab, setActiveTab] = useState<"requests" | "matrix">("requests");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING_IT_APPROVAL" | "APPROVED" | "REJECTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<DashboardRequestItem[]>([]);
  const [stats, setStats] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalCount: 0,
  });

  // Direct Staff Matrix state
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Review & Inspect Modal state
  const [inspectingRequest, setInspectingRequest] = useState<DashboardRequestItem | null>(null);
  const [modalApprovedModules, setModalApprovedModules] = useState<string[]>([]);
  const [modalItNotes, setModalItNotes] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/it/dashboard-requests");
      const data = await res.json();
      if (res.ok) {
        setRequests(data.requests || []);
        setStats(data.stats || { pendingCount: 0, approvedCount: 0, rejectedCount: 0, totalCount: 0 });
      }
    } catch {
      // Handle network errors gracefully
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaff = async () => {
    setIsLoadingStaff(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (res.ok && data.users) {
        setStaffUsers(data.users);
      }
    } catch {
      // Handle gracefully
    } finally {
      setIsLoadingStaff(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchStaff();
  }, []);

  const openReviewModal = (req: DashboardRequestItem) => {
    setInspectingRequest(req);
    let mods: string[] = [];
    try {
      if (req.approvedModules) {
        mods = JSON.parse(req.approvedModules);
      } else if (req.requestedModules) {
        mods = JSON.parse(req.requestedModules);
      }
    } catch {
      mods = [];
    }
    setModalApprovedModules(mods);
    setModalItNotes(req.itNotes || "");
    setActionSuccessMessage(null);
    setActionErrorMessage(null);
  };

  const handleDecision = async (action: "APPROVE" | "REJECT") => {
    if (!inspectingRequest) return;
    setIsProcessingAction(true);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    try {
      const res = await fetch(`/api/it/dashboard-requests/${inspectingRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          approvedModules: modalApprovedModules,
          itNotes: modalItNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process request");
      }

      setActionSuccessMessage(data.message || `Request ${action.toLowerCase()}d successfully.`);
      await fetchRequests();
      await fetchStaff();

      setTimeout(() => {
        setInspectingRequest(null);
      }, 1200);
    } catch (err: any) {
      setActionErrorMessage(err.message || "An error occurred");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Direct Staff Matrix Module Toggle
  const toggleStaffModule = async (user: StaffUser, modId: string) => {
    let currentMods: string[] = [];
    try {
      if (user.assignedModules) {
        currentMods = JSON.parse(user.assignedModules);
      }
    } catch {
      currentMods = ["operations", "approvals", "personal"];
    }

    const updatedMods = currentMods.includes(modId)
      ? currentMods.filter((m) => m !== modId)
      : [...currentMods, modId];

    setUpdatingUserId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}/modules`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedModules: updatedMods,
          reason: "Direct IT Dashboard Provisioning Matrix toggle",
        }),
      });

      if (res.ok) {
        setStaffUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, assignedModules: JSON.stringify(updatedMods) } : u
          )
        );
      }
    } catch {
      // Error handling
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchesQuery =
      searchQuery.trim() === "" ||
      r.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requesterEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  // Filter staff
  const filteredStaff = staffUsers.filter((u) => {
    if (!staffSearchQuery.trim()) return true;
    const q = staffSearchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      u.jobTitle.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/10 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending IT Clearance</span>
            <Clock className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats.pendingCount}
          </p>
          <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
            Require digital signature audit
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/10 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">Authorized</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats.approvedCount}
          </p>
          <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
            Live customized profiles
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121318] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Declined</span>
            <XCircle className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats.rejectedCount}
          </p>
          <span className="text-[11px] text-slate-500">Restricted by security</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121318] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-red-600 dark:text-red-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Handled</span>
            <ShieldCheck className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalCount}
          </p>
          <span className="text-[11px] text-slate-500">Governance tickets</span>
        </div>
      </div>

      {/* Main View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "requests"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
            }`}
          >
            <FileCheck2 className="h-4 w-4" />
            Signed Access Requests ({requests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("matrix")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "matrix"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
            }`}
          >
            <Sliders className="h-4 w-4" />
            Direct Staff Module Matrix ({staffUsers.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              fetchRequests();
              fetchStaff();
            }}
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />}
          >
            Sync
          </Button>
        </div>
      </div>

      {/* TAB 1: SIGNED ACCESS REQUESTS */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-white/5 p-1 text-xs">
              {(
                [
                  { id: "ALL", label: "All Requests" },
                  { id: "PENDING_IT_APPROVAL", label: `Pending (${stats.pendingCount})` },
                  { id: "APPROVED", label: "Approved" },
                  { id: "REJECTED", label: "Rejected" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                    statusFilter === tab.id
                      ? "bg-white dark:bg-[#1f2128] text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket, staff, or department..."
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121318] pl-9 pr-3 py-1.5 text-xs focus:border-red-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Requests List */}
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-slate-400 mb-2" />
              Loading signed requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-12 text-center space-y-2">
              <ShieldCheck className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No Dashboard Requests Found
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {statusFilter === "PENDING_IT_APPROVAL"
                  ? "All dashboard access requests have been cleared and audited. The queue is completely up to date."
                  : "No tickets matching your filter criteria."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => {
                let requested: string[] = [];
                try {
                  requested = JSON.parse(req.requestedModules || "[]");
                } catch {
                  requested = [];
                }

                return (
                  <div
                    key={req.id}
                    className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121318] p-5 space-y-3.5 shadow-2xs hover:border-slate-300 dark:hover:border-white/20 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-200/50 dark:border-red-900/40">
                          #{req.ticketNumber}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {req.requesterName}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {req.requesterEmail} • {req.department}
                            {req.jobTitle && ` • ${req.jobTitle}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {req.status === "PENDING_IT_APPROVAL" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                            <Clock className="h-3.5 w-3.5" /> Pending IT Clearance
                          </span>
                        ) : req.status === "APPROVED" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Authorized & Provisioned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-bold text-red-600 dark:text-red-400">
                            <XCircle className="h-3.5 w-3.5" /> Rejected
                          </span>
                        )}

                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => openReviewModal(req)}
                          leftIcon={<Eye className="h-3.5 w-3.5" />}
                        >
                          {req.status === "PENDING_IT_APPROVAL" ? "Inspect & Authorize" : "View Audit Record"}
                        </Button>
                      </div>
                    </div>

                    {/* Modules and Justification */}
                    <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-white/5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-500 mr-1">
                          Requested Modules:
                        </span>
                        {requested.map((modKey) => {
                          const found = AVAILABLE_DASHBOARD_MODULES.find((m) => m.id === modKey);
                          const ModIcon = found?.icon || Layers;
                          return (
                            <span
                              key={modKey}
                              className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300"
                            >
                              <ModIcon className="h-3 w-3 text-red-600 dark:text-red-400" />
                              {found?.name || modKey}
                            </span>
                          );
                        })}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-white/[0.02] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                        &ldquo;{req.justification}&rdquo;
                      </p>
                    </div>

                    {/* Footer audit stamp */}
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
                      <div className="flex items-center gap-2">
                        <span>Signed via: {req.signatureType || "Digital Pad"}</span>
                        <span>•</span>
                        <span>Timestamp: {new Date(req.signedAt || req.createdAt).toLocaleString()}</span>
                      </div>
                      {req.reviewedBy && (
                        <span>Reviewed by: {req.reviewedBy.fullName || req.reviewedBy.email}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DIRECT STAFF MODULE MATRIX */}
      {activeTab === "matrix" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Department Staff Entitlement Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Directly configure which dashboard capabilities each staff member can access. Click any module pill to immediately toggle capability.
              </p>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={staffSearchQuery}
                onChange={(e) => setStaffSearchQuery(e.target.value)}
                placeholder="Search staff name or department..."
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121318] pl-9 pr-3 py-1.5 text-xs focus:border-red-600 focus:outline-none"
              />
            </div>
          </div>

          {isLoadingStaff ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-slate-400 mb-2" />
              Loading staff accounts...
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No staff profiles found.
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121318] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-slate-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-4 py-3">Staff Profile</th>
                      <th className="px-4 py-3">Department & Role</th>
                      <th className="px-4 py-3">Active Dashboard Modules (Click to Toggle)</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredStaff.map((staff) => {
                      let activeMods: string[] = [];
                      try {
                        activeMods = JSON.parse(staff.assignedModules || "[]");
                      } catch {
                        activeMods = ["operations", "approvals", "personal"];
                      }

                      const isUpdating = updatingUserId === staff.id;
                      const isSuperAdmin = (staff.role || "").toUpperCase() === "SUPER_ADMIN";

                      return (
                        <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {staff.fullName}
                            </div>
                            <div className="text-[11px] text-slate-500">{staff.email}</div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="inline-block rounded-md bg-slate-100 dark:bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              {staff.department || "Operations"}
                            </span>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {staff.role} {staff.jobTitle ? `• ${staff.jobTitle}` : ""}
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            {isSuperAdmin ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600/10 text-red-600 dark:text-red-400 px-3 py-1 text-[11px] font-bold">
                                <Sparkles className="h-3 w-3" /> Full Root Access (All Modules Unlocked)
                              </span>
                            ) : (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {AVAILABLE_DASHBOARD_MODULES.map((mod) => {
                                  const isActive = activeMods.includes(mod.id);
                                  const Icon = mod.icon;

                                  return (
                                    <button
                                      key={mod.id}
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => toggleStaffModule(staff, mod.id)}
                                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                                        isActive
                                          ? "bg-red-600 text-white shadow-2xs hover:bg-red-700"
                                          : "bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                                      }`}
                                      title={isActive ? `Disable ${mod.name}` : `Enable ${mod.name}`}
                                    >
                                      <Icon className="h-3 w-3" />
                                      {mod.name.split(" ")[0]}
                                      {isActive && <Check className="h-2.5 w-2.5 ml-0.5" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            {isUpdating ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin text-red-600 inline-block" />
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <UserCheck className="h-3.5 w-3.5" /> Synchronized
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INSPECT & REVIEW MODAL */}
      {inspectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-2xl p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    IT Security Audit: Ticket #{inspectingRequest.ticketNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review digital signature and authorize requested profile capabilities.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingRequest(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Requester Summary */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant:</span>
                <span className="font-bold">{inspectingRequest.requesterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono">{inspectingRequest.requesterEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department / Role:</span>
                <span>
                  {inspectingRequest.department} ({inspectingRequest.jobTitle})
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/80 dark:border-white/5">
                <span className="text-slate-500 block mb-1">Operational Justification:</span>
                <p className="italic text-slate-700 dark:text-slate-300 bg-white dark:bg-[#151720] p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
                  &ldquo;{inspectingRequest.justification}&rdquo;
                </p>
              </div>
            </div>

            {/* Cryptographic Digital Signature Display */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Verified Digital Signature Record
              </label>
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121318] p-4 flex flex-col items-center justify-center space-y-2">
                {inspectingRequest.signatureData ? (
                  <img
                    src={inspectingRequest.signatureData}
                    alt={`Signature of ${inspectingRequest.requesterName}`}
                    className="max-h-24 max-w-full object-contain filter dark:invert"
                  />
                ) : (
                  <p className="text-xs text-slate-400 italic">No signature image stored</p>
                )}
                <div className="w-full pt-2 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Type: {inspectingRequest.signatureType || "DIGITAL_PAD"}</span>
                  <span>Recorded: {new Date(inspectingRequest.signedAt || inspectingRequest.createdAt).toISOString()}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ SHA-256 Verified</span>
                </div>
              </div>
            </div>

            {/* Module Authorization Toggles */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Modules to Authorize for this Profile
              </label>
              <p className="text-[11px] text-slate-500">
                You can approve all requested modules or selectively grant only the authorized ones.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {AVAILABLE_DASHBOARD_MODULES.map((mod) => {
                  const isChecked = modalApprovedModules.includes(mod.id);
                  const Icon = mod.icon;
                  return (
                    <label
                      key={mod.id}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? "border-red-600 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold"
                          : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setModalApprovedModules([...modalApprovedModules, mod.id]);
                          } else {
                            setModalApprovedModules(
                              modalApprovedModules.filter((m) => m !== mod.id)
                            );
                          }
                        }}
                        className="accent-red-600"
                      />
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{mod.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* IT Admin Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                IT Review Notes & Conditions
              </label>
              <input
                type="text"
                value={modalItNotes}
                onChange={(e) => setModalItNotes(e.target.value)}
                placeholder="e.g. Approved under Concession Operations charter, Q4 review."
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#151720] px-3.5 py-2 text-xs focus:border-red-600 focus:outline-none"
              />
            </div>

            {/* Status alerts */}
            {actionSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                ✓ {actionSuccessMessage}
              </div>
            )}
            {actionErrorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold">
                ⚠ {actionErrorMessage}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-white/10">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setInspectingRequest(null)}
                disabled={isProcessingAction}
              >
                Close
              </Button>

              {inspectingRequest.status === "PENDING_IT_APPROVAL" && (
                <>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => handleDecision("REJECT")}
                    disabled={isProcessingAction}
                    leftIcon={<XCircle className="h-4 w-4" />}
                  >
                    Decline Request
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handleDecision("APPROVE")}
                    disabled={isProcessingAction || modalApprovedModules.length === 0}
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    Authorize & Provision
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
