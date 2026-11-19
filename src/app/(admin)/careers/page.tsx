"use client";

import * as React from "react";
import {
  Briefcase,
  Plus,
  RefreshCw,
  Search,
  MapPin,
  Clock,
  Edit3,
  Trash2,
  CheckCircle2,
  Users,
  Globe,
  EyeOff,
  UserCheck,
  Send,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import {
  SaveCareerListingSchema,
  formatZodError,
} from "@/lib/validation/schemas";

export interface CareerInquiryRecord {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string | null;
  resumeUrl?: string | null;
  coverLetter?: string | null;
  source: string;
  createdAt: string;
}

export interface CareerOpeningRecord {
  id: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  type: string;
  summary: string;
  requirements: string[];
  benefits: string[];
  description?: Record<string, any>;
  status:
    | "PENDING_IT_APPROVAL"
    | "OPEN"
    | "FILLED_PENDING_TAKEDOWN"
    | "CLOSED"
    | "open"
    | "closed";
  published: boolean;
  initiatedById?: string | null;
  initiatedByName?: string | null;
  initiatedByEmail?: string | null;
  itApprovedById?: string | null;
  itApprovedByName?: string | null;
  itApprovedAt?: string | null;
  takedownRequestedAt?: string | null;
  takedownNotes?: string | null;
  takenDownById?: string | null;
  takenDownByName?: string | null;
  takenDownAt?: string | null;
  applicantClickCount: number;
  inquiries?: CareerInquiryRecord[];
  createdAt: string;
  updatedAt: string;
}

interface StatsState {
  total: number;
  pendingIt: number;
  open: number;
  filledPendingTakedown: number;
  closed: number;
}

export default function CareersPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [openings, setOpenings] = React.useState<CareerOpeningRecord[]>([]);
  const [stats, setStats] = React.useState<StatsState>({
    total: 0,
    pendingIt: 0,
    open: 0,
    filledPendingTakedown: 0,
    closed: 0,
  });
  const [currentUser, setCurrentUser] = React.useState<{
    id: string;
    role: string;
    department: string;
    fullName: string;
  } | null>(null);

  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState<
    "ALL" | "PENDING_IT_APPROVAL" | "OPEN" | "FILLED_PENDING_TAKEDOWN" | "CLOSED"
  >("ALL");

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Modals
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<CareerOpeningRecord | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] =
    React.useState<CareerOpeningRecord | null>(null);
  const [takedownModalItem, setTakedownModalItem] =
    React.useState<CareerOpeningRecord | null>(null);
  const [takedownNotes, setTakedownNotes] = React.useState("");
  const [inquiriesModalItem, setInquiriesModalItem] =
    React.useState<CareerOpeningRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form Fields
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [department, setDepartment] = React.useState("Architecture & Engineering");
  const [location, setLocation] = React.useState("Lagos, Nigeria (Hybrid)");
  const [type, setType] = React.useState("Full-Time");
  const [summary, setSummary] = React.useState("");
  const [requirementsText, setRequirementsText] = React.useState("");
  const [benefitsText, setBenefitsText] = React.useState("");

  const fetchCareers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/careers");
      if (!res.ok) throw new Error("Could not fetch career openings");
      const json = await res.json();
      setOpenings(json.data || []);
      if (json.stats) setStats(json.stats);
      if (json.currentUser) setCurrentUser(json.currentUser);
    } catch (err: any) {
      toastError("Careers Sync Error", err.message || "Failed to load listings");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  React.useEffect(() => {
    fetchCareers();
  }, [fetchCareers]);

  const userRole = (currentUser?.role || "").toUpperCase();
  const userDept = (currentUser?.department || "").toUpperCase();
  const isSuperAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";
  const isItStaff = isSuperAdmin || userRole === "IT_ADMIN" || userDept === "IT";
  const isHrStaff = isSuperAdmin || userRole === "HR_MANAGER" || userDept === "HR";

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle("");
    setSlug("");
    setDepartment("Architecture & Engineering");
    setLocation("Lagos, Nigeria (Hybrid)");
    setType("Full-Time");
    setSummary("");
    setRequirementsText(
      "• 5+ years relevant experience\n• Bachelor's/Master's degree in field\n• Strong track record across African markets\n• Excellent analytical & leadership capabilities"
    );
    setBenefitsText(
      "• Competitive executive remuneration\n• Comprehensive global health coverage\n• Performance bonus & equity incentives\n• Relocation & mobility support"
    );
    setFieldErrors({});
    setIsFormOpen(true);
  };

  const openEditModal = (item: CareerOpeningRecord) => {
    setEditingItem(item);
    setTitle(item.title);
    setSlug(item.slug);
    setDepartment(item.department || "Architecture & Engineering");
    setLocation(item.location || "Lagos, Nigeria");
    setType(item.type || "Full-Time");
    setSummary(item.summary || "");
    setRequirementsText((item.requirements || []).join("\n"));
    setBenefitsText((item.benefits || []).join("\n"));
    setFieldErrors({});
    setIsFormOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    clearFieldError("title");
    if (!editingItem) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
      clearFieldError("slug");
    }
  };

  // Submit new or updated opening
  const handleSaveListing = async (e: React.FormEvent) => {
    e.preventDefault();

    const requirements = requirementsText
      .split("\n")
      .map((s) => s.replace(/^[•\-\*]\s*/, "").trim())
      .filter(Boolean);

    const benefits = benefitsText
      .split("\n")
      .map((s) => s.replace(/^[•\-\*]\s*/, "").trim())
      .filter(Boolean);

    const rawPayload = {
      title: title.trim(),
      slug: slug.trim(),
      department: department.trim(),
      location: location.trim(),
      type: type.trim(),
      summary: summary.trim(),
      requirements,
      benefits,
      status: editingItem ? editingItem.status : "PENDING_IT_APPROVAL",
      published: editingItem ? editingItem.published : false,
    };

    const parsed = SaveCareerListingSchema.safeParse(rawPayload);
    if (!parsed.success) {
      const errResult = formatZodError(parsed.error);
      const errMap: Record<string, string> = {};
      for (const [k, v] of Object.entries(errResult.fieldErrors)) {
        errMap[k] = v[0];
      }
      setFieldErrors(errMap);
      toastError("Validation Error", errResult.error);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const url = editingItem ? `/api/careers/${editingItem.id}` : "/api/careers";
      const method = editingItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Save operation failed");
      }

      toastSuccess(
        editingItem ? "Role Updated" : "Opening Initiated by HR",
        editingItem
          ? `"${title}" has been updated.`
          : `"${title}" initiated. IT Department has been notified to review and publish to website.`
      );
      setIsFormOpen(false);
      fetchCareers();
    } catch (err: any) {
      toastError("Operation Failed", err.message || "Could not save role");
    } finally {
      setIsSubmitting(false);
    }
  };

  // IT Action: Approve & Publish to Website
  const handleItApprove = async (item: CareerOpeningRecord) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/careers/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "IT_APPROVE" }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Approval failed");
      }

      toastSuccess(
        "Approved & Published to Website",
        `IT has cleared "${item.title}". It is now live on the website, and HR has been notified.`
      );
      fetchCareers();
    } catch (err: any) {
      toastError("IT Approval Failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // HR Action: Send Role Filled Takedown Request to IT
  const handleHrRequestTakedown = async () => {
    if (!takedownModalItem) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/careers/${takedownModalItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "HR_REQUEST_TAKEDOWN",
          notes: takedownNotes.trim() || "Role successfully filled. Candidate selected.",
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Takedown request failed");
      }

      toastSuccess(
        "Takedown Dispatched to IT",
        `HR marked "${takedownModalItem.title}" as filled. IT Department has been alerted to unpublish from website.`
      );
      setTakedownModalItem(null);
      setTakedownNotes("");
      fetchCareers();
    } catch (err: any) {
      toastError("Takedown Request Failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // IT Action: Take Down Post from Website
  const handleItTakedown = async (item: CareerOpeningRecord) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/careers/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "IT_TAKEDOWN" }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Takedown failed");
      }

      toastSuccess(
        "Post Taken Down",
        `"${item.title}" unpublished from company website. Status set to Closed.`
      );
      fetchCareers();
    } catch (err: any) {
      toastError("Takedown Failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Test simulation for inbound website applicant click/inquiry
  const handleSimulateWebsiteApplicant = async (item: CareerOpeningRecord) => {
    setIsSubmitting(true);
    try {
      const testCandidates = [
        { name: "Folake Balogun", email: "folake.b@gmail.com", phone: "+234 802 345 6789" },
        { name: "Kofi Mensah", email: "kofi.mensah@devmail.africa", phone: "+233 24 555 1234" },
        { name: "Amara Okeke", email: "amara.okeke@yahoo.com", phone: "+234 813 999 8888" },
      ];
      const randomCandidate =
        testCandidates[Math.floor(Math.random() * testCandidates.length)];

      const res = await fetch(`/api/careers/${item.id}/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantName: randomCandidate.name,
          applicantEmail: randomCandidate.email,
          applicantPhone: randomCandidate.phone,
          coverLetter: `Hello Dexta Talent Team, I am submitting my portfolio for the ${item.title} position published on your company website.`,
          source: "WEBSITE_APPLICATION",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Inquiry simulation failed");
      }

      toastSuccess(
        "Website Application Simulated",
        `Candidate "${randomCandidate.name}" applied for "${item.title}". Real-time alert dispatched to HR Department!`
      );
      fetchCareers();
    } catch (err: any) {
      toastError("Simulation Failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmItem) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/careers/${deleteConfirmItem.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete operation failed");

      toastSuccess("Opening Deleted", `"${deleteConfirmItem.title}" was removed.`);
      setDeleteConfirmItem(null);
      fetchCareers();
    } catch (err: any) {
      toastError("Delete Failed", err.message || "Could not delete career opening");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter listings
  const filtered = openings.filter((c) => {
    const normStatus = (c.status || "").toUpperCase();
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      departmentFilter === "all" || c.department === departmentFilter;

    let matchesStatus = true;
    if (statusFilter === "PENDING_IT_APPROVAL") {
      matchesStatus = normStatus === "PENDING_IT_APPROVAL";
    } else if (statusFilter === "OPEN") {
      matchesStatus = normStatus === "OPEN" || normStatus === "OPEN";
    } else if (statusFilter === "FILLED_PENDING_TAKEDOWN") {
      matchesStatus = normStatus === "FILLED_PENDING_TAKEDOWN";
    } else if (statusFilter === "CLOSED") {
      matchesStatus = normStatus === "CLOSED";
    }

    return matchesSearch && matchesDept && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "PENDING_IT_APPROVAL":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
            <Clock className="h-3 w-3" />
            Awaiting IT Approval
          </span>
        );
      case "OPEN":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
            <Globe className="h-3 w-3" />
            Live on Website
          </span>
        );
      case "FILLED_PENDING_TAKEDOWN":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
            <UserCheck className="h-3 w-3" />
            Role Filled &bull; Takedown Requested
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 border border-slate-200 dark:border-white/10">
            <EyeOff className="h-3 w-3" />
            Unpublished / Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Careers &amp; Talent Acquisition
            </h1>
            <Badge
              variant="outline"
              className="font-mono text-xs text-[#ED2618] border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/10"
            >
              HR &bull; IT Governance Flow
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            HR initiates vacancies &bull; IT reviews &amp; approves website publishing &bull; Website clicks alert HR &bull; HR notifies IT to take down filled roles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchCareers()}
            leftIcon={
              <RefreshCw
                className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"}
              />
            }
          >
            Sync
          </Button>

          {isHrStaff && (
            <Button
              size="sm"
              variant="primary"
              onClick={openCreateModal}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Initiate Job Opening
            </Button>
          )}
        </div>
      </div>

      {/* Role & Department Guidance Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-r from-red-50/60 via-slate-50/50 to-white dark:from-red-950/20 dark:via-[#15161c] dark:to-[#121217] p-4 text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#ED2618]/10 text-[#ED2618] flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">
              Department Clearance Gate Active
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              {currentUser
                ? `Acting as ${currentUser.fullName} (${currentUser.department} &bull; ${currentUser.role})`
                : "Synchronizing permissions..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-white/80 dark:bg-white/10 px-2.5 py-1 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
            1. HR Initiates &rarr; 2. IT Publishes &rarr; 3. Website Clicks Alert HR &rarr; 4. Filled Post Taken Down
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            statusFilter === "ALL"
              ? "border-[#ED2618] bg-red-50/30 dark:bg-red-500/10 shadow-sm"
              : "border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total Openings
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {stats.total}
          </p>
        </div>

        <div
          onClick={() => setStatusFilter("PENDING_IT_APPROVAL")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            statusFilter === "PENDING_IT_APPROVAL"
              ? "border-amber-500 bg-amber-50/40 dark:bg-amber-500/10 shadow-sm"
              : "border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Awaiting IT
          </span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {stats.pendingIt}
          </p>
        </div>

        <div
          onClick={() => setStatusFilter("OPEN")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            statusFilter === "OPEN"
              ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-500/10 shadow-sm"
              : "border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Globe className="h-3.5 w-3.5" />
            Live on Website
          </span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.open}
          </p>
        </div>

        <div
          onClick={() => setStatusFilter("FILLED_PENDING_TAKEDOWN")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            statusFilter === "FILLED_PENDING_TAKEDOWN"
              ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-500/10 shadow-sm"
              : "border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            <UserCheck className="h-3.5 w-3.5" />
            Role Filled
          </span>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {stats.filledPendingTakedown}
          </p>
        </div>

        <div
          onClick={() => setStatusFilter("CLOSED")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            statusFilter === "CLOSED"
              ? "border-slate-500 bg-slate-100 dark:bg-white/10 shadow-sm"
              : "border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <EyeOff className="h-3.5 w-3.5" />
            Taken Down
          </span>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
            {stats.closed}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] p-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search roles by title, department, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 hidden sm:inline">Department:</span>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#15161c] px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none w-full sm:w-auto"
          >
            <option value="all">All Departments</option>
            <option value="Architecture & Engineering">Architecture &amp; Engineering</option>
            <option value="Real Estate Development">Real Estate Development</option>
            <option value="Finance & Investment">Finance &amp; Investment</option>
            <option value="Operations & Legal">Operations &amp; Legal</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="mx-auto h-10 w-10 text-slate-400" />
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
              No career openings found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {openings.length === 0
                ? "No positions currently created. HR can click 'Initiate Job Opening' to submit a requisition for IT website clearance."
                : "No positions match your selected filter criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-slate-500 font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Position &amp; Department</th>
                  <th className="px-5 py-3.5">Workflow Status</th>
                  <th className="px-5 py-3.5">Website Activity</th>
                  <th className="px-5 py-3.5">Governance Audit</th>
                  <th className="px-5 py-3.5 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {filtered.map((item) => {
                  const normStatus = (item.status || "").toUpperCase();
                  const isPendingIt = normStatus === "PENDING_IT_APPROVAL";
                  const isOpen = normStatus === "OPEN";
                  const isFilledPendingTakedown =
                    normStatus === "FILLED_PENDING_TAKEDOWN";
                  const isClosed = normStatus === "CLOSED";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Position & Department */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {item.title}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400">
                            {item.department} &bull;{" "}
                            <span className="font-mono text-[11px] text-slate-400">
                              /{item.slug}
                            </span>
                          </p>
                          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1 text-[#ED2618]">
                              <MapPin className="h-3 w-3" />
                              {item.location}
                            </span>
                            <span>&bull;</span>
                            <span className="font-medium text-slate-600 dark:text-slate-300">
                              {item.type}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          {getStatusBadge(item.status)}
                          {isPendingIt && (
                            <p className="text-[11px] text-amber-600/90 dark:text-amber-400/90 font-medium">
                              Waiting for IT web approval
                            </p>
                          )}
                          {isOpen && (
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              Published on live website
                            </p>
                          )}
                          {isFilledPendingTakedown && (
                            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                              Takedown requested by HR
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Website Activity / Clicks */}
                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          <button
                            onClick={() => setInquiriesModalItem(item)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-2.5 py-1 text-slate-700 dark:text-slate-200 hover:border-red-400 transition-colors"
                          >
                            <Users className="h-3.5 w-3.5 text-[#ED2618]" />
                            <span className="font-bold tabular-nums">
                              {item.applicantClickCount || 0}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Clicks / Leads
                            </span>
                          </button>

                          {isOpen && (
                            <div>
                              <button
                                onClick={() => handleSimulateWebsiteApplicant(item)}
                                disabled={isSubmitting}
                                className="text-[10px] text-[#ED2618] hover:underline flex items-center gap-1"
                                title="Simulate a candidate clicking/applying from the website to trigger the real-time HR notification"
                              >
                                <Sparkles className="h-3 w-3" />
                                Simulate Website Applicant
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Governance Audit */}
                      <td className="px-5 py-4 text-[11px] text-slate-500">
                        <div className="space-y-1">
                          {item.initiatedByName && (
                            <p>
                              <strong className="text-slate-700 dark:text-slate-300">
                                HR Lead:
                              </strong>{" "}
                              {item.initiatedByName}
                            </p>
                          )}
                          {item.itApprovedByName && (
                            <p>
                              <strong className="text-slate-700 dark:text-slate-300">
                                IT Approved:
                              </strong>{" "}
                              {item.itApprovedByName}
                            </p>
                          )}
                          {item.takenDownByName && (
                            <p>
                              <strong className="text-slate-700 dark:text-slate-300">
                                IT Takedown:
                              </strong>{" "}
                              {item.takenDownByName}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400">
                            Updated: {formatDate(item.updatedAt)}
                          </p>
                        </div>
                      </td>

                      {/* Interactive Department Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {/* 1. IT Clearance Button */}
                          {isPendingIt && isItStaff && (
                            <Button
                              size="xs"
                              variant="primary"
                              isLoading={isSubmitting}
                              onClick={() => handleItApprove(item)}
                              leftIcon={<Globe className="h-3.5 w-3.5" />}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Approve for Website
                            </Button>
                          )}

                          {/* 2. HR Role Filled -> Request Takedown Button */}
                          {isOpen && isHrStaff && (
                            <Button
                              size="xs"
                              variant="secondary"
                              isLoading={isSubmitting}
                              onClick={() => {
                                setTakedownModalItem(item);
                                setTakedownNotes(
                                  "Position filled by successful candidate. Please unpublish from the company website."
                                );
                              }}
                              leftIcon={<UserCheck className="h-3.5 w-3.5 text-indigo-500" />}
                            >
                              Role Filled (Notify IT)
                            </Button>
                          )}

                          {/* 3. IT Takedown Button */}
                          {(isFilledPendingTakedown || (isOpen && isItStaff)) && isItStaff && (
                            <Button
                              size="xs"
                              variant="danger"
                              isLoading={isSubmitting}
                              onClick={() => handleItTakedown(item)}
                              leftIcon={<EyeOff className="h-3.5 w-3.5" />}
                            >
                              Take Down Post
                            </Button>
                          )}

                          {/* Re-open if closed */}
                          {isClosed && (isHrStaff || isItStaff) && (
                            <Button
                              size="xs"
                              variant="ghost"
                              isLoading={isSubmitting}
                              onClick={async () => {
                                await fetch(`/api/careers/${item.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ action: "REOPEN" }),
                                });
                                toastSuccess("Position Reopened", "Re-submitted for IT web clearance.");
                                fetchCareers();
                              }}
                            >
                              Re-open Opening
                            </Button>
                          )}

                          {/* Secondary options */}
                          <div className="flex items-center gap-1 mt-1">
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => openEditModal(item)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => setDeleteConfirmItem(item)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Initiate or Edit Opening (HR) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? "Edit Career Opening" : "Initiate Job Opening (HR)"}
        description="Configure role responsibilities and requirements. Submitting dispatches an automated clearance notification to IT before going live on the company website."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveListing} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Position Title"
              placeholder="e.g. Senior Architectural Project Lead"
              value={title}
              error={fieldErrors.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
            <Input
              label="URL Slug"
              placeholder="e.g. senior-architectural-project-lead"
              value={slug}
              error={fieldErrors.slug}
              onChange={(e) => {
                setSlug(e.target.value);
                clearFieldError("slug");
              }}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  clearFieldError("department");
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="Architecture & Engineering">Architecture &amp; Engineering</option>
                <option value="Real Estate Development">Real Estate Development</option>
                <option value="Finance & Investment">Finance &amp; Investment</option>
                <option value="Operations & Legal">Operations &amp; Legal</option>
              </select>
              {fieldErrors.department && (
                <p className="text-xs font-medium text-red-500">{fieldErrors.department}</p>
              )}
            </div>

            <Input
              label="Location"
              placeholder="Lagos, Nigeria (Hybrid)"
              value={location}
              error={fieldErrors.location}
              onChange={(e) => {
                setLocation(e.target.value);
                clearFieldError("location");
              }}
            />

            <Input
              label="Employment Type"
              placeholder="Full-Time / Contract"
              value={type}
              error={fieldErrors.type}
              onChange={(e) => {
                setType(e.target.value);
                clearFieldError("type");
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Role Executive Summary
            </label>
            <textarea
              rows={2}
              placeholder="Brief summary of candidate scope and responsibilities..."
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                clearFieldError("summary");
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            {fieldErrors.summary && (
              <p className="text-xs font-medium text-red-500">{fieldErrors.summary}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Requirements (One per line)
              </label>
              <textarea
                rows={4}
                value={requirementsText}
                onChange={(e) => {
                  setRequirementsText(e.target.value);
                  clearFieldError("requirements");
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {fieldErrors.requirements && (
                <p className="text-xs font-medium text-red-500">{fieldErrors.requirements}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Benefits &amp; Perks (One per line)
              </label>
              <textarea
                rows={4}
                value={benefitsText}
                onChange={(e) => {
                  setBenefitsText(e.target.value);
                  clearFieldError("benefits");
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {fieldErrors.benefits && (
                <p className="text-xs font-medium text-red-500">{fieldErrors.benefits}</p>
              )}
            </div>
          </div>

          {/* Governance Notice */}
          <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 p-3 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
            <Clock className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold">IT Clearance Gate</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                New positions require IT Department authorization before being published to the public company website. Once approved, all inbound applicants will immediately alert HR.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => setIsFormOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
            >
              {editingItem ? "Save Changes" : "Submit Opening for IT Clearance"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: HR Role Filled & Takedown Request */}
      <Modal
        isOpen={Boolean(takedownModalItem)}
        onClose={() => setTakedownModalItem(null)}
        title="Mark Role as Filled & Notify IT"
        description="Notify the IT department that a candidate has been selected so they can take down the post from the website."
        maxWidth="md"
        footer={
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setTakedownModalItem(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              isLoading={isSubmitting}
              onClick={handleHrRequestTakedown}
              leftIcon={<Send className="h-3.5 w-3.5" />}
            >
              Dispatch Takedown Notice to IT
            </Button>
          </>
        }
      >
        {takedownModalItem && (
          <div className="space-y-3">
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 p-3 border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-200">
              Position: <strong className="font-bold">{takedownModalItem.title}</strong> &bull;{" "}
              {takedownModalItem.department}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Handover &amp; Takedown Notes for IT:
              </label>
              <textarea
                rows={3}
                value={takedownNotes}
                onChange={(e) => setTakedownNotes(e.target.value)}
                placeholder="e.g. Candidate accepted offer. Please remove from live website effective immediately."
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 3: Candidate Inquiries & Website Clicks Viewer */}
      <Modal
        isOpen={Boolean(inquiriesModalItem)}
        onClose={() => setInquiriesModalItem(null)}
        title={`Website Inquiries: ${inquiriesModalItem?.title || ""}`}
        description="Real-time candidate submissions and click inquiries routed from the company website."
        maxWidth="lg"
      >
        {inquiriesModalItem && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs rounded-xl bg-slate-50 dark:bg-white/5 p-3 border border-slate-200 dark:border-white/10">
              <div>
                <span className="text-slate-500">Total Website Clicks:</span>{" "}
                <strong className="text-slate-900 dark:text-white tabular-nums">
                  {inquiriesModalItem.applicantClickCount || 0}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Applications Recorded:</span>{" "}
                <strong className="text-slate-900 dark:text-white tabular-nums">
                  {inquiriesModalItem.inquiries?.length || 0}
                </strong>
              </div>
            </div>

            {(!inquiriesModalItem.inquiries || inquiriesModalItem.inquiries.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No formal candidate submissions logged yet. Clicks are tracked from the live website.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/10 max-h-80 overflow-y-auto">
                {inquiriesModalItem.inquiries.map((inq) => (
                  <div key={inq.id} className="py-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {inq.applicantName}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(inq.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      {inq.applicantEmail} {inq.applicantPhone && `&bull; ${inq.applicantPhone}`}
                    </p>
                    {inq.coverLetter && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-white/[0.02] p-2 rounded-lg">
                        &ldquo;{inq.coverLetter}&rdquo;
                      </p>
                    )}
                    <span className="inline-block rounded-md bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-mono text-slate-500">
                      Source: {inq.source}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal 4: Delete Confirmation */}
      <Modal
        isOpen={Boolean(deleteConfirmItem)}
        onClose={() => setDeleteConfirmItem(null)}
        title="Delete Job Opening?"
        description="Permanently remove this career opening from the database."
        maxWidth="sm"
        footer={
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeleteConfirmItem(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              isLoading={isSubmitting}
              onClick={handleDelete}
            >
              Confirm Delete
            </Button>
          </>
        }
      >
        {deleteConfirmItem && (
          <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 border border-red-200 dark:border-red-500/20 text-xs text-slate-700 dark:text-slate-300">
            Role: <strong className="text-slate-900 dark:text-white">{deleteConfirmItem.title}</strong>
          </div>
        )}
      </Modal>
    </div>
  );
}
