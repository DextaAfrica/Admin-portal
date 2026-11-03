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

export default function ItGovernancePage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = React.useState<"requests" | "provision" | "sessions">("requests");
  const [requests, setRequests] = React.useState<CredentialRequestItem[]>([]);
  const [stats, setStats] = React.useState({
    pendingCount: 0,
    approvedCount: 0,
    totalCount: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);

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

  React.useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

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
          ? `Authorization granted for Ticket ${selectedTicket.ticketNumber}. Code issued.`
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
      toastSuccess(`Account successfully created for ${provisionForm.fullName}`);
      setProvisionSuccessCode(data.user?.temporaryCode || "PROVISIONED_OK");
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

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
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
                Staff account provisioning, privileged role governance, and verified credential authorization.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRequests}
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
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider uppercase text-amber-700 dark:text-amber-400">
              Pending Authorization
            </span>
            <div className="relative flex h-3 w-3">
              {stats.pendingCount > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              )}
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.pendingCount}
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-400/90 font-medium">
              awaiting IT grant
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Staff credential rotation & password changes
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
            Protected with zero-trust audit verification
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Account Provisioning
            </span>
            <UserCheck className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              100%
            </span>
            <span className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">
              IT Controlled
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Internal onboarding through IT provisioning only
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
              total tickets tracked
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Every authorization logged to audit ledger
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-white/[0.08]">
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`relative pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "requests"
              ? "text-[#ED2618] border-b-2 border-[#ED2618]"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Credential Requests & Authorizations</span>
          {stats.pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-xs font-bold border border-amber-500/20">
              {stats.pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("provision")}
          className={`relative pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ml-4 ${
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
          onClick={() => setActiveTab("sessions")}
          className={`relative pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ml-4 ${
            activeTab === "sessions"
              ? "text-[#ED2618] border-b-2 border-[#ED2618]"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Fingerprint className="h-4 w-4" />
          <span>Security Protocol & Architecture</span>
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
                <table className="w-full text-left border-collapse">
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
                            {req.requestType === "PASSWORD_RESET" && <KeyRound className="h-3 w-3 text-amber-500" />}
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
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
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
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
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
                Direct IT account issuance. Links automatically to the HR Staff Directory and Security Vault.
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
                Temporary credentials have been configured. The employee can authenticate and rotate their credentials upon login.
              </p>
              <div className="mt-3 flex items-center gap-2 font-mono text-xs bg-emerald-500/20 px-3 py-2 rounded-lg w-fit">
                <span>Temporary Auth Key:</span>
                <span className="font-bold">{provisionSuccessCode}</span>
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
                Initial Temporary Password *
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  required
                  placeholder="Minimum 8 characters"
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
                    const randomCode = `DXT-${Math.random().toString(36).slice(-8)}!26`;
                    setProvisionForm({ ...provisionForm, temporaryPassword: randomCode });
                  }}
                  className="text-xs shrink-0 border-slate-200 dark:border-white/10"
                >
                  Generate Strong Key
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                The employee will receive this authorization and will be prompted for 2FA setup upon initial login.
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

      {/* TAB 3: Security Protocol & Policy Architecture */}
      {activeTab === "sessions" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600 border border-red-500/20">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Password Change & Credential Delegation Policy
                </h3>
                <p className="text-xs text-slate-500">
                  Enforced enterprise security protocol for Dexta Africa
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              In accordance with enterprise governance requirements, employees do not bypass IT verification for credential changes. When an employee requests a password rotation:
            </p>

            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-400 pl-1">
              <li>A cryptographically signed authorization ticket is submitted to the IT queue.</li>
              <li>IT security reviews the originating IP address, agent metadata, and reason.</li>
              <li>Upon approval, IT issues a temporary single-use security authorization token (`DXT-SEC-XXXX`).</li>
              <li>The employee validates with their temporary token to complete credential rotation.</li>
              <li>All steps are recorded in the immutable audit log for compliance.</li>
            </ol>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <Fingerprint className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Two-Factor Authentication (2FA) & Session Guard
                </h3>
                <p className="text-xs text-slate-500">
                  Time-based OTP & Hardware Key Integration
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Every staff member with Administrative or Super Admin privileges is required to enforce hardware-backed TOTP verification. IT retains full capability to revoke compromised sessions remotely in case of device loss.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-white">Zero External Cloud Reliance</span>
                <p className="text-xs text-slate-500">All credentials and document records remain isolated in dedicated database storage.</p>
              </div>
              <Badge variant="success" className="text-xs">Active</Badge>
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
            {/* Ticket Information card */}
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
                  <p className="font-semibold text-amber-600 dark:text-amber-400">
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

            {/* Generated Authorization Code Result */}
            {generatedAuthCode ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Authorization Granted & Key Issued
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Transmit this one-time secure activation key to the employee or store it in the secure handover channel:
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
                        Issues verified security key to allow credential rotation
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
                      placeholder="Leave blank to auto-generate single-use key"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="font-mono text-xs"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      If provided, the account password will be directly updated immediately upon authorization.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    IT Security Log Remarks
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Identity verified via corporate video call. Access granted."
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

            {/* Modal Actions */}
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
                      Confirm & Issue Authorization
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

      {/* MODAL 2: Submit New Security Request (Self-Service or IT Escalation) */}
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
    </div>
  );
}

