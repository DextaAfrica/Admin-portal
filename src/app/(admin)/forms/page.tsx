"use client";

import * as React from "react";
import Link from "next/link";
import {
  Link as LinkIcon,
  Plus,
  Copy,
  Check,
  ExternalLink,
  BarChart3,
  Calendar,
  MapPin,
  Users,
  RefreshCw,
  Sparkles,
  Trash2,
  Share2,
  FileText,
  UserCheck,
  Building,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface FormItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  formType: "event" | "onboarding" | "partner" | "survey";
  status: "active" | "closed" | "draft";
  coverImageUrl: string;
  eventDate: string | null;
  eventLocation: string;
  submissionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function FormsManagementPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [forms, setForms] = React.useState<FormItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [copiedSlug, setCopiedSlug] = React.useState<string | null>(null);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [formType, setFormType] = React.useState<"event" | "onboarding" | "partner">("event");
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [eventDate, setEventDate] = React.useState("");
  const [eventLocation, setEventLocation] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchForms = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/forms");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch forms");
      setForms(data.forms || []);
    } catch (err: any) {
      toastError(err.message || "Failed to load forms");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  React.useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  // Handle slug auto-fill
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]/g, "-")) {
      const autoSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(autoSlug);
    }
  };

  const handleCopyLink = (slugToCopy: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/register/${slugToCopy}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slugToCopy);
    toastSuccess("Registration link copied to clipboard!");
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      toastError("Title and link name are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          formType,
          description,
          eventDate: eventDate || null,
          eventLocation,
          status: "active",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create link");
      }

      toastSuccess(`Created registration link "/register/${slug}"`);
      setIsCreateOpen(false);
      setTitle("");
      setSlug("");
      setDescription("");
      setEventDate("");
      setEventLocation("");
      fetchForms();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, formTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${formTitle}" and all its responses?`)) return;

    try {
      const res = await fetch(`/api/forms/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete form");
      toastSuccess("Registration form removed");
      fetchForms();
    } catch (err: any) {
      toastError(err.message);
    }
  };

  // Metrics
  const totalSubmissions = forms.reduce((acc, f) => acc + f.submissionsCount, 0);
  const activeCount = forms.filter((f) => f.status === "active").length;
  const eventCount = forms.filter((f) => f.formType === "event").length;
  const onboardCount = forms.filter((f) => f.formType === "onboarding" || f.formType === "partner").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2.5">
            <span>Registration & Onboarding Links</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Create clean, short-slug links for events, client onboarding, and partner intake with demographic telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchForms}
            disabled={loading}
            className="border-neutral-800 text-neutral-300 hover:bg-neutral-800/60"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Create New Link</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0f1422] border border-neutral-800/80 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Active Links</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <LinkIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{activeCount}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Accepting registrations</div>
        </div>

        <div className="bg-[#0f1422] border border-neutral-800/80 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Total Responses</span>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{totalSubmissions}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Leads, clients & attendees</div>
        </div>

        <div className="bg-[#0f1422] border border-neutral-800/80 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Event Portals</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{eventCount}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Summits & conferences</div>
        </div>

        <div className="bg-[#0f1422] border border-neutral-800/80 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Onboarding Portals</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{onboardCount}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Clients & partner intake</div>
        </div>
      </div>

      {/* Forms List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-neutral-200">Active Registration Links</h2>
          <span className="text-xs text-neutral-400 font-mono">{forms.length} total</span>
        </div>

        {loading && forms.length === 0 ? (
          <div className="bg-[#0f1422] border border-neutral-800 rounded-xl p-12 text-center text-neutral-400 text-sm">
            <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
            <span>Loading active links...</span>
          </div>
        ) : forms.length === 0 ? (
          <div className="bg-[#0f1422] border border-neutral-800 rounded-xl p-12 text-center text-neutral-400">
            <LinkIcon className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-neutral-200 mb-1">No registration links yet</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-5">
              Create clean short-slug links to invite clients, onboard contractors, or register guests for summits.
            </p>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Create First Link</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forms.map((item) => {
              const isCopied = copiedSlug === item.slug;
              return (
                <div
                  key={item.id}
                  className="bg-[#0f1422] border border-neutral-800 hover:border-neutral-700/80 rounded-xl p-5 flex flex-col justify-between transition-all group"
                >
                  <div>
                    {/* Badge header */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${
                            item.formType === "onboarding"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : item.formType === "partner"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {item.formType}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{item.status}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-[#141a29] border border-neutral-800 px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-200">
                        <Users className="w-3.5 h-3.5 text-red-400" />
                        <span>{item.submissionsCount} Responses</span>
                      </div>
                    </div>

                    {/* Title & Slug */}
                    <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors mb-1">
                      {item.title}
                    </h3>

                    {/* Short Link Pill */}
                    <div className="flex items-center gap-2 bg-[#141a29]/80 border border-neutral-800/80 rounded-lg px-3 py-1.5 text-xs text-neutral-300 font-mono my-2.5">
                      <span className="text-neutral-500">/register/</span>
                      <span className="text-red-400 font-semibold">{item.slug}</span>
                      <button
                        onClick={() => handleCopyLink(item.slug)}
                        title="Copy shareable link"
                        className="ml-auto p-1 text-neutral-400 hover:text-white transition-colors"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {item.description && (
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-3">
                        {item.description}
                      </p>
                    )}

                    {/* Metadata tags */}
                    {(item.eventDate || item.eventLocation) && (
                      <div className="flex flex-wrap gap-2 text-[11px] text-neutral-400 mb-3">
                        {item.eventDate && (
                          <span className="flex items-center gap-1 bg-[#141a29] px-2 py-0.5 rounded">
                            <Calendar className="w-3 h-3 text-red-400" />
                            <span>{new Date(item.eventDate).toLocaleDateString()}</span>
                          </span>
                        )}
                        {item.eventLocation && (
                          <span className="flex items-center gap-1 bg-[#141a29] px-2 py-0.5 rounded">
                            <MapPin className="w-3 h-3 text-red-400" />
                            <span>{item.eventLocation}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/register/${item.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Preview Portal</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="p-1 text-neutral-400 hover:text-red-400 transition-colors"
                        title="Delete registration portal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <Link
                      href={`/forms/${item.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700/80 text-white text-xs font-medium transition-all"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-red-400" />
                      <span>Demographics & Leads</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Registration or Onboarding Link"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {/* Form Type selector */}
          <div>
            <label className="block font-medium text-neutral-300 mb-1.5">Link Purpose *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: "event" as const, label: "Event Registration" },
                { type: "onboarding" as const, label: "Client Onboarding" },
                { type: "partner" as const, label: "Partner Intake" },
              ].map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setFormType(opt.type)}
                  className={`p-2.5 rounded-lg text-center font-medium border transition-all ${
                    formType === opt.type
                      ? "bg-red-500/10 border-red-500/60 text-white"
                      : "bg-[#141a29] border-neutral-800 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-medium text-neutral-300 mb-1">
              Title / Event Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. West Africa Infrastructure Summit 2026"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 bg-[#121724] border border-neutral-800 rounded-lg text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block font-medium text-neutral-300 mb-1">
              Short Link Slug * (clean and concise)
            </label>
            <div className="flex items-center bg-[#121724] border border-neutral-800 rounded-lg px-3 py-2">
              <span className="text-neutral-500 font-mono">/register/</span>
              <input
                type="text"
                required
                placeholder="summit2026"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "-"))}
                className="w-full bg-transparent text-neutral-100 font-mono focus:outline-none pl-1"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Recipients will open: <span className="font-mono text-neutral-400">admin.dextaafrica.org/register/{slug || "slug"}</span>
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-neutral-300 mb-1">Description / Brief</label>
            <textarea
              rows={2}
              placeholder="Brief welcome message or event overview displayed to respondents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#121724] border border-neutral-800 rounded-lg text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500 resize-none"
            />
          </div>

          {/* Date & Location (if event) */}
          {formType === "event" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-neutral-300 mb-1">Event Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121724] border border-neutral-800 rounded-lg text-neutral-100 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block font-medium text-neutral-300 mb-1">Venue / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Eko Convention Center, Lagos"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121724] border border-neutral-800 rounded-lg text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-3 flex justify-end gap-2 border-t border-neutral-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
              className="border-neutral-800 text-neutral-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {isSubmitting ? "Creating..." : "Create & Launch Link"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
