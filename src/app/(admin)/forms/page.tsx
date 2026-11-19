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
  ShieldCheck,
  Mail,
  Sliders,
  Settings,
  Edit3,
  HelpCircle,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export interface CustomFieldDef {
  id: string;
  label: string;
  type: "text" | "number" | "email" | "phone" | "select" | "textarea" | "checkbox";
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

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
  fields: CustomFieldDef[];
  sendConfirmationEmail?: boolean;
  confirmationSubject?: string;
  confirmationMessage?: string;
  consentNotice?: string;
  requireConsent?: boolean;
  submissionsCount: number;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_CONSENT_NOTICE =
  "I hereby consent to Dexta Africa collecting, storing, and processing my personal data strictly in accordance with NDPR & GDPR regulatory standards. I acknowledge this information will only be used for official enterprise communications and event coordination.";

const DEFAULT_CONFIRMATION_MESSAGE =
  "Thank you for completing your registration. Your submission has been officially recorded in our enterprise registry.";

export default function FormsManagementPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [forms, setForms] = React.useState<FormItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [copiedSlug, setCopiedSlug] = React.useState<string | null>(null);

  // Studio Modal State (Supports Create & Edit)
  const [isStudioOpen, setIsStudioOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [studioTab, setStudioTab] = React.useState<"details" | "fields" | "email" | "consent">("details");

  // Form Details
  const [formType, setFormType] = React.useState<"event" | "onboarding" | "partner">("event");
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [eventDate, setEventDate] = React.useState("");
  const [eventLocation, setEventLocation] = React.useState("");
  const [status, setStatus] = React.useState<"active" | "closed" | "draft">("active");

  // Custom Fields Builder
  const [customFields, setCustomFields] = React.useState<CustomFieldDef[]>([]);

  // Email Response Settings
  const [sendConfirmationEmail, setSendConfirmationEmail] = React.useState(true);
  const [confirmationSubject, setConfirmationSubject] = React.useState("");
  const [confirmationMessage, setConfirmationMessage] = React.useState(DEFAULT_CONFIRMATION_MESSAGE);

  // Legal Consent Settings
  const [requireConsent, setRequireConsent] = React.useState(true);
  const [consentNotice, setConsentNotice] = React.useState(DEFAULT_CONSENT_NOTICE);

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

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingId && (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]/g, "-"))) {
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

  const openCreateModal = () => {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setFormType("event");
    setEventDate("");
    setEventLocation("");
    setStatus("active");
    setCustomFields([]);
    setSendConfirmationEmail(true);
    setConfirmationSubject("");
    setConfirmationMessage(DEFAULT_CONFIRMATION_MESSAGE);
    setRequireConsent(true);
    setConsentNotice(DEFAULT_CONSENT_NOTICE);
    setStudioTab("details");
    setIsStudioOpen(true);
  };

  const openEditModal = (item: FormItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setSlug(item.slug);
    setDescription(item.description || "");
    setFormType(item.formType as any);
    setEventDate(item.eventDate ? item.eventDate.split("T")[0] : "");
    setEventLocation(item.eventLocation || "");
    setStatus(item.status);
    setCustomFields(Array.isArray(item.fields) ? item.fields : []);
    setSendConfirmationEmail(item.sendConfirmationEmail !== false);
    setConfirmationSubject(item.confirmationSubject || "");
    setConfirmationMessage(item.confirmationMessage || DEFAULT_CONFIRMATION_MESSAGE);
    setRequireConsent(item.requireConsent !== false);
    setConsentNotice(item.consentNotice || DEFAULT_CONSENT_NOTICE);
    setStudioTab("details");
    setIsStudioOpen(true);
  };

  // Add a new custom field to the builder
  const handleAddField = () => {
    const id = `fld_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newField: CustomFieldDef = {
      id,
      label: "",
      type: "text",
      placeholder: "",
      required: false,
      options: [],
    };
    setCustomFields([...customFields, newField]);
  };

  const handleUpdateField = (id: string, updates: Partial<CustomFieldDef>) => {
    setCustomFields(
      customFields.map((fld) => (fld.id === id ? { ...fld, ...updates } : fld))
    );
  };

  const handleRemoveField = (id: string) => {
    setCustomFields(customFields.filter((fld) => fld.id !== id));
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      toastError("Title and link name are required");
      setStudioTab("details");
      return;
    }

    // Validate custom fields
    for (const fld of customFields) {
      if (!fld.label.trim()) {
        toastError("Please provide a label for all custom input fields or remove empty fields.");
        setStudioTab("fields");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        formType,
        description: description.trim(),
        eventDate: eventDate || null,
        eventLocation: eventLocation.trim(),
        status,
        fields: customFields,
        sendConfirmationEmail,
        confirmationSubject: confirmationSubject.trim(),
        confirmationMessage: confirmationMessage.trim(),
        requireConsent,
        consentNotice: consentNotice.trim(),
      };

      const url = editingId ? `/api/forms/${editingId}` : "/api/forms";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save form");

      toastSuccess(editingId ? "Form updated successfully!" : `Created registration link "/register/${slug}"`);
      setIsStudioOpen(false);
      fetchForms();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, formTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${formTitle}" and all its recorded responses?`)) return;

    try {
      const res = await fetch(`/api/forms/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete form");

      toastSuccess("Form and responses deleted");
      fetchForms();
    } catch (err: any) {
      toastError(err.message || "Failed to delete form");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-red-500" />
              <span>Forms & Registration Studio</span>
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
              NDPR & GDPR Compliant
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Architect custom client onboarding forms, event registrations, and intake portals. Customize dynamic input fields, automate branded email responses, and mandate regulatory data protection acknowledgments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchForms}
            disabled={loading}
            className="border-neutral-800 text-neutral-300 hover:bg-neutral-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-red-600 hover:bg-red-500 text-white font-semibold shadow-lg shadow-red-600/25"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Build New Form
          </Button>
        </div>
      </div>

      {/* Forms Grid */}
      <div>
        {loading && forms.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0f1420] border border-neutral-800 text-neutral-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-red-500" />
            <p className="text-xs font-mono">Loading Enterprise Registration Portals...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0f1420] border border-dashed border-neutral-800 text-neutral-400 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">No Custom Forms Configured</h3>
            <p className="text-xs text-neutral-400 mb-4 max-w-sm mx-auto leading-relaxed">
              Build your first registration link with custom fields, automated confirmation receipts, and legal consent checkboxes.
            </p>
            <Button
              size="sm"
              onClick={openCreateModal}
              className="bg-red-600 hover:bg-red-500 text-white font-medium"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Build Your First Form
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((item) => {
              const fullUrl = `admin.dextaafrica.org/register/${item.slug}`;
              const hasCustomFields = Array.isArray(item.fields) && item.fields.length > 0;
              const hasEmailReceipt = item.sendConfirmationEmail !== false;
              const hasConsent = item.requireConsent !== false;

              return (
                <div
                  key={item.id}
                  className="group rounded-2xl bg-[#0e131f] border border-neutral-800/80 hover:border-neutral-700 p-5 transition-all shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header line */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                        {item.formType}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.status === "active"
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-neutral-600"
                          }`}
                        />
                        <span className="text-[11px] font-mono text-neutral-400 uppercase">
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Title & Link */}
                    <div>
                      <h3 className="font-semibold text-white text-base group-hover:text-red-400 transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Link Copy Box */}
                    <div className="flex items-center justify-between bg-[#141a29] border border-neutral-800 rounded-lg p-2 text-xs">
                      <span className="font-mono text-neutral-300 truncate max-w-[200px]">
                        /{item.slug}
                      </span>
                      <button
                        onClick={() => handleCopyLink(item.slug)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-red-400 hover:text-red-300 px-2 py-0.5 rounded hover:bg-red-500/10 transition-colors"
                      >
                        {copiedSlug === item.slug ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Telemetry & Capability Tags */}
                    <div className="pt-2 border-t border-neutral-800/60 flex flex-wrap gap-1.5 text-[10px] font-mono">
                      <span className="flex items-center gap-1 bg-[#141a29] border border-neutral-800/80 px-2 py-0.5 rounded text-neutral-300">
                        <Users className="w-3 h-3 text-red-400" />
                        <span>{item.submissionsCount} submissions</span>
                      </span>

                      {hasCustomFields && (
                        <span className="flex items-center gap-1 bg-[#141a29] border border-neutral-800/80 px-2 py-0.5 rounded text-neutral-300">
                          <Sliders className="w-3 h-3 text-blue-400" />
                          <span>{item.fields.length} custom field{item.fields.length > 1 ? "s" : ""}</span>
                        </span>
                      )}

                      {hasEmailReceipt && (
                        <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400">
                          <Mail className="w-3 h-3" />
                          <span>Email Receipt: Active</span>
                        </span>
                      )}

                      {hasConsent && (
                        <span className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded text-purple-400">
                          <ShieldCheck className="w-3 h-3" />
                          <span>NDPR Consent</span>
                        </span>
                      )}

                      {item.eventDate && (
                        <span className="flex items-center gap-1 bg-[#141a29] border border-neutral-800/80 px-2 py-0.5 rounded text-neutral-400">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(item.eventDate).toISOString().split("T")[0]}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 mt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/register/${item.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </Link>

                      <button
                        onClick={() => openEditModal(item)}
                        className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
                        title="Configure form fields, emails, and consent"
                      >
                        <Settings className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Edit Studio</span>
                      </button>

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
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700/80 text-white text-xs font-medium transition-all"
                    >
                      <BarChart3 className="w-3 h-3 text-red-400" />
                      <span>Roster</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Studio Modal (Create / Edit) */}
      <Modal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        title={editingId ? "Form Studio: Configure Portal & Fields" : "Form Studio: Build Registration Portal"}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
          {/* Studio Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#141a29] border border-neutral-800 rounded-xl overflow-x-auto">
            {[
              { id: "details" as const, label: "1. Link & Basics", icon: Sliders },
              { id: "fields" as const, label: `2. Custom Fields (${customFields.length})`, icon: Plus },
              { id: "email" as const, label: "3. Email Response", icon: Mail },
              { id: "consent" as const, label: "4. Legal Consent", icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = studioTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStudioTab(tab.id)}
                  className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-medium transition-all ${
                    isActive
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: DETAILS & BASICS */}
          {studioTab === "details" && (
            <div className="space-y-3.5 animate-fadeIn">
              <div>
                <label className="block font-medium text-neutral-300 mb-1.5">Portal Purpose *</label>
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

              <div>
                <label className="block font-medium text-neutral-300 mb-1">
                  Portal Title / Event Name *
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

              <div>
                <label className="block font-medium text-neutral-300 mb-1">
                  Short Link Slug * (clean URL identifier)
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
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">Description / Brief Overview</label>
                <textarea
                  rows={2}
                  placeholder="Brief welcome message or event context displayed to respondents..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121724] border border-neutral-800 rounded-lg text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

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

              <div>
                <label className="block font-medium text-neutral-300 mb-1">Portal Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#121724] border border-neutral-800 rounded-lg text-neutral-100 focus:outline-none focus:border-red-500"
                >
                  <option value="active">Active (Open to Public Submissions)</option>
                  <option value="closed">Closed (Submissions Suspended)</option>
                  <option value="draft">Draft (Admin Access Only)</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM INPUT FIELDS BUILDER */}
          {studioTab === "fields" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-neutral-800 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-white">Dynamic Form Questions</h4>
                  <p className="text-[11px] text-neutral-400">
                    Standard fields (Full Name, Email, Phone, Company, Designation) are automatically captured. Add any custom fields needed for this intake.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddField}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Field
                </Button>
              </div>

              {customFields.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-[#121724] border border-dashed border-neutral-800 text-neutral-400">
                  <p className="text-xs">No custom questions added yet. The form will capture standard enterprise contact fields.</p>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="mt-2 text-red-400 hover:text-red-300 font-medium text-xs underline"
                  >
                    + Add your first custom question
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {customFields.map((fld, idx) => (
                    <div
                      key={fld.id}
                      className="p-3 rounded-xl bg-[#121724] border border-neutral-800 space-y-2.5 relative group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] text-neutral-400 font-bold uppercase">
                          Question #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-neutral-300">
                            <input
                              type="checkbox"
                              checked={fld.required || false}
                              onChange={(e) => handleUpdateField(fld.id, { required: e.target.checked })}
                              className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-900 text-red-600 focus:ring-red-500 accent-red-600"
                            />
                            <span>Required</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemoveField(fld.id)}
                            className="text-neutral-500 hover:text-red-400 p-1"
                            title="Remove field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">Field Question / Label *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Estimated Project Budget"
                            value={fld.label}
                            onChange={(e) => handleUpdateField(fld.id, { label: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-[#0f1420] border border-neutral-800 rounded-lg text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">Input Field Type</label>
                          <select
                            value={fld.type}
                            onChange={(e) => handleUpdateField(fld.id, { type: e.target.value as any })}
                            className="w-full px-2.5 py-1.5 bg-[#0f1420] border border-neutral-800 rounded-lg text-neutral-100 focus:outline-none focus:border-red-500"
                          >
                            <option value="text">Single Line Text</option>
                            <option value="number">Numeric / Quantity</option>
                            <option value="select">Dropdown Selection</option>
                            <option value="textarea">Paragraph / Long Text</option>
                            <option value="phone">Phone / WhatsApp</option>
                            <option value="email">Email Address</option>
                          </select>
                        </div>
                      </div>

                      {fld.type === "select" ? (
                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">
                            Dropdown Options (comma-separated)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Under $50k, $50k - $250k, $250k - $1M, $1M+"
                            value={Array.isArray(fld.options) ? fld.options.join(", ") : ""}
                            onChange={(e) =>
                              handleUpdateField(fld.id, {
                                options: e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-[#0f1420] border border-neutral-800 rounded-lg text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">Placeholder Text (optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Enter details or scope here..."
                            value={fld.placeholder || ""}
                            onChange={(e) => handleUpdateField(fld.id, { placeholder: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-[#0f1420] border border-neutral-800 rounded-lg text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUTOMATED EMAIL RESPONSE */}
          {studioTab === "email" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-red-400" />
                    <div>
                      <h4 className="font-semibold text-white">Instant Confirmation Email Response</h4>
                      <p className="text-[11px] text-neutral-400">
                        Automatically dispatch a branded registration receipt to the applicant&apos;s submitted email.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendConfirmationEmail}
                      onChange={(e) => setSendConfirmationEmail(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600" />
                  </label>
                </div>
              </div>

              {sendConfirmationEmail && (
                <div className="space-y-3 bg-[#121724] p-4 rounded-xl border border-neutral-800">
                  <div>
                    <label className="block font-medium text-neutral-300 mb-1">
                      Email Subject Line
                    </label>
                    <input
                      type="text"
                      placeholder={`Registration Confirmed: ${title || "Your Event"}`}
                      value={confirmationSubject}
                      onChange={(e) => setConfirmationSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0f1420] border border-neutral-800 rounded-lg text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
                    />
                    <p className="text-[10px] text-neutral-500 mt-1">
                      Leave empty to use the default automated subject: &quot;Registration Confirmed: [Title]&quot;
                    </p>
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-300 mb-1">
                      Custom Body Message & Instructions
                    </label>
                    <textarea
                      rows={3}
                      placeholder={DEFAULT_CONFIRMATION_MESSAGE}
                      value={confirmationMessage}
                      onChange={(e) => setConfirmationMessage(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0f1420] border border-neutral-800 rounded-lg text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] leading-relaxed">
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                    Emails will automatically include the registrant&apos;s name, event details, venue, reference ID, and a verified NDPR/GDPR consent acknowledgment badge.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DATA PROTECTION & LEGAL CONSENT */}
          {studioTab === "consent" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h4 className="font-semibold text-white">Mandatory Data Protection Acknowledgment</h4>
                      <p className="text-[11px] text-neutral-400">
                        Requires applicants to explicitly check a consent box acknowledging data usage to protect against privacy disputes and regulatory non-compliance.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireConsent}
                      onChange={(e) => setRequireConsent(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                  </label>
                </div>
              </div>

              <div className="space-y-3 bg-[#121724] p-4 rounded-xl border border-neutral-800">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">
                    Regulatory Legal Notice Text (NDPR / GDPR)
                  </label>
                  <textarea
                    rows={4}
                    value={consentNotice}
                    onChange={(e) => setConsentNotice(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0f1420] border border-neutral-800 rounded-lg text-neutral-100 focus:outline-none focus:border-red-500 leading-relaxed text-[11px]"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    This exact legal disclaimer will be displayed next to a mandatory agreement checkbox on the public submission portal.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] leading-relaxed">
                  <AlertCircle className="w-3.5 h-3.5 inline mr-1 text-blue-400" />
                  Every submission logs the applicant&apos;s IP address, timestamp, and user-agent string alongside their explicit consent acknowledgment.
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 flex items-center justify-between border-t border-neutral-800">
            <div className="text-[11px] text-neutral-400">
              {editingId ? "Updating existing portal configuration" : "Creating new custom intake portal"}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsStudioOpen(false)}
                className="border-neutral-800 text-neutral-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-500 text-white font-semibold"
              >
                {isSubmitting ? "Saving Form..." : editingId ? "Save Changes" : "Create & Launch Portal"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
