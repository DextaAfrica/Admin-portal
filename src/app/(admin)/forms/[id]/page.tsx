"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  Building2,
  Calendar,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Search,
  CheckCircle2,
  Globe2,
  UserCheck,
  Briefcase,
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  Phone,
  Mail,
  Printer,
  ShieldCheck,
  Send,
  Sparkles,
  X,
  CheckSquare,
  UploadCloud,
  Sliders,
  Plus,
  Trash2,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";

interface Submission {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  category: string;
  attendanceMode: string;
  answers: Record<string, any>;
  notes: string;
  status: string;
  consentAcknowledged?: boolean;
  consentTimestamp?: string | null;
  ipAddress?: string;
  createdAt: string;
}

interface AnalyticsData {
  form: {
    id: string;
    slug: string;
    title: string;
    description: string;
    formType: string;
    status: string;
    eventDate: string | null;
    eventLocation: string;
    fields?: { id: string; label: string; type: string }[];
    sendConfirmationEmail?: boolean;
    requireConsent?: boolean;
    consentNotice?: string;
  };
  demographics: {
    totalCount: number;
    categoryBreakdown: { label: string; count: number; pct: number }[];
    attendanceBreakdown: { mode: string; count: number; pct: number }[];
    topOrganizations: { company: string; count: number }[];
    timeline: { date: string; count: number }[];
  };
  submissions: Submission[];
}

