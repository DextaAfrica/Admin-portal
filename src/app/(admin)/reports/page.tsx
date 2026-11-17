"use client";

import * as React from "react";
import Image from "next/image";
import {
  FileText,
  Plus,
  Printer,
  Trash2,
  Save,
  Check,
  Send,
  ArrowLeft,
  Calendar,
  User,
  Upload,
  Image as ImageIcon,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Table as TableIcon,
  HardHat,
  Briefcase,
  FileSpreadsheet,
  CheckSquare,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { DextaLogo } from "@/components/ui/DextaLogo";
import { Modal } from "@/components/ui/Modal";

interface NarrativeSection {
  id: string;
  title: string;
  content: string;
}

interface SpreadsheetRow {
  id: string;
  item: string;
  zone: string;
  contractor: string;
  quantity: string;
  status: "COMPLETED" | "IN_PROGRESS" | "PENDING" | "DELAYED";
  progressPct: number;
  varianceNotes: string;
}

interface AttachedImage {
  id: string;
  url: string;
  caption: string;
  timestamp: string;
}

interface ReportDocumentItem {
  id: string;
  reference: string;
  title: string;
  cadence: "DAILY" | "WEEKLY" | "MONTHLY" | "AD_HOC";
  department: string;
  authorName: string;
  authorTitle: string | null;
  authorEmail: string;
  lineManagerName: string | null;
  lineManagerTitle: string | null;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "CHANGES_REQUESTED";
  reportDate: string;
  summary: string | null;
  sections: string | null;
  spreadsheetData: string | null;
  images: string | null;
  managerNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CorporateReportsPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  // Mode: "list" (Repository view) | "editor" (Document builder)
  const [viewMode, setViewMode] = React.useState<"list" | "editor">("list");
  const [reportsList, setReportsList] = React.useState<ReportDocumentItem[]>([]);
  const [isLoadingList, setIsLoadingList] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  // List Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [cadenceFilter, setCadenceFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [departmentFilter, setDepartmentFilter] = React.useState("ALL");

  // Template Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = React.useState(false);

  // Active Report State in Editor
  const [activeReportId, setActiveReportId] = React.useState<string | null>(null);
  const [reference, setReference] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [cadence, setCadence] = React.useState<"DAILY" | "WEEKLY" | "MONTHLY" | "AD_HOC">("DAILY");
  const [department, setDepartment] = React.useState("OPERATIONS");
  const [authorName, setAuthorName] = React.useState("");
  const [authorTitle, setAuthorTitle] = React.useState("Operations Lead");
  const [lineManagerName, setLineManagerName] = React.useState("");
  const [lineManagerTitle, setLineManagerTitle] = React.useState("Director of Operations");
  const [status, setStatus] = React.useState<"DRAFT" | "SUBMITTED" | "APPROVED" | "CHANGES_REQUESTED">("DRAFT");
  const [reportDate, setReportDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = React.useState("");
  const [managerNotes, setManagerNotes] = React.useState("");

  // Narrative Sections (Word-like)
  const [sections, setSections] = React.useState<NarrativeSection[]>([
    {
      id: "sec-1",
      title: "Key Activities & Work Completed",
      content: "",
    },
    {
      id: "sec-2",
      title: "Equipment, Materials & Logistics",
      content: "",
    },
    {
      id: "sec-3",
      title: "Issues, Risks & Recommendations",
      content: "",
    },
  ]);

  // Spreadsheet Data (Excel-like)
  const [spreadsheetRows, setSpreadsheetRows] = React.useState<SpreadsheetRow[]>([
    {
      id: "row-1",
      item: "Site Preparation & Earthworks",
      zone: "Zone A",
      contractor: "Civil Works Squad",
      quantity: "350 sqm",
      status: "COMPLETED",
      progressPct: 100,
      varianceNotes: "Completed on schedule",
    },
    {
      id: "row-2",
      item: "Reinforced Concrete Foundation",
      zone: "Main Structure",
      contractor: "Structural Team",
      quantity: "45 Metric Tons",
      status: "IN_PROGRESS",
      progressPct: 70,
      varianceNotes: "Curing in progress",
    },
    {
      id: "row-3",
      item: "Paving & Surface Drainage",
      zone: "Access Road",
      contractor: "Road Crew",
      quantity: "800 Linear Meters",
      status: "PENDING",
      progressPct: 25,
      varianceNotes: "Awaiting final inspection",
    },
  ]);

  // Image Attachments Gallery
  const [images, setImages] = React.useState<AttachedImage[]>([]);

  // 1. Fetch Reports List
  const fetchReports = React.useCallback(async () => {
    setIsLoadingList(true);
    try {
      const params = new URLSearchParams({
        cadence: cadenceFilter,
        status: statusFilter,
        department: departmentFilter,
        search: searchQuery,
      });
      const res = await fetch(`/api/reports/documents?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load reports");
      const json = await res.json();
      setReportsList(json.reports || []);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Error connecting to reports service");
    } finally {
      setIsLoadingList(false);
    }
  }, [cadenceFilter, statusFilter, departmentFilter, searchQuery, toastError]);

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Template Handlers
  const handleStartBlank = () => {
    setActiveReportId(null);
    setReference(`RPT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setTitle("Operational Progress Report");
    setCadence("DAILY");
    setDepartment("OPERATIONS");
    setAuthorName("Operations Lead");
    setAuthorTitle("Project Manager");
    setLineManagerName("Line Manager");
    setLineManagerTitle("Director of Operations");
    setStatus("DRAFT");
    setReportDate(new Date().toISOString().slice(0, 10));
    setSummary("");
    setSections([
      {
        id: "sec-1",
        title: "Work Accomplished",
        content: "",
      },
      {
        id: "sec-2",
        title: "Upcoming Milestone Targets",
        content: "",
      },
      {
        id: "sec-3",
        title: "Notes for Line Manager",
        content: "",
      },
    ]);
    setSpreadsheetRows([
      {
        id: "row-1",
        item: "Task Deliverable",
        zone: "Sector 1",
        contractor: "Operational Team",
        quantity: "1 Unit",
        status: "IN_PROGRESS",
        progressPct: 50,
        varianceNotes: "In progress",
      },
    ]);
    setImages([]);
    setManagerNotes("");
    setIsTemplateModalOpen(false);
    setViewMode("editor");
  };

  const handleStartTemplate = (templateType: "DAILY" | "WEEKLY" | "MONTHLY" | "INCIDENT") => {
    setActiveReportId(null);
    setReference(`RPT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setReportDate(new Date().toISOString().slice(0, 10));
    setStatus("DRAFT");
    setManagerNotes("");

    if (templateType === "DAILY") {
      setTitle("Daily Operations & Field Deliveries Report");
      setCadence("DAILY");
      setDepartment("OPERATIONS");
      setSummary("Daily briefing detailing completed ground activities, deployed workforce, machinery uptime, and key milestones achieved during the shift.");
      setSections([
        {
          id: "sec-1",
          title: "Ground Activities & Work Completed",
          content: "All scheduled site milestones were conducted in accordance with quality standards. Team members completed excavation, foundation grading, and site preparation with no delays.",
        },
        {
          id: "sec-2",
          title: "Machinery, Materials & Site Logistics",
          content: "Equipment performed at full capacity. Material deliveries were inspected upon arrival and verified against specifications.",
        },
        {
          id: "sec-3",
          title: "Challenges & Required Actions",
          content: "Inspection clearance requested from line manager prior to proceeding with the next phase.",
        },
      ]);
      setSpreadsheetRows([
        {
          id: "row-1",
          item: "Sub-base Compaction & Grading",
          zone: "Zone 1",
          contractor: "Civil Engineering Team",
          quantity: "480 sqm",
          status: "COMPLETED",
          progressPct: 100,
          varianceNotes: "Inspected and approved",
        },
        {
          id: "row-2",
          item: "Retaining Wall Reinforcement",
          zone: "Zone 2",
          contractor: "Structural Team",
          quantity: "32 Metric Tons",
          status: "IN_PROGRESS",
          progressPct: 75,
          varianceNotes: "Proceeding as planned",
        },
      ]);
    } else if (templateType === "WEEKLY") {
      setTitle("Weekly Project Progress & Deliverables Summary");
      setCadence("WEEKLY");
      setDepartment("OPERATIONS");
      setSummary("Weekly progress review outlining key deliverable milestones, resource utilization, contractor performance, and targets for the upcoming week.");
      setSections([
        {
          id: "sec-1",
          title: "Weekly Milestone Highlights",
          content: "Progress across active project corridors advanced by 18% overall. Major structural elements were cast and quality assurance tests met all criteria.",
        },
        {
          id: "sec-2",
          title: "Contractor & Team Performance",
          content: "Subcontractor teams met all safety guidelines and maintained productive output across all project sectors.",
        },
        {
          id: "sec-3",
          title: "Line Manager Approvals Required",
          content: "Approval required for the upcoming scheduled concrete pour and mobilization of Phase 2 paving crews.",
        },
      ]);
      setSpreadsheetRows([
        {
          id: "row-1",
          item: "Foundation Pile Capping",
          zone: "Sector North",
          contractor: "Engineering Squad",
          quantity: "14 Piles",
          status: "COMPLETED",
          progressPct: 100,
          varianceNotes: "Full integrity confirmed",
        },
        {
          id: "row-2",
          item: "Drainage Canal Construction",
          zone: "Sector East",
          contractor: "Civil Squad",
          quantity: "600 Meters",
          status: "IN_PROGRESS",
          progressPct: 60,
          varianceNotes: "On schedule",
        },
      ]);
    } else if (templateType === "MONTHLY") {
      setTitle("Monthly Operations & Milestone Review");
      setCadence("MONTHLY");
      setDepartment("OPERATIONS");
      setSummary("Comprehensive monthly summary of all completed infrastructure milestones, contractor delivery audits, safety compliance, and forward planning.");
      setSections([
        {
          id: "sec-1",
          title: "Monthly Operational Highlights",
          content: "All priority milestones were delivered within scheduled timeframes. Key deliverables included completion of major access corridors and structural handovers.",
        },
        {
          id: "sec-2",
          title: "Safety, Resource & Asset Health",
          content: "Zero lost-time incidents recorded across the month. Equipment availability stood at 98.5%.",
        },
      ]);
      setSpreadsheetRows([
        {
          id: "row-1",
          item: "Access Corridor Roadway",
          zone: "Phase 1 Corridor",
          contractor: "Infrastructure Team",
          quantity: "12 Kilometers",
          status: "COMPLETED",
          progressPct: 100,
          varianceNotes: "Final inspection passed",
        },
      ]);
    } else {
      setTitle("Site Safety & Incident Review Report");
      setCadence("AD_HOC");
      setDepartment("OPERATIONS");
      setSummary("Formal site incident and safety report detailing observed conditions, immediate corrective actions, and prevention measures.");
      setSections([
        {
          id: "sec-1",
          title: "Incident Overview & Immediate Actions",
          content: "Precautionary measures taken to secure the perimeter following heavy weather. Site area was cordoned off and verified stable.",
        },
        {
          id: "sec-2",
          title: "Preventive Measures & Recommendations",
          content: "Additional drainage reinforcement installed. Routine inspection intervals increased.",
        },
      ]);
      setSpreadsheetRows([
        {
          id: "row-1",
          item: "Perimeter Shoring & Inspection",
          zone: "Sector 3",
          contractor: "Safety Team",
          quantity: "100 Meters",
          status: "COMPLETED",
          progressPct: 100,
          varianceNotes: "Condition stabilized",
        },
      ]);
    }

    setImages([]);
    setIsTemplateModalOpen(false);
    setViewMode("editor");
  };

  // Load Existing Report into Editor
  const handleEditReport = (item: ReportDocumentItem) => {
    setActiveReportId(item.id);
    setReference(item.reference);
    setTitle(item.title);
    setCadence(item.cadence);
    setDepartment(item.department);
    setAuthorName(item.authorName);
    setAuthorTitle(item.authorTitle || "Operations Lead");
    setLineManagerName(item.lineManagerName || "Line Manager");
    setLineManagerTitle(item.lineManagerTitle || "Director of Operations");
    setStatus(item.status);
    setReportDate(new Date(item.reportDate).toISOString().slice(0, 10));
    setSummary(item.summary || "");
    setManagerNotes(item.managerNotes || "");

    try {
      const parsedSections = item.sections ? JSON.parse(item.sections) : [];
      setSections(parsedSections.length > 0 ? parsedSections : [{ id: "sec-1", title: "Key Activities", content: "" }]);
    } catch {
      setSections([{ id: "sec-1", title: "Key Activities", content: item.sections || "" }]);
    }

    try {
      const parsedSpreadsheet = item.spreadsheetData ? JSON.parse(item.spreadsheetData) : [];
      setSpreadsheetRows(parsedSpreadsheet);
    } catch {
      setSpreadsheetRows([]);
    }

    try {
      const parsedImages = item.images ? JSON.parse(item.images) : [];
      setImages(parsedImages);
    } catch {
      setImages([]);
    }

    setViewMode("editor");
  };

  // Save Report
  const handleSaveReport = async (overrideStatus?: typeof status) => {
    if (!title.trim()) {
      toastError("Report title is required");
      return;
    }

    setIsSaving(true);
    const saveStatus = overrideStatus || status;

    const payload = {
      title,
      cadence,
      department,
      authorName,
      authorTitle,
      lineManagerName,
      lineManagerTitle,
      reportDate,
      summary,
      sections,
      spreadsheetData: spreadsheetRows,
      images,
      managerNotes,
      status: saveStatus,
    };

    try {
      const url = activeReportId ? `/api/reports/documents/${activeReportId}` : "/api/reports/documents";
      const method = activeReportId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Failed to save report");

      if (resJson.report?.id) {
        setActiveReportId(resJson.report.id);
        setReference(resJson.report.reference);
      }
      setStatus(saveStatus);
      toastSuccess("Report Saved", resJson.message || "Document saved successfully.");
      fetchReports();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Error saving report");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Report
  const handleDeleteReport = async (id: string, ref: string) => {
    if (!confirm(`Delete report ${ref}? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/reports/documents/${id}`, { method: "DELETE" });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Delete failed");

      toastSuccess("Report Deleted", `Document ${ref} removed.`);
      fetchReports();
      if (activeReportId === id) {
        setViewMode("list");
      }
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Could not delete report");
    }
  };

  // Section Controls
  const handleAddSection = () => {
    const newId = `sec-${Date.now()}`;
    setSections([...sections, { id: newId, title: "New Section", content: "" }]);
  };

  const handleUpdateSection = (id: string, field: "title" | "content", value: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleDeleteSection = (id: string) => {
    if (sections.length <= 1) {
      toastError("Report must have at least one section.");
      return;
    }
    setSections(sections.filter((s) => s.id !== id));
  };

  // Spreadsheet Row Controls
  const handleAddRow = () => {
    const newRow: SpreadsheetRow = {
      id: `row-${Date.now()}`,
      item: "New Deliverable / Task",
      zone: "Zone 1",
      contractor: "Operational Team",
      quantity: "1 Unit",
      status: "IN_PROGRESS",
      progressPct: 50,
      varianceNotes: "Normal progress",
    };
    setSpreadsheetRows([...spreadsheetRows, newRow]);
  };

  const handleUpdateRow = (id: string, field: keyof SpreadsheetRow, value: any) => {
    setSpreadsheetRows(spreadsheetRows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleDeleteRow = (id: string) => {
    setSpreadsheetRows(spreadsheetRows.filter((r) => r.id !== id));
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toastError("File Too Large", "Please select photos under 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const newImg: AttachedImage = {
            id: `img-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            url: reader.result,
            caption: file.name.replace(/\.[^/.]+$/, ""),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setImages((prev) => [...prev, newImg]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const handleDeleteImage = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
  };

  const handleUpdateImageCaption = (id: string, caption: string) => {
    setImages(images.map((img) => (img.id === id ? { ...img, caption } : img)));
  };

  // Spreadsheet Aggregates
  const completedMilestoneCount = spreadsheetRows.filter((r) => r.status === "COMPLETED").length;
  const inProgressMilestoneCount = spreadsheetRows.filter((r) => r.status === "IN_PROGRESS").length;
  const avgProgressPct =
    spreadsheetRows.length > 0
      ? Math.round(spreadsheetRows.reduce((sum, r) => sum + (Number(r.progressPct) || 0), 0) / spreadsheetRows.length)
      : 0;

  return (
    <div className="w-full min-w-0 pb-16">
      {/* ===================================================================== */}
      {/* VIEW MODE 1: CORPORATE REPORTS LIST */}
      {/* ===================================================================== */}
      {viewMode === "list" && (
        <div className="space-y-6 animate-fade-in">
          {/* Clean Executive Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Reports &amp; Documentation
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Create, edit, and export operational progress reports for line manager review.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartBlank}
                className="text-xs border-slate-200 dark:border-white/10"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                <span>Blank Report</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsTemplateModalOpen(true)}
                className="bg-[#ED2618] hover:bg-red-700 text-white text-xs"
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                <span>Choose Template</span>
              </Button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-white/10 text-xs shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search reports by title, author, manager..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#ED2618]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={cadenceFilter}
                onChange={(e) => setCadenceFilter(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Cadences</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="AD_HOC">Ad-Hoc</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="APPROVED">Approved</option>
              </select>
            </div>
          </div>

          {/* Reports Grid */}
          {reportsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportsList.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c0d12] p-5 shadow-sm hover:border-[#ED2618]/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#ED2618]">
                        {item.reference}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          item.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : item.status === "SUBMITTED"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.summary || "No summary provided."}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/[0.05] text-[11px] text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>Author: {item.authorName}</span>
                      <span>{new Date(item.reportDate).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span>Manager: {item.lineManagerName || "Unassigned"}</span>
                      <span>{item.cadence}</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReport(item.id, item.reference)}
                        className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 h-7 px-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditReport(item)}
                        className="h-7 text-xs border-slate-200 dark:border-white/10"
                      >
                        <Edit3 className="h-3.5 w-3.5 mr-1" />
                        <span>Open &amp; Edit</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c0d12] p-10 text-center shadow-sm">
              <div className="max-w-md mx-auto space-y-3">
                <div className="h-12 w-12 rounded-xl bg-red-50 text-[#ED2618] dark:bg-red-950/30 mx-auto flex items-center justify-center">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  No Reports Created Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Start from a structured blank template or choose an executive pre-configured template to draft detailed field milestones, attach site photos, populate spreadsheet data, and export PDFs for your line manager.
                </p>
                <div className="flex items-center justify-center gap-2.5 pt-2">
                  <Button variant="outline" size="sm" onClick={handleStartBlank} className="text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    <span>Start Blank</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="bg-[#ED2618] hover:bg-red-700 text-white text-xs"
                  >
                    <span>Choose Template</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW MODE 2: DOCUMENT EDITOR (Fixed Top Header, Perfectly Docked) */}
      {/* ===================================================================== */}
      {viewMode === "editor" && (
        <div className="space-y-6 animate-fade-in relative">
          {/* Clean, Fixed Top Action Bar - Perfectly Docked with Negative Margins to Prevent Any Text Scrolling Past */}
          <div className="sticky -top-4 sm:-top-6 lg:-top-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-white/95 dark:bg-[#0c0d12]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 z-30 shadow-sm print-hide flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className="text-xs text-slate-600 dark:text-slate-300 h-8"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                <span>All Reports</span>
              </Button>

              <div className="h-4 w-px bg-slate-200 dark:bg-white/10 hidden sm:block" />

              <span className="font-mono text-xs font-bold text-[#ED2618]">
                {reference}
              </span>

              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  status === "APPROVED"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : status === "SUBMITTED"
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                }`}
              >
                {status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
                onClick={() => handleSaveReport()}
                className="text-xs h-8 border-slate-200 dark:border-white/10"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                <span>{isSaving ? "Saving..." : "Save Draft"}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs h-8 border-slate-200 dark:border-white/10"
                title="Convert to PDF via Browser Print"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                <span>Export PDF</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                disabled={isSaving || status === "SUBMITTED"}
                onClick={() => handleSaveReport("SUBMITTED")}
                className="bg-[#ED2618] hover:bg-red-700 text-white text-xs h-8"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                <span>{status === "SUBMITTED" ? "Submitted" : "Submit to Manager"}</span>
              </Button>
            </div>
          </div>

          {/* ================================================================= */}
          {/* CLEAN DOCUMENT PAPER SHEET (Centered, Professional Formatting) */}
          {/* ================================================================= */}
          <div className="max-w-4xl mx-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white text-slate-900 shadow-md p-6 sm:p-10 space-y-6 print-document-container">
            {/* 1. Header & Title Block */}
            <div className="border-b border-slate-200 pb-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DextaLogo className="h-8 w-auto text-slate-900" />
                  <div className="border-l border-slate-300 pl-3">
                    <span className="text-xs font-bold text-slate-900 block">
                      Dexta Africa
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Operations &amp; Infrastructure
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Reference
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {reference}
                  </span>
                </div>
              </div>

              {/* Editable Report Title */}
              <div className="pt-2">
                <label className="text-[10px] font-semibold text-slate-400 block mb-1 print-hide">
                  Report Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter Report Title..."
                  className="w-full text-xl sm:text-2xl font-bold text-slate-900 tracking-tight border-b border-transparent hover:border-slate-300 focus:border-[#ED2618] focus:outline-none transition-all pb-1 bg-transparent"
                />
              </div>

              {/* Report Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    Cadence:
                  </span>
                  <select
                    value={cadence}
                    onChange={(e) => setCadence(e.target.value as any)}
                    className="font-medium text-slate-900 bg-transparent focus:outline-none cursor-pointer mt-0.5"
                  >
                    <option value="DAILY">Daily Report</option>
                    <option value="WEEKLY">Weekly Report</option>
                    <option value="MONTHLY">Monthly Report</option>
                    <option value="AD_HOC">Ad-Hoc Review</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    Department:
                  </span>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="font-medium text-slate-900 bg-transparent focus:outline-none cursor-pointer mt-0.5"
                  >
                    <option value="OPERATIONS">Operations</option>
                    <option value="ENGINEERING">Engineering</option>
                    <option value="FINANCE">Finance</option>
                    <option value="IT">Systems IT</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    Date:
                  </span>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="font-medium text-slate-900 bg-transparent focus:outline-none cursor-pointer mt-0.5"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    Status:
                  </span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {status}
                  </span>
                </div>
              </div>

              {/* Author & Manager Line */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    Prepared By:
                  </span>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Author Name"
                    className="font-semibold text-slate-900 w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-[#ED2618] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={authorTitle}
                    onChange={(e) => setAuthorTitle(e.target.value)}
                    placeholder="Author Title / Role"
                    className="text-[11px] text-slate-500 w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-[#ED2618] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    Reviewed By (Line Manager):
                  </span>
                  <input
                    type="text"
                    value={lineManagerName}
                    onChange={(e) => setLineManagerName(e.target.value)}
                    placeholder="Line Manager Name"
                    className="font-semibold text-slate-900 w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-[#ED2618] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={lineManagerTitle}
                    onChange={(e) => setLineManagerTitle(e.target.value)}
                    placeholder="Line Manager Title"
                    className="text-[11px] text-slate-500 w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-[#ED2618] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Executive Summary */}
            <div className="space-y-2 print-avoid-break">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Executive Summary
              </h3>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary of operations, milestone deliverables, and shift progress for line manager..."
                className="w-full text-xs text-slate-800 leading-relaxed p-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#ED2618] focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* 3. Narrative Sections (Word-like text blocks) */}
            <div className="space-y-5">
              {sections.map((sec) => (
                <div key={sec.id} className="space-y-2 print-avoid-break">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => handleUpdateSection(sec.id, "title", e.target.value)}
                      className="font-bold text-xs uppercase tracking-wider text-slate-900 w-full max-w-lg bg-transparent focus:outline-none focus:border-b focus:border-[#ED2618]"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteSection(sec.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1 print-hide"
                      title="Remove Section"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={sec.content}
                    onChange={(e) => handleUpdateSection(sec.id, "content", e.target.value)}
                    placeholder="Enter narrative details, contractor progress, and site observations..."
                    className="w-full text-xs text-slate-800 leading-relaxed p-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#ED2618] focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              ))}

              <div className="text-right print-hide">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddSection}
                  className="text-xs border-dashed border-slate-300"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  <span>Add Section</span>
                </Button>
              </div>
            </div>

            {/* 4. Excel-Style Spreadsheet Data Table */}
            <div className="space-y-3 print-avoid-break">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-[#ED2618]" />
                  <span>Milestone Deliverables &amp; Work Breakdown Matrix</span>
                </h3>

                <div className="print-hide">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddRow}
                    className="text-xs border-slate-300 h-7"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    <span>Add Row</span>
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Milestone / Work Item</th>
                      <th className="px-3 py-2">Location / Zone</th>
                      <th className="px-3 py-2">Contractor / Team</th>
                      <th className="px-3 py-2 w-24">Scope / Qty</th>
                      <th className="px-3 py-2 w-28">Status</th>
                      <th className="px-3 py-2 w-20">Progress</th>
                      <th className="px-3 py-2">Variance / Notes</th>
                      <th className="px-2 py-2 text-center w-8 print-hide"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {spreadsheetRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={row.item}
                            onChange={(e) => handleUpdateRow(row.id, "item", e.target.value)}
                            className="w-full bg-transparent px-1.5 py-1 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#ED2618] rounded"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={row.zone}
                            onChange={(e) => handleUpdateRow(row.id, "zone", e.target.value)}
                            className="w-full bg-transparent px-1.5 py-1 text-xs text-slate-700 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#ED2618] rounded"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={row.contractor}
                            onChange={(e) => handleUpdateRow(row.id, "contractor", e.target.value)}
                            className="w-full bg-transparent px-1.5 py-1 text-xs text-slate-700 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#ED2618] rounded"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={row.quantity}
                            onChange={(e) => handleUpdateRow(row.id, "quantity", e.target.value)}
                            className="w-full bg-transparent px-1.5 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#ED2618] rounded"
                          />
                        </td>
                        <td className="p-1.5">
                          <select
                            value={row.status}
                            onChange={(e) => handleUpdateRow(row.id, "status", e.target.value as any)}
                            className="w-full bg-transparent px-1 py-1 text-[10px] font-semibold uppercase rounded cursor-pointer focus:outline-none focus:bg-white"
                          >
                            <option value="COMPLETED">Completed</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="PENDING">Pending</option>
                            <option value="DELAYED">Delayed</option>
                          </select>
                        </td>
                        <td className="p-1.5">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={row.progressPct}
                              onChange={(e) => handleUpdateRow(row.id, "progressPct", parseInt(e.target.value) || 0)}
                              className="w-10 bg-transparent px-1 py-1 text-xs font-mono text-right font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#ED2618] rounded"
                            />
                            <span className="text-[10px] text-slate-400">%</span>
                          </div>
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={row.varianceNotes}
                            onChange={(e) => handleUpdateRow(row.id, "varianceNotes", e.target.value)}
                            className="w-full bg-transparent px-1.5 py-1 text-xs text-slate-600 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#ED2618] rounded"
                          />
                        </td>
                        <td className="p-1.5 text-center print-hide">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                            title="Delete Row"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Summary Footer */}
                  <tfoot className="bg-slate-50 font-semibold text-[11px] text-slate-700 border-t border-slate-200">
                    <tr>
                      <td className="px-3 py-2">
                        Total Items: {spreadsheetRows.length}
                      </td>
                      <td colSpan={3} className="px-3 py-2 text-slate-500">
                        Completed: {completedMilestoneCount} &bull; Ongoing: {inProgressMilestoneCount}
                      </td>
                      <td className="px-3 py-2 text-slate-500 text-right">
                        Average:
                      </td>
                      <td className="px-3 py-2 font-mono text-[#ED2618]">
                        {avgProgressPct}%
                      </td>
                      <td colSpan={2} className="px-3 py-2 text-[10px] text-slate-400 font-normal">
                        Completion Progress
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 5. Photographic Evidence & Attachments */}
            <div className="space-y-3 print-avoid-break">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-[#ED2618]" />
                  <span>Site Photos &amp; Inspection Evidence ({images.length})</span>
                </h3>

                <div className="relative print-hide">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" size="sm" className="text-xs border-slate-300 h-7 pointer-events-none">
                    <Upload className="h-3 w-3 mr-1" />
                    <span>Attach Photos</span>
                  </Button>
                </div>
              </div>

              {images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="rounded-lg border border-slate-200 p-2 space-y-1.5 bg-slate-50 print-avoid-break relative group"
                    >
                      <div className="relative aspect-[16/10] w-full rounded overflow-hidden bg-slate-100 border border-slate-200">
                        <Image
                          src={img.url}
                          alt={img.caption || "Site Evidence"}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img.id)}
                          className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity print-hide"
                          title="Remove Image"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 px-1">
                        <input
                          type="text"
                          value={img.caption}
                          onChange={(e) => handleUpdateImageCaption(img.id, e.target.value)}
                          placeholder="Photo Caption..."
                          className="w-full text-xs text-slate-800 bg-transparent focus:outline-none focus:border-b focus:border-[#ED2618]"
                        />
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {img.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400 print-hide">
                  <p>No site photos attached. Click &quot;Attach Photos&quot; to upload inspection proof.</p>
                </div>
              )}
            </div>

            {/* 6. Line Manager Review & Sign-Off Block */}
            <div className="border-t border-slate-200 pt-5 space-y-5 print-avoid-break">
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Line Manager Directives &amp; Review Notes
                </h3>
                <textarea
                  rows={2}
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  placeholder="Line manager feedback, approval conditions, and instructions..."
                  className="w-full text-xs text-slate-800 leading-relaxed p-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#ED2618] focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Formal Signature Lines */}
              <div className="grid grid-cols-2 gap-8 pt-2">
                <div className="space-y-4">
                  <div className="border-b border-slate-300 pb-1 h-10 flex items-end">
                    <span className="font-serif italic text-sm text-slate-800">
                      {authorName || "Author Signature"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {authorName || "Author Name"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {authorTitle} &bull; Dexta Africa
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono">
                      Date: {reportDate}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-b border-slate-300 pb-1 h-10 flex items-end">
                    <span className="font-serif italic text-sm text-slate-800">
                      {status === "APPROVED" ? lineManagerName : status === "SUBMITTED" ? "Submitted for Review" : ""}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {lineManagerName || "Line Manager Name"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {lineManagerTitle}
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono">
                      Status: {status}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TEMPLATE SELECTION MODAL */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Select Report Template"
        description="Choose a structured report layout configured for line manager review."
        maxWidth="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {/* Template 1: Blank */}
          <button
            type="button"
            onClick={handleStartBlank}
            className="p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#ED2618] bg-slate-50 dark:bg-white/[0.02] text-left transition-all space-y-2 group cursor-pointer"
          >
            <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-white group-hover:bg-[#ED2618] group-hover:text-white transition-colors">
              <Plus className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Blank Template
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Start from a clean slate with custom narrative sections, data grid, and photo attachments.
            </p>
          </button>

          {/* Template 2: Daily Operations */}
          <button
            type="button"
            onClick={() => handleStartTemplate("DAILY")}
            className="p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#ED2618] bg-slate-50 dark:bg-white/[0.02] text-left transition-all space-y-2 group cursor-pointer"
          >
            <div className="h-8 w-8 rounded-lg bg-red-50 text-[#ED2618] flex items-center justify-center group-hover:bg-[#ED2618] group-hover:text-white transition-colors">
              <HardHat className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Daily Operations Report
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Structured for daily field execution, ground progress, contractor deployment, and equipment uptime.
            </p>
          </button>

          {/* Template 3: Weekly Milestone Progress */}
          <button
            type="button"
            onClick={() => handleStartTemplate("WEEKLY")}
            className="p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#ED2618] bg-slate-50 dark:bg-white/[0.02] text-left transition-all space-y-2 group cursor-pointer"
          >
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Calendar className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Weekly Progress Report
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Consolidated weekly deliverables, contractor milestones, quality checks, and forward planning.
            </p>
          </button>

          {/* Template 4: Monthly Review */}
          <button
            type="button"
            onClick={() => handleStartTemplate("MONTHLY")}
            className="p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#ED2618] bg-slate-50 dark:bg-white/[0.02] text-left transition-all space-y-2 group cursor-pointer"
          >
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Briefcase className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Monthly Operational Review
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Comprehensive monthly performance analysis, resource health, and line manager directives.
            </p>
          </button>
        </div>
      </Modal>
    </div>
  );
}
