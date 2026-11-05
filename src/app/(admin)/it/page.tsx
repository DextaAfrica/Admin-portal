"use client";

import * as React from "react";
import {
  ShieldCheck,
  KeyRound,
  UserPlus,
  Lock,
  Unlock,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Terminal,
  Fingerprint,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  Send,
  Eye,
  Copy,
  Info,
  ShieldAlert,
  Bell,
  AlertOctagon,
  EyeOff,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";

interface CredentialRequestItem {
  id: string;
  ticketNumber: string;
  userId?: string | null;
  requesterEmail: string;
  requesterName: string;
  department: string;
  requestType: "PASSWORD_RESET" | "ACCOUNT_PROVISION" | "MFA_RESET" | "ROLE_ELEVATION";
  status: "PENDING" | "APPROVED" | "REJECTED" | "FULFILLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  reason: string;
  temporaryCode?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  itNotes?: string | null;
  reviewedBy?: { fullName: string; email: string } | null;
  resolvedAt?: string | null;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
    department: string;
    role: string;
    status: string;
    twoFactorEnabled: boolean;
    lastLoginAt?: string | null;
  } | null;
}

interface PolicyAlertItem {
  id: string;
  severity: "INFO" | "WARNING" | "CRITICAL" | "BREACH_ATTEMPT";
  eventType: string;
  title: string;
  description: string;
  actorEmail?: string | null;
  targetResource?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "DISMISSED";
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
}

