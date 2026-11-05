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
} from "lucide-react";
import { StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TelemetryChart, RadialGauge } from "@/components/ui/TelemetryChart";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatBytes, timeAgo } from "@/lib/utils";

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
  treasuryMetrics = { totalInflow: 1250000, totalDisbursed: 295500, netBalance: 954500 },
  financialTransactions = [],
  approvals = [],
  corporateEmails = [],
  automationRules = [],
}: DepartmentDashboardViewProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  const isExecutive =
    currentUser.role === "SUPER_ADMIN" ||
    currentUser.department === "EXECUTIVE" ||
    currentUser.role === "ADMIN";

  const [activeTab, setActiveTab] = React.useState<
    "executive" | "approvals" | "communications" | "operations" | "finance" | "it"
  >(isExecutive ? "executive" : "operations");

  // Local state for interactive workflows
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

  const formatCurrency = (val: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Submit New Inter-Department Approval Request
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

  // Submit Decision on Approval (Approve / Reject)
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

      // If approved with amount, refresh transactions list
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

  // Send Corporate Outbound / Internal Email
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

  // Record Financial Transaction
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

  // Filter transactions
  const filteredTransactions = transactionsList.filter((t) => {
    if (txnFilter === "INFLOWS") return t.type === "CAPITAL_INFLOW";
    if (txnFilter === "DISBURSEMENTS") return t.type === "PROJECT_DISBURSEMENT";
    if (txnFilter === "CONTRACTORS") return t.type === "CONTRACTOR_PAYOUT";
    if (txnFilter === "PAYROLL") return t.type === "PAYROLL";
    return true;
  });

  // Filter approvals
  const filteredApprovals = approvalsList.filter((a) => {
    if (approvalFilter === "PENDING") return a.status === "PENDING";
    if (approvalFilter === "APPROVED") return a.status === "APPROVED";
    if (approvalFilter === "REJECTED") return a.status === "REJECTED";
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Navigation & Executive Department Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest uppercase text-slate-400">
              Automated Enterprise Command &amp; Workflows
            </span>
            {isExecutive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#ED2618] bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                <Crown className="h-3 w-3" />
                CEO Executive Level
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            {activeTab === "executive"
              ? "Managing Director & CEO Command Suite"
              : activeTab === "approvals"
              ? "Inter-Department Approvals & Automated Routing"
              : activeTab === "communications"
              ? "Operations Corporate Email & Messaging Hub"
              : activeTab === "operations"
              ? "Enterprise Operations & Infrastructure Logistics"
              : activeTab === "finance"
              ? "Capital Allocation & Treasury Management"
              : "Systems Infrastructure & IT Governance"}
          </h2>
        </div>

        {/* Tab Controls Bar */}
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
            <Crown className="h-3.5 w-3.5 text-[#ED2618]" />
            <span>MD / CEO Command</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("approvals")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "approvals"
                ? "bg-[#ED2618] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Approval Desk</span>
            {approvalsList.filter((a) => a.status === "PENDING").length > 0 && (
              <span className="h-4 w-4 rounded-full bg-white text-[#ED2618] text-[9px] font-black flex items-center justify-center">
                {approvalsList.filter((a) => a.status === "PENDING").length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("communications")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "communications"
                ? "bg-[#ED2618] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Corporate Emails</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("operations")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "operations"
                ? "bg-[#ED2618] text-white shadow-sm"
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
      {/* 1. MD / CEO EXECUTIVE COMMAND DASHBOARD */}
      {/* ===================================================================== */}
      {activeTab === "executive" && (
        <div className="space-y-6">
          {/* Executive Top Row Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Net Treasury Liquidity"
              value={formatCurrency(treasuryMetrics.netBalance)}
              icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
              trend={{
                value: "+$954k Settled",
                isPositive: true,
              }}
              description={`${formatCurrency(treasuryMetrics.totalInflow)} Inflow / ${formatCurrency(treasuryMetrics.totalDisbursed)} Outflow`}
            />

            <StatCard
              title="Gross Capital Pipeline"
              value={formatCurrency(executiveMetrics.grossPipelineValue)}
              icon={<Briefcase className="h-5 w-5 text-[#ED2618]" />}
              trend={{
                value: `${executiveMetrics.totalDeals} In-Flight Deals`,
                isPositive: true,
              }}
              description={`${executiveMetrics.totalClients} institutional investors`}
            />

            <StatCard
              title="Landmark Developments"
              value={executiveMetrics.developmentsCount}
              icon={<Building2 className="h-5 w-5 text-[#ED2618]" />}
              trend={{
                value: "Active Logistics",
                isPositive: true,
              }}
              description="Real estate site deliveries"
            />

            <StatCard
              title="Workflow Automations"
              value={automationRules.length}
              icon={<Zap className="h-5 w-5 text-blue-500" />}
              trend={{
                value: "Engine Online",
                isPositive: true,
              }}
              description="Active routing & notification triggers"
            />
          </div>

          {/* Quick Executive Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#12141C] border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Executive Command Active: Complete Operations &amp; Treasury Visibility
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href="/api/reports/executive?format=csv"
                download
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#ED2618] hover:text-[#ED2618] transition-all cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Executive Report (CSV)</span>
              </a>

              <Button
                size="sm"
                variant="primary"
                onClick={() => setNewTxnModalOpen(true)}
                leftIcon={<DollarSign className="h-3.5 w-3.5" />}
              >
                Record Treasury Action
              </Button>
            </div>
          </div>

          {/* CEO Operations Radar & Landmark Developments Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Operational Developments */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#12141C] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#ED2618]" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Operations Portfolio &amp; Site Deliveries
                  </h3>
                </div>
                <Badge variant="success">All Sites Active</Badge>
              </div>

              <div className="space-y-4">
                {[
                  {
                    name: "Eko Atlantic Horizon Tower",
                    location: "Coastal Boulevard, Lagos",
                    progress: 74,
                    budget: "$4.8M",
                    spent: "$3.4M",
                    status: "Foundation Complete & Core Rising",
                    contractor: "Lafarge & Horizon Civil",
                  },
                  {
                    name: "Lekki Peninsula Logistics Hub",
                    location: "Free Trade Zone, Lekki",
                    progress: 58,
                    budget: "$2.2M",
                    spent: "$1.3M",
                    status: "Structural Steel Frame Installation",
                    contractor: "GeoTech Africa Ltd",
                  },
                  {
                    name: "Victoria Island Institutional Core",
                    location: "Ozumba Mbadiwe Ave, VI",
                    progress: 92,
                    budget: "$3.5M",
                    spent: "$3.2M",
                    status: "Interior Fitout & Facade Glazing",
                    contractor: "Dexta Premier Fitouts",
                  },
                ].map((site, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {site.name}
                        </span>
                        <p className="text-[11px] text-slate-400">{site.location} &bull; {site.contractor}</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#ED2618]">
                        {site.spent} / {site.budget}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-semibold mb-1">
                        <span>{site.status}</span>
                        <span>{site.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-[#ED2618] rounded-full transition-all duration-500"
                          style={{ width: `${site.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow Automations Engine Status */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#12141C] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#ED2618]" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Automated Routing Rules
                  </h3>
                </div>
                <Badge variant="outline">SMTP Live</Badge>
              </div>

              <div className="space-y-3">
                {automationRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {rule.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Trigger: <code className="text-[#ED2618] font-mono">{rule.triggerEvent}</code> &bull; Action: {rule.actionType}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        {rule.executionCount}
                      </span>
                      <p className="text-[10px] text-slate-400 uppercase">Fired</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* All Financial Transactions Table (Enterprise Treasury Ledger) */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#12141C] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Enterprise Financial Transactions Ledger
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete audit log of capital inflows, operations disbursements, contractor settlements, and payroll.
                </p>
              </div>

              {/* Transaction Filter Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {(["ALL", "INFLOWS", "DISBURSEMENTS", "CONTRACTORS", "PAYROLL"] as const).map(
                  (f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setTxnFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer whitespace-nowrap ${
                        txnFilter === f
                          ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                      }`}
                    >
                      {f}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/70 dark:border-white/[0.06] text-slate-400 uppercase font-mono text-[10px]">
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Title &amp; Recipient</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No transactions recorded matching this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((txn) => {
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
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. INTER-DEPARTMENT APPROVALS & ROUTING HUB */}
      {/* ===================================================================== */}
      {activeTab === "approvals" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#12141C] border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Inter-Department Operational Approval Desk
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Submit requests between HR, Operations, Finance, and Executive with automated Mailpit notifications.
              </p>
            </div>

            <Button
              size="sm"
              variant="primary"
              onClick={() => setNewApprovalModalOpen(true)}
              leftIcon={<PlusCircle className="h-4 w-4" />}
            >
              New Inter-Department Request
            </Button>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1.5 border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
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

          {/* Approvals Grid / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApprovals.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-slate-400">
                <CheckCircle2 className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No approval requests found</p>
                <p className="text-[11px] text-slate-400">Submit a new request to start automated routing.</p>
              </div>
            ) : (
              filteredApprovals.map((appr) => {
                const isPending = appr.status === "PENDING";
                const isApproved = appr.status === "APPROVED";

                return (
                  <div
                    key={appr.id}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#12141C] shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-extrabold text-[#ED2618]">
                          {appr.ticketNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPending
                              ? "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/20"
                              : isApproved
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {appr.status}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {appr.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {appr.description}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] space-y-1 text-[11px]">
                        <div className="flex justify-between text-slate-400">
                          <span>Route:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
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
                            <span className="font-bold text-[#ED2618]">
                              {formatCurrency(appr.amount, appr.currency)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-400">
                          <span>Priority:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{appr.priority}</span>
                        </div>
                      </div>

                      {appr.decisionNotes && (
                        <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-white/[0.02] p-2 rounded-lg italic">
                          &ldquo;{appr.decisionNotes}&rdquo; &bull; {appr.approvedByName}
                        </div>
                      )}
                    </div>

                    {isPending ? (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                        <Button
                          size="sm"
                          variant="primary"
                          className="flex-1"
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
                          onClick={() => {
                            setSelectedApproval(appr);
                            setDecisionType("REJECTED");
                            setDecisionModalOpen(true);
                          }}
                        >
                          Decline
                        </Button>
                      </div>
                    ) : (
                      <div className="text-[10px] font-mono text-slate-400 text-right pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                        Decided {timeAgo(appr.decidedAt || appr.updatedAt)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. CORPORATE COMMUNICATIONS & EMAIL STUDIO */}
      {/* ===================================================================== */}
      {activeTab === "communications" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#12141C] border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Operations &amp; Inter-Department Email Dispatcher
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official outbound and inbound corporate messaging wired directly to SMTP Mailpit.
              </p>
            </div>

            <Button
              size="sm"
              variant="primary"
              onClick={() => setNewEmailModalOpen(true)}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Compose Corporate Email
            </Button>
          </div>

          {/* Email Messages Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#12141C] p-6 shadow-xs space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/70 dark:border-white/[0.06] text-slate-400 uppercase font-mono text-[10px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Direction</th>
                    <th className="py-2.5 px-3">Sender</th>
                    <th className="py-2.5 px-3">Recipient</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">SMTP Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {emailsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No corporate emails recorded yet. Send your first communication!
                      </td>
                    </tr>
                  ) : (
                    emailsList.map((eml) => (
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. OPERATIONS & INFRASTRUCTURE FLEET */}
      {/* ===================================================================== */}
      {activeTab === "operations" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Real Estate Developments"
              value={operationsMetrics.developmentsCount}
              icon={<Building2 className="h-5 w-5 text-[#ED2618]" />}
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
                  : `${operationsMetrics.pendingLeaves} On Leave`
              }
              icon={<Users className="h-5 w-5 text-emerald-500" />}
              trend={{
                value: "All Active",
                isPositive: true,
              }}
              description="Operations personnel on site"
            />
          </div>

          {/* Real 7-Day Operations Activity Chart */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#12141C] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Operational Activity Telemetry (Past 7 Days)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real audit log actions across site approvals, media uploads, and logistics.
                </p>
              </div>
              <Badge variant="success">Real-Time Telemetry</Badge>
            </div>

            <TelemetryChart data={weeklyActivityData} />
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. CAPITAL ALLOCATION & TREASURY */}
      {/* ===================================================================== */}
      {activeTab === "finance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Gross Pipeline Value"
              value={formatCurrency(financeMetrics.grossPipelineValue)}
              icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
              trend={{
                value: `${financeMetrics.totalDeals} Deals`,
                isPositive: true,
              }}
              description="Active client commitments"
            />

            <StatCard
              title="Average Deal Size"
              value={formatCurrency(financeMetrics.avgDealSize)}
              icon={<TrendingUp className="h-5 w-5 text-[#ED2618]" />}
              trend={{
                value: "Institutional",
                isPositive: true,
              }}
              description="Capital per engagement"
            />

            <StatCard
              title="Net Treasury Reserves"
              value={formatCurrency(treasuryMetrics.netBalance)}
              icon={<Briefcase className="h-5 w-5 text-blue-500" />}
              trend={{
                value: "+$954k",
                isPositive: true,
              }}
              description="Escrow & deployment reserves"
            />
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. SYSTEMS INFRASTRUCTURE & IT */}
      {/* ===================================================================== */}
      {activeTab === "it" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Zero-Trust MFA Enrollment"
              value={`${itMetrics.mfaPercent}%`}
              icon={<ShieldCheck className="h-5 w-5 text-emerald-500" />}
              trend={{
                value: `${itMetrics.mfaUsers} Enrolled`,
                isPositive: true,
              }}
              description="Staff multi-factor security"
            />

            <StatCard
              title="Connected Backends"
              value={`${itMetrics.healthyEndpoints} / ${itMetrics.totalEndpoints || 1}`}
              icon={<Radio className="h-5 w-5 text-[#ED2618]" />}
              trend={{
                value: `${itMetrics.backendLatency}ms`,
                isPositive: itMetrics.backendHealthy,
              }}
              description="Microservice health status"
            />

            <StatCard
              title="Intrusion Defense"
              value={itMetrics.openAlerts === 0 ? "SECURE" : `${itMetrics.openAlerts} Alerts`}
              icon={<ShieldAlert className="h-5 w-5 text-blue-500" />}
              trend={{
                value: "Zero Breaches",
                isPositive: true,
              }}
              description="Watchdog perimeter monitor"
            />
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
        description="Submit an operational request for authorization from another department. Dispatches automated email to Mailpit."
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
              placeholder="e.g. On-Site Inspection Clearance for Phase 2"
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
                <option value="OPERATIONS">Operations</option>
                <option value="HR">HR &amp; People</option>
                <option value="FINANCE">Finance &amp; Treasury</option>
                <option value="EXECUTIVE">Executive (MD / CEO)</option>
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
                <option value="CONTRACTOR_CLEARANCE">Contractor Clearance</option>
                <option value="BUDGET_DISBURSEMENT">Budget Disbursement</option>
                <option value="HEADCOUNT_HIRE">Headcount &amp; Offer</option>
                <option value="TRAVEL_EXPENSE">Travel &amp; Site Logistics</option>
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
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent (CEO Escalation)</option>
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
              placeholder="Provide complete context, contractor names, site references, or policy rationale..."
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
      {/* MODAL 2: DECIDE ON APPROVAL (APPROVE / REJECT) */}
      {/* ===================================================================== */}
      <Modal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title={`${decisionType === "APPROVED" ? "Authorize" : "Decline"} Request`}
        description={`Ticket ${selectedApproval?.ticketNumber}: ${selectedApproval?.title}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">From:</span>
              <span className="font-semibold">{selectedApproval?.requesterName} ({selectedApproval?.fromDepartment})</span>
            </div>
            {selectedApproval?.amount && (
              <div className="flex justify-between">
                <span className="text-slate-400">Disbursement:</span>
                <span className="font-bold text-[#ED2618]">{formatCurrency(selectedApproval.amount, selectedApproval.currency)}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Decision Comments / Conditions (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Enter instructions, disbursement conditions, or reason for decline..."
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
        description="Dispatch official operations communication. Wired directly to local SMTP Mailpit."
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
                placeholder="e.g. Operations Director"
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
              placeholder="e.g. Schedule Confirmation: Coastal Site Concrete Pouring"
              value={emailForm.subject}
              onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141C] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Message Body (HTML or Plain Text) *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Enter official correspondence text. Will be formatted with executive Dexta corporate styling..."
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
        description="Authorize and record a disbursement, capital inflow, or contractor payout to the enterprise ledger."
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
