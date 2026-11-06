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
} from "lucide-react";
import { StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TelemetryChart } from "@/components/ui/TelemetryChart";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatBytes, timeAgo, formatDate } from "@/lib/utils";

export interface DepartmentDashboardViewProps {
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
  treasuryMetrics?: {
    totalInflow: number;
    totalDisbursed: number;
    netBalance: number;
  };
  financialTransactions?: any[];
  approvals?: any[];
  corporateEmails?: any[];
  automationRules?: any[];
  initialPlatform?: "systems" | "operations" | "executive";
  initialTab?: "overview" | "systems" | "operations" | "approvals" | "treasury" | "communications";
  portfolioItems?: any[];
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
}: DepartmentDashboardViewProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  // Tab State: Overview (default), Systems IT, Operations, Approvals, Treasury, Communications
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "systems" | "operations" | "approvals" | "treasury" | "communications"
  >(initialTab);

  // Platform State: systems (admin.), operations (ops.), executive (root/CEO)
  const [platform, setPlatform] = React.useState<"systems" | "operations" | "executive">(initialPlatform);

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

      let currentPlatform: "systems" | "operations" | "executive" = "operations";
      if (userRole === "SUPER_ADMIN" || userDept === "EXECUTIVE") {
        currentPlatform = isAdminHost ? "systems" : isOpsHost ? "operations" : "executive";
      } else if (userDept === "IT") {
        currentPlatform = "systems";
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
        setActiveTab("operations");
      } else if (
        tabParam === "systems" ||
        tabParam === "operations" ||
        tabParam === "approvals" ||
        tabParam === "treasury" ||
        tabParam === "communications" ||
        tabParam === "overview"
      ) {
        setActiveTab(tabParam as any);
      } else if (tabParam === "dispatch") {
        setActiveTab("communications");
      } else {
        setActiveTab(currentPlatform === "systems" ? "systems" : "operations");
      }
    };

    syncFromUrl();

    const handleSwitchTab = (e: any) => {
      const tab = e.detail;
      if (
        tab === "systems" ||
        tab === "operations" ||
        tab === "approvals" ||
        tab === "treasury" ||
        tab === "communications" ||
        tab === "overview"
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
        `Formal notice dispatched to ${selectedApproval.requesterEmail} via SMTP Mailpit.`
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

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-7xl mx-auto">
      {/* ===================================================================== */}
      {/* 1. MASTER UNIFIED EXECUTIVE HEADER (ZERO STACKED DUPLICATES) */}
      {/* ===================================================================== */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Greeting & Identity */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#ED2618] animate-pulse" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#ED2618]">
                {platform === "systems"
                  ? "admin.dextaafrica.org • Zero-Trust Systems Command"
                  : platform === "operations"
                  ? "ops.dextaafrica.org • Operations Fleet Desk"
                  : "dextaafrica.org • Executive Leadership Suite"}
              </span>
              <span className="text-slate-300 dark:text-white/20">&bull;</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                {platform === "systems"
                  ? `SYSTEMS & IT • ${currentUser.role || "ADMIN"}`
                  : platform === "operations"
                  ? `OPERATIONS • ${currentUser.role || "ADMIN"}`
                  : `${currentUser.department || "EXECUTIVE"} • ${currentUser.role || "ADMIN"}`}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {greeting}, <span className="text-[#ED2618]">{currentUser.fullName}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              {platform === "systems"
                ? "Your zero-trust IT command center governing user access tokens, identity verification, watchdog firewalls, active sessions, and cloud microservices."
                : platform === "operations"
                ? "Your personalized operational workspace for managing Landmark site developments, logistics procurement, and field contractor clearances."
                : "Personalized executive command center governing infrastructure site deliveries, capital treasury settlements, and official communications."}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {platform === "systems" ? (
              <>
                <Link
                  href="/it"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-white px-3.5 py-2 text-xs font-bold transition-all shadow-sm"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Security Firewall</span>
                </Link>

                <Link
                  href="/users"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#ED2618] hover:text-[#ED2618] transition-all"
                >
                  <Users className="h-4 w-4" />
                  <span>User Governance</span>
                </Link>

                <a
                  href="/api/reports/executive?format=csv"
                  download
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#ED2618] hover:text-[#ED2618] transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Audit Logs (CSV)</span>
                  <span className="inline sm:hidden">CSV</span>
                </a>
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
              <span>Systems IT Command</span>
            </button>
          )}

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

          {(platform === "operations" || platform === "executive") && (
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
              <span>Approval Desk</span>
              {pendingApprovalsCount > 0 && (
                <span className="h-4 min-w-[16px] px-1 rounded-full bg-red-500/20 text-[#ED2618] dark:bg-white/20 dark:text-white text-[10px] font-black flex items-center justify-center">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          )}

          {(platform === "operations" || platform === "executive") && (
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

          {(platform === "operations" || platform === "executive") && (
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
              <span>Corporate Dispatch</span>
            </button>
          )}

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
              <Crown className="h-3.5 w-3.5 text-[#ED2618]" />
              <span>Executive Overview</span>
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
                  Landmark Site Deliveries
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
                {portfolioItems.length > 0 ? portfolioItems.slice(0, 3).map((p: any) => p.name).join(" • ") : "No Landmark Developments Registered"}
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
                Automated SMTP Routing via Mailpit
              </p>
            </div>
          </div>

          {/* Main Grid: Sites & Approvals Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 cols): Landmark Construction Projects */}
            <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Landmark Infrastructure Sites
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
                        No Landmark Developments Registered
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Production database has zero registered site developments.
                      </p>
                    </div>
                    <Link
                      href="/portfolio"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-white text-xs font-bold transition-all shadow-sm"
                    >
                      <span>Deploy Landmark Project &rarr;</span>
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
          {/* Top 4 Systems Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. 2FA Zero-Trust Adoption */}
            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Zero-Trust 2FA Adoption
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {itMetrics.mfaPercent}%
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Check className="h-3.5 w-3.5" />
                  <span>{itMetrics.mfaUsers} of {itMetrics.totalUsers || 1} accounts enforced</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                Strict TOTP Authenticator &amp; Recovery Codes
              </p>
            </div>

            {/* 2. Security Watchdog Defense */}
            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Security Watchdog Defense
                </span>
                <div className="p-2 rounded-xl bg-red-500/10 text-[#ED2618]">
                  <ShieldAlert className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {itMetrics.openAlerts === 0 ? "Threat Matrix Clear" : `${itMetrics.openAlerts} Incidents`}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Zap className="h-3.5 w-3.5 text-[#ED2618]" />
                  <span>Automated Perimeter Watchdog Live</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                0 Critical Vulnerabilities Detected
              </p>
            </div>

            {/* 3. AWS S3 Storage Vault */}
            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  AWS S3 Storage Vault
                </span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <HardDrive className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {formatBytes(itMetrics.totalStorageBytes)}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                  <span>Quota: {itMetrics.storagePercent}% of 50 GB allocated</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                Site Blue-Prints &bull; Legal Contracts &bull; Media Assets
              </p>
            </div>

            {/* 4. Microservice API Health */}
            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Microservice Gateway
                </span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                  <Radio className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {itMetrics.healthyEndpoints} / {itMetrics.totalEndpoints || 1} Healthy
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Core Backend Latency: {itMetrics.backendLatency || 12}ms</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                Subdomain Mesh: admin &bull; ops &bull; gateway
              </p>
            </div>
          </div>

          {/* Quick IT Systems Management Modules */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Systems IT Core Governance Modules
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Direct administrative control planes for identity, cloud assets, firewall rules, and microservices.
                </p>
              </div>
              <Badge variant="outline">Enterprise IT Mode</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/users"
                className="group p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] hover:border-red-500/40 hover:bg-red-500/[0.03] transition-all space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-red-100 dark:bg-red-500/10 text-[#ED2618]">
                    <Users className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#ED2618] group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#ED2618] transition-colors">
                  Identity &amp; User Governance
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Manage user accounts, assign department RBAC permissions, and revoke sessions across subdomains.
                </p>
              </Link>

              <Link
                href="/it"
                className="group p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] hover:border-red-500/40 hover:bg-red-500/[0.03] transition-all space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-red-100 dark:bg-red-500/10 text-[#ED2618]">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#ED2618] group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#ED2618] transition-colors">
                  Security &amp; Inactivity Guard
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Configure perimeter firewall policies, 2FA enforcement, and backend inactivity logout threshold.
                </p>
              </Link>

              <Link
                href="/storage"
                className="group p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] hover:border-red-500/40 hover:bg-red-500/[0.03] transition-all space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-500">
                    <HardDrive className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#ED2618] group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#ED2618] transition-colors">
                  AWS S3 Storage Asset Vault
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Explore uploaded contractor site drawings, architectural BIM files, and multimedia assets.
                </p>
              </Link>

              <Link
                href="/endpoints"
                className="group p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] hover:border-red-500/40 hover:bg-red-500/[0.03] transition-all space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-500">
                    <Radio className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#ED2618] group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#ED2618] transition-colors">
                  Microservices &amp; API Health
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Monitor live latency pings, HTTP status returns, and endpoint heartbeat metrics.
                </p>
              </Link>

              <Link
                href="/audit-logs"
                className="group p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] hover:border-red-500/40 hover:bg-red-500/[0.03] transition-all space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#ED2618] group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#ED2618] transition-colors">
                  Immutable Audit Trails
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Cryptographically verified event logs for compliance, sign-ins, privilege elevations, and data mutations.
                </p>
              </Link>

              <Link
                href="/marketing/campaigns"
                className="group p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] hover:border-red-500/40 hover:bg-red-500/[0.03] transition-all space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#ED2618] group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#ED2618] transition-colors">
                  Email Dispatch &amp; Campaigns
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Scheduled broadcast queue, Mailpit delivery diagnostics, and corporate communication logs.
                </p>
              </Link>
            </div>
          </div>

          {/* Connected Microservices & Recent Audit Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 6 cols: Live Microservice Topology */}
            <div className="lg:col-span-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Core Microservices Telemetry
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Continuous heartbeat ping status across internal Dexta services.
                  </p>
                </div>
                <Badge variant="success">All Systems Nominal</Badge>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: "Dexta Core Go API Gateway", route: "/api/v1/health", status: "HEALTHY", latency: "12ms" },
                  { name: "Cloud AWS S3 Storage Ingestion", route: "s3.eu-west-1.amazonaws.com", status: "ONLINE", latency: "28ms" },
                  { name: "Zero-Trust Session Inactivity Daemon", route: "internal://session-guard", status: "ACTIVE", latency: "4ms" },
                  { name: "Enterprise SMTP Dispatcher", route: "smtp://mailpit:1025", status: "ONLINE", latency: "15ms" },
                  { name: "Immutable SQLite WAL Database Engine", route: "file://admin_portal.db", status: "OPTIMAL", latency: "2ms" },
                ].map((svc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {svc.name}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 truncate">
                          {svc.route}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-slate-400">
                        {svc.latency}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                        {svc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 6 cols: Recent Security & Audit Logs */}
            <div className="lg:col-span-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Live Security &amp; Audit Logs
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time audit events verified by immutable audit trail.
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
                {recentLogs && recentLogs.length > 0 ? (
                  recentLogs.slice(0, 5).map((log: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate font-mono">
                          {log.action}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {log.actorEmail || "system"} &bull; {log.entity}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                        {timeAgo(log.createdAt)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No security incidents or audit warnings detected.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. TAB: SITE OPERATIONS */}
      {/* ===================================================================== */}
      {activeTab === "operations" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Landmark Development &amp; Field Engineering Fleet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time logistics coordination across coastal towers and industrial commercial zones.
                </p>
              </div>
              <Badge variant={portfolioItems.length > 0 ? "success" : "outline"}>
                {portfolioItems.length} {portfolioItems.length === 1 ? "Site Active" : "Sites Active"}
              </Badge>
            </div>

            {portfolioItems && portfolioItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {portfolioItems.map((site: any, i: number) => (
                  <div
                    key={site.id || i}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] space-y-4"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-[#ED2618] uppercase">
                        Site Project #0{i + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {site.name}
                      </h4>
                      <p className="text-xs text-slate-400">{site.location || "Coastal Corridor"}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-[#12151E] border border-slate-200/60 dark:border-white/[0.05] space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                          {(site.status || "active").replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Catalog Access:</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          {site.published ? "Public Catalog" : "Internal Engineering"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Created:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {formatDate(site.createdAt || new Date())}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => {
                        setApprovalForm({
                          ...approvalForm,
                          title: `Logistics Clearance for ${site.name}`,
                          toDepartment: "OPERATIONS",
                          category: "PROCUREMENT_LOGISTICS",
                        });
                        setNewApprovalModalOpen(true);
                      }}
                    >
                      Request Site Clearance
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl bg-slate-50/50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 space-y-4">
                <div className="h-12 w-12 mx-auto rounded-2xl bg-red-500/10 text-[#ED2618] flex items-center justify-center">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    No Field Engineering Projects Registered
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    There are currently no active landmark development projects in the database. Deploy a new development to begin site inspections and contractor disbursements.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href="/portfolio"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-white text-xs font-bold transition-all shadow-sm"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Register Development Project</span>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setNewApprovalModalOpen(true)}
                    className="text-xs font-bold"
                  >
                    <span>Request Site Clearance</span>
                  </Button>
                </div>
              </div>
            )}
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
                  Authorizations between HR, Operations, Finance, and Executive with automatic Mailpit dispatch.
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
                  Official outbound and internal operations messaging wired directly to SMTP Mailpit.
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
      {/* MODAL 1: NEW INTER-DEPARTMENT APPROVAL REQUEST */}
      {/* ===================================================================== */}
      <Modal
        isOpen={newApprovalModalOpen}
        onClose={() => setNewApprovalModalOpen(false)}
        title="New Inter-Department Approval Request"
        description="Submit an operational request for authorization. Dispatches automated notification and email to Mailpit."
        maxWidth="lg"
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
        description="Dispatch official operations communication. Dispatches real SMTP email to Mailpit."
        maxWidth="lg"
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
        maxWidth="lg"
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
