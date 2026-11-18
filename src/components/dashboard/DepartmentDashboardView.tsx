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
  PlusCircle,
  Mail,
  Send,
  Download,
  Filter,
  Check,
  X,
  RefreshCw,
  Cpu,
  Zap,
  Radio,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  AlertCircle,
  UserCheck,
  Award,
  Landmark,
  Plus,
} from "lucide-react";
import { StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TelemetryChart } from "@/components/ui/TelemetryChart";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatBytes, timeAgo, formatDate, getInitials } from "@/lib/utils";

export interface DepartmentDashboardViewProps {
  currentUser: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    department?: string;
    seniorityLevel?: string;
    jobTitle?: string | null;
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
  treasuryMetrics?: {
    totalInflow: number;
    totalDisbursed: number;
    netBalance: number;
  };
  financialTransactions?: any[];
  approvals?: any[];
  corporateEmails?: any[];
  automationRules?: any[];
  initialPlatform?: "systems" | "operations" | "executive" | "finance" | "hr";
  initialTab?: "overview" | "systems" | "operations" | "approvals" | "treasury" | "communications" | "personal";
  portfolioItems?: any[];
  userProjects?: any[];
  userReports?: any[];
  userSubmittedApprovals?: any[];
  userPendingActionApprovals?: any[];
  userAuditLogs?: any[];
  userLeaveRequests?: any[];
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
  treasuryMetrics = { totalInflow: 0, totalDisbursed: 0, netBalance: 0 },
  financialTransactions = [],
  approvals = [],
  corporateEmails = [],
  automationRules = [],
  initialPlatform = "executive",
  initialTab = "overview",
  portfolioItems = [],
  userProjects = [],
  userReports = [],
  userSubmittedApprovals = [],
  userPendingActionApprovals = [],
  userAuditLogs = [],
  userLeaveRequests = [],
}: DepartmentDashboardViewProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  // Tab State: Overview (default), Systems IT, Operations, Approvals, Treasury, Communications, Personal Hub
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "systems" | "operations" | "approvals" | "treasury" | "communications" | "personal"
  >(initialTab || "operations");

  // Platform State: systems (admin.), operations (ops.), executive (root/CEO), finance, hr
  const [platform, setPlatform] = React.useState<"systems" | "operations" | "executive" | "finance" | "hr">(initialPlatform);

  // Seniority & Clearance Gating Evaluation
  const userSeniority = (currentUser.seniorityLevel || "SENIOR").toUpperCase();
  const isExec = currentUser.role === "SUPER_ADMIN" || userSeniority === "EXECUTIVE" || currentUser.department?.toUpperCase() === "EXECUTIVE";
  const isSenior = isExec || userSeniority === "SENIOR" || currentUser.role === "ADMIN";
  const isMid = !isSenior && (userSeniority === "MID" || currentUser.role === "OPERATIONS");
  const isJunior = !isSenior && !isMid;

  const seniorityBadgeLabel = isExec
    ? "Executive Director"
    : isSenior
    ? "Senior Lead • Level 3"
    : isMid
    ? "Specialist • Level 2"
    : "Staff Analyst • Level 1";

  const seniorityAuthorityLabel = isExec
    ? "Full Cross-Directorate Sovereign Clearance Authority"
    : isSenior
    ? "Authorized Department Clearance & Disbursement Sign-Off"
    : isMid
    ? "Operational Review & Requisition Processing Authority"
    : "Staff Task Execution & Requisition Submission Authority";

  // Sanitize and normalize display job title (eliminates inappropriate developer tags for business roles)
  const userJobTitle = React.useMemo(() => {
    const raw = (currentUser.jobTitle || "").trim();
    if (!raw || raw.toLowerCase().includes("dev") || raw.toLowerCase().includes("developer")) {
      return currentUser.department?.toUpperCase() === "EXECUTIVE"
        ? "Executive Director"
        : currentUser.department?.toUpperCase() === "FINANCE"
        ? "Finance Lead"
        : currentUser.department?.toUpperCase() === "HR"
        ? "People & Culture Lead"
        : "Operations Manager";
    }
    return raw;
  }, [currentUser.jobTitle, currentUser.department]);

  // First name extraction for friendly personal greeting
  const userFirstName = React.useMemo(() => {
    const raw = (currentUser.fullName || "").trim();
    if (!raw) return "there";
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0];

    // If email prefix matches one of the name tokens (e.g. peter4tech matches Peter)
    const emailPrefix = (currentUser.email || "").toLowerCase().split("@")[0];
    const match = parts.find((p) => p.length >= 3 && emailPrefix.includes(p.toLowerCase()));
    if (match) return match;

    // In cases where family name is first (e.g. Ogba Peter), prefer given name or first token
    return parts[parts.length - 1] || parts[0];
  }, [currentUser.fullName, currentUser.email]);

  // Sync tab and platform with URL search parameter (?tab=...), hostname, and sidebar events
  React.useEffect(() => {
    const syncFromUrl = () => {
      if (typeof window === "undefined") return;
      const host = window.location.hostname.toLowerCase();
      const isAdminHost = host.startsWith("admin.") || host.includes("admin.dextaafrica") || host.includes("admin.localhost");
      const isOpsHost = host.startsWith("ops.") || host.includes("ops.dextaafrica") || host.includes("ops.localhost");

      // The authenticated account's verified department strictly dictates their workspace
      const userDept = (currentUser?.department || "").toUpperCase();
      const userRole = (currentUser?.role || "").toUpperCase();

      let currentPlatform: "systems" | "operations" | "executive" | "finance" | "hr" = "operations";
      if (userRole === "SUPER_ADMIN" || userDept === "EXECUTIVE") {
        currentPlatform = isAdminHost ? "systems" : isOpsHost ? "operations" : "executive";
      } else if (userDept === "FINANCE" || userDept === "ACCOUNTING" || userDept === "ACCOUNTS") {
        currentPlatform = "finance";
      } else if (userDept === "IT") {
        currentPlatform = "systems";
      } else if (userDept === "HR") {
        currentPlatform = "hr";
      } else if (userDept === "OPERATIONS" || userDept === "ENGINEERING" || userDept === "ARCHITECTURE") {
        currentPlatform = "operations";
      } else {
        currentPlatform = "operations";
      }
      setPlatform(currentPlatform);

      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");

      // Guard: non-IT users cannot view Systems IT tab
      if (tabParam === "systems" && userRole !== "SUPER_ADMIN" && userDept !== "IT") {
        setActiveTab(currentPlatform === "finance" ? "treasury" : "operations");
      } else if (currentPlatform === "operations" && (tabParam === "personal" || tabParam === "communications" || tabParam === "dispatch" || tabParam === "systems" || tabParam === "treasury" || tabParam === "overview")) {
        setActiveTab("operations");
      } else if (
        tabParam === "systems" ||
        tabParam === "operations" ||
        tabParam === "approvals" ||
        tabParam === "treasury" ||
        tabParam === "communications" ||
        tabParam === "overview" ||
        tabParam === "personal"
      ) {
        setActiveTab(tabParam as any);
      } else if (tabParam === "dispatch") {
        setActiveTab("communications");
      } else {
        if (currentPlatform === "systems") setActiveTab("systems");
        else if (currentPlatform === "finance") setActiveTab("treasury");
        else if (currentPlatform === "hr") setActiveTab("approvals");
        else if (currentPlatform === "executive") setActiveTab(isAdminHost ? "systems" : isOpsHost ? "operations" : "overview");
        else setActiveTab("operations");
      }
    };

    syncFromUrl();

    const handleSwitchTab = (e: any) => {
      const tab = e.detail;
      if (platform === "operations" && (tab === "personal" || tab === "communications" || tab === "dispatch" || tab === "systems" || tab === "treasury" || tab === "overview")) {
        setActiveTab("operations");
        return;
      }
      if (
        tab === "systems" ||
        tab === "operations" ||
        tab === "approvals" ||
        tab === "treasury" ||
        tab === "communications" ||
        tab === "overview" ||
        tab === "personal"
      ) {
        setActiveTab(tab);
      } else if (tab === "dispatch") {
        setActiveTab("communications");
      }
    };

    window.addEventListener("dexta:switch-tab", handleSwitchTab);
    window.addEventListener("popstate", syncFromUrl);
    return () => {
      window.removeEventListener("dexta:switch-tab", handleSwitchTab);
      window.removeEventListener("popstate", syncFromUrl);
    };
  }, [currentUser?.department, currentUser?.role]);

  // Dynamic Data State
  const [transactionsList, setTransactionsList] = React.useState<any[]>(financialTransactions);
  const [approvalsList, setApprovalsList] = React.useState<any[]>(approvals);
  const [emailsList, setEmailsList] = React.useState<any[]>(corporateEmails);
  const [txnFilter, setTxnFilter] = React.useState<string>("ALL");
  const [approvalFilter, setApprovalFilter] = React.useState<string>("ALL");

  // Modals state
  const [newApprovalModalOpen, setNewApprovalModalOpen] = React.useState(false);
  const [newEmailModalOpen, setNewEmailModalOpen] = React.useState(false);
  const [newTxnModalOpen, setNewTxnModalOpen] = React.useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = React.useState(false);
  const [selectedApproval, setSelectedApproval] = React.useState<any | null>(null);
  const [decisionType, setDecisionType] = React.useState<"APPROVED" | "REJECTED">("APPROVED");
  const [decisionNotes, setDecisionNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Forms state
  const [approvalForm, setApprovalForm] = React.useState({
    title: "",
    description: "",
    category: "PROCUREMENT_LOGISTICS",
    toDepartment: "OPERATIONS",
    priority: "NORMAL",
    amount: "",
    currency: "USD",
  });

  const [emailForm, setEmailForm] = React.useState({
    toEmail: "operations@dextaafrica.com",
    toName: "Operations Fleet Directorate",
    toDepartment: "OPERATIONS",
    subject: "",
    bodyHtml: "",
    category: "OPERATIONS",
    direction: "OUTBOUND",
  });

  const [txnForm, setTxnForm] = React.useState({
    type: "PROJECT_DISBURSEMENT",
    title: "",
    description: "",
    amount: "",
    currency: "USD",
    department: "OPERATIONS",
    recipientOrEntity: "",
  });

  // Time of Day Greeting
  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const formatCurrency = (val: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // True live database metrics (zero fabricated mock values)
  const effectiveInflow = treasuryMetrics.totalInflow || 0;
  const effectiveDisbursed = treasuryMetrics.totalDisbursed || 0;
  const effectiveTreasuryBalance = effectiveInflow - effectiveDisbursed;
  const effectivePipelineValue = executiveMetrics.grossPipelineValue || 0;
  const effectiveDealsCount = executiveMetrics.totalDeals || 0;

  // Submit Approval
  const handleCreateApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalForm.title || !approvalForm.description) {
      toastError("Please provide request title and details.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approvalForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit approval request");

      setApprovalsList([data.approval, ...approvalsList]);
      setNewApprovalModalOpen(false);
      setApprovalForm({
        title: "",
        description: "",
        category: "PROCUREMENT_LOGISTICS",
        toDepartment: "OPERATIONS",
        priority: "NORMAL",
        amount: "",
        currency: "USD",
      });

      toastSuccess(
        "Request Dispatched",
        `Approval ticket ${data.approval.ticketNumber} created. Notification and email dispatched to ${data.approval.toDepartment}.`
      );
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Error submitting request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Decide Approval
  const handleDecideApproval = async () => {
    if (!selectedApproval) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/approvals/${selectedApproval.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: decisionType,
          decisionNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update approval decision");

      setApprovalsList((prev) =>
        prev.map((item) => (item.id === selectedApproval.id ? data.approval : item))
      );

      if (decisionType === "APPROVED" && selectedApproval.amount > 0) {
        const txnRes = await fetch("/api/transactions");
        if (txnRes.ok) {
          const txnData = await txnRes.json();
          setTransactionsList(txnData.transactions || []);
        }
      }

      setDecisionModalOpen(false);
      setSelectedApproval(null);
      setDecisionNotes("");

      toastSuccess(
        `Request ${decisionType === "APPROVED" ? "Approved" : "Declined"}`,
        `Formal notice dispatched to ${selectedApproval.requesterEmail} via Enterprise SMTP.`
      );
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Error saving decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send Corporate Email
  const handleSendCorporateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.toEmail || !emailForm.subject || !emailForm.bodyHtml) {
      toastError("Please fill in recipient, subject, and message content.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/corporate-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");

      setEmailsList([data.email, ...emailsList]);
      setNewEmailModalOpen(false);
      setEmailForm({
        toEmail: "operations@dextaafrica.com",
        toName: "Operations Fleet Directorate",
        toDepartment: "OPERATIONS",
        subject: "",
        bodyHtml: "",
        category: "OPERATIONS",
        direction: "OUTBOUND",
      });

      toastSuccess(
        "Email Dispatched",
        `Corporate communication dispatched to ${data.email.toEmail} via SMTP.`
      );
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Error sending email");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Record Transaction
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txnForm.title || !txnForm.amount || !txnForm.recipientOrEntity) {
      toastError("Please fill in title, amount, and recipient/entity.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txnForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record transaction");

      setTransactionsList([data.transaction, ...transactionsList]);
      setNewTxnModalOpen(false);
      setTxnForm({
        type: "PROJECT_DISBURSEMENT",
        title: "",
        description: "",
        amount: "",
        currency: "USD",
        department: "OPERATIONS",
        recipientOrEntity: "",
      });

      toastSuccess(
        "Transaction Settled",
        `Reference ${data.transaction.reference} registered to Dexta Treasury Ledger.`
      );
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Error recording transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter lists
  const filteredTransactions = transactionsList.filter((t) => {
    if (txnFilter === "INFLOWS") return t.type === "CAPITAL_INFLOW";
    if (txnFilter === "DISBURSEMENTS") return t.type === "PROJECT_DISBURSEMENT";
    if (txnFilter === "CONTRACTORS") return t.type === "CONTRACTOR_PAYOUT";
    if (txnFilter === "PAYROLL") return t.type === "PAYROLL";
    return true;
  });

  const filteredApprovals = approvalsList.filter((a) => {
    if (approvalFilter === "PENDING") return a.status === "PENDING";
    if (approvalFilter === "APPROVED") return a.status === "APPROVED";
    if (approvalFilter === "REJECTED") return a.status === "REJECTED";
    return true;
  });

  const pendingApprovalsCount = approvalsList.filter((a) => a.status === "PENDING").length;

  const formatActivityAction = (action?: string) => {
    if (!action) return "System Activity";
    const upper = action.toUpperCase();
    if (upper.includes("MFA") || upper.includes("CHALLENGE")) return "Security login verified";
    if (upper.includes("LOGIN") || upper.includes("AUTH")) return "Staff signed in";
    if (upper.includes("LOGOUT")) return "Staff signed out";
    if (upper.includes("USER_CREATE") || upper.includes("REGISTER")) return "New team member added";
    if (upper.includes("USER_UPDATE")) return "Team profile updated";
    if (upper.includes("PASSWORD")) return "Password updated";
    if (upper.includes("APPROVAL")) return "Clearance request updated";
    if (upper.includes("FILE") || upper.includes("UPLOAD") || upper.includes("STORAGE")) return "Document uploaded";
    if (upper.includes("PROJECT")) return "Project record updated";
    if (upper.includes("DISPATCH") || upper.includes("EMAIL")) return "Email announcement sent";
    return action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-7xl mx-auto">
      {/* ===================================================================== */}
      {/* 1. MASTER UNIFIED EXECUTIVE HEADER (ZERO STACKED DUPLICATES) */}
      {/* ===================================================================== */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Greeting & Identity */}
          <div className="space-y-2.5">
            {platform === "operations" ? (
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-[#ED2618] animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#ED2618]">
                  Operations Workspace
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex h-2 w-2 rounded-full bg-[#ED2618] animate-pulse" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#ED2618]">
                  {platform === "systems"
                    ? "admin.dextafrica.org • Systems IT Administration"
                    : platform === "finance"
                    ? "dextaafrica.org • Treasury & Financial Accounts Desk"
                    : platform === "hr"
                    ? "dextaafrica.org • People & Culture Desk"
                    : "dextaafrica.org • Executive Leadership Suite"}
                </span>
                <span className="text-slate-300 dark:text-white/20">&bull;</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  {platform === "systems"
                    ? `SYSTEMS & IT • ${currentUser.role || "ADMIN"}`
                    : platform === "finance"
                    ? `FINANCE & ACCOUNTS • ${currentUser.role || "ADMIN"}`
                    : platform === "hr"
                    ? `PEOPLE & HR • ${currentUser.role || "ADMIN"}`
                    : `${currentUser.department || "EXECUTIVE"} • ${currentUser.role || "ADMIN"}`}
                </span>
                <span className="text-slate-300 dark:text-white/20">&bull;</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 uppercase tracking-wider border border-amber-500/25">
                  {seniorityBadgeLabel}
                </span>
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {greeting}, <span className="text-[#ED2618]">{userFirstName}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              {platform === "operations"
                ? "Manage ongoing projects, daily field reports, team logistics, and site approvals in one place."
                : platform === "systems"
                ? "Manage team accounts, platform security, documents, and system clearances in one place."
                : platform === "finance"
                ? "Manage corporate ledger records, capital inflows, contractor disbursements, and treasury accounts."
                : platform === "hr"
                ? "Manage workforce operations, employee profiles, leave clearances, and team onboarding."
                : "Executive leadership workspace governing enterprise infrastructure, capital investments, and operations."}
            </p>

            <div className="flex items-center gap-2 pt-0.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {userJobTitle}
              </span>
              <span className="text-slate-300 dark:text-white/20">&bull;</span>
              <span className="font-mono text-slate-400">{currentUser.email}</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {platform === "operations" ? (
              <>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-white text-xs font-bold transition-all shadow-sm"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Enter New Project</span>
                </Link>
                <Link
                  href="/reports"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:border-[#ED2618] hover:text-[#ED2618] text-xs font-bold transition-all"
                >
                  <FileText className="h-4 w-4" />
                  <span>Draft Report</span>
                </Link>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setNewApprovalModalOpen(true)}
                  leftIcon={<CheckCircle2 className="h-4 w-4 text-[#ED2618]" />}
                >
                  Request Clearance
                </Button>
              </>
            ) : platform === "systems" ? (
              <>
                <Link
                  href="/it"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-white px-3.5 py-2 text-xs font-bold transition-all shadow-sm"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Security Policies</span>
                </Link>

                <Link
                  href="/users"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#ED2618] hover:text-[#ED2618] transition-all"
                >
                  <Users className="h-4 w-4" />
                  <span>Team Accounts</span>
                </Link>

                <a
                  href="/api/reports/executive?format=csv"
                  download
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#ED2618] hover:text-[#ED2618] transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Activity Logs (CSV)</span>
                  <span className="inline sm:hidden">CSV</span>
                </a>
              </>
            ) : platform === "finance" ? (
              <>
                {isSenior ? (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setNewTxnModalOpen(true)}
                      leftIcon={<PlusCircle className="h-4 w-4" />}
                    >
                      Record Inflow
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setNewApprovalModalOpen(true)}
                      leftIcon={<CheckCircle2 className="h-4 w-4" />}
                    >
                      Disbursement Clearance
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setNewApprovalModalOpen(true)}
                    leftIcon={<PlusCircle className="h-4 w-4" />}
                  >
                    Submit Expense Voucher
                  </Button>
                )}
                <a
                  href="/api/reports/executive?format=csv"
                  download
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#ED2618] hover:text-[#ED2618] transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Export Ledger</span>
                  <span className="inline sm:hidden">CSV</span>
                </a>
              </>
            ) : platform === "hr" ? (
              <>
                <Link
                  href="/hr"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-white px-3.5 py-2 text-xs font-bold transition-all shadow-sm"
                >
                  <Users className="h-4 w-4" />
                  <span>Onboard Staff</span>
                </Link>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setNewApprovalModalOpen(true)}
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Personnel Clearance
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setNewEmailModalOpen(true)}
                  leftIcon={<Mail className="h-4 w-4" />}
                >
                  Staff Notice
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setNewApprovalModalOpen(true)}
                  leftIcon={<PlusCircle className="h-4 w-4" />}
                >
                  Request Approval
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setNewEmailModalOpen(true)}
                  leftIcon={<Mail className="h-4 w-4" />}
                >
                  Send Team Email
                </Button>

                <a
                  href="/api/reports/executive?format=csv"
                  download
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#ED2618] hover:text-[#ED2618] transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Export Report</span>
                  <span className="inline sm:hidden">CSV</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Clean, Modern Navigation Tabs (Subdomain Context Aware) */}
        <div className="flex items-center gap-2 pt-6 mt-6 border-t border-slate-100 dark:border-white/[0.06] overflow-x-auto no-scrollbar">
          {/* Executive Overview (Executive only) */}
          {platform === "executive" && (
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "overview"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
              }`}
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Executive Overview</span>
            </button>
          )}

          {/* Systems IT Command (IT & Executive) */}
          {(platform === "systems" || platform === "executive") && (
            <button
              type="button"
              onClick={() => setActiveTab("systems")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "systems"
                  ? "bg-[#ED2618] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>System Overview</span>
            </button>
          )}

          {/* Site Operations (Operations & Executive only - NOT shown to Finance/HR) */}
          {(platform === "operations" || platform === "executive") && (
            <button
              type="button"
              onClick={() => setActiveTab("operations")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "operations"
                  ? "bg-[#ED2618] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Site Operations</span>
            </button>
          )}

          {/* Treasury & Ledger (Finance & Executive only - NOT shown to non-exec Operations) */}
          {(platform === "finance" || platform === "executive") && (
            <button
              type="button"
              onClick={() => setActiveTab("treasury")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "treasury"
                  ? "bg-[#ED2618] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
              }`}
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span>Treasury &amp; Ledger</span>
            </button>
          )}

          {/* Approval Desk (Available to all workspaces) */}
          <button
            type="button"
            onClick={() => setActiveTab("approvals")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "approvals"
                ? "bg-[#ED2618] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Clearances &amp; Approvals</span>
            {pendingApprovalsCount > 0 && (
              <span className="h-4 min-w-[16px] px-1 rounded-full bg-red-500/20 text-[#ED2618] dark:bg-white/20 dark:text-white text-[10px] font-black flex items-center justify-center">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          {/* Corporate Dispatch (Available across workspaces except Operations) */}
          {platform !== "operations" && (
            <button
              type="button"
              onClick={() => setActiveTab("communications")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "communications"
                  ? "bg-[#ED2618] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Email &amp; Broadcasts</span>
            </button>
          )}

          {/* Personalized User Workspace Hub (Only for multi-department/Executive workspaces) */}
          {platform !== "operations" && (
            <button
              type="button"
              onClick={() => setActiveTab("personal")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "personal"
                  ? "bg-[#ED2618] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>My Tasks</span>
              {userSubmittedApprovals.length > 0 && (
                <span className="h-4 min-w-[16px] px-1 rounded-full bg-blue-500/20 text-blue-600 dark:bg-blue-500/30 dark:text-blue-200 text-[10px] font-black flex items-center justify-center">
                  {userSubmittedApprovals.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. TAB: EXECUTIVE OVERVIEW */}
      {/* ===================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top 4 Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Net Treasury Liquidity
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {formatCurrency(effectiveTreasuryBalance)}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>+{formatCurrency(effectiveInflow)} Total Capital Inflow</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                {formatCurrency(effectiveDisbursed)} verified disbursements
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Gross Capital Pipeline
                </span>
                <div className="p-2 rounded-xl bg-red-500/10 text-[#ED2618]">
                  <Briefcase className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {formatCurrency(effectivePipelineValue)}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                  <span>{effectiveDealsCount} In-Flight Institutional Deals</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                African Real Estate Trust &amp; Sovereign Funds
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Project Site Deliveries
                </span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Building2 className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {operationsMetrics.developmentsCount} {operationsMetrics.developmentsCount === 1 ? "Active Site" : "Active Sites"}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Check className="h-3.5 w-3.5" />
                  <span>{operationsMetrics.developmentsCount > 0 ? "Production Backed Portfolio" : "Zero Unverified Sites"}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                {portfolioItems.length > 0 ? portfolioItems.slice(0, 3).map((p: any) => p.name).join(" • ") : "No Project Sites Registered"}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Inter-Department Desk
                </span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {approvalsList.length} Requests
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#ED2618] font-semibold">
                  <span>{pendingApprovalsCount} Awaiting Review</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                Automated Corporate SMTP Routing
              </p>
            </div>
          </div>

          {/* Main Grid: Sites & Approvals Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 cols): Construction Projects */}
            <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Active Project Sites
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live operational progress and contractor disbursement tracking.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab("operations")}
                >
                  View Details &rarr;
                </Button>
              </div>

              <div className="space-y-4">
                {portfolioItems && portfolioItems.length > 0 ? (
                  portfolioItems.slice(0, 3).map((site: any, idx: number) => (
                    <div
                      key={site.id || idx}
                      className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {site.name}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {site.location || "Coastline Corridor"} &bull;{" "}
                            <span className="capitalize text-[#ED2618] font-semibold">
                              {(site.status || "active").replace("_", " ")}
                            </span>
                          </p>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                          {site.published ? "Published Catalog" : "Internal Engineering"}
                        </span>
                      </div>

                      {site.summary && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {site.summary}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 space-y-3">
                    <div className="h-10 w-10 mx-auto rounded-xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center text-slate-400">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        No Project Sites Registered
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Production database has zero registered site developments.
                      </p>
                    </div>
                    <Link
                      href="/projects"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-white text-xs font-bold transition-all shadow-sm"
                    >
                      <span>Enter Infrastructure Project &rarr;</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (5 cols): Quick Inter-Department Approvals & Action Center */}
            <div className="lg:col-span-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Approval Desk (Action Required)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Inter-department clearances awaiting executive review.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setNewApprovalModalOpen(true)}
                  leftIcon={<PlusCircle className="h-3.5 w-3.5" />}
                >
                  New
                </Button>
              </div>

              <div className="space-y-3">
                {approvalsList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No active requests. Submit a request to initiate automated routing.
                  </div>
                ) : (
                  approvalsList.slice(0, 4).map((appr) => {
                    const isPending = appr.status === "PENDING";
                    const isApproved = appr.status === "APPROVED";

                    return (
                      <div
                        key={appr.id}
                        className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-[#ED2618]">
                            {appr.ticketNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isPending
                                ? "bg-slate-200/70 dark:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/15"
                                : isApproved
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {appr.status}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                            {appr.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            From: <strong className="text-slate-700 dark:text-slate-300">{appr.requesterName} ({appr.fromDepartment})</strong>
                            {appr.amount && (
                              <span className="ml-2 font-mono font-bold text-[#ED2618]">
                                &bull; {formatCurrency(appr.amount, appr.currency)}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* 1-Click Fast Actions on Pending Requests */}
                        {isPending && (
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedApproval(appr);
                                setDecisionType("APPROVED");
                                setDecisionModalOpen(true);
                              }}
                              className="flex-1 py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer text-center"
                            >
                              Authorize
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedApproval(appr);
                                setDecisionType("REJECTED");
                                setDecisionModalOpen(true);
                              }}
                              className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-rose-600 hover:text-white text-slate-600 dark:text-slate-400 text-[11px] font-bold transition-all cursor-pointer text-center"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2.5 TAB: SYSTEMS IT COMMAND (ADMIN.DEXTAFRICA.ORG) */}
      {/* ===================================================================== */}
      {activeTab === "systems" && (
        <div className="space-y-6">
          {/* Top 3 High-Impact Operational Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Team Members */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm flex flex-col justify-between space-y-4 hover:border-red-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Team Members
                </span>
                <div className="h-9 w-9 rounded-xl bg-red-500/10 text-[#ED2618] flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {itMetrics.totalUsers || 4}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Active staff accounts across all departments
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                <Link
                  href="/users"
                  className="text-xs font-bold text-[#ED2618] hover:underline flex items-center gap-1 group"
                >
                  <span>Manage Team Accounts</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                  All Active
                </span>
              </div>
            </div>

            {/* 2. Clearances & Approvals */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pending Clearances
                </span>
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {pendingApprovalsCount}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {pendingApprovalsCount > 0
                    ? "Requests awaiting department management decision"
                    : "All department requests reviewed and cleared"}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab("approvals")}
                  className="text-xs font-bold text-[#ED2618] hover:underline flex items-center gap-1 group cursor-pointer"
                >
                  <span>Review Clearances</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 font-bold">
                  {pendingApprovalsCount > 0 ? "Action Required" : "Up to date"}
                </span>
              </div>
            </div>

            {/* 3. Company File Storage */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Document Storage
                </span>
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <HardDrive className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {formatBytes(itMetrics.totalStorageBytes)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Using {itMetrics.storagePercent}% of 50 GB allowance
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                <Link
                  href="/storage"
                  className="text-xs font-bold text-[#ED2618] hover:underline flex items-center gap-1 group"
                >
                  <span>Open Document Vault</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                  Cloud Secured
                </span>
              </div>
            </div>
          </div>

          {/* Two-Column Core Layout: Primary Actions on Left + Live Team Activity on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 cols): 4 Focused Administrative Modules */}
            <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Administrative Workspaces
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select a workspace to manage people, documents, or company requests.
                  </p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Systems Online
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Team & Access */}
                <Link
                  href="/users"
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] hover:border-[#ED2618]/50 hover:bg-white dark:hover:bg-white/[0.04] hover:shadow-md hover:-translate-y-0.5 transition-all space-y-3 group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-red-500/10 text-[#ED2618] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Users className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#ED2618] group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#ED2618] transition-colors">
                      Team &amp; Staff Accounts
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                      Onboard new staff, assign department roles, and manage employee access.
                    </p>
                  </div>
                </Link>

                {/* 2. Document Storage */}
                <Link
                  href="/storage"
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] hover:border-blue-500/50 hover:bg-white dark:hover:bg-white/[0.04] hover:shadow-md hover:-translate-y-0.5 transition-all space-y-3 group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <HardDrive className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                      Files &amp; Documents
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                      Access construction drawings, partner contracts, and field reports.
                    </p>
                  </div>
                </Link>

                {/* 3. Approvals & Clearances */}
                <button
                  type="button"
                  onClick={() => setActiveTab("approvals")}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] hover:border-emerald-500/50 hover:bg-white dark:hover:bg-white/[0.04] hover:shadow-md hover:-translate-y-0.5 transition-all space-y-3 group cursor-pointer text-left w-full"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Approvals &amp; Clearances
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                      Review site purchase requests, contractor funds, and sign-offs.
                    </p>
                  </div>
                </button>

                {/* 4. Company Announcements */}
                <button
                  type="button"
                  onClick={() => setActiveTab("communications")}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] hover:border-amber-500/50 hover:bg-white dark:hover:bg-white/[0.04] hover:shadow-md hover:-translate-y-0.5 transition-all space-y-3 group cursor-pointer text-left w-full"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Mail className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                      Company Announcements
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                      Dispatch official email notices and updates directly to staff.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Right Column (5 cols): Clean Human-Friendly Team Activity */}
            <div className="lg:col-span-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 sm:p-7 shadow-sm space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Recent Activity
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Live audit stream across enterprise workspaces.
                    </p>
                  </div>
                  <Link
                    href="/audit-logs"
                    className="text-xs font-bold text-[#ED2618] hover:underline shrink-0"
                  >
                    View All &rarr;
                  </Link>
                </div>

                <div className="space-y-3">
                  {recentLogs && recentLogs.length > 0 ? (
                    recentLogs.slice(0, 5).map((log: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {formatActivityAction(log.action)}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {log.actorEmail || "Team Member"}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap mt-0.5">
                          {timeAgo(log.createdAt)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-xs text-slate-400">
                      No recent activity recorded yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Quick Help Card */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Dexta Africa Enterprise Portal
                </span>
                <Link
                  href="/it"
                  className="font-bold text-slate-700 dark:text-slate-300 hover:text-[#ED2618] transition-colors"
                >
                  Security Settings &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. TAB: SITE OPERATIONS & FIELD REPOSITORY */}
      {/* ===================================================================== */}
      {activeTab === "operations" && (
        <div className="space-y-6 animate-fade-in">
          {/* TELEMETRY RIBBON (Zero Mock Data, 100% Dynamic) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-4 sm:p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Total Projects
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                {userProjects.length}
              </div>
              <p className="text-[11px] text-slate-400">
                Registered operations sites
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-4 sm:p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">
                Active In Progress
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {userProjects.filter((p: any) => p.status === "IN_PROGRESS").length}
              </div>
              <p className="text-[11px] text-slate-400">
                Live ground execution
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-4 sm:p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider block">
                Reports &amp; Dossiers
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {userReports.length}
              </div>
              <p className="text-[11px] text-slate-400">
                Field documentation submitted
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-4 sm:p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-blue-500 uppercase tracking-wider block">
                Clearances Assigned
              </span>
              <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {userSubmittedApprovals.length}
              </div>
              <p className="text-[11px] text-slate-400">
                Permits &amp; authorizations
              </p>
            </div>
          </div>

          {/* ACTIVE INFRASTRUCTURE PROJECTS (Direct Real Telemetry) */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Active Infrastructure Projects &amp; Sites
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Live operational sites, contractor squads, and ground milestones under your supervision.
                </p>
              </div>
              <Link
                href="/projects"
                className="text-xs font-bold text-[#ED2618] hover:underline flex items-center gap-1"
              >
                <span>View All Projects &rarr;</span>
              </Link>
            </div>

            {userProjects && userProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userProjects.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] space-y-3 hover:border-slate-300 dark:hover:border-white/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-[#ED2618] bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md">
                          {p.code}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                          {p.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">{p.location}</p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 shrink-0">
                        {p.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Delivery Velocity:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {p.progressPct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#ED2618] rounded-full"
                          style={{ width: `${p.progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{p.contractorTeam || "Dexta Squad Alpha"}</span>
                      <Link
                        href="/projects"
                        className="font-bold text-[#ED2618] hover:underline"
                      >
                        Manage &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 space-y-3">
                <div className="h-10 w-10 mx-auto rounded-xl bg-red-50 text-[#ED2618] dark:bg-red-950/30 flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    No Projects Entered Yet
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    As Operations Manager, enter your infrastructure projects to establish ground milestones and assign contractor squads.
                  </p>
                </div>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ED2618] hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Enter New Project</span>
                </Link>
              </div>
            )}
          </div>

          {/* TWO COLUMNS: RECENT FIELD REPORTS & CLEARANCES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Recent Field Reports & Dossiers */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Your Reports &amp; Dossiers
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Field activity logs and line manager submissions.
                  </p>
                </div>
                <Link
                  href="/reports"
                  className="text-xs font-bold text-[#ED2618] hover:underline"
                >
                  Reports Studio &rarr;
                </Link>
              </div>

              {userReports && userReports.length > 0 ? (
                <div className="space-y-2">
                  {userReports.slice(0, 4).map((r: any) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-mono text-[10px] font-bold text-[#ED2618]">
                          {r.reference}
                        </span>
                        <h5 className="font-bold text-slate-900 dark:text-white truncate">
                          {r.title}
                        </h5>
                        <p className="text-[10px] text-slate-400">
                          {r.cadence} &bull; {new Date(r.reportDate || r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 shrink-0">
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 space-y-2">
                  <FileText className="h-6 w-6 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">No field reports drafted yet.</p>
                  <Link
                    href="/reports"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#ED2618] hover:underline"
                  >
                    <span>Create New Report &rarr;</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Right: Inter-Department Clearances */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Operations Clearances &amp; Permits
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Inter-department permits and contractor authorizations.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setNewApprovalModalOpen(true)}
                  className="h-7 text-xs font-bold"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  <span>New Request</span>
                </Button>
              </div>

              {userSubmittedApprovals && userSubmittedApprovals.length > 0 ? (
                <div className="space-y-2">
                  {userSubmittedApprovals.slice(0, 4).map((a: any) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-mono text-[10px] font-bold text-[#ED2618]">
                          {a.ticketCode}
                        </span>
                        <h5 className="font-bold text-slate-900 dark:text-white truncate">
                          {a.title}
                        </h5>
                        <p className="text-[10px] text-slate-400">
                          {a.fromDepartment} &rarr; {a.toDepartment}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 shrink-0">
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 space-y-2">
                  <CheckCircle2 className="h-6 w-6 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">No active clearance requests pending.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setNewApprovalModalOpen(true)}
                    className="h-7 text-xs font-bold"
                  >
                    <span>Issue Clearance Ticket</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. TAB: APPROVAL DESK */}
      {/* ===================================================================== */}
      {activeTab === "approvals" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Inter-Department Workflow &amp; Approvals
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Authorizations between HR, Operations, Finance, and Executive with automatic email dispatch.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setApprovalFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      approvalFilter === filter
                        ? "bg-[#ED2618] text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApprovals.map((appr) => {
                const isPending = appr.status === "PENDING";
                const isApproved = appr.status === "APPROVED";

                return (
                  <div
                    key={appr.id}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#ED2618]">
                          {appr.ticketNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPending
                              ? "bg-slate-200/70 dark:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/15"
                              : isApproved
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                          }`}
                        >
                          {appr.status}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {appr.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {appr.description}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-[#12151E] border border-slate-200/60 dark:border-white/[0.05] space-y-1 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Route:</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {appr.fromDepartment} &rarr; {appr.toDepartment}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Requester:</span>
                          <span className="text-slate-700 dark:text-slate-300">{appr.requesterName}</span>
                        </div>
                        {appr.amount && (
                          <div className="flex justify-between text-slate-400">
                            <span>Amount:</span>
                            <span className="font-bold text-[#ED2618] font-mono">
                              {formatCurrency(appr.amount, appr.currency)}
                            </span>
                          </div>
                        )}
                      </div>

                      {appr.decisionNotes && (
                        <p className="text-[11px] text-slate-500 italic bg-white dark:bg-[#12151E] p-2.5 rounded-lg border border-slate-200/40 dark:border-white/[0.04]">
                          &ldquo;{appr.decisionNotes}&rdquo; &bull; {appr.approvedByName}
                        </p>
                      )}
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
                        {isSenior ? (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              className="flex-1 text-xs"
                              onClick={() => {
                                setSelectedApproval(appr);
                                setDecisionType("APPROVED");
                                setDecisionModalOpen(true);
                              }}
                            >
                              Authorize
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                setSelectedApproval(appr);
                                setDecisionType("REJECTED");
                                setDecisionModalOpen(true);
                              }}
                            >
                              Decline
                            </Button>
                          </>
                        ) : (
                          <div className="w-full text-center py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] text-[11px] text-slate-500 font-medium">
                            Awaiting Senior Lead Authorization
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. TAB: TREASURY & FINANCIAL LEDGER */}
      {/* ===================================================================== */}
      {activeTab === "treasury" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Enterprise Financial Ledger &amp; Treasury
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete audit log of capital inflows, disbursements, contractor payouts, and payroll.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setNewTxnModalOpen(true)}
                  leftIcon={<DollarSign className="h-4 w-4" />}
                >
                  Record Transaction
                </Button>

                <a
                  href="/api/reports/executive?format=csv"
                  download
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#ED2618] hover:text-[#ED2618] transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download CSV</span>
                </a>
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(["ALL", "INFLOWS", "DISBURSEMENTS", "CONTRACTORS", "PAYROLL"] as const).map(
                (f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setTxnFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      txnFilter === f
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    {f}
                  </button>
                )
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/70 dark:border-white/[0.06] text-slate-400 uppercase font-mono text-[10px]">
                    <th className="py-3 px-3">Reference</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Title &amp; Recipient</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {filteredTransactions.map((txn) => {
                    const isInflow = txn.type === "CAPITAL_INFLOW";
                    return (
                      <tr key={txn.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {txn.reference}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {new Date(txn.transactionDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isInflow
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {txn.type.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">
                            {txn.title}
                          </div>
                          <div className="text-[11px] text-slate-400">{txn.recipientOrEntity}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                          {txn.department}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-bold ${isInflow ? "text-emerald-600 dark:text-emerald-400" : "text-[#ED2618]"}`}>
                          {isInflow ? "+" : "-"}
                          {formatCurrency(txn.amount, txn.currency)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. TAB: CORPORATE COMMUNICATIONS */}
      {/* ===================================================================== */}
      {activeTab === "communications" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Corporate Communications &amp; Dispatch Desk
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Official outbound and internal operations messaging wired directly to Corporate SMTP.
                </p>
              </div>

              <Button
                size="sm"
                variant="primary"
                onClick={() => setNewEmailModalOpen(true)}
                leftIcon={<Send className="h-4 w-4" />}
              >
                Compose Email
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/70 dark:border-white/[0.06] text-slate-400 uppercase font-mono text-[10px]">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Direction</th>
                    <th className="py-3 px-3">Sender</th>
                    <th className="py-3 px-3">Recipient</th>
                    <th className="py-3 px-3">Subject</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-center">SMTP Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {emailsList.map((eml) => (
                    <tr key={eml.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {timeAgo(eml.createdAt)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                          {eml.direction}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{eml.fromName}</div>
                        <div className="text-[11px] text-slate-400">{eml.fromEmail}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{eml.toName}</div>
                        <div className="text-[11px] text-slate-400">{eml.toEmail}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {eml.subject}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        {eml.category}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {eml.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. TAB: PERSONALIZED USER WORKSPACE & TASK HUB */}
      {/* ===================================================================== */}
      {activeTab === "personal" && (
        <div className="space-y-6 animate-fade-in">
          {/* User Identity & Clearance Authority Banner */}
          <div className="p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-[#ED2618] text-white font-extrabold text-xl shadow-md">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {currentUser.fullName}
                    </h2>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 uppercase border border-amber-500/25">
                      {seniorityBadgeLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {currentUser.email} &bull; {currentUser.department || "Operations"} &bull; {userJobTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setNewApprovalModalOpen(true)}
                  leftIcon={<PlusCircle className="h-4 w-4" />}
                >
                  New Requisition
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setNewEmailModalOpen(true)}
                  leftIcon={<Mail className="h-4 w-4" />}
                >
                  Send Team Message
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Clearance Authority</span>
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {isExec ? "Sovereign Executive" : isSenior ? "Senior Department Lead" : isMid ? "Operational Specialist" : "Staff Task Execution"}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {seniorityAuthorityLabel}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>My Active Requisitions</span>
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {userSubmittedApprovals.length}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  In-flight tickets submitted by your account
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Awaiting Department Review</span>
                  <Clock className="h-4 w-4 text-[#ED2618]" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {userPendingActionApprovals.length}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {isSenior ? "Tickets requiring your department authorization" : "Handled by senior department leads"}
                </p>
              </div>
            </div>
          </div>

          {/* 2-Column Grid: My Submissions & Pending Department Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: My In-Flight Submissions */}
            <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    My In-Flight Requisitions
                  </h3>
                  <p className="text-xs text-slate-400">
                    Track the live status of requests and clearings you submitted.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {userSubmittedApprovals.length} total
                </span>
              </div>

              <div className="space-y-3">
                {userSubmittedApprovals.length > 0 ? (
                  userSubmittedApprovals.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#ED2618]">
                          {req.ticketNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            req.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : req.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {req.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {req.description}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-white/[0.04] text-[10px] text-slate-500">
                        <span>Routed to: {req.toDepartment}</span>
                        <span>{timeAgo(req.createdAt)}</span>
                      </div>
                      {req.decisionNotes && (
                        <p className="text-[10px] text-slate-500 italic bg-white dark:bg-[#12141C] p-2 rounded-lg border border-slate-200/50 dark:border-white/[0.04]">
                          &ldquo;{req.decisionNotes}&rdquo; &bull; {req.approvedByName}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      No In-Flight Requisitions
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      You have zero pending clearance requests. Use the New Requisition button to submit inter-department authorizations.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions Requiring Attention & Personal Audit Activity */}
            <div className="space-y-6">
              {/* Department Action Queue */}
              <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Clearances Awaiting {currentUser.department || "Department"} Review
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isSenior ? "Authorize or decline requests sent to your department." : "Review pending tasks handled by your department leads."}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#ED2618]">
                    {userPendingActionApprovals.length} pending
                  </span>
                </div>

                <div className="space-y-3">
                  {userPendingActionApprovals.length > 0 ? (
                    userPendingActionApprovals.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#ED2618]">
                            {req.ticketNumber}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            PENDING
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {req.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            From: {req.requesterName} ({req.fromDepartment})
                          </p>
                        </div>
                        {req.amount && (
                          <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            Amount: {formatCurrency(req.amount, req.currency)}
                          </div>
                        )}
                        {isSenior ? (
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-white/[0.04]">
                            <Button
                              size="sm"
                              variant="primary"
                              className="flex-1 text-xs"
                              onClick={() => {
                                setSelectedApproval(req);
                                setDecisionType("APPROVED");
                                setDecisionModalOpen(true);
                              }}
                            >
                              Authorize
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                setSelectedApproval(req);
                                setDecisionType("REJECTED");
                                setDecisionModalOpen(true);
                              }}
                            >
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <div className="py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] text-center text-[10px] text-slate-400 font-medium">
                            Awaiting Senior Lead Authorization
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 space-y-1">
                      <ShieldCheck className="h-6 w-6 text-emerald-500 mx-auto" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Zero In-Flight Department Clearances
                      </p>
                      <p className="text-[11px] text-slate-400">
                        All inter-department requests routed to {currentUser.department || "your department"} are fully resolved.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Audit Activity */}
              <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      My Personal Audit Log
                    </h3>
                    <p className="text-xs text-slate-400">
                      Recent operations executed by your account.
                    </p>
                  </div>
                  <Link
                    href="/audit-logs"
                    className="text-xs font-bold text-[#ED2618] hover:underline"
                  >
                    View All &rarr;
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {userAuditLogs.length > 0 ? (
                    userAuditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] text-xs"
                      >
                        <div>
                          <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            {log.action}
                          </span>
                          <span className="text-slate-400 text-[10px] block">
                            Entity: {log.entity}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {timeAgo(log.createdAt)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">
                      No personal audit events recorded in this session.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: NEW INTER-DEPARTMENT APPROVAL REQUEST */}
      {/* ===================================================================== */}
      <Modal
        isOpen={newApprovalModalOpen}
        onClose={() => setNewApprovalModalOpen(false)}
        title="New Inter-Department Approval Request"
        description="Submit an operational request for authorization. Dispatches automated email notification."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateApproval} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Request Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. On-Site Inspection Clearance for Coastal Phase 2"
              value={approvalForm.title}
              onChange={(e) => setApprovalForm({ ...approvalForm, title: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141C] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Department *
              </label>
              <select
                value={approvalForm.toDepartment}
                onChange={(e) => setApprovalForm({ ...approvalForm, toDepartment: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141C] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
              >
                <option value="OPERATIONS">Operations Fleet</option>
                <option value="HR">HR &amp; People</option>
                <option value="FINANCE">Finance &amp; Treasury</option>
                <option value="EXECUTIVE">Executive Leadership</option>
                <option value="IT">Systems &amp; IT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={approvalForm.category}
                onChange={(e) => setApprovalForm({ ...approvalForm, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141C] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
              >
                <option value="PROCUREMENT_LOGISTICS">Procurement &amp; Logistics</option>
                <option value="CONTRACTOR_CLEARANCE">Contractor Site Clearance</option>
                <option value="BUDGET_DISBURSEMENT">Budget Disbursement</option>
                <option value="HEADCOUNT_HIRE">Headcount &amp; Offer</option>
                <option value="TRAVEL_EXPENSE">Travel &amp; Logistics</option>
                <option value="POLICY_EXCEPTION">Policy Exception</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Monetary Scope (Optional)
              </label>
              <input
                type="number"
                placeholder="e.g. 25000"
                value={approvalForm.amount}
                onChange={(e) => setApprovalForm({ ...approvalForm, amount: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141C] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={approvalForm.priority}
                onChange={(e) => setApprovalForm({ ...approvalForm, priority: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141C] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent (CEO Notice)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description &amp; Justification *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide context, contractor details, or site references..."
              value={approvalForm.description}
              onChange={(e) => setApprovalForm({ ...approvalForm, description: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141C] px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNewApprovalModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Dispatch Approval
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 2: AUTHORIZE OR DECLINE APPROVAL */}
      {/* ===================================================================== */}
      <Modal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title={`${decisionType === "APPROVED" ? "Authorize" : "Decline"} Request`}
        description={`Ticket ${selectedApproval?.ticketNumber}: ${selectedApproval?.title}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Requester:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {selectedApproval?.requesterName} ({selectedApproval?.fromDepartment})
              </span>
            </div>
            {selectedApproval?.amount && (
              <div className="flex justify-between">
                <span className="text-slate-400">Financial Disbursement:</span>
                <span className="font-bold text-[#ED2618] font-mono">
                  {formatCurrency(selectedApproval.amount, selectedApproval.currency)}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Comments / Conditions
            </label>
            <textarea
              rows={3}
              placeholder="Enter instructions, disbursement conditions, or reason..."
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141C] px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDecisionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={decisionType === "APPROVED" ? "primary" : "danger"}
              isLoading={isSubmitting}
              onClick={handleDecideApproval}
            >
              Confirm {decisionType === "APPROVED" ? "Authorization" : "Decline"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 3: COMPOSE CORPORATE EMAIL */}
      {/* ===================================================================== */}
      <Modal
        isOpen={newEmailModalOpen}
        onClose={() => setNewEmailModalOpen(false)}
        title="Compose Corporate Email"
        description="Dispatch official operations communication to verified recipients."
        maxWidth="3xl"
      >
        <form onSubmit={handleSendCorporateEmail} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Recipient Email *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. operations@dextaafrica.com"
                value={emailForm.toEmail}
                onChange={(e) => setEmailForm({ ...emailForm, toEmail: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141C] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Recipient Name / Department
              </label>
              <input
                type="text"
                placeholder="e.g. Operations Directorate"
                value={emailForm.toName}
                onChange={(e) => setEmailForm({ ...emailForm, toName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141C] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={emailForm.category}
                onChange={(e) => setEmailForm({ ...emailForm, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141C] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
              >
                <option value="OPERATIONS">Operations &amp; Site Dispatch</option>
                <option value="HR">HR &amp; Workforce Coordination</option>
                <option value="FINANCE">Finance &amp; Disbursement Notice</option>
                <option value="EXECUTIVE">Executive Leadership Memo</option>
                <option value="GENERAL">General Correspondence</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Direction
              </label>
              <select
                value={emailForm.direction}
                onChange={(e) => setEmailForm({ ...emailForm, direction: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141C] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
              >
                <option value="INTERNAL">Internal Department Communication</option>
                <option value="OUTBOUND">Outbound External Contractor</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Subject *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Concrete Pouring Inspection Schedule Confirmation"
              value={emailForm.subject}
              onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141C] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Message Body *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Enter official correspondence text..."
              value={emailForm.bodyHtml}
              onChange={(e) => setEmailForm({ ...emailForm, bodyHtml: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141C] px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNewEmailModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Send via SMTP
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 4: RECORD FINANCIAL TRANSACTION */}
      {/* ===================================================================== */}
      <Modal
        isOpen={newTxnModalOpen}
        onClose={() => setNewTxnModalOpen(false)}
        title="Record Treasury Transaction"
        description="Record a disbursement, capital inflow, or contractor payout to the ledger."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateTransaction} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transaction Type *
              </label>
              <select
                value={txnForm.type}
                onChange={(e) => setTxnForm({ ...txnForm, type: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141C] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
              >
                <option value="PROJECT_DISBURSEMENT">Project Site Disbursement</option>
                <option value="CAPITAL_INFLOW">Capital / Equity Inflow</option>
                <option value="CONTRACTOR_PAYOUT">Contractor Settlement</option>
                <option value="PAYROLL">Workforce Payroll</option>
                <option value="TREASURY_TRANSFER">Treasury Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount (USD) *
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 75000"
                value={txnForm.amount}
                onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141C] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Transaction Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Horizon Tower Zone C Structural Steel Disbursement"
              value={txnForm.title}
              onChange={(e) => setTxnForm({ ...txnForm, title: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141C] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Recipient / Vendor / Entity *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Julius Berger Africa Ltd"
                value={txnForm.recipientOrEntity}
                onChange={(e) => setTxnForm({ ...txnForm, recipientOrEntity: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141C] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={txnForm.department}
                onChange={(e) => setTxnForm({ ...txnForm, department: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141C] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
              >
                <option value="OPERATIONS">Operations</option>
                <option value="FINANCE">Finance &amp; Treasury</option>
                <option value="HR">HR</option>
                <option value="EXECUTIVE">Executive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNewTxnModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Post Transaction
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
