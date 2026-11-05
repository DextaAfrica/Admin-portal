"use client";

import * as React from "react";
import {
  MessageSquare,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Archive,
  ArrowUpRight,
  ExternalLink,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import type { Enquiry } from "@/lib/backend-api";

export default function EnquiriesPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [enquiries, setEnquiries] = React.useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Detail Modal State
  const [selectedEnquiry, setSelectedEnquiry] = React.useState<Enquiry | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  const fetchEnquiries = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/backend/enquiries?perPage=50");
      if (!res.ok) throw new Error("Could not fetch enquiries");
      const json = await res.json();
      setEnquiries(json.data || []);
    } catch (err: any) {
      toastError("Lead Sync Error", err.message || "Failed to load enquiries from core backend");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  React.useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const handleUpdateStatus = async (
    enquiryId: string,
    nextStatus: "new" | "in_progress" | "resolved" | "archived"
  ) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/backend/enquiries/${enquiryId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toastSuccess(
        "Lead Status Updated",
        `Inquiry status is now ${nextStatus.replace("_", " ").toUpperCase()}`
      );

      // Update local state
      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiryId ? { ...e, status: nextStatus } : e))
      );
      if (selectedEnquiry && selectedEnquiry.id === enquiryId) {
        setSelectedEnquiry({ ...selectedEnquiry, status: nextStatus });
      }
    } catch (err: any) {
      toastError("Status Update Failed", err.message || "Could not update lead status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filtered = enquiries.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.phone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const countNew = enquiries.filter((e) => e.status === "new").length;
  const countInProgress = enquiries.filter((e) => e.status === "in_progress").length;
  const countResolved = enquiries.filter((e) => e.status === "resolved").length;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Client Inquiries &amp; Leads
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              Go Core API
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time pipeline of investor inquiries, luxury property viewings, and commercial development leads.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchEnquiries()}
            leftIcon={<RefreshCw className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />}
          >
            Refresh Pipeline
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] p-4">
          <p className="text-xs font-semibold text-slate-500">Total Leads Received</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {enquiries.length}
          </p>
        </div>
        <div className="rounded-2xl border border-red-200/60 dark:border-red-500/20 bg-red-50/40 dark:bg-red-500/5 p-4">
          <p className="text-xs font-semibold text-[#ED2618] dark:text-red-400">New Unread Leads</p>
          <p className="text-2xl font-bold text-[#ED2618] dark:text-red-400 mt-1">
            {countNew}
          </p>
        </div>
        <div className="rounded-2xl border border-red-200/60 dark:border-red-500/20 bg-red-50/40 dark:bg-red-500/5 p-4">
          <p className="text-xs font-semibold text-red-700 dark:text-red-400">In Active Discussion</p>
          <p className="text-2xl font-bold text-red-800 dark:text-red-300 mt-1">
            {countInProgress}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/5 p-4">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Resolved &amp; Closed</p>
          <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">
            {countResolved}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] p-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client name, email, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 hidden sm:inline">Filter by:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#15161c] px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none w-full sm:w-auto"
          >
            <option value="all">All Inquiry Statuses</option>
            <option value="new">New Inquiries</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-slate-400" />
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
              No inquiries found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {enquiries.length === 0
                ? "Your lead inbox is clear. Incoming property inquiries from the public website will appear here in real-time."
                : "No inquiries match your current search and filter settings."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-slate-500 font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Client &amp; Contact</th>
                  <th className="px-5 py-3.5">Subject</th>
                  <th className="px-5 py-3.5">Source Page</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date Received</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {filtered.map((enquiry) => (
                  <tr
                    key={enquiry.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelectedEnquiry(enquiry)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-[#ED2618] font-bold text-xs border border-red-100 dark:border-red-500/20">
                          {enquiry.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {enquiry.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {enquiry.email}
                            </span>
                            {enquiry.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {enquiry.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {enquiry.subject || "Property Viewing Inquiry"}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">
                        {enquiry.message}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-slate-100 dark:bg-white/10 px-2.5 py-1 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                        {enquiry.sourcePage || "/contact"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          enquiry.status === "new"
                            ? "bg-red-50 dark:bg-red-500/15 text-[#ED2618] border border-red-200 dark:border-red-500/30"
                            : enquiry.status === "in_progress"
                            ? "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400"
                            : enquiry.status === "resolved"
                            ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400"
                        }`}
                      >
                        {enquiry.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                      {formatDate(enquiry.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => setSelectedEnquiry(enquiry)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inquiry Detail Modal */}
      <Modal
        isOpen={Boolean(selectedEnquiry)}
        onClose={() => setSelectedEnquiry(null)}
        title="Client Inquiry Details"
        description="Review full client message and update lead pipeline status."
        maxWidth="lg"
      >
        {selectedEnquiry && (
          <div className="space-y-5">
            {/* Contact Information Banner */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedEnquiry.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Received on {formatDate(selectedEnquiry.createdAt)}
                  </p>
                </div>
                <span className="font-mono text-xs rounded bg-slate-200 dark:bg-white/10 px-2 py-0.5 text-slate-700 dark:text-slate-300">
                  Source: {selectedEnquiry.sourcePage || "/contact"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-white/10 text-xs">
                <a
                  href={`mailto:${selectedEnquiry.email}?subject=Re: ${encodeURIComponent(selectedEnquiry.subject)}`}
                  className="flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-[#ED2618]"
                >
                  <Mail className="h-4 w-4 text-[#ED2618]" />
                  <span>{selectedEnquiry.email}</span>
                </a>
                {selectedEnquiry.phone ? (
                  <a
                    href={`tel:${selectedEnquiry.phone}`}
                    className="flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-[#ED2618]"
                  >
                    <Phone className="h-4 w-4 text-[#ED2618]" />
                    <span>{selectedEnquiry.phone}</span>
                  </a>
                ) : (
                  <span className="text-slate-400">No phone provided</span>
                )}
              </div>
            </div>

            {/* Subject and Message Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Subject</label>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] p-3 text-sm font-bold text-slate-900 dark:text-white">
                {selectedEnquiry.subject}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Client Message</label>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] p-4 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {selectedEnquiry.message}
              </div>
            </div>

            {/* Pipeline Status Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 dark:border-white/10 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Update Pipeline Status:
                </span>
                <select
                  disabled={isUpdatingStatus}
                  value={selectedEnquiry.status}
                  onChange={(e) =>
                    handleUpdateStatus(selectedEnquiry.id, e.target.value as any)
                  }
                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#15161c] px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="new">New Inquiry</option>
                  <option value="in_progress">In Active Discussion</option>
                  <option value="resolved">Resolved &amp; Closed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedEnquiry.email}?subject=Re: ${encodeURIComponent(selectedEnquiry.subject)}`}
                >
                  <Button size="sm" variant="primary" leftIcon={<Mail className="h-3.5 w-3.5" />}>
                    Reply via Email
                  </Button>
                </a>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedEnquiry(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