export default function FormDemographicsPage({
  params,
}: {
  params?: { id?: string } | Promise<{ id?: string }>;
}) {
  const routeParams = useParams();
  const formId =
    (typeof routeParams?.id === "string" ? routeParams.id : "") ||
    (params && "id" in params && typeof params.id === "string" ? params.id : "");
  const { success: toastSuccess, error: toastError } = useToast();

  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");
  const [isCopied, setIsCopied] = React.useState(false);

  // Batch Email Dispatcher States
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = React.useState(false);
  const [batchSubject, setBatchSubject] = React.useState("");
  const [batchMessage, setBatchMessage] = React.useState("");
  const [isSendingBatch, setIsSendingBatch] = React.useState(false);

  // Upload Submissions States
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
  const [uploadMode, setUploadMode] = React.useState<"file" | "paste" | "single">("file");
  const [pastedSubmissions, setPastedSubmissions] = React.useState("");
  const [parsedUploads, setParsedUploads] = React.useState<any[]>([]);
  const [isSubmittingUpload, setIsSubmittingUpload] = React.useState(false);
  const [singleEntry, setSingleEntry] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    category: "Attendee",
    attendanceMode: "in-person",
    status: "registered",
    notes: "",
  });

  // Dynamic Fields Editor States
  const [isFieldsModalOpen, setIsFieldsModalOpen] = React.useState(false);
  const [editingFields, setEditingFields] = React.useState<any[]>([]);
  const [isSavingFields, setIsSavingFields] = React.useState(false);
  const [newFieldData, setNewFieldData] = React.useState({
    label: "",
    type: "text",
    placeholder: "",
    required: false,
    options: "",
  });

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/forms/${formId}/analytics`);
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to load demographics");
      setData(resData);
    } catch (err: any) {
      toastError(err.message || "Failed to load demographic data");
    } finally {
      setLoading(false);
    }
  }, [formId, toastError]);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleCopyLink = () => {
    if (!data?.form.slug) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/register/${data.form.slug}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toastSuccess("Link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      [
        "Full Name",
        "Email",
        "Phone",
        "Organization",
        "Job Title",
        "Category",
        "Attendance Mode",
        "Status",
        "Legal Consent Verified",
        "Consent Timestamp",
        "IP Address",
        "Notes",
        "Date Registered",
      ],
      ...data.submissions.map((s) => [
        `"${s.fullName.replace(/"/g, '""')}"`,
        `"${s.email.replace(/"/g, '""')}"`,
        `"${(s.phone || "").replace(/"/g, '""')}"`,
        `"${(s.company || "").replace(/"/g, '""')}"`,
        `"${(s.jobTitle || "").replace(/"/g, '""')}"`,
        `"${s.category}"`,
        `"${s.attendanceMode}"`,
        `"${s.status}"`,
        `"${s.consentAcknowledged !== false ? "YES (NDPR & GDPR Compliant)" : "NO"}"`,
        `"${s.consentTimestamp || s.createdAt}"`,
        `"${s.ipAddress || ""}"`,
        `"${(s.notes || "").replace(/"/g, '""')}"`,
        `"${s.createdAt.split("T")[0]}"`,
      ]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${data.form.slug}-leads-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess("CSV exported successfully");
  };

  const handleExportPDF = () => {
    window.print();
  };

  React.useEffect(() => {
    if (data?.form.fields) {
      setEditingFields(data.form.fields);
    }
  }, [data]);

  const parseUploadRows = (text: string) => {
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
          category: parts[5] || "Attendee",
          attendanceMode: parts[6] || "in-person",
          status: parts[7] || "registered",
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
      const parsed = parseUploadRows(content);
      setParsedUploads(parsed);
      if (parsed.length > 0) {
        toastSuccess(`Parsed ${parsed.length} row(s) from ${file.name}`);
      } else {
        toastError("No valid rows detected. Ensure columns are: Full Name, Email, Phone, Company");
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmUpload = async () => {
    let payload: any[] = [];
    if (uploadMode === "file" || uploadMode === "paste") {
      const items = uploadMode === "paste" ? parseUploadRows(pastedSubmissions) : parsedUploads;
      if (items.length === 0) {
        toastError("No submission rows to upload.");
        return;
      }
      payload = items;
    } else {
      if (!singleEntry.fullName || !singleEntry.email) {
        toastError("Full Name and Email are mandatory");
        return;
      }
      payload = [singleEntry];
    }

    setIsSubmittingUpload(true);
    try {
      const res = await fetch(`/api/forms/${formId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to upload submissions");

      toastSuccess(resData.message || `Uploaded ${payload.length} submission(s)`);
      setIsUploadModalOpen(false);
      setParsedUploads([]);
      setPastedSubmissions("");
      fetchAnalytics();
    } catch (err: any) {
      toastError(err.message || "Failed to upload submissions");
    } finally {
      setIsSubmittingUpload(false);
    }
  };

  const handleAddNewField = () => {
    if (!newFieldData.label.trim()) {
      toastError("Field Label is required");
      return;
    }
    const id = newFieldData.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || `field_${Date.now()}`;
    const opts = newFieldData.options
      ? newFieldData.options.split(",").map((o) => o.trim()).filter(Boolean)
      : undefined;

    const updated = [
      ...editingFields,
      {
        id,
        label: newFieldData.label.trim(),
        type: newFieldData.type,
        placeholder: newFieldData.placeholder.trim(),
        required: newFieldData.required,
        options: opts,
      },
    ];
    setEditingFields(updated);
    setNewFieldData({
      label: "",
      type: "text",
      placeholder: "",
      required: false,
      options: "",
    });
    toastSuccess(`Added "${newFieldData.label}" field`);
  };

  const handleRemoveField = (fieldId: string) => {
    setEditingFields(editingFields.filter((f) => f.id !== fieldId));
  };

  const handleSaveFields = async () => {
    setIsSavingFields(true);
    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: editingFields }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to save form fields");

      toastSuccess("Form fields updated successfully!");
      setIsFieldsModalOpen(false);
      fetchAnalytics();
    } catch (err: any) {
      toastError(err.message || "Failed to update form fields");
    } finally {
      setIsSavingFields(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-neutral-400">
        <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mb-3" />
        <span className="text-xs uppercase tracking-wider font-mono">Loading Demographic Telemetry...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-neutral-400">
        <p className="text-sm">Unable to load demographics for this portal.</p>
        <Link href="/forms" className="mt-4 inline-block text-xs text-red-400 underline">
          Return to links list
        </Link>
      </div>
    );
  }

  const { form, demographics, submissions } = data;

  // Filtered submissions
  const filteredSubmissions = submissions.filter((s) => {
    const matchesCat = selectedCategory === "ALL" || s.category.toUpperCase() === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      s.fullName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.company && s.company.toLowerCase().includes(q)) ||
      (s.jobTitle && s.jobTitle.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === filteredSubmissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubmissions.map((s) => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenBatchModal = () => {
    if (selectedIds.length === 0) {
      toastError("Please select at least one registrant to message.");
      return;
    }
    setBatchSubject(`Update: ${data?.form.title || "Registration Portal"}`);
    setBatchMessage(
      `Dear {{firstName}},\n\nThank you for registering for ${data?.form.title || "our portal"}.\n\nWe are pleased to reach out regarding your registration details.\n\nWarm regards,\nDexta Africa Executive Office`
    );
    setIsBatchModalOpen(true);
  };

  const insertToken = (token: string) => {
    setBatchMessage((prev) => prev + " " + token);
  };

  const handleSendBatchEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchSubject.trim() || !batchMessage.trim()) {
      toastError("Subject and message body are required.");
      return;
    }
    setIsSendingBatch(true);
    try {
      const res = await fetch(`/api/forms/${formId}/batch-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionIds: selectedIds,
          subject: batchSubject.trim(),
          message: batchMessage.trim(),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to dispatch batch email.");
      toastSuccess(
        `Dispatched batch emails to ${result.dispatchedCount} recipient(s).`
      );
      setIsBatchModalOpen(false);
      setSelectedIds([]);
    } catch (err: any) {
      toastError(err.message || "Failed to dispatch batch emails.");
    } finally {
      setIsSendingBatch(false);
    }
  };

  return (
    <div className="space-y-6 print:bg-white print:text-black">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <Link
            href="/forms"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Registration Links</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100">
              {form.title}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${
                form.formType === "onboarding"
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : form.formType === "partner"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {form.formType}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mt-1">
            <div className="flex items-center gap-1.5 font-mono text-neutral-300">
              <span>/register/{form.slug}</span>
              <button
                onClick={handleCopyLink}
                title="Copy registration link"
                className="p-1 hover:text-white transition-colors"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <span className="text-neutral-600">•</span>
            <Link
              href={`/register/${form.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-red-400 hover:underline"
            >
              <span>Open Public Page</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Export & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-red-600 hover:bg-red-500 text-white font-bold shadow-md shadow-red-600/30 text-xs h-8"
          >
            <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
            <span>Upload Details / Ingest</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFieldsModalOpen(true)}
            className="border-neutral-800 text-neutral-300 hover:bg-neutral-800 text-xs h-8 font-semibold"
          >
            <Sliders className="w-3.5 h-3.5 mr-1.5 text-red-500" />
            <span>Form Fields &amp; Questions</span>
          </Button>

          <Link
            href={`/marketing/campaigns?formSlug=${form.slug}&formTitle=${encodeURIComponent(form.title)}`}
          >
            <Button
              size="sm"
              variant="outline"
              className="border-neutral-800 text-neutral-300 hover:bg-neutral-800 text-xs h-8"
            >
              <Mail className="w-3.5 h-3.5 mr-1.5" />
              <span>Design Campaign</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={loading}
            className="border-neutral-800 text-neutral-300 hover:bg-neutral-800 text-xs h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/api/forms/export?formId=${formId}&format=xlsx`, "_blank")}
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs h-8 font-semibold"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
            <span>Excel (.xlsx)</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/api/forms/export?formId=${formId}&format=pdf`, "_blank")}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-8 font-semibold"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>PDF Report</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-neutral-800 text-neutral-300 hover:bg-neutral-800 text-xs h-8"
          >
            <span>CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={handleExportPDF}
            className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs h-8"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            <span>Print</span>
          </Button>
        </div>
      </div>

      {/* Dexta Clan Cohort Link Banner */}
      {(form.slug.toLowerCase().includes("clan") ||
        form.title.toLowerCase().includes("clan") ||
        form.title.toLowerCase().includes("cohort")) && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 to-slate-900 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                Dexta Clan Masterclass Cohort Portal Detected
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-red-600 text-white uppercase font-extrabold">
                  Academy
                </span>
              </div>
              <p className="text-neutral-400 text-[11px] mt-0.5">
                Submissions to this form feed directly into the Dexta Clan Masterclass Registry. Track cohort progress, admissions, and accreditation in the dedicated Clan desk.
              </p>
            </div>
          </div>
          <Link
            href="/clan"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shrink-0 transition-colors shadow-sm"
          >
            <span>Open Dexta Clan Desk</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Print-only title */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">{form.title}</h1>
        <p className="text-sm text-gray-600">Demographic Telemetry & Registration Roster — Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* KPI Overview Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0f1422] border border-neutral-800/80 rounded-xl p-4 sm:p-5 print:border-gray-300 print:bg-gray-50">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5 text-xs">
            <span>Total Responses</span>
            <Users className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white print:text-black">{demographics.totalCount}</div>
          <div className="text-[11px] text-neutral-400 mt-1">100% verified entries</div>
        </div>

        <div className="bg-[#0f1422] border border-neutral-800/80 rounded-xl p-4 sm:p-5 print:border-gray-300 print:bg-gray-50">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5 text-xs">
            <span>Clients & Leads</span>
            <Briefcase className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white print:text-black">
            {(demographics.categoryBreakdown.find((c) => c.label === "Client")?.count || 0) +
              (demographics.categoryBreakdown.find((c) => c.label === "Lead")?.count || 0)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">High-value stakeholders</div>
        </div>

        <div className="bg-[#0f1422] border border-neutral-800/80 rounded-xl p-4 sm:p-5 print:border-gray-300 print:bg-gray-50">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5 text-xs">
            <span>In-Person Mode</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white print:text-black">
            {demographics.attendanceBreakdown.find((a) => a.mode.includes("In-Person"))?.count || 0}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Physical venue attendees</div>
        </div>

        <div className="bg-[#0f1422] border border-neutral-800/80 rounded-xl p-4 sm:p-5 print:border-gray-300 print:bg-gray-50">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5 text-xs">
            <span>Virtual Mode</span>
            <Globe2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white print:text-black">
            {demographics.attendanceBreakdown.find((a) => a.mode.includes("Virtual"))?.count || 0}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Livestream participants</div>
        </div>
      </div>

      {/* Demographic Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Graph 1: Category Distribution */}
        <div className="bg-[#0f1422] border border-neutral-800/80 rounded-xl p-5 print:border-gray-300 print:bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-200 print:text-black flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-red-400" />
              <span>Demographic Classification</span>
            </h2>
            <span className="text-[11px] text-neutral-400">By Role</span>
          </div>

          {demographics.categoryBreakdown.length === 0 ? (
            <div className="text-xs text-neutral-400 text-center py-8">No responses received yet</div>
          ) : (
            <div className="space-y-3">
              {demographics.categoryBreakdown.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-medium text-neutral-300 print:text-black">{item.label}</span>
                    <span className="font-mono text-neutral-400">
                      {item.count} ({item.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#141a29] rounded-full overflow-hidden print:bg-gray-200">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(item.pct, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Graph 2: Attendance Mode */}
        <div className="bg-[#0f1422] border border-neutral-800/80 rounded-xl p-5 print:border-gray-300 print:bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-200 print:text-black flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-400" />
              <span>Attendance Mode</span>
            </h2>
            <span className="text-[11px] text-neutral-400">Venue vs Stream</span>
          </div>

          <div className="space-y-4">
            {demographics.attendanceBreakdown.map((item) => (
              <div key={item.mode} className="bg-[#141a29]/60 border border-neutral-800/60 rounded-xl p-3.5">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-neutral-200 print:text-black">{item.mode}</span>
                  <span className="font-mono text-neutral-300 font-bold">{item.count} ({item.pct}%)</span>
                </div>
                <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden print:bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.mode.includes("Virtual") ? "bg-purple-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${Math.max(item.pct, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Graph 3: Top Organizations Represented */}
        <div className="bg-[#0f1422] border border-neutral-800/80 rounded-xl p-5 print:border-gray-300 print:bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-200 print:text-black flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Top Organizations</span>
            </h2>
            <span className="text-[11px] text-neutral-400">Affiliations</span>
          </div>

          {demographics.topOrganizations.length === 0 ? (
            <div className="text-xs text-neutral-400 text-center py-8">No organizations reported yet</div>
          ) : (
            <div className="space-y-2.5">
              {demographics.topOrganizations.map((org, idx) => (
                <div
                  key={org.company}
                  className="flex items-center justify-between py-1.5 border-b border-neutral-800/60 text-xs"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="w-5 h-5 rounded-md bg-neutral-800 text-neutral-400 font-mono text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-neutral-200 print:text-black truncate">{org.company}</span>
                  </div>
                  <span className="font-mono text-neutral-400 font-semibold px-2 py-0.5 rounded bg-[#141a29]">
                    {org.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submissions Table Section */}
      <div className="bg-[#0f1422] border border-neutral-800/80 rounded-xl overflow-hidden print:border-gray-300">
        {/* Table Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-neutral-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
          <div className="flex flex-wrap items-center gap-1.5">
            {["ALL", "CLIENT", "LEAD", "INVESTOR", "PARTNER", "CONTRACTOR", "ATTENDEE"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                    : "bg-[#141a29] text-neutral-400 hover:text-white border border-neutral-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={handleOpenBatchModal}
              disabled={selectedIds.length === 0}
              className={`text-xs h-8 ${
                selectedIds.length > 0
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30"
                  : "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed"
              }`}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              <span>
                Send Batch Email {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
              </span>
            </Button>

            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search leads, name, org..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#121724] border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Selection Alert Strip */}
        {selectedIds.length > 0 && (
          <div className="px-5 py-2.5 bg-red-600/10 border-b border-red-500/20 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs">
              <CheckSquare className="w-4 h-4 text-red-400" />
              <span className="text-white">
                <strong className="text-red-400 font-semibold">{selectedIds.length}</strong> of{" "}
                {filteredSubmissions.length} submission{filteredSubmissions.length > 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleOpenBatchModal}
                className="bg-red-600 hover:bg-red-500 text-white shadow-sm text-xs h-7 px-3"
              >
                <Send className="w-3 h-3 mr-1.5" />
                <span>Compose Batch Email</span>
              </Button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded hover:bg-neutral-800 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141a29]/80 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider text-[11px] font-semibold print:bg-gray-100 print:text-black">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredSubmissions.length > 0 &&
                      selectedIds.length === filteredSubmissions.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-neutral-700 bg-neutral-800 text-red-600 focus:ring-red-500 cursor-pointer w-3.5 h-3.5"
                    aria-label="Select all submissions"
                  />
                </th>
                <th className="py-3 px-4">Registrant Name & Email</th>
                <th className="py-3 px-4">Organization & Title</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">Files & Custom Answers</th>
                <th className="py-3 px-4">Data Consent</th>
                <th className="py-3 px-4">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 print:divide-gray-200">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-neutral-400">
                    No submissions matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => {
                  const isSelected = selectedIds.includes(sub.id);
                  return (
                    <tr
                      key={sub.id}
                      className={`hover:bg-[#141a29]/40 transition-colors ${
                        isSelected ? "bg-red-500/[0.04]" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(sub.id)}
                          className="rounded border-neutral-700 bg-neutral-800 text-red-600 focus:ring-red-500 cursor-pointer w-3.5 h-3.5"
                          aria-label={`Select ${sub.fullName}`}
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-neutral-100 print:text-black">{sub.fullName}</div>
                        <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-neutral-500" />
                          <span>{sub.email}</span>
                        </div>
                      </td>

                    <td className="py-3.5 px-4 text-neutral-300 print:text-black">
                      <div className="font-medium">{sub.company || "—"}</div>
                      {sub.jobTitle && (
                        <div className="text-[11px] text-neutral-400">{sub.jobTitle}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-neutral-300 print:text-black">
                      {sub.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-neutral-500" />
                          <span>{sub.phone}</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#141a29] text-neutral-200 border border-neutral-800 print:border-gray-300">
                        {sub.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium capitalize ${
                          sub.attendanceMode === "virtual"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {sub.attendanceMode}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {sub.answers && Object.keys(sub.answers).length > 0 ? (
                        <div className="flex flex-col gap-1 max-w-[200px]">
                          {Object.entries(sub.answers).map(([key, val]: [string, any]) => {
                            let fileObj: any = null;
                            if (typeof val === "object" && val?.url) {
                              fileObj = val;
                            } else if (typeof val === "string" && val.startsWith('{"url":')) {
                              try {
                                fileObj = JSON.parse(val);
                              } catch {}
                            }

                            if (fileObj?.url) {
                              return (
                                <a
                                  key={key}
                                  href={fileObj.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-[10px] font-medium truncate"
                                  title={fileObj.fileName}
                                >
                                  <FileSpreadsheet className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{fileObj.fileName || "View Attachment"}</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                </a>
                              );
                            }

                            return (
                              <div key={key} className="text-[10px] text-neutral-400 truncate">
                                <span className="text-neutral-500">{key}:</span> {Array.isArray(val) ? val.join(", ") : String(val)}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {sub.consentAcknowledged !== false ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          <span>NDPR Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-neutral-500 bg-neutral-800">
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-neutral-400 font-mono text-[11px]">
                      {sub.createdAt.split("T")[0]}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Email Dispatcher Studio Modal */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="Batch Email Dispatcher Studio"
        maxWidth="2xl"
      >
        <form onSubmit={handleSendBatchEmail} className="space-y-5 text-xs">
          {/* Target Summary Banner */}
          <div className="p-4 rounded-xl bg-[#0f1422] border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-xs flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-red-400" />
                Target Recipients
              </span>
              <span className="font-mono text-[11px] bg-red-600/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full font-bold">
                {selectedIds.length} Selected Registrant{selectedIds.length > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Each selected respondent will receive a personalized individual email dispatched directly via enterprise SMTP.
            </p>
          </div>

          {/* Email Subject */}
          <div>
            <label className="block text-xs font-semibold text-neutral-200 mb-1.5">
              Email Subject Line *
            </label>
            <input
              type="text"
              required
              value={batchSubject}
              onChange={(e) => setBatchSubject(e.target.value)}
              placeholder="e.g. Important Update: West Africa Infrastructure Summit 2026"
              className="w-full px-3.5 py-2.5 bg-[#111624] border border-neutral-800 rounded-xl text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500 text-xs"
            />
          </div>

          {/* Personalization Variable Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-neutral-200">
                Message Body *
              </label>
              <span className="text-[10px] text-neutral-500 font-mono">
                Click chips to insert dynamic tokens
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { token: "{{firstName}}", label: "First Name" },
                { token: "{{fullName}}", label: "Full Name" },
                { token: "{{company}}", label: "Company" },
                { token: "{{category}}", label: "Category" },
                { token: "{{portalTitle}}", label: "Portal Title" },
              ].map((item) => (
                <button
                  key={item.token}
                  type="button"
                  onClick={() => insertToken(item.token)}
                  className="px-2 py-1 rounded bg-[#141a29] border border-neutral-800 hover:border-red-500/50 hover:text-white text-neutral-400 font-mono text-[10px] transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5 text-red-400" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            <textarea
              required
              rows={8}
              value={batchMessage}
              onChange={(e) => setBatchMessage(e.target.value)}
              placeholder="Write your email announcement or update. Use the tokens above to personalize each email..."
              className="w-full px-3.5 py-2.5 bg-[#111624] border border-neutral-800 rounded-xl text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500 resize-none font-mono text-xs leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBatchModalOpen(false)}
              className="border-neutral-800 text-neutral-300 hover:bg-neutral-800 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSendingBatch || selectedIds.length === 0}
              className="bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 text-xs px-4"
            >
              {isSendingBatch ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  <span>Dispatching Emails...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  <span>Send to {selectedIds.length} Recipient{selectedIds.length > 1 ? "s" : ""}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: UPLOAD & INGEST DETAILS */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title={`Upload Details into ${form.title}`}
        description="Ingest participant details directly into this portal's backend registry. Supports CSV, Excel, TXT, or direct paste."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmittingUpload}
              onClick={() => setIsUploadModalOpen(false)}
              className="border-neutral-800 text-neutral-300 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSubmittingUpload}
              onClick={handleConfirmUpload}
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
            >
              {isSubmittingUpload ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  <span>Processing Ingestion...</span>
                </>
              ) : uploadMode === "single" ? (
                "Add Single Submission"
              ) : (
                `Confirm & Ingest ${uploadMode === "paste" ? parseUploadRows(pastedSubmissions).length : parsedUploads.length} Records`
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 pt-1 text-xs">
          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-[#111624] border border-neutral-800 p-1 gap-1">
            <button
              type="button"
              onClick={() => setUploadMode("file")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                uploadMode === "file" ? "bg-red-600 text-white shadow-sm" : "text-neutral-400"
              }`}
            >
              File Upload (CSV / Excel)
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("paste")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                uploadMode === "paste" ? "bg-red-600 text-white shadow-sm" : "text-neutral-400"
              }`}
            >
              Quick Copy &amp; Paste
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("single")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                uploadMode === "single" ? "bg-red-600 text-white shadow-sm" : "text-neutral-400"
              }`}
            >
              Single Entry Form
            </button>
          </div>

          {/* MODE 1: FILE UPLOAD */}
          {uploadMode === "file" && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-800 rounded-2xl p-6 text-center cursor-pointer hover:border-red-500/50 transition-colors bg-[#111624]/50">
                <UploadCloud className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-xs font-bold text-neutral-100">
                  Select CSV, XLSX, or TXT File
                </span>
                <span className="text-[11px] text-neutral-500 mt-0.5">
                  Columns: Full Name, Email, Phone, Company, Job Title, Category
                </span>
                <input
                  type="file"
                  accept=".csv,.txt,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {parsedUploads.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-emerald-400">
                      ✓ {parsedUploads.length} Registrant(s) Ready to Ingest
                    </span>
                    <button
                      type="button"
                      onClick={() => setParsedUploads([])}
                      className="text-red-400 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-neutral-800 bg-[#111624] p-2 space-y-1">
                    {parsedUploads.slice(0, 10).map((row, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] py-1 border-b border-neutral-800/60">
                        <span className="font-bold text-neutral-200 truncate max-w-[180px]">{row.fullName}</span>
                        <span className="text-neutral-400 truncate max-w-[200px]">{row.email}</span>
                        <span className="text-neutral-500 text-[10px] truncate max-w-[120px]">{row.company}</span>
                      </div>
                    ))}
                    {parsedUploads.length > 10 && (
                      <div className="text-center text-[10px] text-neutral-500 pt-1">
                        + {parsedUploads.length - 10} more rows
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
              <label className="block text-xs font-semibold text-neutral-300">
                Paste CSV or Tab-separated rows
              </label>
              <textarea
                rows={6}
                value={pastedSubmissions}
                onChange={(e) => setPastedSubmissions(e.target.value)}
                placeholder={"Olamide Adeleke, olamide@realty.ng, +2348031234567, Adeleke Prime, Broker\nChinedu Eze, chinedu@horizon.ng, +2348129876543, Horizon Capital, Associate"}
                className="w-full rounded-xl border border-neutral-800 bg-[#111624] p-3 font-mono text-xs text-neutral-100 focus:outline-none focus:border-red-500"
              />
              <span className="text-[11px] text-neutral-500">
                Detected: {parseUploadRows(pastedSubmissions).length} row(s)
              </span>
            </div>
          )}

          {/* MODE 3: SINGLE ENTRY */}
          {uploadMode === "single" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={singleEntry.fullName}
                    onChange={(e) => setSingleEntry({ ...singleEntry, fullName: e.target.value })}
                    placeholder="e.g. Olamide Adeleke"
                    className="w-full rounded-lg border border-neutral-800 bg-[#111624] p-2 text-xs text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={singleEntry.email}
                    onChange={(e) => setSingleEntry({ ...singleEntry, email: e.target.value })}
                    placeholder="olamide@realty.ng"
                    className="w-full rounded-lg border border-neutral-800 bg-[#111624] p-2 text-xs text-neutral-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={singleEntry.phone}
                    onChange={(e) => setSingleEntry({ ...singleEntry, phone: e.target.value })}
                    placeholder="+234 803 123 4567"
                    className="w-full rounded-lg border border-neutral-800 bg-[#111624] p-2 text-xs text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={singleEntry.company}
                    onChange={(e) => setSingleEntry({ ...singleEntry, company: e.target.value })}
                    placeholder="Adeleke Prime Realty"
                    className="w-full rounded-lg border border-neutral-800 bg-[#111624] p-2 text-xs text-neutral-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Category
                  </label>
                  <select
                    value={singleEntry.category}
                    onChange={(e) => setSingleEntry({ ...singleEntry, category: e.target.value })}
                    className="w-full rounded-lg border border-neutral-800 bg-[#111624] p-2 text-xs text-neutral-100"
                  >
                    <option value="Attendee">Attendee</option>
                    <option value="Lead">Lead</option>
                    <option value="Partner">Partner</option>
                    <option value="Client">Client</option>
                    <option value="Investor">Investor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Attendance Mode
                  </label>
                  <select
                    value={singleEntry.attendanceMode}
                    onChange={(e) => setSingleEntry({ ...singleEntry, attendanceMode: e.target.value })}
                    className="w-full rounded-lg border border-neutral-800 bg-[#111624] p-2 text-xs text-neutral-100"
                  >
                    <option value="in-person">In-Person</option>
                    <option value="virtual">Virtual</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 3: FORM FIELDS & DYNAMIC QUESTIONS EDITOR */}
      <Modal
        isOpen={isFieldsModalOpen}
        onClose={() => setIsFieldsModalOpen(false)}
        title={`Customize Form Fields & Questions`}
        description="Add custom questions, dropdowns, document uploads, or track selections to this registration portal. Updates apply immediately to live links."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSavingFields}
              onClick={() => setIsFieldsModalOpen(false)}
              className="border-neutral-800 text-neutral-300 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSavingFields}
              onClick={handleSaveFields}
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
            >
              {isSavingFields ? "Saving Fields..." : "Save & Publish Form Fields"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 pt-1 text-xs">
          {/* Current Fields List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-200 uppercase tracking-wider text-[11px]">
                Active Custom Fields ({editingFields.length})
              </span>
              <span className="text-[11px] text-neutral-500">
                (Standard: Full Name, Email, Phone, Company are automatically included)
              </span>
            </div>

            {editingFields.length === 0 ? (
              <div className="p-4 rounded-xl border border-neutral-800 bg-[#111624] text-center text-neutral-400">
                No custom questions added yet. Use the builder below to add questions.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-xl border border-neutral-800 bg-[#111624] p-2">
                {editingFields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-2 rounded-lg bg-[#141a29] border border-neutral-800/80">
                    <div className="space-y-0.5">
                      <div className="font-bold text-neutral-100 flex items-center gap-1.5">
                        <span>{field.label}</span>
                        {field.required && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-red-500/20 text-red-400 font-bold">
                            REQUIRED
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        Type: {field.type} {field.options ? `• Options: ${field.options.join(", ")}` : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(field.id)}
                      className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Field"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Field Builder Card */}
          <div className="p-4 rounded-xl border border-neutral-800 bg-[#111624] space-y-3">
            <h4 className="font-bold text-neutral-200 flex items-center gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5 text-red-500" />
              Add a New Question or Form Field
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                  Field Label / Question *
                </label>
                <input
                  type="text"
                  value={newFieldData.label}
                  onChange={(e) => setNewFieldData({ ...newFieldData, label: e.target.value })}
                  placeholder="e.g. Real Estate License Number"
                  className="w-full rounded-lg border border-neutral-800 bg-[#141a29] p-2 text-xs text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                  Field Type
                </label>
                <select
                  value={newFieldData.type}
                  onChange={(e) => setNewFieldData({ ...newFieldData, type: e.target.value })}
                  className="w-full rounded-lg border border-neutral-800 bg-[#141a29] p-2 text-xs text-neutral-100 font-semibold"
                >
                  <option value="text">Text (Single Line)</option>
                  <option value="textarea">Textarea (Multi-line)</option>
                  <option value="select">Dropdown / Select</option>
                  <option value="radio">Radio Buttons</option>
                  <option value="checkbox">Checkbox (Multi-select)</option>
                  <option value="date">Date Picker</option>
                  <option value="number">Number</option>
                  <option value="phone">Phone Number</option>
                  <option value="email">Email Address</option>
                  <option value="url">Website / Portfolio Link</option>
                  <option value="file">File / Document Upload</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                  Placeholder / Help Text
                </label>
                <input
                  type="text"
                  value={newFieldData.placeholder}
                  onChange={(e) => setNewFieldData({ ...newFieldData, placeholder: e.target.value })}
                  placeholder="e.g. Enter your verified association ID"
                  className="w-full rounded-lg border border-neutral-800 bg-[#141a29] p-2 text-xs text-neutral-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="requiredCheck"
                  checked={newFieldData.required}
                  onChange={(e) => setNewFieldData({ ...newFieldData, required: e.target.checked })}
                  className="rounded border-neutral-700 bg-neutral-900"
                />
                <label htmlFor="requiredCheck" className="text-xs font-semibold text-neutral-300 cursor-pointer">
                  Mandatory / Required Field
                </label>
              </div>
            </div>

            {(newFieldData.type === "select" || newFieldData.type === "radio" || newFieldData.type === "checkbox") && (
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                  Dropdown Options (comma-separated)
                </label>
                <input
                  type="text"
                  value={newFieldData.options}
                  onChange={(e) => setNewFieldData({ ...newFieldData, options: e.target.value })}
                  placeholder="Luxury Residential, Commercial Acquisition, Land Syndication"
                  className="w-full rounded-lg border border-neutral-800 bg-[#141a29] p-2 text-xs text-neutral-100"
                />
              </div>
            )}

            <Button
              type="button"
              size="xs"
              onClick={handleAddNewField}
              className="bg-red-600 hover:bg-red-500 text-white font-bold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Field to Form
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
