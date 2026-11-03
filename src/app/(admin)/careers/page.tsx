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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import type { CareerListing } from "@/lib/backend-api";

export default function CareersPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [listings, setListings] = React.useState<CareerListing[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("all");

  // Modal State
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<CareerListing | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] =
    React.useState<CareerListing | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form Fields
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [department, setDepartment] = React.useState("Architecture & Engineering");
  const [location, setLocation] = React.useState("Lagos, Nigeria");
  const [type, setType] = React.useState("Full-Time");
  const [summary, setSummary] = React.useState("");
  const [requirementsText, setRequirementsText] = React.useState("");
  const [benefitsText, setBenefitsText] = React.useState("");
  const [status, setStatus] = React.useState<"open" | "closed">("open");
  const [published, setPublished] = React.useState(true);

  const fetchCareers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/backend/careers/listings?perPage=50");
      if (!res.ok) throw new Error("Could not fetch career listings");
      const json = await res.json();
      setListings(json.data || []);
    } catch (err: any) {
      toastError("Careers Sync Error", err.message || "Failed to load listings from Go backend");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  React.useEffect(() => {
    fetchCareers();
  }, [fetchCareers]);

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle("");
    setSlug("");
    setDepartment("Architecture & Engineering");
    setLocation("Lagos, Nigeria (Hybrid)");
    setType("Full-Time");
    setSummary("");
    setRequirementsText("• 5+ years relevant experience\n• Bachelor's/Master's degree\n• Excellent communication & analytical skills");
    setBenefitsText("• Competitive executive remuneration\n• Comprehensive health insurance\n• Global talent mobility opportunities");
    setStatus("open");
    setPublished(true);
    setIsFormOpen(true);
  };

  const openEditModal = (item: CareerListing) => {
    setEditingItem(item);
    setTitle(item.title);
    setSlug(item.slug);
    setDepartment(item.department || "Engineering");
    setLocation(item.location || "Lagos, Nigeria");
    setType(item.type || "Full-Time");
    setSummary(item.summary || "");
    setRequirementsText((item.requirements || []).join("\n"));
    setBenefitsText((item.benefits || []).join("\n"));
    setStatus(item.status);
    setPublished(item.published);
    setIsFormOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingItem) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  const handleSaveListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      toastError("Validation Error", "Title and Slug are required");
      return;
    }

    setIsSubmitting(true);
    const requirements = requirementsText
      .split("\n")
      .map((s) => s.replace(/^[•\-\*]\s*/, "").trim())
      .filter(Boolean);

    const benefits = benefitsText
      .split("\n")
      .map((s) => s.replace(/^[•\-\*]\s*/, "").trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      department: department.trim(),
      location: location.trim(),
      type: type.trim(),
      summary: summary.trim(),
      description: editingItem?.description || {
        overview: summary.trim(),
      },
      requirements,
      benefits,
      status,
      published,
    };

    try {
      const url = editingItem
        ? `/api/backend/careers/listings/${editingItem.id}`
        : "/api/backend/careers/listings";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Save operation failed");
      }

      toastSuccess(
        editingItem ? "Role Updated" : "Role Published",
        `"${title}" has been synchronized with the core backend.`
      );
      setIsFormOpen(false);
      fetchCareers();
    } catch (err: any) {
      toastError("Operation Failed", err.message || "Could not save role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmItem) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/backend/careers/listings/${deleteConfirmItem.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Delete operation failed");

      toastSuccess("Listing Deleted", `"${deleteConfirmItem.title}" was removed.`);
      setDeleteConfirmItem(null);
      fetchCareers();
    } catch (err: any) {
      toastError("Delete Failed", err.message || "Could not delete career listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = listings.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      departmentFilter === "all" || c.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Careers &amp; Talent Acquisition
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              Go Core API
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage executive openings, engineering positions, and project management roles across Africa.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchCareers()}
            leftIcon={<RefreshCw className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />}
          >
            Sync
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={openCreateModal}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            New Job Opening
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
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

      {/* Career Listings Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="mx-auto h-10 w-10 text-slate-400" />
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
              No career openings found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {listings.length === 0
                ? "No open positions currently published. Click 'New Job Opening' to create a new role."
                : "No positions match your search filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-slate-500 font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Role Title &amp; Department</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Contract Type</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Last Updated</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.department} &bull; /{item.slug}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#ED2618]" />
                        {item.location}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          item.status === "open"
                            ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
                            : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {formatDate(item.updatedAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => openEditModal(item)}
                          leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => setDeleteConfirmItem(item)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? "Edit Job Listing" : "Create Career Opening"}
        description="Configure job responsibilities, candidate requirements, and publishing status."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveListing} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Position Title"
              placeholder="e.g. Senior Architectural Project Manager"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
            <Input
              label="URL Slug"
              placeholder="e.g. senior-architectural-project-manager"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
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
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="Architecture & Engineering">Architecture &amp; Engineering</option>
                <option value="Real Estate Development">Real Estate Development</option>
                <option value="Finance & Investment">Finance &amp; Investment</option>
                <option value="Operations & Legal">Operations &amp; Legal</option>
              </select>
            </div>

            <Input
              label="Location"
              placeholder="Lagos, Nigeria"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <Input
              label="Employment Type"
              placeholder="Full-Time / Contract"
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Role Executive Summary
            </label>
            <textarea
              rows={2}
              placeholder="Brief high-level overview of the role..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Requirements (One per line)
              </label>
              <textarea
                rows={4}
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Benefits &amp; Perks (One per line)
              </label>
              <textarea
                rows={4}
                value={benefitsText}
                onChange={(e) => setBenefitsText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Application Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#15161c] px-3 py-1.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="open">Active (Accepting Applications)</option>
                <option value="closed">Closed (Role Filled)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-4">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4 rounded text-red-600 focus:ring-red-500"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Visible on Live Careers Page
              </span>
            </label>
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
              {editingItem ? "Update Role" : "Publish to Core Backend"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmItem)}
        onClose={() => setDeleteConfirmItem(null)}
        title="Delete Job Listing?"
        description="Permanently remove this career opening from the system."
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

