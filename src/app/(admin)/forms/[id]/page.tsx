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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
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
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={loading}
            className="border-neutral-800 text-neutral-300 hover:bg-neutral-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-neutral-800 text-neutral-300 hover:bg-neutral-800"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            <span>Export CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={handleExportPDF}
            className="bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            <span>Export PDF</span>
          </Button>
        </div>
      </div>

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

          <div className="relative w-full sm:w-64">
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141a29]/80 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider text-[11px] font-semibold print:bg-gray-100 print:text-black">
              <tr>
                <th className="py-3 px-4">Registrant Name & Email</th>
                <th className="py-3 px-4">Organization & Title</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">Data Consent</th>
                <th className="py-3 px-4">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 print:divide-gray-200">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-neutral-400">
                    No submissions matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#141a29]/40 transition-colors">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
