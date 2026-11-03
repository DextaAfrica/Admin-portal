"use client";

import * as React from "react";
import {
  Building2,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Compass,
  Star,
  MapPin,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import type { Development } from "@/lib/backend-api";

export default function PortfolioPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [developments, setDevelopments] = React.useState<Development[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Modal State
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<Development | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] =
    React.useState<Development | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form Fields
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [status, setStatus] = React.useState<
    "planning" | "under_construction" | "completed"
  >("planning");
  const [summary, setSummary] = React.useState("");
  const [heroImageUrl, setHeroImageUrl] = React.useState("");
  const [featured, setFeatured] = React.useState(false);
  const [published, setPublished] = React.useState(true);
  const [displayOrder, setDisplayOrder] = React.useState(0);
  const [seoTitle, setSeoTitle] = React.useState("");
  const [seoDescription, setSeoDescription] = React.useState("");

  const fetchDevelopments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/backend/portfolio?perPage=50");
      if (!res.ok) throw new Error("Could not fetch developments");
      const json = await res.json();
      setDevelopments(json.data || []);
    } catch (err: any) {
      toastError("Portfolio Sync Error", err.message || "Failed to load developments from backend");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  React.useEffect(() => {
    fetchDevelopments();
  }, [fetchDevelopments]);

  const openCreateModal = () => {
    setEditingItem(null);
    setName("");
    setSlug("");
    setLocation("");
    setStatus("planning");
    setSummary("");
    setHeroImageUrl("");
    setFeatured(false);
    setPublished(true);
    setDisplayOrder(developments.length + 1);
    setSeoTitle("");
    setSeoDescription("");
    setIsFormOpen(true);
  };

  const openEditModal = (dev: Development) => {
    setEditingItem(dev);
    setName(dev.name);
    setSlug(dev.slug);
    setLocation(dev.location || "");
    setStatus(dev.status);
    setSummary(dev.summary || "");
    setHeroImageUrl(dev.heroImageUrl || "");
    setFeatured(dev.featured);
    setPublished(dev.published);
    setDisplayOrder(dev.displayOrder);
    setSeoTitle(dev.seoTitle || "");
    setSeoDescription(dev.seoDescription || "");
    setIsFormOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
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

  const handleSaveDevelopment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toastError("Validation Error", "Name and URL Slug are required");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      location: location.trim(),
      status,
      summary: summary.trim(),
      body: editingItem?.body || {
        architect: "Dexta Design Studio",
        specs: "Prime luxury residential development",
      },
      heroImageUrl: heroImageUrl.trim(),
      gallery: editingItem?.gallery || [],
      featured,
      published,
      displayOrder: Number(displayOrder) || 0,
      seoTitle: seoTitle.trim() || name.trim(),
      seoDescription: seoDescription.trim() || summary.trim(),
    };

    try {
      const url = editingItem
        ? `/api/backend/portfolio/${editingItem.id}`
        : "/api/backend/portfolio";
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
        editingItem ? "Development Updated" : "Development Created",
        `${name} has been synchronized with the core backend.`
      );
      setIsFormOpen(false);
      fetchDevelopments();
    } catch (err: any) {
      toastError("Operation Failed", err.message || "Could not save development");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmItem) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/backend/portfolio/${deleteConfirmItem.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete operation failed");

      toastSuccess(
        "Development Removed",
        `${deleteConfirmItem.name} was removed from the portfolio.`
      );
      setDeleteConfirmItem(null);
      fetchDevelopments();
    } catch (err: any) {
      toastError("Delete Failed", err.message || "Could not delete development");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = developments.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const countPlanning = developments.filter((d) => d.status === "planning").length;
  const countConstruction = developments.filter((d) => d.status === "under_construction").length;
  const countCompleted = developments.filter((d) => d.status === "completed").length;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Portfolio & Developments
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              Go Core API
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Author and orchestrate Dexta Africa’s real estate assets, construction phases, and architectural presentations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchDevelopments()}
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
            New Development
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] p-4">
          <p className="text-xs font-semibold text-slate-500">Total Developments</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {developments.length}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/5 p-4">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Completed Assets</p>
          <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">
            {countCompleted}
          </p>
        </div>
        <div className="rounded-2xl border border-sky-200/60 dark:border-sky-500/20 bg-sky-50/40 dark:bg-sky-500/5 p-4">
          <p className="text-xs font-semibold text-sky-700 dark:text-sky-400">Under Construction</p>
          <p className="text-2xl font-bold text-sky-800 dark:text-sky-300 mt-1">
            {countConstruction}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-500/5 p-4">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Planning &amp; Design</p>
          <p className="text-2xl font-bold text-amber-800 dark:text-amber-300 mt-1">
            {countPlanning}
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] p-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, location, or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 hidden sm:inline">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#15161c] px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none w-full sm:w-auto"
          >
            <option value="all">All Development Phases</option>
            <option value="planning">Planning Phase</option>
            <option value="under_construction">Under Construction</option>
            <option value="completed">Completed Projects</option>
          </select>
        </div>
      </div>

      {/* Developments Grid / Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.01] p-12 text-center">
          <Building2 className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
            No developments found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {developments.length === 0
              ? "Your real estate portfolio has no developments saved yet. Click 'New Development' to create your first landmark asset."
              : "No developments match your search criteria."}
          </p>
          {developments.length === 0 && (
            <Button size="sm" variant="primary" className="mt-4" onClick={openCreateModal}>
              Create First Development
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dev) => (
            <div
              key={dev.id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] overflow-hidden shadow-sm hover:border-[#ED2618]/30 transition-all"
            >
              {/* Media Preview Header */}
              <div className="relative h-44 w-full bg-slate-100 dark:bg-black/30 overflow-hidden">
                {dev.heroImageUrl ? (
                  <img
                    src={dev.heroImageUrl}
                    alt={dev.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
                    <Building2 className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                      dev.status === "completed"
                        ? "bg-emerald-500/80 text-white"
                        : dev.status === "under_construction"
                        ? "bg-sky-500/80 text-white"
                        : "bg-amber-500/80 text-white"
                    }`}
                  >
                    {dev.status.replace("_", " ")}
                  </span>
                  {dev.featured && (
                    <span className="flex items-center gap-1 rounded-lg bg-[#ED2618]/90 backdrop-blur-md px-2 py-1 text-[10px] font-bold text-white">
                      <Star className="h-3 w-3 fill-current" /> Featured
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#ED2618]" />
                    {dev.location || "Location not set"}
                  </p>
                  <h3 className="text-base font-bold text-white truncate drop-shadow-sm">
                    {dev.name}
                  </h3>
                </div>
              </div>

              {/* Body Description */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {dev.summary || "No editorial summary provided."}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-white/[0.06] pt-3">
                  <span className="font-mono truncate max-w-[150px]">/{dev.slug}</span>
                  <span>Updated {formatDate(dev.updatedAt)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/[0.06] px-4 py-2.5 bg-slate-50/50 dark:bg-white/[0.01]">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      dev.published ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {dev.published ? "Published" : "Draft"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => openEditModal(dev)}
                    leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                  >
                    Edit
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 dark:hover:text-red-400"
                    onClick={() => setDeleteConfirmItem(dev)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Development Create / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? "Edit Development Project" : "New Landmark Development"}
        description="Configure development attributes, architectural location, and public website publishing state."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveDevelopment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Development Name"
              placeholder="e.g. The Grand Ikoyi Horizon"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
            <Input
              label="URL Slug"
              placeholder="e.g. the-grand-ikoyi-horizon"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              helperText="Unique URL identifier for the public website"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Physical Location"
              placeholder="e.g. Victoria Island, Lagos, Nigeria"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Development Phase
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="planning">Planning &amp; Concept</option>
                <option value="under_construction">Under Active Construction</option>
                <option value="completed">Completed &amp; Handover</option>
              </select>
            </div>
          </div>

          <Input
            label="Hero Image CDN URL"
            placeholder="https://..."
            value={heroImageUrl}
            onChange={(e) => setHeroImageUrl(e.target.value)}
            helperText="High-resolution hero render or photography URL"
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Executive Summary
            </label>
            <textarea
              rows={3}
              placeholder="High-end editorial summary for investor presentation..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Search Engine (SEO) Meta Title"
              placeholder="The Grand Horizon | Dexta Africa"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
            <Input
              label="Display Order Priority"
              type="number"
              placeholder="1"
              value={String(displayOrder)}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
            />
          </div>

          {/* Publishing & Feature Flags */}
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-3.5 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4 rounded text-red-600 focus:ring-red-500"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Publish on Live Website
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 rounded text-red-600 focus:ring-red-500"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Showcase in Homepage Featured Spotlight
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
              {editingItem ? "Update Development" : "Save to Core Backend"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmItem)}
        onClose={() => setDeleteConfirmItem(null)}
        title="Delete Development Project?"
        description="This action will permanently delete this real estate development from the core database and invalidate website caches."
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
            Development: <strong className="text-slate-900 dark:text-white">{deleteConfirmItem.name}</strong> ({deleteConfirmItem.slug})
          </div>
        )}
      </Modal>
    </div>
  );
}