export default function ItGovernancePage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = React.useState<"requests" | "provision" | "alerts" | "sessions">("requests");
  const [requests, setRequests] = React.useState<CredentialRequestItem[]>([]);
  const [stats, setStats] = React.useState({
    pendingCount: 0,
    approvedCount: 0,
    totalCount: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);

  // Policy Watchdog Alerts State
  const [alerts, setAlerts] = React.useState<PolicyAlertItem[]>([]);
  const [alertStats, setAlertStats] = React.useState({
    openCount: 0,
    criticalCount: 0,
    totalCount: 0,
  });
  const [selectedAlert, setSelectedAlert] = React.useState<PolicyAlertItem | null>(null);
  const [alertResolutionNotes, setAlertResolutionNotes] = React.useState("");
  const [isResolvingAlert, setIsResolvingAlert] = React.useState(false);
  const [alertSeverityFilter, setAlertSeverityFilter] = React.useState("ALL");

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");

  // Review / Decision Modal
  const [selectedTicket, setSelectedTicket] = React.useState<CredentialRequestItem | null>(null);
  const [reviewAction, setReviewAction] = React.useState<"APPROVE" | "REJECT">("APPROVE");
  const [itNotes, setItNotes] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [isSubmittingReview, setIsSubmittingReview] = React.useState(false);
  const [generatedAuthCode, setGeneratedAuthCode] = React.useState<string | null>(null);

  // New Ticket Modal (Self-service / internal escalation)
  const [newTicketModalOpen, setNewTicketModalOpen] = React.useState(false);
  const [ticketForm, setTicketForm] = React.useState({
    requesterName: "",
    requesterEmail: "",
    department: "Executive",
    requestType: "PASSWORD_RESET",
    priority: "MEDIUM",
    reason: "",
  });
  const [isSubmittingTicket, setIsSubmittingTicket] = React.useState(false);

  // Provision Account Form
  const [provisionForm, setProvisionForm] = React.useState({
    fullName: "",
    email: "",
    department: "Engineering",
    role: "ADMIN",
    jobTitle: "",
    temporaryPassword: "",
  });
  const [isProvisioning, setIsProvisioning] = React.useState(false);
  const [provisionSuccessCode, setProvisionSuccessCode] = React.useState<string | null>(null);

  // Inactivity Policy & Active Sessions State
  const [inactivityTimeout, setInactivityTimeout] = React.useState<number>(15);
  const [selectedTimeoutOption, setSelectedTimeoutOption] = React.useState<number>(15);
  const [isSavingInactivity, setIsSavingInactivity] = React.useState(false);
  const [liveSessions, setLiveSessions] = React.useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = React.useState(false);

  const fetchInactivityPolicy = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/inactivity-policy");
      if (res.ok) {
        const data = await res.json();
        if (data.timeoutMinutes) {
          setInactivityTimeout(data.timeoutMinutes);
          setSelectedTimeoutOption(data.timeoutMinutes);
        }
      }
    } catch {}
  }, []);

  const fetchLiveSessions = React.useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const res = await fetch("/api/it/sessions");
      if (res.ok) {
        const data = await res.json();
        setLiveSessions(data.sessions || []);
      }
    } catch {} finally {
      setIsLoadingSessions(false);
    }
  }, []);

  const handleSaveInactivity = async (newMinutes: number) => {
    setIsSavingInactivity(true);
    try {
      const res = await fetch("/api/auth/inactivity-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeoutMinutes: newMinutes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update inactivity policy");
      setInactivityTimeout(newMinutes);
      setSelectedTimeoutOption(newMinutes);
      toastSuccess(`Inactivity Auto-Logout updated to ${newMinutes} minutes across all portals.`);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Failed to update policy");
    } finally {
      setIsSavingInactivity(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/it/sessions?id=${sessionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke session");
      toastSuccess("Session revoked immediately.");
      fetchLiveSessions();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Failed to revoke session");
    }
  };

  const fetchRequests = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/it/credentials");
      if (!res.ok) throw new Error("Failed to load credential authorization requests");
      const data = await res.json();
      setRequests(data.requests || []);
      setStats(data.stats || { pendingCount: 0, approvedCount: 0, totalCount: 0 });
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Error connecting to IT service");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  const fetchAlerts = React.useCallback(async () => {
    try {
      const res = await fetch("/api/it/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setAlertStats(data.stats || { openCount: 0, criticalCount: 0, totalCount: 0 });
      }
    } catch {
      // non-blocking
    }
  }, []);

  React.useEffect(() => {
    fetchRequests();
    fetchAlerts();
    fetchInactivityPolicy();
    fetchLiveSessions();
  }, [fetchRequests, fetchAlerts, fetchInactivityPolicy, fetchLiveSessions]);

  React.useEffect(() => {
    if (activeTab === "sessions") {
      fetchLiveSessions();
      fetchInactivityPolicy();
    }
  }, [activeTab, fetchLiveSessions, fetchInactivityPolicy]);

  // Handle Review Submission (Grant Access / Reject)
  const handleSubmitReview = async () => {
    if (!selectedTicket) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/it/credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTicket.id,
          status: reviewAction === "APPROVE" ? "APPROVED" : "REJECTED",
          itNotes,
          newPassword: newPassword.trim() ? newPassword.trim() : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process authorization request");
      }

      const data = await res.json();
      toastSuccess(
        reviewAction === "APPROVE"
          ? `Authorization granted for Ticket ${selectedTicket.ticketNumber}. Activation code issued.`
          : `Request ${selectedTicket.ticketNumber} rejected.`
      );

      if (data.request?.temporaryCode) {
        setGeneratedAuthCode(data.request.temporaryCode);
      } else {
        setSelectedTicket(null);
        setItNotes("");
        setNewPassword("");
      }

      fetchRequests();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Review submission failed");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle Provisioning New Account
  const handleProvisionAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provisionForm.fullName || !provisionForm.email || !provisionForm.temporaryPassword) {
      toastError("Please complete all required fields");
      return;
    }

    setIsProvisioning(true);
    try {
      const res = await fetch("/api/it/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(provisionForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Account provisioning failed");
      }

      const data = await res.json();
      const code = data.user?.activationKey || provisionForm.temporaryPassword;
      toastSuccess(`Account successfully created for ${provisionForm.fullName}`);
      setProvisionSuccessCode(code);
      setProvisionForm({
        fullName: "",
        email: "",
        department: "Engineering",
        role: "ADMIN",
        jobTitle: "",
        temporaryPassword: "",
      });
      fetchRequests();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Failed to provision account");
    } finally {
      setIsProvisioning(false);
    }
  };

  // Handle New Ticket Submission
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.requesterEmail || !ticketForm.reason) {
      toastError("Email and reason are mandatory");
      return;
    }

    setIsSubmittingTicket(true);
    try {
      const res = await fetch("/api/it/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit credential request");
      }

      const data = await res.json();
      toastSuccess(`Security ticket ${data.request?.ticketNumber} logged for IT review`);
      setNewTicketModalOpen(false);
      setTicketForm({
        requesterName: "",
        requesterEmail: "",
        department: "Executive",
        requestType: "PASSWORD_RESET",
        priority: "MEDIUM",
        reason: "",
      });
      fetchRequests();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Failed to create security ticket");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Resolve Policy Alert
  const handleResolveAlert = async (status: "RESOLVED" | "INVESTIGATING" | "DISMISSED") => {
    if (!selectedAlert) return;
    setIsResolvingAlert(true);
    try {
      const res = await fetch("/api/it/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedAlert.id,
          status,
          resolutionNotes: alertResolutionNotes,
        }),
      });

      if (!res.ok) throw new Error("Failed to update security alert");
      toastSuccess(`Policy alert marked as ${status}`);
      setSelectedAlert(null);
      setAlertResolutionNotes("");
      fetchAlerts();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Error resolving alert");
    } finally {
      setIsResolvingAlert(false);
    }
  };

  // Trigger test policy violation watchdog alert
  const handleTriggerWatchdogTest = async () => {
    try {
      const res = await fetch("/api/it/alerts/test", { method: "POST" });
      if (res.ok) {
        toastSuccess("Simulated boundary breach recorded in Policy Watchdog queue");
        fetchAlerts();
      }
    } catch {
      toastError("Could not trigger watchdog test");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toastSuccess("Authorization key copied to clipboard");
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requesterEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || req.status === statusFilter;
    const matchesType = typeFilter === "ALL" || req.requestType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredAlerts = alerts.filter((a) => {
    return alertSeverityFilter === "ALL" || a.severity === alertSeverityFilter;
  });

  return (
    <div className="w-full min-w-0 space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-500 border border-red-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                IT Security & Access Governance
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Staff account provisioning, privileged role governance, and policy violation watchdog monitoring.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchRequests();
              fetchAlerts();
            }}
            className="flex items-center gap-2 border-slate-200 dark:border-white/10"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Queue</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setNewTicketModalOpen(true)}
            className="flex items-center gap-2 bg-[#ED2618] hover:bg-[#d02013] text-white shadow-sm"
          >
            <KeyRound className="h-4 w-4" />
            <span>Submit Security Ticket</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider uppercase text-red-700 dark:text-red-400">
              Pending Authorization
            </span>
            <div className="relative flex h-3 w-3">
              {stats.pendingCount > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ED2618] opacity-75"></span>
              )}
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ED2618]"></span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.pendingCount}
            </span>
            <span className="text-xs text-red-700 dark:text-red-400/90 font-medium">
              awaiting IT grant
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Credential rotation & password change tickets
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
              Granted & Authorized
            </span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.approvedCount}
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400/90 font-medium">
              verified keys issued
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Users set preferred personal passwords
          </p>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider uppercase text-rose-700 dark:text-rose-400">
              Policy Violations & Alerts
            </span>
            <div className="relative flex h-3 w-3">
              {alertStats.openCount > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
              )}
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {alertStats.openCount}
            </span>
            <span className="text-xs text-rose-700 dark:text-rose-400 font-medium">
              {alertStats.criticalCount > 0 ? `${alertStats.criticalCount} Critical` : "Active incidents"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Automated corporate policy watchdog feed
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Access Governance
            </span>
            <Terminal className="h-5 w-5 text-red-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.totalCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              tickets tracked
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Immutable audit trail across all operations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-white/[0.08] overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`relative pb-3 text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "requests"
              ? "text-[#ED2618] border-b-2 border-[#ED2618]"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Credential Requests & Authorizations</span>
          {stats.pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-red-500/10 text-red-700 dark:text-red-400 px-2 py-0.5 text-xs font-bold border border-red-500/20">
              {stats.pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("provision")}
          className={`relative pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ml-4 whitespace-nowrap ${
            activeTab === "provision"
              ? "text-[#ED2618] border-b-2 border-[#ED2618]"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <UserPlus className="h-4 w-4" />
          <span>Provision Staff Account</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("alerts")}
          className={`relative pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ml-4 whitespace-nowrap ${
            activeTab === "alerts"
              ? "text-[#ED2618] border-b-2 border-[#ED2618]"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Policy Watchdog & Violations</span>
          {alertStats.openCount > 0 && (
            <span className="ml-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 px-2 py-0.5 text-xs font-bold border border-rose-500/20">
              {alertStats.openCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sessions")}
          className={`relative pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ml-4 whitespace-nowrap ${
            activeTab === "sessions"
              ? "text-[#ED2618] border-b-2 border-[#ED2618]"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <EyeOff className="h-4 w-4" />
          <span>Zero-Dashboard Access Policy</span>
        </button>
      </div>

      {/* TAB 1: Credential Requests Queue */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search ticket #, staff name, email or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Filter by request status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Authorization</option>
                <option value="APPROVED">Approved / Issued</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                aria-label="Filter by request type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="PASSWORD_RESET">Password Reset</option>
                <option value="ACCOUNT_PROVISION">Account Provision</option>
                <option value="MFA_RESET">MFA Reset</option>
                <option value="ROLE_ELEVATION">Role Elevation</option>
              </select>
            </div>
          </div>

          {/* Requests Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="p-12 text-center">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-slate-400 mb-3" />
                <p className="text-sm text-slate-500">Loading IT security queue...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center">
                <ShieldCheck className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  No credential authorization tickets found
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  All employee password changes and security authorizations are up to date.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Ticket</th>
                      <th className="py-3.5 px-4">Requester</th>
                      <th className="py-3.5 px-4">Request Type</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Submitted</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-sm">
                    {filteredRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-md">
                              {req.ticketNumber}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900 dark:text-white">
                              {req.requesterName}
                            </span>
                            <span className="text-xs text-slate-500">
                              {req.requesterEmail} • {req.department}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                            {req.requestType === "PASSWORD_RESET" && <KeyRound className="h-3 w-3 text-[#ED2618]" />}
                            {req.requestType === "ACCOUNT_PROVISION" && <UserPlus className="h-3 w-3 text-indigo-500" />}
                            {req.requestType === "MFA_RESET" && <Fingerprint className="h-3 w-3 text-red-500" />}
                            {req.requestType === "ROLE_ELEVATION" && <Lock className="h-3 w-3 text-purple-500" />}
                            {req.requestType.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-bold tracking-wide uppercase ${
                              req.priority === "URGENT"
                                ? "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
                                : req.priority === "HIGH"
                                ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                                : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {req.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              req.status === "PENDING"
                                ? "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
                                : req.status === "APPROVED" || req.status === "FULFILLED"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {req.status === "PENDING" && <Clock className="h-3 w-3 animate-pulse" />}
                            {req.status === "APPROVED" && <CheckCircle2 className="h-3 w-3" />}
                            {req.status === "REJECTED" && <XCircle className="h-3 w-3" />}
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(req.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {req.status === "PENDING" ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedTicket(req);
                                setReviewAction("APPROVE");
                                setItNotes("");
                                setNewPassword("");
                                setGeneratedAuthCode(null);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 font-medium shadow-sm"
                            >
                              <Unlock className="h-3.5 w-3.5 mr-1" />
                              Review & Authorize
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTicket(req);
                                setReviewAction("APPROVE");
                                setItNotes(req.itNotes || "");
                                setGeneratedAuthCode(req.temporaryCode || null);
                              }}
                              className="text-xs h-8 px-2.5 border-slate-200 dark:border-white/10"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View Audit
                            </Button>
                          )}
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

      {/* TAB 2: Provision Staff Account Form */}
      {activeTab === "provision" && (
        <div className="max-w-3xl rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/[0.08] pb-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Provision New Employee Account
              </h2>
              <p className="text-xs text-slate-500">
                Direct IT account issuance. Issues activation key allowing the employee to establish their personal preferred password.
              </p>
            </div>
          </div>

          {provisionSuccessCode && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Staff Account Successfully Provisioned
              </div>
              <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">
                Transmit this one-time activation key to the employee. They will use this key on the registration portal to establish their preferred personal password.
              </p>
              <div className="mt-3 flex items-center gap-2 font-mono text-xs bg-emerald-500/20 px-3 py-2 rounded-lg w-fit">
                <span>Activation Authorization Key:</span>
                <span className="font-bold tracking-wider">{provisionSuccessCode}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(provisionSuccessCode)}
                  className="ml-2 hover:opacity-75"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleProvisionAccount} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Legal Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Adebayo Ogunlesi"
                  value={provisionForm.fullName}
                  onChange={(e) => setProvisionForm({ ...provisionForm, fullName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Official Work Email *
                </label>
                <Input
                  type="email"
                  required
                  placeholder="e.g. adebayo.ogunlesi@dextaafrica.com"
                  value={provisionForm.email}
                  onChange={(e) => setProvisionForm({ ...provisionForm, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Department *
                </label>
                <select
                  aria-label="Department selection"
                  value={provisionForm.department}
                  onChange={(e) => setProvisionForm({ ...provisionForm, department: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 text-sm text-slate-900 dark:text-white"
                >
                  <option value="Executive">Executive</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Architecture">Architecture</option>
                  <option value="Operations">Operations</option>
                  <option value="Finance">Finance</option>
                  <option value="Legal">Legal</option>
                  <option value="HR">HR Department</option>
                  <option value="IT">IT & Security</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  System Role *
                </label>
                <select
                  aria-label="System role selection"
                  value={provisionForm.role}
                  onChange={(e) => setProvisionForm({ ...provisionForm, role: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 text-sm text-slate-900 dark:text-white"
                >
                  <option value="STAFF">Standard Staff</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="SUPER_ADMIN">Executive Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Job Title
                </label>
                <Input
                  placeholder="e.g. Senior Structural Engineer"
                  value={provisionForm.jobTitle}
                  onChange={(e) => setProvisionForm({ ...provisionForm, jobTitle: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Initial Security Activation Token / Key *
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  required
                  placeholder="e.g. DXT-ACT-9821"
                  value={provisionForm.temporaryPassword}
                  onChange={(e) =>
                    setProvisionForm({ ...provisionForm, temporaryPassword: e.target.value })
                  }
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const randomCode = `DXT-ACT-${Math.floor(1000 + Math.random() * 9000)}`;
                    setProvisionForm({ ...provisionForm, temporaryPassword: randomCode });
                  }}
                  className="text-xs shrink-0 border-slate-200 dark:border-white/10"
                >
                  Generate Strong Key
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                The user will use this key on the registration portal to set their confidential preferred password.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] flex justify-end">
              <Button
                type="submit"
                disabled={isProvisioning}
                className="bg-[#ED2618] hover:bg-[#d02013] text-white px-6 font-semibold shadow-sm"
              >
                {isProvisioning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Provisioning Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Authorize & Provision Account
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Policy Violations & Watchdog Alerts Feed */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20">
            <div>
              <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Active Company Policy Watchdog Engine
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Automatically detects unwanted operations, boundary breaches, and policy violations against corporate regulations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerWatchdogTest}
                className="text-xs border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
              >
                <Flame className="h-3.5 w-3.5 mr-1" />
                Simulate Watchdog Breach
              </Button>
              <select
                aria-label="Filter alerts by severity"
                value={alertSeverityFilter}
                onChange={(e) => setAlertSeverityFilter(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical Breaches</option>
                <option value="WARNING">Warnings</option>
                <option value="INFO">Informational</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] overflow-hidden shadow-sm">
            {filteredAlerts.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-3" />
                <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  Zero Open Policy Violations
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  All user activity and operations conform to company governance policies.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Severity</th>
                      <th className="py-3.5 px-4">Incident Title</th>
                      <th className="py-3.5 px-4">Suspected Actor</th>
                      <th className="py-3.5 px-4">Target Resource</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Detected</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-sm">
                    {filteredAlerts.map((alert) => (
                      <tr
                        key={alert.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold ${
                              alert.severity === "CRITICAL" || alert.severity === "BREACH_ATTEMPT"
                                ? "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
                                : alert.severity === "WARNING"
                                ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                                : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {alert.severity}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {alert.title}
                            </span>
                            <span className="text-xs text-slate-500 line-clamp-1">
                              {alert.description}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 font-mono">
                          {alert.actorEmail || "Anonymous / External"}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                          {alert.targetResource || "General System"}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                              alert.status === "OPEN"
                                ? "bg-red-500/10 text-red-700 dark:text-red-400"
                                : alert.status === "INVESTIGATING"
                                ? "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            }`}
                          >
                            {alert.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(alert.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAlert(alert);
                              setAlertResolutionNotes(alert.resolutionNotes || "");
                            }}
                            className="text-xs h-8 border-slate-200 dark:border-white/10"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Investigate
                          </Button>
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

      {/* TAB 4: Enterprise Inactivity Timeout & Session Governance */}
      {activeTab === "sessions" && (
        <div className="space-y-6">
          {/* Section 1: Inactivity Policy Control Card */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/[0.06] pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/15 text-[#ED2618] border border-red-200 dark:border-red-500/25">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Global Session Inactivity &amp; Auto-Logout Policy
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enforced by backend session verification and real-time client heartbeat across all portals
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Active Threshold:</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-1 text-xs font-bold text-[#ED2618] dark:text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ED2618] animate-pulse" />
                  {inactivityTimeout} Minutes Inactivity
                </span>
              </div>
            </div>

            {/* Inactivity Threshold Tier Options */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Select Enterprise Inactivity Timeout Threshold
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    minutes: 5,
                    title: "5 Minutes",
                    badge: "High Security",
                    desc: "Optimal for high-risk field sites & public workstations",
                  },
                  {
                    minutes: 15,
                    title: "15 Minutes",
                    badge: "Recommended",
                    desc: "Standard corporate policy for balance of security & productivity",
                  },
                  {
                    minutes: 30,
                    title: "30 Minutes",
                    badge: "Extended Ops",
                    desc: "Recommended for operations desks managing live site dispatches",
                  },
                  {
                    minutes: 60,
                    title: "60 Minutes",
                    badge: "Supervisory",
                    desc: "For command center wallboards and executive oversight suites",
                  },
                ].map((tier) => {
                  const isSelected = selectedTimeoutOption === tier.minutes;
                  return (
                    <button
                      key={tier.minutes}
                      type="button"
                      onClick={() => setSelectedTimeoutOption(tier.minutes)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? "border-[#ED2618] bg-red-50/70 dark:bg-red-500/10 ring-1 ring-[#ED2618]"
                          : "border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {tier.title}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isSelected
                              ? "bg-red-200/80 dark:bg-red-500/20 text-[#ED2618] dark:text-red-300"
                              : "bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {tier.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {tier.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-[#ED2618] shrink-0" />
                <span>
                  Includes 60-second in-app grace period countdown before auto-signing out.
                </span>
              </div>

              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => handleSaveInactivity(selectedTimeoutOption)}
                isLoading={isSavingInactivity}
                leftIcon={<RefreshCw className="h-4 w-4" />}
                className="bg-[#ED2618] hover:bg-[#c91e12] text-xs font-bold"
              >
                Save &amp; Apply Policy Across All Portals
              </Button>
            </div>
          </div>

          {/* Section 2: Live Active Sessions Monitor */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300">
                  <Fingerprint className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Live Active User Sessions &amp; Idle Watchdog
                  </h4>
                  <p className="text-xs text-slate-500">
                    {liveSessions.length} active sessions tracked across ops.dextaafrica.org and admin.dextafrica.org
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={fetchLiveSessions}
                isLoading={isLoadingSessions}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                className="text-xs"
              >
                Refresh Sessions
              </Button>
            </div>

            {liveSessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No active sessions found.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-white/[0.08]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-white/[0.03] text-slate-500 border-b border-slate-200/80 dark:border-white/[0.08]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">User &amp; Department</th>
                      <th className="px-4 py-3 font-semibold">IP &amp; Device</th>
                      <th className="px-4 py-3 font-semibold">Last Active</th>
                      <th className="px-4 py-3 font-semibold">Inactivity Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {liveSessions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {s.user?.fullName || "Active User"}
                            {s.isCurrent && (
                              <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                                This Device
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {s.user?.email} &bull; {s.user?.department || "OPERATIONS"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {s.ipAddress || "127.0.0.1"}
                          </span>
                          <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {s.userAgent || "Desktop Browser"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {s.inactiveMinutes === 0
                            ? "Active just now"
                            : `${s.inactiveMinutes} min${s.inactiveMinutes > 1 ? "s" : ""} ago`}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.isIdle
                                ? "bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                s.isIdle ? "bg-slate-400" : "bg-emerald-500 animate-pulse"
                              }`}
                            />
                            {s.isIdle ? `Idle (${s.remainingMinutes}m left)` : "Actively Working"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!s.isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleRevokeSession(s.id)}
                              className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                            >
                              Terminate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Architecture & Privacy Isolation Boundaries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                  <EyeOff className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Zero-Access User Dashboard Boundary
                  </h3>
                  <p className="text-xs text-slate-500">
                    Strict cryptographic and architectural isolation
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                In strict accordance with Dexta Africa privacy rules, the IT department manages credentials and security, but **IT personnel have zero access to private user dashboards**.
              </p>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>No Payroll &amp; Document Access:</strong> IT is restricted from browsing private HR staff contracts, tax returns, or executive reviews.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>No Deal Memo Snooping:</strong> IT cannot view investor conversations or confidential real estate escrow memos.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Automated Inactivity Revocation:</strong> Inactive sessions are cleared from the database immediately when the threshold expires.</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <Fingerprint className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Two-Factor Authentication &amp; Hardware Security
                  </h3>
                  <p className="text-xs text-slate-500">
                    Time-based OTP &amp; Inactivity Guard Integration
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Every staff member with Administrative privileges enforces hardware-backed TOTP verification. IT retains full capability to revoke compromised sessions remotely in case of device loss.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white">Zero External Cloud Leakage</span>
                  <p className="text-xs text-slate-500">All credentials and session records remain isolated in dedicated database storage.</p>
                </div>
                <Badge variant="success" className="text-xs">Active</Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Review & Grant Authorization Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => {
          setSelectedTicket(null);
          setGeneratedAuthCode(null);
          setItNotes("");
          setNewPassword("");
        }}
        title={`Security Ticket: ${selectedTicket?.ticketNumber || ""}`}
        description="IT Verification & Access Authorization Review"
        maxWidth="lg"
      >
        {selectedTicket && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Requester:</span>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {selectedTicket.requesterName} ({selectedTicket.requesterEmail})
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Department:</span>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {selectedTicket.department}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Request Type:</span>
                  <p className="font-semibold text-[#ED2618] dark:text-red-400">
                    {selectedTicket.requestType.replace(/_/g, " ")}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Priority:</span>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {selectedTicket.priority}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/50 dark:border-white/[0.05]">
                <span className="text-xs text-slate-500">Employee Stated Reason:</span>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium mt-1 bg-white dark:bg-black/30 p-2.5 rounded-lg border border-slate-200/50 dark:border-white/5">
                  &ldquo;{selectedTicket.reason}&rdquo;
                </p>
              </div>

              {selectedTicket.ipAddress && (
                <div className="text-[11px] text-slate-400 font-mono">
                  Origin IP: {selectedTicket.ipAddress}
                </div>
              )}
            </div>

            {generatedAuthCode ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Authorization Granted & Key Issued
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Transmit this one-time secure activation key to the employee. They will enter this key to establish their preferred confidential password:
                </p>
                <div className="flex items-center justify-between bg-black/80 text-white font-mono text-sm px-4 py-3 rounded-lg border border-emerald-500/40">
                  <span className="tracking-widest font-bold">{generatedAuthCode}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedAuthCode)}
                    className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
            ) : selectedTicket.status === "PENDING" ? (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    IT Security Action
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewAction("APPROVE")}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                        reviewAction === "APPROVE"
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                          : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Grant Access & Issue Key
                      </div>
                      <p className="text-[11px] font-normal text-slate-500">
                        Issues verified key allowing employee to set their preferred password
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewAction("REJECT")}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                        reviewAction === "REJECT"
                          ? "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20"
                          : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="h-4 w-4 text-rose-500" />
                        Deny / Reject Request
                      </div>
                      <p className="text-[11px] font-normal text-slate-500">
                        Reject authorization due to policy or verification failure
                      </p>
                    </button>
                  </div>
                </div>

                {reviewAction === "APPROVE" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Direct Password Override (Optional)
                    </label>
                    <Input
                      type="text"
                      placeholder="Leave blank to auto-generate activation key"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="font-mono text-xs"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      If left blank, a single-use key is generated so the employee establishes their own password.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    IT Security Log Remarks
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Identity verified via internal video call. Access granted."
                    value={itNotes}
                    onChange={(e) => setItNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ED2618]"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.05] text-xs">
                <span className="text-slate-500">IT Remarks:</span>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5 font-medium">
                  {selectedTicket.itNotes || "No specific notes logged."}
                </p>
                {selectedTicket.reviewedBy && (
                  <p className="text-slate-400 text-[11px] mt-2">
                    Processed by {selectedTicket.reviewedBy.fullName} ({selectedTicket.reviewedBy.email})
                  </p>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTicket(null);
                  setGeneratedAuthCode(null);
                }}
              >
                Close
              </Button>

              {selectedTicket.status === "PENDING" && !generatedAuthCode && (
                <Button
                  size="sm"
                  disabled={isSubmittingReview}
                  onClick={handleSubmitReview}
                  className={
                    reviewAction === "APPROVE"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-rose-600 hover:bg-rose-700 text-white"
                  }
                >
                  {isSubmittingReview ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                      Executing...
                    </>
                  ) : reviewAction === "APPROVE" ? (
                    <>
                      <Unlock className="h-4 w-4 mr-1.5" />
                      Confirm & Issue Key
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Reject Security Ticket
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: Submit New Security Request */}
      <Modal
        isOpen={newTicketModalOpen}
        onClose={() => setNewTicketModalOpen(false)}
        title="Log IT Credential & Access Ticket"
        description="Submit employee credential rotation or account request to the IT queue."
        maxWidth="md"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Staff Requester Name
            </label>
            <Input
              placeholder="e.g. Samuel Adeleke"
              value={ticketForm.requesterName}
              onChange={(e) => setTicketForm({ ...ticketForm, requesterName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Employee Work Email *
            </label>
            <Input
              type="email"
              required
              placeholder="e.g. samuel.adeleke@dextaafrica.com"
              value={ticketForm.requesterEmail}
              onChange={(e) => setTicketForm({ ...ticketForm, requesterEmail: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                aria-label="Staff department"
                value={ticketForm.department}
                onChange={(e) => setTicketForm({ ...ticketForm, department: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 text-xs text-slate-900 dark:text-white"
              >
                <option value="Executive">Executive</option>
                <option value="Engineering">Engineering</option>
                <option value="Architecture">Architecture</option>
                <option value="Operations">Operations</option>
                <option value="Finance">Finance</option>
                <option value="Legal">Legal</option>
                <option value="HR">HR</option>
                <option value="IT">IT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                aria-label="Ticket priority"
                value={ticketForm.priority}
                onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 text-xs text-slate-900 dark:text-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent (Lockout)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Request Type
            </label>
            <select
              aria-label="Request type"
              value={ticketForm.requestType}
              onChange={(e) => setTicketForm({ ...ticketForm, requestType: e.target.value })}
              className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 text-xs text-slate-900 dark:text-white"
            >
              <option value="PASSWORD_RESET">Password Reset / Rotation</option>
              <option value="ACCOUNT_PROVISION">New Account Provisioning</option>
              <option value="MFA_RESET">2FA / MFA Reset</option>
              <option value="ROLE_ELEVATION">Role Elevation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason / Business Justification *
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Periodic quarterly password rotation or device change..."
              value={ticketForm.reason}
              onChange={(e) => setTicketForm({ ...ticketForm, reason: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ED2618]"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setNewTicketModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingTicket}
              className="bg-[#ED2618] hover:bg-[#d02013] text-white"
            >
              {isSubmittingTicket ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1.5" />
                  Submit to IT Queue
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Investigate Policy Alert Modal */}
      <Modal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title={`Incident: ${selectedAlert?.title || "Policy Violation"}`}
        description="Company Policy Watchdog Incident Investigation"
        maxWidth="lg"
      >
        {selectedAlert && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Severity:</span>
                  <p className="font-bold text-red-600 dark:text-red-400">
                    {selectedAlert.severity}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Event Classification:</span>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {selectedAlert.eventType}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Suspected Account:</span>
                  <p className="font-mono text-slate-900 dark:text-white">
                    {selectedAlert.actorEmail || "Unidentified"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Target Protected Resource:</span>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {selectedAlert.targetResource || "Core System"}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/50 dark:border-white/[0.05]">
                <span className="text-xs text-slate-500">Watchdog Telemetry Description:</span>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium mt-1 bg-white dark:bg-black/30 p-2.5 rounded-lg border border-slate-200/50 dark:border-white/5">
                  {selectedAlert.description}
                </p>
              </div>

              {selectedAlert.ipAddress && (
                <div className="text-[11px] text-slate-400 font-mono">
                  Recorded IP: {selectedAlert.ipAddress} • Detected at: {formatDate(selectedAlert.createdAt)}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Remediation / Resolution Notes
              </label>
              <textarea
                rows={3}
                placeholder="Record action taken: e.g. Session revoked, policy violation warning issued..."
                value={alertResolutionNotes}
                onChange={(e) => setAlertResolutionNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ED2618]"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedAlert(null)}>
                Close
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={isResolvingAlert}
                onClick={() => handleResolveAlert("INVESTIGATING")}
                className="text-xs border-red-500/30 text-red-600 hover:bg-red-500/10"
              >
                Mark Investigating
              </Button>

              <Button
                size="sm"
                disabled={isResolvingAlert}
                onClick={() => handleResolveAlert("RESOLVED")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                {isResolvingAlert ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Resolve Incident
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
