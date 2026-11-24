"use client";

import * as React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  Award,
  Calendar,
  Building2,
  TrendingUp,
  Download,
  UploadCloud,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  FileSpreadsheet,
  FileText,
  Mail,
  Sliders,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  Phone,
  Sparkles,
  BarChart3,
  PieChart,
  Copy,
  Check,
  Briefcase,
  AlertCircle,
  HelpCircle,
  Layers,
  Send,
  MoreVertical,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface Cohort {
  id: string;
  cohortNumber: number;
  name: string;
  theme: string;
  description: string;
  status: "planning" | "open" | "in_progress" | "completed";
  startDate: string | null;
  endDate: string | null;
  certificationDate: string | null;
  targetCapacity: number;
  formId: string;
  assignedStaffName: string;
  assignedStaffEmail: string;
  totalMembers?: number;
  appliedCount?: number;
  selectedCount?: number;
  enrolledCount?: number;
  attendedCount?: number;
  certifiedCount?: number;
}

interface Member {
  id: string;
  cohortId: string;
  cohortName?: string;
  cohortNumber?: number;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  specialization: string;
  status: "applied" | "selected" | "enrolled" | "attended" | "certified" | "dropped";
  attendanceScore: number;
  certificateNumber: string;
  notes: string;
  createdAt: string;
}

interface ClanReports {
  metrics: {
    totalCandidates: number;
    selectedCount: number;
    enrolledCount: number;
    certifiedCount: number;
    pendingAppliedCount: number;
    acceptanceRate: number;
    graduationRate: number;
  };
  cohortPerformance: any[];
  topBrokerages: { company: string; count: number }[];
  specializationBreakdown: { label: string; count: number }[];
}

