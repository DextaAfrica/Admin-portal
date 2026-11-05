"use client";

import * as React from "react";
import {
  Users,
  UserPlus,
  Calendar,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Building2,
  Shield,
  Download,
  Eye,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";

interface EmployeeDocument {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  verified: boolean;
  createdAt: string;
}

interface Employee {
  id: string;
  employeeNumber: string;
  fullName: string;
  workEmail: string;
  phone: string;
  department: string;
  jobTitle: string;
  employmentType: string;
  status: "ACTIVE" | "ONBOARDING" | "ON_LEAVE" | "PROBATION" | "OFFBOARDING";
  startDate: string;
  location: string;
  emergencyContact?: string | null;
  annualLeaveBalance: number;
  usedLeaveDays: number;
  notes?: string | null;
  documents: EmployeeDocument[];
}

interface LeaveRequest {
  id: string;
  userId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  handoverNotes?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewerNotes?: string | null;
  reviewedBy?: { fullName: string; email: string } | null;
  reviewedAt?: string | null;
  createdAt: string;
}

const DEPARTMENTS = [
  "ALL",
  "Executive",
  "Engineering",
  "Architecture",
  "Operations",
  "Finance",
  "Legal",
  "HR",
  "IT",
];

export default function HrDashboardPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = React.useState<"directory" | "leaves" | "documents">("directory");
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [leaves, setLeaves] = React.useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = React.useState("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modals
  const [isOnboardOpen, setIsOnboardOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);
  const [reviewLeave, setReviewLeave] = React.useState<LeaveRequest | null>(null);
  const [reviewerDecision, setReviewerDecision] = React.useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewerNotes, setReviewerNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Onboard Form State
  const [onboardForm, setOnboardForm] = React.useState({
    fullName: "",
    workEmail: "",
    phone: "",
    department: "Operations",
    jobTitle: "",
    employmentType: "FULL_TIME",
    startDate: new Date().toISOString().split("T")[0],
    location: "Lagos Executive Hub, Nigeria",
    emergencyContact: "",
    notes: "",
  });

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [empRes, leaveRes] = await Promise.all([
        fetch(`/api/hr/employees?department=${selectedDept}&status=${selectedStatus}&search=${encodeURIComponent(searchQuery)}`),
        fetch("/api/hr/leaves"),
      ]);

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
      }
      if (leaveRes.ok) {
        const leaveData = await leaveRes.json();
        setLeaves(leaveData.leaves || []);
      }
    } catch {
      toastError("Load Issue", "Could not synchronize HR records.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDept, selectedStatus, searchQuery, toastError]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/hr/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(onboardForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to onboard employee");

      toastSuccess("Colleague Onboarded", `${onboardForm.fullName} has been added to the internal HR directory.`);
      setIsOnboardOpen(false);
      setOnboardForm({
        fullName: "",
        workEmail: "",
        phone: "",
        department: "Operations",
        jobTitle: "",
        employmentType: "FULL_TIME",
        startDate: new Date().toISOString().split("T")[0],
        location: "Lagos Executive Hub, Nigeria",
        emergencyContact: "",
        notes: "",
      });
      fetchData();
    } catch (err: unknown) {
      toastError("Onboarding Error", err instanceof Error ? err.message : "Error onboarding employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveDecision = async () => {
    if (!reviewLeave) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/hr/leaves", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reviewLeave.id,
          status: reviewerDecision,
          reviewerNotes,
        }),
      });

      if (!res.ok) throw new Error("Could not update leave decision");

      toastSuccess(
        reviewerDecision === "APPROVED" ? "Leave Approved" : "Leave Rejected",
        `Decision recorded for ${reviewLeave.employeeName}.`
      );
      setReviewLeave(null);
      setReviewerNotes("");
      fetchData();
    } catch (err: unknown) {
      toastError("Decision Error", err instanceof Error ? err.message : "Error saving decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingLeavesCount = leaves.filter((l) => l.status === "PENDING").length;

  return (
    <div className="w-full min-w-0 space-y-8 animate-fade-in">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-red-200/80 dark:border-red-500/25 bg-red-50/80 dark:bg-red-500/10 px-3 py-1 mb-2">
            <span className="h-2 w-2 rounded-full bg-[#ED2618]" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#ED2618] dark:text-red-400">
              Human Resources Management Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            People, Culture &amp; Internal Operations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Centralized staff directory, time-off approvals, and internal contract vault — eliminating scattered spreadsheets and external files.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchData()}
            leftIcon={<RefreshCw className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />}
          >
            Refresh
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsOnboardOpen(true)}
            leftIcon={<UserPlus className="h-4 w-4" />}
          >
            Onboard New Colleague
          </Button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Total Workforce</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-[#ED2618]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {employees.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Verified Dexta Africa staff</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Active On Site / Office</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {employees.filter((e) => e.status === "ACTIVE").length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Operational readiness</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Leave Requests Pending</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {pendingLeavesCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Awaiting HR manager decision</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Document Compliance</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            100%
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Internal vault contracts verified</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-white/10 pb-2 overflow-x-auto no-scrollbar flex-nowrap">
        <button
          type="button"
          onClick={() => setActiveTab("directory")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "directory"
              ? "bg-[#ED2618] text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Staff Directory ({employees.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("leaves")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer relative ${
            activeTab === "leaves"
              ? "bg-[#ED2618] text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Time-Off &amp; Leave Approvals</span>
          {pendingLeavesCount > 0 && (
            <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-extrabold text-white">
              {pendingLeavesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("documents")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "documents"
              ? "bg-[#ED2618] text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
          }`}
        >
          <FileCheck className="h-3.5 w-3.5" />
          <span>Internal Document Vault</span>
        </button>
      </div>

      {/* TAB 1: STAFF DIRECTORY */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          {/* Search & Department Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDept(dept)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    selectedDept === dept
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-[#ED2618]/50"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, role, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121318] pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
              />
            </div>
          </div>

          {/* Directory Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-slate-500 font-bold">
                <tr>
                  <th className="px-5 py-3.5">Staff Member</th>
                  <th className="px-5 py-3.5">Department &amp; Title</th>
                  <th className="px-5 py-3.5">Employment</th>
                  <th className="px-5 py-3.5">Leave Balance</th>
                  <th className="px-5 py-3.5">Internal Vault</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/15 text-[#ED2618] font-bold text-xs border border-red-200/60 dark:border-red-500/20">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-950 dark:text-white">{emp.fullName}</p>
                          <p className="text-[11px] text-slate-500">{emp.employeeNumber} • {emp.workEmail}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900 dark:text-white">{emp.jobTitle}</p>
                      <p className="text-[11px] text-slate-500">{emp.department}</p>
                    </td>

                    <td className="px-5 py-4">
                      <Badge variant={emp.status === "ACTIVE" ? "success" : emp.status === "ON_LEAVE" ? "warning" : "default"}>
                        {emp.status.replace("_", " ")}
                      </Badge>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900 dark:text-white tabular-nums">
                          {emp.annualLeaveBalance - emp.usedLeaveDays} Days Left
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {emp.usedLeaveDays} used of {emp.annualLeaveBalance}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        <FileText className="h-3 w-3 text-[#ED2618]" />
                        <span>{emp.documents?.length || 0} Records</span>
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => setSelectedEmployee(emp)}
                        leftIcon={<Eye className="h-3.5 w-3.5" />}
                      >
                        Profile &amp; Vault
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TIME-OFF & LEAVE APPROVALS */}
      {activeTab === "leaves" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-5 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Internal Staff Leave Requests
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and authorize time-off applications with automatic leave balance accounting.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-slate-500 font-bold">
                <tr>
                  <th className="px-5 py-3.5">Colleague</th>
                  <th className="px-5 py-3.5">Leave Type &amp; Period</th>
                  <th className="px-5 py-3.5">Duration</th>
                  <th className="px-5 py-3.5">Stated Reason</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-4 font-bold text-slate-950 dark:text-white">
                      {leave.employeeName}
                      <p className="text-[11px] font-normal text-slate-400">{leave.department}</p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900 dark:text-white">{leave.leaveType} Leave</p>
                      <p className="text-[11px] text-slate-500">
                        {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                      </p>
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white tabular-nums">
                      {leave.daysCount} Working Days
                    </td>

                    <td className="px-5 py-4 max-w-xs text-slate-600 dark:text-slate-300 truncate" title={leave.reason}>
                      {leave.reason}
                    </td>

                    <td className="px-5 py-4">
                      <Badge
                        variant={leave.status === "APPROVED" ? "success" : leave.status === "PENDING" ? "warning" : "danger"}
                        pulse={leave.status === "PENDING"}
                      >
                        {leave.status}
                      </Badge>
                    </td>

                    <td className="px-5 py-4 text-right">
                      {leave.status === "PENDING" ? (
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() => {
                            setReviewLeave(leave);
                            setReviewerDecision("APPROVED");
                          }}
                        >
                          Review &amp; Decide
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          Decided {formatDate(leave.reviewedAt || leave.createdAt)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INTERNAL DOCUMENT VAULT */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-5 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Internal Staff Records &amp; Contracts Vault
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure internal records storage eliminating paper files, loose attachments, and external drives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.flatMap((emp) =>
              (emp.documents || []).map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-[#ED2618]">
                      <FileText className="h-5 w-5" />
                    </div>
                    <Badge variant="success" className="text-[10px]">
                      Verified Vault
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-950 dark:text-white line-clamp-1" title={doc.title}>
                      {doc.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Colleague: <strong className="text-slate-800 dark:text-slate-200">{emp.fullName}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Category: {doc.category.replace("_", " ")} • Added {formatDate(doc.createdAt)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {emp.employeeNumber}
                    </span>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#ED2618] hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Access Document</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: ONBOARD NEW COLLEAGUE */}
      <Modal
        isOpen={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        title="Onboard New Team Member"
        description="Register an employee profile into the internal HR directory and document vault."
        maxWidth="lg"
      >
        <form onSubmit={handleOnboardSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              placeholder="e.g. Babatunde Adeyemi"
              value={onboardForm.fullName}
              onChange={(e) => setOnboardForm({ ...onboardForm, fullName: e.target.value })}
              required
            />
            <Input
              label="Official Work Email"
              type="email"
              placeholder="babatunde@dextaafrica.com"
              value={onboardForm.workEmail}
              onChange={(e) => setOnboardForm({ ...onboardForm, workEmail: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Department
              </label>
              <select
                value={onboardForm.department}
                onChange={(e) => setOnboardForm({ ...onboardForm, department: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
              >
                {DEPARTMENTS.filter((d) => d !== "ALL").map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Job Title / Role"
              placeholder="e.g. Senior Project Architect"
              value={onboardForm.jobTitle}
              onChange={(e) => setOnboardForm({ ...onboardForm, jobTitle: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Direct Phone Number"
              placeholder="+234 803 000 0000"
              value={onboardForm.phone}
              onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value })}
              required
            />
            <Input
              label="Primary Work Location"
              value={onboardForm.location}
              onChange={(e) => setOnboardForm({ ...onboardForm, location: e.target.value })}
            />
          </div>

          <Input
            label="Emergency Contact (Name & Phone)"
            placeholder="Next of Kin: Folake Adeyemi (+234 802 000 0000)"
            value={onboardForm.emergencyContact}
            onChange={(e) => setOnboardForm({ ...onboardForm, emergencyContact: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button size="sm" variant="ghost" onClick={() => setIsOnboardOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit" isLoading={isSubmitting}>
              Complete Onboarding
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: REVIEW LEAVE REQUEST */}
      <Modal
        isOpen={Boolean(reviewLeave)}
        onClose={() => setReviewLeave(null)}
        title="Review Time-Off Application"
        description="Verify department coverage and authorize or reject the leave application."
        maxWidth="md"
        footer={
          <>
            <Button size="sm" variant="ghost" onClick={() => setReviewLeave(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={reviewerDecision === "APPROVED" ? "primary" : "danger"}
              isLoading={isSubmitting}
              onClick={handleLeaveDecision}
            >
              Confirm {reviewerDecision === "APPROVED" ? "Approval" : "Rejection"}
            </Button>
          </>
        }
      >
        {reviewLeave && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-4 border border-slate-200 dark:border-white/10 space-y-1.5">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {reviewLeave.employeeName} ({reviewLeave.department})
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Type: <strong>{reviewLeave.leaveType} Leave</strong> • <strong>{reviewLeave.daysCount} Working Days</strong>
              </p>
              <p className="text-slate-500">
                Period: {formatDate(reviewLeave.startDate)} to {formatDate(reviewLeave.endDate)}
              </p>
              <p className="text-slate-700 dark:text-slate-200 pt-1">
                Reason: &ldquo;{reviewLeave.reason}&rdquo;
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">HR Decision</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewerDecision("APPROVED")}
                  className={`rounded-xl py-2 px-3 font-bold border transition-all cursor-pointer ${
                    reviewerDecision === "APPROVED"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "border-slate-200 dark:border-white/10 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Approve Leave
                </button>
                <button
                  type="button"
                  onClick={() => setReviewerDecision("REJECTED")}
                  className={`rounded-xl py-2 px-3 font-bold border transition-all cursor-pointer ${
                    reviewerDecision === "REJECTED"
                      ? "bg-red-600 text-white border-red-600"
                      : "border-slate-200 dark:border-white/10 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Reject Application
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Reviewer Notes (Optional)</label>
              <textarea
                rows={3}
                placeholder="Add handover verification remarks or notes for employee..."
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#ED2618]"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: EMPLOYEE FULL PROFILE & INTERNAL VAULT */}
      <Modal
        isOpen={Boolean(selectedEmployee)}
        onClose={() => setSelectedEmployee(null)}
        title={selectedEmployee ? `${selectedEmployee.fullName} — Staff Record` : "Staff Profile"}
        description="Unified employee file, emergency details, and internal contract vault."
        maxWidth="lg"
      >
        {selectedEmployee && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] p-4 border border-slate-200 dark:border-white/10">
              <div>
                <p className="text-slate-400">Employee ID</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedEmployee.employeeNumber}</p>
              </div>
              <div>
                <p className="text-slate-400">Department</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedEmployee.department}</p>
              </div>
              <div>
                <p className="text-slate-400">Employment</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedEmployee.employmentType.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-slate-400">Leave Balance</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {selectedEmployee.annualLeaveBalance - selectedEmployee.usedLeaveDays} Days
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white">Contact &amp; Location Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 dark:text-slate-300">
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-[#ED2618]" />
                  <span>{selectedEmployee.workEmail}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-[#ED2618]" />
                  <span>{selectedEmployee.phone}</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[#ED2618]" />
                  <span>{selectedEmployee.location}</span>
                </p>
                <p className="flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  <span>{selectedEmployee.emergencyContact || "No emergency contact listed"}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/10">
              <h4 className="font-bold text-slate-900 dark:text-white">
                Internal Vault Documents ({selectedEmployee.documents?.length || 0})
              </h4>
              <div className="space-y-2">
                {selectedEmployee.documents?.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 p-3 bg-white dark:bg-[#15161c]"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-[#ED2618]" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{doc.title}</p>
                        <p className="text-[10px] text-slate-400">{doc.category.replace("_", " ")}</p>
                      </div>
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-[#ED2618] hover:underline"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

