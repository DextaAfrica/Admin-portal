"use client";

import * as React from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  UserCheck,
  Users,
  LogOut,
  LogIn,
  Clock,
  Calendar,
  Building2,
  Search,
  Download,
  Printer,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Eye,
  ShieldCheck,
  BarChart3,
  CheckCircle2,
  QrCode,
  Mail,
  Send,
  FileSpreadsheet,
  Trash2,
  CalendarClock,
  AlertCircle,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { VISIT_PURPOSES, VISIT_DEPARTMENTS } from "@/lib/visitors/constants";
import { cn } from "@/lib/utils";

interface VisitorRecord {
  id: string;
  passCode: string;
  fullName: string;
  phone: string;
  email: string;
  company: string;
  position: string;
  purpose: string;
  purposeOther: string;
  hostName: string;
  department: string;
  hasAppointment: boolean;
  invitedBy: string;
  visitDescription: string;
  visitDate: string;
  checkInAt: string;
  checkOutAt: string | null;
  status: "checked_in" | "checked_out";
  agreedGuidelines: boolean;
  consentedData: boolean;
  declaredAt: string;
  checkedOutBy: string;
}

interface CountItem {
  label: string;
  count: number;
}

interface VisitorAnalytics {
  totalToday: number;
  currentlyOnSite: number;
  checkedOutToday: number;
  scheduledToday: number;
  walkInToday: number;
  totalAllTime: number;
  byDepartment: CountItem[];
  byPurpose: CountItem[];
  hourlyArrivals: CountItem[];
}

interface VisitorReportSchedule {
  id: string;
  title: string;
  cadence: "WEEKLY" | "MONTHLY";
  recipientEmails: string[];
  department: string;
  includeAllDepts: boolean;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt: string;
}

interface VisitorReportDelivery {
  id: string;
  title: string;
  cadence: "WEEKLY" | "MONTHLY";
  recipientEmails: string[];
  periodStart: string;
  periodEnd: string;
  totalVisitors: number;
  status: "SENT" | "FAILED";
  errorMessage?: string;
  sentAt: string;
}