export default function DextaClanDashboardPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = React.useState<"cohorts" | "members" | "reports" | "links" | "governance">("cohorts");
  const [loading, setLoading] = React.useState(true);
  const [cohorts, setCohorts] = React.useState<Cohort[]>([]);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [reports, setReports] = React.useState<ClanReports | null>(null);

  // Filters
  const [selectedCohortFilter, setSelectedCohortFilter] = React.useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Bulk Selection
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<string[]>([]);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
  const [uploadMode, setUploadMode] = React.useState<"file" | "paste" | "single">("file");
  const [uploadTargetCohort, setUploadTargetCohort] = React.useState<string>("clan-cohort-4");
  const [pastedData, setPastedData] = React.useState("");
  const [parsedPreview, setParsedPreview] = React.useState<any[]>([]);
  const [isSubmittingUpload, setIsSubmittingUpload] = React.useState(false);

  // Single Member Form
  const [singleMember, setSingleMember] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    specialization: "Luxury Residential",
    status: "selected",
    certificateNumber: "",
    notes: "",
  });

  // Create Cohort Modal
  const [isCohortModalOpen, setIsCohortModalOpen] = React.useState(false);
  const [newCohortData, setNewCohortData] = React.useState({
    cohortNumber: 5,
    name: "Cohort 5: Commercial Syndication & Sovereign Capital",
    theme: "Real Estate Certification Masterclass 5.0",
    description: "Executive certification focused on commercial syndication, institutional capital structuring, and landmark project acquisitions.",
    status: "planning" as Cohort["status"],
    targetCapacity: 150,
    startDate: "2027-03-01T09:00",
    certificationDate: "2027-04-10T14:00",
  });
  const [isSavingCohort, setIsSavingCohort] = React.useState(false);

  // Staff Assignment
  const [staffList, setStaffList] = React.useState<any[]>([]);
  const [assignedLead, setAssignedLead] = React.useState<any>({
    assignedStaffName: "Systems IT Administrator",
    assignedStaffEmail: "admin@dextaafrica.org",
  });
  const [selectedStaffToAssign, setSelectedStaffToAssign] = React.useState("");
  const [isAssigningStaff, setIsAssigningStaff] = React.useState(false);

  // Load Data
  const loadClanData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [cohortsRes, membersRes, reportsRes, staffRes] = await Promise.all([
        fetch("/api/clan/cohorts"),
        fetch(`/api/clan/members?cohortId=${selectedCohortFilter}&status=${selectedStatusFilter}&search=${encodeURIComponent(searchQuery)}`),
        fetch("/api/clan/reports"),
        fetch("/api/clan/staff"),
      ]);

      if (cohortsRes.ok) {
        const cData = await cohortsRes.json();
        setCohorts(cData.cohorts || []);
      }
      if (membersRes.ok) {
        const mData = await membersRes.json();
        setMembers(mData.members || []);
      }
      if (reportsRes.ok) {
        const rData = await reportsRes.json();
        setReports(rData);
      }
      if (staffRes.ok) {
        const sData = await staffRes.json();
        setStaffList(sData.staffMembers || []);
        if (sData.assignedLead) setAssignedLead(sData.assignedLead);
      }
    } catch (err: any) {
      toastError(err.message || "Failed to load Dexta Clan data");
    } finally {
      setLoading(false);
    }
  }, [selectedCohortFilter, selectedStatusFilter, searchQuery, toastError]);

  React.useEffect(() => {
    loadClanData();
  }, [loadClanData]);

  // Bulk Status Change
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedMemberIds.length === 0) {
      toastError("Select at least one candidate");
      return;
    }
    try {
      const res = await fetch("/api/clan/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberIds: selectedMemberIds,
          status: newStatus,
          notes: `Status transitioned to ${newStatus} via Executive Bulk Action`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      toastSuccess(data.message || `Updated status to ${newStatus}`);
      setSelectedMemberIds([]);
      loadClanData();
    } catch (err: any) {
      toastError(err.message || "Bulk status update failed");
    }
  };

  // Parse CSV or Pasted Text
  const parseRows = (text: string) => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    const firstLine = lines[0];
    const isHeader =
      firstLine.toLowerCase().includes("name") ||
      firstLine.toLowerCase().includes("email");

    const startIdx = isHeader ? 1 : 0;
    const delimiter = firstLine.includes("\t") ? "\t" : ",";

    const results = [];
    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map((p) => p.trim().replace(/^"|"$/g, ""));
      if (parts.length >= 2) {
        results.push({
          fullName: parts[0] || "",
          email: parts[1] || "",
          phone: parts[2] || "",
          company: parts[3] || "",
          jobTitle: parts[4] || "",
          specialization: parts[5] || "Luxury Residential",
          status: parts[6] || "selected",
        });
      }
    }
    return results;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseRows(content);
      setParsedPreview(parsed);
      if (parsed.length > 0) {
        toastSuccess(`Parsed ${parsed.length} candidate rows from ${file.name}`);
      } else {
        toastError("No valid rows detected. Ensure columns are: Full Name, Email, Phone, Company");
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmIngest = async () => {
    let payload: any[] = [];
    if (uploadMode === "file" || uploadMode === "paste") {
      const items = uploadMode === "paste" ? parseRows(pastedData) : parsedPreview;
      if (items.length === 0) {
        toastError("No candidate rows to upload. Please review input.");
        return;
      }
      payload = items.map((item) => ({
        ...item,
        cohortId: uploadTargetCohort,
      }));
    } else {
      if (!singleMember.fullName || !singleMember.email) {
        toastError("Full Name and Email are mandatory");
        return;
      }
      payload = [{
        ...singleMember,
        cohortId: uploadTargetCohort,
      }];
    }

    setIsSubmittingUpload(true);
    try {
      const res = await fetch("/api/clan/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to ingest members");

      toastSuccess(data.message || `Successfully uploaded ${payload.length} members`);
      setIsUploadModalOpen(false);
      setParsedPreview([]);
      setPastedData("");
      loadClanData();
    } catch (err: any) {
      toastError(err.message || "Failed to upload members");
    } finally {
      setIsSubmittingUpload(false);
    }
  };

  // Save New Cohort
  const handleSaveCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCohort(true);
    try {
      const res = await fetch("/api/clan/cohorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCohortData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create cohort");

      toastSuccess("Cohort created successfully!");
      setIsCohortModalOpen(false);
      loadClanData();
    } catch (err: any) {
      toastError(err.message || "Failed to create cohort");
    } finally {
      setIsSavingCohort(false);
    }
  };

  // Assign Staff Lead
  const handleAssignStaff = async () => {
    if (!selectedStaffToAssign) {
      toastError("Please select a staff member");
      return;
    }
    const staff = staffList.find((s) => s.id === selectedStaffToAssign);
    if (!staff) return;

    setIsAssigningStaff(true);
    try {
      const res = await fetch("/api/clan/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: staff.id,
          staffName: staff.fullName,
          staffEmail: staff.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign staff");

      toastSuccess(data.message || `Assigned to ${staff.fullName}`);
      setAssignedLead({
        assignedStaffName: staff.fullName,
        assignedStaffEmail: staff.email,
      });
    } catch (err: any) {
      toastError(err.message || "Failed to assign staff lead");
    } finally {
      setIsAssigningStaff(false);
    }
  };

  // Export CSV of Current Members
  const handleExportMembersCSV = () => {
    if (members.length === 0) {
      toastError("No members to export");
      return;
    }
    const rows = [
      ["Full Name", "Email", "Phone", "Company / Brokerage", "Job Title", "Cohort", "Status", "Specialization", "Certificate Number", "Attendance Score"],
      ...members.map((m) => [
        `"${m.fullName.replace(/"/g, '""')}"`,
        `"${m.email.replace(/"/g, '""')}"`,
        `"${(m.phone || "").replace(/"/g, '""')}"`,
        `"${(m.company || "").replace(/"/g, '""')}"`,
        `"${(m.jobTitle || "").replace(/"/g, '""')}"`,
        `"${m.cohortName || m.cohortId}"`,
        `"${m.status.toUpperCase()}"`,
        `"${m.specialization || "General"}"`,
        `"${m.certificateNumber || ""}"`,
        `"${m.attendanceScore}%"`,
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dexta-clan-roster-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess("Clan roster CSV exported successfully");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-red-600/10 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-500/20">
              Enterprise Academy Product
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Active: Cohort 4 (The High-Performing Realtor)
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <GraduationCap className="h-7 w-7 text-red-600" />
            Dexta Clan Executive Academy
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Central command for partner accreditation, real estate certification masterclass cohorts, candidate pipeline tracking, and executive reports.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={loadClanData}
            disabled={loading}
            className="text-xs border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportMembersCSV}
            className="text-xs border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export Roster
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCohortModalOpen(true)}
            className="text-xs border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Cohort
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsUploadModalOpen(true)}
            className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm"
          >
            <UploadCloud className="h-3.5 w-3.5 mr-1.5" />
            Upload Candidates / Ingest
          </Button>
        </div>
      </div>

      {/* KPI Telemetry Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#12131a] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Candidates</span>
            <Users className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {reports?.metrics.totalCandidates || members.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">Across Cohorts 1 – 4</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12131a] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cohort 4 Active</span>
            <Sparkles className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {cohorts.find((c) => c.cohortNumber === 4)?.totalMembers || 0}
            <span className="text-xs font-normal text-slate-400 ml-1">/ 120 Cap</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Flagship Masterclass 4.0
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12131a] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Acceptance Rate</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {reports?.metrics.acceptanceRate || 82}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Competitive Selection
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12131a] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Certified Alumni</span>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {reports?.metrics.certifiedCount || 190}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Fully Credentialed
          </div>
        </div>

        <div className="col-span-2 md:col-span-4 lg:col-span-1 p-4 rounded-2xl bg-white dark:bg-[#12131a] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Program Desk Lead</span>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
            {assignedLead.assignedStaffName || "Systems IT Administrator"}
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-1">
            {assignedLead.assignedStaffEmail || "admin@dextaafrica.org"}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 pb-px">
        <button
          onClick={() => setActiveTab("cohorts")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "cohorts"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Cohorts Lifecycle ({cohorts.length})
        </button>

        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "members"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Candidates &amp; Member Roster ({members.length})
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "reports"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          Executive Reports &amp; Dossiers
        </button>

        <button
          onClick={() => setActiveTab("links")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "links"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Application Portals &amp; Links
        </button>

        <button
          onClick={() => setActiveTab("governance")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "governance"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Staff Assignment &amp; Desk Delegation
        </button>
      </div>

      {/* TAB 1: COHORTS LIFECYCLE */}
      {activeTab === "cohorts" && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {cohorts.map((cohort) => {
              const enrolled = (cohort.selectedCount || 0) + (cohort.enrolledCount || 0) + (cohort.certifiedCount || 0);
              const progressPct = Math.min(100, Math.round((enrolled / (cohort.targetCapacity || 100)) * 100));

              return (
                <div
                  key={cohort.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    cohort.status === "in_progress"
                      ? "bg-slate-900 text-white border-red-500/40 shadow-lg shadow-red-950/20"
                      : "bg-white dark:bg-[#12131a] border-slate-200/80 dark:border-white/[0.08]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                            cohort.status === "in_progress"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : cohort.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {cohort.status.replace("_", " ")}
                        </span>
                        <span className="text-xs font-mono opacity-60">
                          Cohort #{cohort.cohortNumber}
                        </span>
                      </div>
                      <h3 className="text-base font-bold tracking-tight">
                        {cohort.name}
                      </h3>
                      <p className="text-xs opacity-75 mt-0.5">
                        {cohort.theme}
                      </p>
                    </div>

                    <Link
                      href={`/register/dexta-clan-cohort-4`}
                      target="_blank"
                      className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                      title="Open Public Application Portal"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>

                  <p className="text-xs opacity-80 line-clamp-2 mb-4 leading-relaxed">
                    {cohort.description}
                  </p>

                  {/* Enrollment Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="opacity-75">Enrollment Progress</span>
                      <span className="font-bold">
                        {enrolled} / {cohort.targetCapacity} Candidates ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          cohort.status === "in_progress" ? "bg-red-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Breakdown Pills */}
                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-200/50 dark:border-white/10 text-center text-xs">
                    <div className="p-2 rounded-lg bg-slate-100/60 dark:bg-white/[0.04]">
                      <span className="block text-[10px] opacity-60 uppercase font-semibold">Applied</span>
                      <span className="font-bold text-sm">{cohort.appliedCount || 0}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100/60 dark:bg-white/[0.04]">
                      <span className="block text-[10px] opacity-60 uppercase font-semibold">Selected</span>
                      <span className="font-bold text-sm text-red-500">{cohort.selectedCount || 0}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100/60 dark:bg-white/[0.04]">
                      <span className="block text-[10px] opacity-60 uppercase font-semibold">Enrolled</span>
                      <span className="font-bold text-sm text-blue-500">{cohort.enrolledCount || 0}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100/60 dark:bg-white/[0.04]">
                      <span className="block text-[10px] opacity-60 uppercase font-semibold">Certified</span>
                      <span className="font-bold text-sm text-emerald-500">{cohort.certifiedCount || 0}</span>
                    </div>
                  </div>

                  {/* Cohort Footer Action */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200/50 dark:border-white/10 text-xs">
                    <div className="text-[11px] opacity-75 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {cohort.startDate ? new Date(cohort.startDate).toLocaleDateString() : "TBD"} –{" "}
                      {cohort.certificationDate ? new Date(cohort.certificationDate).toLocaleDateString() : "TBD"}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCohortFilter(cohort.id);
                          setActiveTab("members");
                        }}
                        className="font-bold text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        View Members ({cohort.totalMembers || 0})
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CANDIDATES & MEMBER ROSTER */}
      {activeTab === "members" && (
        <div className="space-y-4 animate-fade-in">
          {/* Roster Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#12131a] border border-slate-200/80 dark:border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[220px]">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search candidate name, email, brokerage..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Cohort Dropdown Filter */}
              <select
                value={selectedCohortFilter}
                onChange={(e) => setSelectedCohortFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="ALL">All Cohorts (1 – 4)</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    Cohort {c.cohortNumber}: {c.name}
                  </option>
                ))}
              </select>

              {/* Status Dropdown Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="applied">Applied (Pending Review)</option>
                <option value="selected">Selected (Offer Dispatched)</option>
                <option value="enrolled">Enrolled &amp; Confirmed</option>
                <option value="attended">Attended Masterclass</option>
                <option value="certified">Certified Real Estate Alumni</option>
              </select>
            </div>

            {/* Batch Status Transition Actions */}
            {selectedMemberIds.length > 0 && (
              <div className="flex items-center gap-2 p-1 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/40">
                <span className="text-[11px] font-bold text-red-700 dark:text-red-400 px-2">
                  {selectedMemberIds.length} Selected
                </span>
                <Button
                  size="xs"
                  onClick={() => handleBulkStatusChange("selected")}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px]"
                >
                  Mark Selected
                </Button>
                <Button
                  size="xs"
                  onClick={() => handleBulkStatusChange("enrolled")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px]"
                >
                  Mark Enrolled
                </Button>
                <Button
                  size="xs"
                  onClick={() => handleBulkStatusChange("certified")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px]"
                >
                  Mark Certified
                </Button>
                <Link
                  href={`/marketing/campaigns?occasion=invitation&cohort=Cohort4`}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:underline px-2"
                >
                  <Send className="h-3 w-3" />
                  Email Campaign
                </Link>
              </div>
            )}
          </div>

          {/* Members Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#12131a] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/75 dark:bg-white/[0.02] text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 w-8">
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.length === members.length && members.length > 0}
                        onChange={(e) =>
                          setSelectedMemberIds(
                            e.target.checked ? members.map((m) => m.id) : []
                          )
                        }
                        className="rounded border-slate-300"
                      />
                    </th>
                    <th className="py-3 px-4">Candidate / Member</th>
                    <th className="py-3 px-4">Brokerage &amp; Role</th>
                    <th className="py-3 px-4">Cohort</th>
                    <th className="py-3 px-4">Specialization</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Credential / Cert No</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="font-semibold">No candidates found matching criteria</p>
                        <p className="text-[11px] mt-1">Upload candidate records using the button above to begin.</p>
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedMemberIds.includes(member.id)}
                            onChange={() =>
                              setSelectedMemberIds((prev) =>
                                prev.includes(member.id)
                                  ? prev.filter((id) => id !== member.id)
                                  : [...prev, member.id]
                              )
                            }
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {member.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{member.email}</span>
                            {member.phone && <span>• {member.phone}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {member.company || "Independent Broker"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {member.jobTitle || "Realtor"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            {member.cohortName ? member.cohortName.split(":")[0] : member.cohortId}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-600 dark:text-slate-400">
                            {member.specialization || "General Practice"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              member.status === "certified"
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : member.status === "selected"
                                ? "bg-red-500/10 text-red-600 border border-red-500/20"
                                : member.status === "enrolled"
                                ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {member.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            {member.certificateNumber || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <select
                            value={member.status}
                            onChange={(e) => {
                              setSelectedMemberIds([member.id]);
                              handleBulkStatusChange(e.target.value);
                            }}
                            className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-2 py-1 text-[11px] font-semibold"
                          >
                            <option value="applied">Applied</option>
                            <option value="selected">Selected</option>
                            <option value="enrolled">Enrolled</option>
                            <option value="attended">Attended</option>
                            <option value="certified">Certified</option>
                          </select>
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

      {/* TAB 3: EXECUTIVE CLAN REPORTS */}
      {activeTab === "reports" && (
        <div className="space-y-6 animate-fade-in">
          {/* Executive Summary Dossier Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-red-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-red-400 uppercase font-bold">
                  Dexta Clan Intelligence Dossier &bull; FY 2026
                </span>
                <h2 className="text-xl font-bold mt-1">Real Estate Academy Conversion &amp; Accreditations</h2>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.print()}
                className="border-white/20 text-white hover:bg-white/10 text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Print Executive Dossier
              </Button>
            </div>

            {/* Performance Bar Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-white/10">
              <div>
                <div className="text-[11px] text-slate-400">Total Applications</div>
                <div className="text-2xl font-black">{reports?.metrics.totalCandidates || 240}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Selections Dispatched</div>
                <div className="text-2xl font-black text-red-400">{reports?.metrics.selectedCount || 195}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Masterclass Enrolled</div>
                <div className="text-2xl font-black text-blue-400">{reports?.metrics.enrolledCount || 180}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Certified Real Estate Fellows</div>
                <div className="text-2xl font-black text-emerald-400">{reports?.metrics.certifiedCount || 165}</div>
              </div>
            </div>
          </div>

          {/* Detailed Cohort Progress Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#12131a] p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-red-600" />
              Cohort Growth &amp; Certification Trajectory
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/[0.08] text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Cohort</th>
                    <th className="py-2.5 px-3">Certification Theme</th>
                    <th className="py-2.5 px-3">Capacity</th>
                    <th className="py-2.5 px-3">Applicants</th>
                    <th className="py-2.5 px-3">Admitted</th>
                    <th className="py-2.5 px-3">Graduated</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {cohorts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                      <td className="py-3 px-3 font-bold">Cohort #{c.cohortNumber}</td>
                      <td className="py-3 px-3">{c.theme}</td>
                      <td className="py-3 px-3 font-mono">{c.targetCapacity}</td>
                      <td className="py-3 px-3 font-mono">{c.appliedCount || 0}</td>
                      <td className="py-3 px-3 font-mono font-bold text-red-600">{c.selectedCount || 0}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600">{c.certifiedCount || 0}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/10">
                          {c.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Brokerage & Specialization Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#12131a] space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-red-600" />
                Top Participating Brokerages &amp; Firms
              </h4>
              <div className="space-y-2">
                {(reports?.topBrokerages || [
                  { company: "Adeleke Prime Realty", count: 18 },
                  { company: "Horizon Capital Partners", count: 14 },
                  { company: "Apex Developments", count: 11 },
                  { company: "Bello & Associates", count: 9 },
                  { company: "Crestview Estates", count: 8 },
                ]).map((b) => (
                  <div key={b.company} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-white/[0.04]">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{b.company}</span>
                    <span className="font-mono text-slate-500 font-bold">{b.count} Fellows</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#12131a] space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="h-4 w-4 text-red-600" />
                Specialization Track Representation
              </h4>
              <div className="space-y-2">
                {(reports?.specializationBreakdown || [
                  { label: "Luxury Residential & Waterfront", count: 48 },
                  { label: "Commercial Properties & Office Parks", count: 32 },
                  { label: "Land Syndication & Banking", count: 24 },
                  { label: "Diaspora Real Estate Portfolios", count: 19 },
                ]).map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-white/[0.04]">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{s.label}</span>
                    <span className="font-mono text-slate-500 font-bold">{s.count} Practitioners</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: APPLICATION PORTALS & LINKS */}
      {activeTab === "links" && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#12131a] border border-slate-200/80 dark:border-white/[0.08] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Active Dexta Clan Public Registration Portals
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribute these secure links to applicants, real estate partners, and candidate pools.
                </p>
              </div>
              <Link href="/forms">
                <Button size="xs" variant="outline" className="text-xs">
                  <Sliders className="h-3 w-3 mr-1" />
                  Manage All Enterprise Links
                </Button>
              </Link>
            </div>

            <div className="p-4 rounded-xl border border-red-500/30 bg-red-50/30 dark:bg-red-950/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-600 text-white">
                    Primary Live Portal
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    Dexta Clan: Real Estate Certification Masterclass 4.0
                  </h4>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    /register/dexta-clan-cohort-4
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/register/dexta-clan-cohort-4"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
                  >
                    <span>View Public Page</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Pre-configured with NDPR legal consent verification, real estate license capture, specialization tracks, and auto-reply selection emails.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: STAFF ASSIGNMENT & GOVERNANCE */}
      {activeTab === "governance" && (
        <div className="space-y-4 animate-fade-in max-w-2xl">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#12131a] border border-slate-200/80 dark:border-white/[0.08] space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-red-600" />
                Assign Clan Academy Program Lead
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Delegate operational stewardship of the Dexta Clan desk to an authorized team member. The assigned staff member receives admissions alerts, candidate dossiers, and management authority.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Currently Assigned Lead</span>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {assignedLead.assignedStaffName || "Systems IT Administrator"}
              </div>
              <div className="text-xs font-mono text-slate-500">
                {assignedLead.assignedStaffEmail || "admin@dextaafrica.org"}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Team Member from Enterprise Directory
              </label>
              <select
                value={selectedStaffToAssign}
                onChange={(e) => setSelectedStaffToAssign(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-red-500 focus:outline-none"
              >
                <option value="">-- Choose Staff Member --</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.fullName} ({staff.email}) &bull; {staff.role} - {staff.department}
                  </option>
                ))}
              </select>

              <Button
                variant="primary"
                onClick={handleAssignStaff}
                disabled={!selectedStaffToAssign || isAssigningStaff}
                isLoading={isAssigningStaff}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5"
              >
                Confirm Desk Delegation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: BATCH INGESTION & UPLOAD */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Candidates into Dexta Clan Academy"
        description="Ingest applicant and fellow details directly into our backend database. Supported formats: CSV, Excel, TXT, or direct paste."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSubmittingUpload}
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSubmittingUpload}
              onClick={handleConfirmIngest}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {uploadMode === "single"
                ? "Add Candidate"
                : `Confirm & Ingest ${uploadMode === "paste" ? parseRows(pastedData).length : parsedPreview.length} Records`}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 pt-1 text-xs">
          {/* Target Cohort Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Destination Cohort
            </label>
            <select
              value={uploadTargetCohort}
              onChange={(e) => setUploadTargetCohort(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3 py-2 text-xs font-semibold"
            >
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  Cohort {c.cohortNumber}: {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-white/[0.04] p-1 gap-1">
            <button
              type="button"
              onClick={() => setUploadMode("file")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                uploadMode === "file" ? "bg-white dark:bg-[#1a1c24] text-slate-900 dark:text-white shadow-2xs" : "text-slate-500"
              }`}
            >
              File Upload (CSV / Excel)
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("paste")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                uploadMode === "paste" ? "bg-white dark:bg-[#1a1c24] text-slate-900 dark:text-white shadow-2xs" : "text-slate-500"
              }`}
            >
              Quick Copy &amp; Paste
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("single")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                uploadMode === "single" ? "bg-white dark:bg-[#1a1c24] text-slate-900 dark:text-white shadow-2xs" : "text-slate-500"
              }`}
            >
              Single Entry Form
            </button>
          </div>

          {/* MODE 1: FILE UPLOAD */}
          {uploadMode === "file" && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-white/20 rounded-2xl p-6 text-center cursor-pointer hover:border-red-500 transition-colors">
                <UploadCloud className="h-8 w-8 text-red-600 mb-2" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Click to select CSV, XLSX or TXT file
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Expected columns: Full Name, Email, Phone, Company / Brokerage, Job Title
                </span>
                <input
                  type="file"
                  accept=".csv,.txt,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {parsedPreview.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-emerald-600">
                      ✓ {parsedPreview.length} Candidates Ready to Ingest
                    </span>
                    <button
                      type="button"
                      onClick={() => setParsedPreview([])}
                      className="text-red-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10 p-2 space-y-1">
                    {parsedPreview.slice(0, 10).map((row, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100 dark:border-white/[0.04]">
                        <span className="font-bold truncate max-w-[180px]">{row.fullName}</span>
                        <span className="text-slate-500 truncate max-w-[200px]">{row.email}</span>
                        <span className="text-slate-400 text-[10px] truncate max-w-[120px]">{row.company}</span>
                      </div>
                    ))}
                    {parsedPreview.length > 10 && (
                      <div className="text-center text-[10px] text-slate-400 pt-1">
                        + {parsedPreview.length - 10} more records
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: PASTE */}
          {uploadMode === "paste" && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Paste rows from Google Sheets or Excel
              </label>
              <textarea
                rows={6}
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
                placeholder={"Olamide Adeleke, olamide@realty.ng, +2348031234567, Adeleke Prime, Principal\nChinedu Eze, chinedu@horizon.ng, +2348129876543, Horizon Capital, Senior Broker"}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-3 font-mono text-xs focus:outline-none focus:border-red-500"
              />
              <span className="text-[11px] text-slate-500">
                Detected: {parseRows(pastedData).length} valid candidate(s)
              </span>
            </div>
          )}

          {/* MODE 3: SINGLE ENTRY */}
          {uploadMode === "single" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Candidate Full Name *
                  </label>
                  <input
                    type="text"
                    value={singleMember.fullName}
                    onChange={(e) => setSingleMember({ ...singleMember, fullName: e.target.value })}
                    placeholder="e.g. Olamide Adeleke"
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={singleMember.email}
                    onChange={(e) => setSingleMember({ ...singleMember, email: e.target.value })}
                    placeholder="olamide@adelekerealty.com"
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={singleMember.phone}
                    onChange={(e) => setSingleMember({ ...singleMember, phone: e.target.value })}
                    placeholder="+234 803 123 4567"
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Agency / Brokerage Firm
                  </label>
                  <input
                    type="text"
                    value={singleMember.company}
                    onChange={(e) => setSingleMember({ ...singleMember, company: e.target.value })}
                    placeholder="Adeleke Prime Realty"
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Specialization Track
                  </label>
                  <select
                    value={singleMember.specialization}
                    onChange={(e) => setSingleMember({ ...singleMember, specialization: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 p-2 text-xs"
                  >
                    <option value="Luxury Residential">Luxury Residential &amp; Waterfront</option>
                    <option value="Commercial Acquisition">Commercial Real Estate &amp; Office Parks</option>
                    <option value="Land Syndication">Land Syndication &amp; Banking</option>
                    <option value="Diaspora Portfolios">Diaspora Real Estate Portfolios</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Admission Status
                  </label>
                  <select
                    value={singleMember.status}
                    onChange={(e) => setSingleMember({ ...singleMember, status: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 p-2 text-xs"
                  >
                    <option value="selected">Selected (Admitted to Cohort)</option>
                    <option value="applied">Applied (Under Review)</option>
                    <option value="enrolled">Enrolled &amp; Confirmed</option>
                    <option value="certified">Certified Fellow</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 2: CREATE NEW COHORT */}
      <Modal
        isOpen={isCohortModalOpen}
        onClose={() => setIsCohortModalOpen(false)}
        title="Establish New Dexta Clan Cohort"
        description="Launch an upcoming real estate certification masterclass cohort and admissions cycle."
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSavingCohort}
              onClick={() => setIsCohortModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSavingCohort}
              onClick={handleSaveCohort}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Launch Cohort
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 pt-1 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Cohort Number *
              </label>
              <input
                type="number"
                value={newCohortData.cohortNumber}
                onChange={(e) => setNewCohortData({ ...newCohortData, cohortNumber: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 dark:border-white/10 p-2 text-xs font-mono font-bold"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Target Capacity
              </label>
              <input
                type="number"
                value={newCohortData.targetCapacity}
                onChange={(e) => setNewCohortData({ ...newCohortData, targetCapacity: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 dark:border-white/10 p-2 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Cohort Name &amp; Designation *
            </label>
            <input
              type="text"
              value={newCohortData.name}
              onChange={(e) => setNewCohortData({ ...newCohortData, name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-white/10 p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Masterclass Theme
            </label>
            <input
              type="text"
              value={newCohortData.theme}
              onChange={(e) => setNewCohortData({ ...newCohortData, theme: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-white/10 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Cohort Executive Summary
            </label>
            <textarea
              rows={3}
              value={newCohortData.description}
              onChange={(e) => setNewCohortData({ ...newCohortData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-white/10 p-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={newCohortData.startDate}
                onChange={(e) => setNewCohortData({ ...newCohortData, startDate: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-white/10 p-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Certification Date
              </label>
              <input
                type="datetime-local"
                value={newCohortData.certificationDate}
                onChange={(e) => setNewCohortData({ ...newCohortData, certificationDate: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-white/10 p-2 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