function formatDuration(checkInAt: string, checkOutAt: string | null): string {
  const start = new Date(checkInAt).getTime();
  const end = checkOutAt ? new Date(checkOutAt).getTime() : Date.now();
  const mins = Math.max(0, Math.floor((end - start) / 60000));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export default function AdminVisitorsPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [visitors, setVisitors] = React.useState<VisitorRecord[]>([]);
  const [analytics, setAnalytics] = React.useState<VisitorAnalytics | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [statusFilter, setStatusFilter] = React.useState<"all" | "checked_in" | "checked_out">("all");
  const [deptFilter, setDeptFilter] = React.useState<string>("all");
  const [dateFilter, setDateFilter] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [copiedLink, setCopiedLink] = React.useState(false);

  const [selectedVisitor, setSelectedVisitor] = React.useState<VisitorRecord | null>(null);
  const [checkingOutId, setCheckingOutId] = React.useState<string | null>(null);

  // Reception QR Poster Modal
  const [qrModalOpen, setQrModalOpen] = React.useState(false);
  const [kioskQrUrl, setKioskQrUrl] = React.useState("");

  // Automated Report Modal & State
  const [reportModalOpen, setReportModalOpen] = React.useState(false);
  const [reportSchedule, setReportSchedule] = React.useState<VisitorReportSchedule>({
    id: "default",
    title: "Visitor Check-in Digest",
    cadence: "WEEKLY",
    recipientEmails: ["operations@dextaafrica.com"],
    department: "ALL",
    includeAllDepts: true,
    isActive: true,
    nextRunAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const [reportDeliveries, setReportDeliveries] = React.useState<VisitorReportDelivery[]>([]);
  const [isLoadingReports, setIsLoadingReports] = React.useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = React.useState(false);
  const [isTriggeringReport, setIsTriggeringReport] = React.useState(false);
  const [recipientEmailInput, setRecipientEmailInput] = React.useState("");

  const loadReportScheduleAndHistory = React.useCallback(async () => {
    setIsLoadingReports(true);
    try {
      const [schedRes, delivRes] = await Promise.all([
        fetch("/api/visitors/report-schedule", { cache: "no-store" }),
        fetch("/api/visitors/report-deliveries", { cache: "no-store" }),
      ]);
      if (schedRes.ok) {
        const d = await schedRes.json();
        if (d.schedule) setReportSchedule(d.schedule);
      }
      if (delivRes.ok) {
        const d = await delivRes.json();
        setReportDeliveries(d.deliveries || []);
      }
    } catch {
      toastError("Error", "Failed to load automated report configuration.");
    } finally {
      setIsLoadingReports(false);
    }
  }, [toastError]);

  const handleSaveReportSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportSchedule) return;
    if (reportSchedule.recipientEmails.length === 0) {
      toastError("Validation Error", "Please assign at least one recipient email address.");
      return;
    }
    setIsSavingSchedule(true);
    try {
      const res = await fetch("/api/visitors/report-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportSchedule),
      });
      const data = await res.json();
      if (!res.ok) {
        toastError("Save Failed", data.error || "Could not save report schedule.");
        return;
      }
      setReportSchedule(data.schedule);
      toastSuccess("Schedule Saved", "Automated visitor report configuration saved successfully.");
    } catch {
      toastError("Error", "Network error updating schedule.");
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleTriggerReportNow = async () => {
    setIsTriggeringReport(true);
    try {
      const res = await fetch("/api/visitors/report-schedule/trigger", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toastError("Dispatch Error", data.error || "Failed to trigger report delivery.");
        return;
      }
      toastSuccess(
        "Report Dispatched",
        `Visitor check-in digest dispatched to ${reportSchedule.recipientEmails.join(", ")}.`
      );
      await loadReportScheduleAndHistory();
    } catch {
      toastError("Error", "Failed to dispatch automated report.");
    } finally {
      setIsTriggeringReport(false);
    }
  };

  const handleAddRecipient = () => {
    const email = recipientEmailInput.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toastError("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (reportSchedule.recipientEmails.includes(email)) {
      toastError("Duplicate", "This email address is already in the recipient list.");
      return;
    }
    setReportSchedule({
      ...reportSchedule,
      recipientEmails: [...reportSchedule.recipientEmails, email],
    });
    setRecipientEmailInput("");
  };

  const handleRemoveRecipient = (emailToRemove: string) => {
    if (reportSchedule.recipientEmails.length <= 1) {
      toastError("Minimum Required", "At least one recipient email address must be maintained.");
      return;
    }
    setReportSchedule({
      ...reportSchedule,
      recipientEmails: reportSchedule.recipientEmails.filter((e) => e !== emailToRemove),
    });
  };

  React.useEffect(() => {
    if (!qrModalOpen || typeof window === "undefined") return;
    const visitUrl = `${window.location.origin}/visit`;
    QRCode.toDataURL(visitUrl, {
      width: 480,
      margin: 2,
      color: { dark: "#070A0F", light: "#FFFFFF" },
    })
      .then(setKioskQrUrl)
      .catch(() => setKioskQrUrl(""));
  }, [qrModalOpen]);

  // Assisted Front-Desk Check-In Modal
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [addSubmitting, setAddSubmitting] = React.useState(false);
  const [formState, setFormState] = React.useState({
    fullName: "",
    phone: "",
    email: "",
    company: "",
    position: "",
    purpose: "Business Meeting",
    purposeOther: "",
    hostName: "",
    department: "Operations & Administration",
    hasAppointment: true,
    invitedBy: "",
    visitDescription: "",
    agreedGuidelines: true,
    consentedData: true,
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (statusFilter !== "all") sp.set("status", statusFilter);
      if (deptFilter !== "all") sp.set("department", deptFilter);
      if (dateFilter) sp.set("date", dateFilter);
      if (searchQuery.trim()) sp.set("q", searchQuery.trim());

      const [listRes, analyticsRes] = await Promise.all([
        fetch(`/api/visitors?${sp.toString()}`, { cache: "no-store" }),
        fetch("/api/visitors/analytics", { cache: "no-store" }),
      ]);

      if (listRes.ok) {
        const d = await listRes.json();
        setVisitors(d.visitors || []);
      }
      if (analyticsRes.ok) {
        const a = await analyticsRes.json();
        setAnalytics(a.analytics || null);
      }
    } catch {
      toastError("Error", "Failed to load visitor records.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, deptFilter, dateFilter, searchQuery, toastError]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdminCheckOut = async (visitor: VisitorRecord) => {
    setCheckingOutId(visitor.id);
    try {
      const res = await fetch(`/api/visitors/${visitor.id}/check-out`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        toastError("Check-Out Failed", data.error || "Could not check out visitor.");
        return;
      }
      toastSuccess("Checked Out", `${visitor.fullName} has been checked out.`);
      if (selectedVisitor?.id === visitor.id) {
        setSelectedVisitor(data.visitor);
      }
      await loadData();
    } catch {
      toastError("Error", "Network error during check-out.");
    } finally {
      setCheckingOutId(null);
    }
  };

  const handleAssistedCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSubmitting(true);
    try {
      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      const data = await res.json();
      if (!res.ok) {
        toastError("Validation Error", data.error || "Please check visitor details.");
        return;
      }
      toastSuccess("Visitor Checked In", `Pass ${data.visitor.passCode} issued.`);
      setAddModalOpen(false);
      setFormState({
        fullName: "",
        phone: "",
        email: "",
        company: "",
        position: "",
        purpose: "Business Meeting",
        purposeOther: "",
        hostName: "",
        department: "Operations & Administration",
        hasAppointment: true,
        invitedBy: "",
        visitDescription: "",
        agreedGuidelines: true,
        consentedData: true,
      });
      await loadData();
    } catch {
      toastError("Error", "Failed to register visitor.");
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleCopyKioskLink = () => {
    const url = `${window.location.origin}/visit`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toastSuccess("Link Copied", "Visitor Check-In Portal URL copied to clipboard.");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const exportCsvUrl = React.useMemo(() => {
    const sp = new URLSearchParams();
    if (statusFilter !== "all") sp.set("status", statusFilter);
    if (deptFilter !== "all") sp.set("department", deptFilter);
    if (dateFilter) sp.set("date", dateFilter);
    if (searchQuery.trim()) sp.set("q", searchQuery.trim());
    return `/api/visitors/export?${sp.toString()}`;
  }, [statusFilter, deptFilter, dateFilter, searchQuery]);

  const maxDeptCount = Math.max(
    1,
    ...(analytics?.byDepartment.map((d) => d.count) || [1])
  );
  const maxPurposeCount = Math.max(
    1,
    ...(analytics?.byPurpose.map((p) => p.count) || [1])
  );
  const maxHourCount = Math.max(
    1,
    ...(analytics?.hourlyArrivals?.map((h) => h.count) || [1])
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[11px] font-bold text-[#ED2618] mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ED2618] animate-pulse" />
            <span>Reception &amp; Premises Security</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Visitor Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor live on-premises guests, manage check-ins &amp; departures, and export compliance logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            type="button"
            onClick={handleCopyKioskLink}
            className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111520] text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#ED2618] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedLink ? "Copied" : "Copy Check-In Link"}</span>
          </button>

          <Link
            href="/visit"
            target="_blank"
            className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111520] text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#ED2618] transition-all flex items-center gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#ED2618]" />
            <span>Open Kiosk</span>
          </Link>

          <button
            type="button"
            onClick={() => setQrModalOpen(true)}
            className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111520] text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#ED2618] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="h-3.5 w-3.5 text-[#ED2618]" />
            <span>Reception QR</span>
          </button>

          <a
            href={exportCsvUrl}
            className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111520] text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#ED2618] transition-all flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </a>

          <button
            type="button"
            onClick={() => {
              setReportModalOpen(true);
              void loadReportScheduleAndHistory();
            }}
            className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111520] text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#ED2618] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5 text-[#ED2618]" />
            <span>Automated Reports</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111520] text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#ED2618] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-white text-xs font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Check In Visitor</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Currently On-Premises
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black font-mono text-slate-900 dark:text-white">
            {analytics?.currentlyOnSite ?? 0}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            Active Checked-In Passes
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Visitors Today
            </span>
            <div className="h-9 w-9 rounded-xl bg-red-500/10 text-[#ED2618] flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black font-mono text-slate-900 dark:text-white">
            {analytics?.totalToday ?? 0}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Total arrivals recorded today
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Checked Out Today
            </span>
            <div className="h-9 w-9 rounded-xl bg-slate-500/10 text-slate-500 flex items-center justify-center">
              <LogOut className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black font-mono text-slate-900 dark:text-white">
            {analytics?.checkedOutToday ?? 0}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Completed departures today
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Scheduled vs Walk-In
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black font-mono text-slate-900 dark:text-white">
            {analytics?.scheduledToday ?? 0}{" "}
            <span className="text-base font-semibold text-slate-400">
              / {analytics?.walkInToday ?? 0}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Scheduled appointments vs walk-ins
          </p>
        </div>
      </div>

      {/* Analytics Visuals */}
      {analytics && (analytics.byDepartment.length > 0 || analytics.byPurpose.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#ED2618]" />
                <span>Visits by Department</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                {analytics.totalAllTime} Total
              </span>
            </div>
            <div className="space-y-3">
              {analytics.byDepartment.slice(0, 6).map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                      {item.label}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {item.count}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#ED2618] to-rose-400"
                      style={{ width: `${Math.round((item.count / maxDeptCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                <span>Purpose of Visit Breakdown</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">All Visits</span>
            </div>
            <div className="space-y-3">
              {analytics.byPurpose.slice(0, 6).map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                      {item.label}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {item.count}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: `${Math.round((item.count / maxPurposeCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Peak Arrival Hours</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">Hourly</span>
            </div>
            {analytics.hourlyArrivals && analytics.hourlyArrivals.length > 0 ? (
              <div className="space-y-3">
                {analytics.hourlyArrivals.slice(0, 6).map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                        {item.label}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {item.count}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-400"
                        style={{ width: `${Math.round((item.count / maxHourCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                Hourly arrival trends will appear as guests check in.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filter Bar & Visitor Ledger */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.06] flex flex-col lg:flex-row lg:items-center justify-between gap-3 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "checked_in", "checked_out"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  statusFilter === st
                    ? "bg-[#ED2618] text-white"
                    : "bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                )}
              >
                {st === "all"
                  ? "All Visitors"
                  : st === "checked_in"
                  ? "Checked In"
                  : "Checked Out"}
              </button>
            ))}

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-8 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Departments</option>
              {VISIT_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-8 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 text-xs font-medium text-slate-700 dark:text-slate-200"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, pass, company, host..."
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#ED2618]"
              />
            </div>
            <button
              type="button"
              onClick={loadData}
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-[#ED2618] cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.06] text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/70 dark:bg-white/[0.02]">
                <th className="py-3.5 px-4">Pass &amp; Visitor</th>
                <th className="py-3.5 px-4">Company &amp; Role</th>
                <th className="py-3.5 px-4">Purpose &amp; Host</th>
                <th className="py-3.5 px-4">Arrival &amp; Departure</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs">
              {visitors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {loading
                      ? "Loading visitor records..."
                      : "No visitor records match the current filters."}
                  </td>
                </tr>
              ) : (
                visitors.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200">
                          {v.passCode}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {v.fullName}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {v.phone} &bull; {v.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {v.company || "Individual Visitor"}
                      </p>
                      {v.position && (
                        <p className="text-[11px] text-slate-400">{v.position}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {v.purpose === "Other" && v.purposeOther
                          ? v.purposeOther
                          : v.purpose}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Seeing: <strong className="text-slate-700 dark:text-slate-300">{v.hostName}</strong> ({v.department})
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="text-slate-800 dark:text-slate-200 font-semibold">
                        {v.visitDate}
                      </div>
                      <div className="text-emerald-600 dark:text-emerald-400">
                        In:{" "}
                        {new Date(v.checkInAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {v.checkOutAt && (
                        <div className="text-slate-400">
                          Out:{" "}
                          {new Date(v.checkOutAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Duration: {formatDuration(v.checkInAt, v.checkOutAt)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {v.status === "checked_in" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Checked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                          Checked Out
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right print:hidden">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedVisitor(v)}
                          className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {v.status === "checked_in" && (
                          <button
                            type="button"
                            onClick={() => handleAdminCheckOut(v)}
                            disabled={checkingOutId === v.id}
                            className="px-3 py-1.5 rounded-lg bg-[#ED2618] hover:bg-[#d01f12] text-white text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            <LogOut className="h-3 w-3" />
                            <span>{checkingOutId === v.id ? "..." : "Check Out"}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visitor Detail Modal */}
      <Modal
        isOpen={Boolean(selectedVisitor)}
        onClose={() => setSelectedVisitor(null)}
        title={selectedVisitor ? `Visitor Pass • ${selectedVisitor.passCode}` : "Visitor Details"}
      >
        {selectedVisitor && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
              <div>
                <span className="text-slate-400 block">Full Name</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedVisitor.fullName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Visit Status</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedVisitor.status === "checked_in" ? "Checked In" : "Checked Out"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Phone</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedVisitor.phone}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Email</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedVisitor.email}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Company</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedVisitor.company || "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Position</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedVisitor.position || "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Seeing / Host</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedVisitor.hostName} ({selectedVisitor.department})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Appointment</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedVisitor.hasAppointment
                    ? `Scheduled${selectedVisitor.invitedBy ? ` (${selectedVisitor.invitedBy})` : ""}`
                    : "Walk-In"}
                </span>
              </div>
            </div>

            {selectedVisitor.visitDescription && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
                <span className="text-slate-400 block mb-1">Visit Description</span>
                <p className="text-slate-800 dark:text-slate-200">
                  {selectedVisitor.visitDescription}
                </p>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>Guidelines Agreed &amp; Data Consent Confirmed</span>
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>

            {selectedVisitor.status === "checked_in" && (
              <button
                type="button"
                onClick={() => handleAdminCheckOut(selectedVisitor)}
                disabled={checkingOutId === selectedVisitor.id}
                className="w-full h-11 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-white font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Record Departure &amp; Check Out</span>
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Assisted Front-Desk Check-In Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Front-Desk Assisted Check-In"
      >
        <form onSubmit={handleAssistedCheckIn} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formState.fullName}
                onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={formState.phone}
                onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Company / Organisation</label>
              <input
                type="text"
                value={formState.company}
                onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Position / Designation</label>
              <input
                type="text"
                value={formState.position}
                onChange={(e) => setFormState({ ...formState, position: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Purpose of Visit *</label>
              <select
                value={formState.purpose}
                onChange={(e) => setFormState({ ...formState, purpose: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3"
              >
                {VISIT_PURPOSES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Department *</label>
              <select
                value={formState.department}
                onChange={(e) => setFormState({ ...formState, department: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3"
              >
                {VISIT_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Who are they here to see? *</label>
              <input
                type="text"
                required
                value={formState.hostName}
                onChange={(e) => setFormState({ ...formState, hostName: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Scheduled Appointment?</label>
              <select
                value={formState.hasAppointment ? "yes" : "no"}
                onChange={(e) =>
                  setFormState({ ...formState, hasAppointment: e.target.value === "yes" })
                }
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3"
              >
                <option value="yes">Yes (Scheduled)</option>
                <option value="no">No (Walk-In)</option>
              </select>
            </div>
            {formState.purpose === "Other" && (
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Specify Purpose *</label>
                <input
                  type="text"
                  required
                  value={formState.purposeOther}
                  onChange={(e) => setFormState({ ...formState, purposeOther: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3"
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Invited / Scheduled By (optional)</label>
              <input
                type="text"
                value={formState.invitedBy}
                onChange={(e) => setFormState({ ...formState, invitedBy: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={addSubmitting}
            className="w-full h-11 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-white font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            <span>{addSubmitting ? "Checking In..." : "Check In Visitor"}</span>
          </button>
        </form>
      </Modal>

      {/* Reception QR Standee Modal */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Reception Desk QR Check-In"
      >
        <div className="space-y-4 text-center p-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Visitors can scan this QR code at the reception desk to check in or check out on their phone.
          </p>
          {kioskQrUrl ? (
            <div className="inline-block rounded-3xl bg-white p-5 border border-slate-200 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={kioskQrUrl} alt="Reception Check-In QR" className="h-56 w-56 mx-auto" />
              <p className="mt-3 text-xs font-extrabold tracking-wide text-slate-900 uppercase">
                Dexta Africa Reception
              </p>
              <p className="text-[11px] text-slate-500">Scan to Check In / Check Out</p>
            </div>
          ) : (
            <div className="py-10 text-xs text-slate-400">Generating QR Code...</div>
          )}
          <div className="flex items-center justify-center gap-3 pt-2">
            {kioskQrUrl && (
              <a
                href={kioskQrUrl}
                download="dexta-reception-qr.png"
                className="px-4 py-2.5 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download QR PNG</span>
              </a>
            )}
            <button
              type="button"
              onClick={handleCopyKioskLink}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              Copy Kiosk Link
            </button>
          </div>
        </div>
      </Modal>

      {/* Automated Visitor Check-In Reports Modal */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Automated Visitor Check-In Reports"
      >
        <div className="space-y-6 text-xs max-h-[75vh] overflow-y-auto p-1 pr-2">
          {/* Status Banner */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    reportSchedule.isActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  )}
                />
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  {reportSchedule.isActive ? "Recurring Cron Active" : "Schedule Paused"}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#ED2618]/10 text-[#ED2618]">
                  {reportSchedule.cadence}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Next automated delivery:{" "}
                <span className="font-mono text-slate-700 dark:text-slate-200 font-semibold">
                  {new Date(reportSchedule.nextRunAt).toLocaleString()}
                </span>
              </p>
            </div>

            <button
              type="button"
              disabled={isTriggeringReport}
              onClick={handleTriggerReportNow}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              <Send className={cn("h-3.5 w-3.5", isTriggeringReport && "animate-spin")} />
              <span>{isTriggeringReport ? "Sending Digest..." : "Send Report Now"}</span>
            </button>
          </div>

          {/* Schedule Configuration Form */}
          <form onSubmit={handleSaveReportSchedule} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Report Cadence *
                </label>
                <select
                  value={reportSchedule.cadence}
                  onChange={(e) =>
                    setReportSchedule({
                      ...reportSchedule,
                      cadence: e.target.value as "WEEKLY" | "MONTHLY",
                    })
                  }
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 text-xs"
                >
                  <option value="WEEKLY">Weekly Digest (Past 7 Days)</option>
                  <option value="MONTHLY">Monthly Digest (Past 30 Days)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Automation Status *
                </label>
                <select
                  value={reportSchedule.isActive ? "active" : "paused"}
                  onChange={(e) =>
                    setReportSchedule({
                      ...reportSchedule,
                      isActive: e.target.value === "active",
                    })
                  }
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 text-xs"
                >
                  <option value="active">Active (Automated dispatch enabled)</option>
                  <option value="paused">Paused (Manual triggers only)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Department Scope *
                </label>
                <select
                  value={reportSchedule.includeAllDepts ? "ALL" : reportSchedule.department}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "ALL") {
                      setReportSchedule({
                        ...reportSchedule,
                        includeAllDepts: true,
                        department: "ALL",
                      });
                    } else {
                      setReportSchedule({
                        ...reportSchedule,
                        includeAllDepts: false,
                        department: val,
                      });
                    }
                  }}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 text-xs"
                >
                  <option value="ALL">All Departments (Comprehensive Facility Log)</option>
                  {VISIT_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept} only
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recipient Emails */}
            <div>
              <label className="block font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Assigned Recipient Emails ({reportSchedule.recipientEmails.length}) *
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 mb-2 min-h-11">
                {reportSchedule.recipientEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[11px] font-mono text-slate-800 dark:text-slate-200"
                  >
                    <Mail className="h-3 w-3 text-[#ED2618]" />
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient(email)}
                      className="text-slate-400 hover:text-red-500 cursor-pointer ml-1"
                      title="Remove recipient"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={recipientEmailInput}
                  onChange={(e) => setRecipientEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddRecipient();
                    }
                  }}
                  placeholder="Enter email address (e.g. security@dextaafrica.com)..."
                  className="flex-1 h-9 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddRecipient}
                  className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-bold hover:border-[#ED2618] transition-all cursor-pointer"
                >
                  + Add Email
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingSchedule}
              className="w-full h-11 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-white font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all shadow-md shadow-red-500/20"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSavingSchedule ? "Saving Settings..." : "Save Report Schedule"}</span>
            </button>
          </form>

          {/* Deliveries Audit Log */}
          <div className="border-t border-slate-200 dark:border-white/10 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                <CalendarClock className="h-4 w-4 text-[#ED2618]" />
                <span>Recent Report Deliveries Ledger</span>
              </h3>
              <button
                type="button"
                onClick={loadReportScheduleAndHistory}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Refresh delivery logs"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isLoadingReports && "animate-spin")} />
              </button>
            </div>

            {reportDeliveries.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center text-slate-400 text-xs">
                No reports delivered yet. Use &quot;Send Report Now&quot; above to trigger an initial check-in digest.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10 text-slate-500">
                      <th className="py-2.5 px-3">Date Sent</th>
                      <th className="py-2.5 px-3">Cadence</th>
                      <th className="py-2.5 px-3">Visitors</th>
                      <th className="py-2.5 px-3">Recipients</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {reportDeliveries.slice(0, 5).map((d) => (
                      <tr key={d.id}>
                        <td className="py-2 px-3 font-mono">
                          {new Date(d.sentAt).toLocaleDateString()} {new Date(d.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-2 px-3 font-semibold">{d.cadence}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {d.totalVisitors}
                        </td>
                        <td className="py-2 px-3 text-slate-500 truncate max-w-[140px]">
                          {d.recipientEmails.join(", ")}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              d.status === "SENT"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-500/10 text-red-500"
                            )}
                          >
                            {d.status === "SENT" ? (
                              <Check className="h-2.5 w-2.5" />
                            ) : (
                              <AlertCircle className="h-2.5 w-2.5" />
                            )}
                            <span>{d.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
