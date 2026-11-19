"use client";

import * as React from "react";
import Link from "next/link";
import {
  Link as LinkIcon,
  Plus,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Mail,
  Sliders,
  Settings,
  HelpCircle,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  CheckSquare,
  CircleDot,
  CalendarDays,
  Globe,
  Hash,
  ChevronUp,
  ChevronDown,
  Layers,
  Eye,
  UploadCloud,
  FileCheck2,
  Phone,
  Sparkles,
  Lock,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export type CustomFieldType =
  | "text"
  | "textarea"
  | "file"
  | "image"
  | "select"
  | "radio"
  | "checkbox"
  | "date"
  | "number"
  | "phone"
  | "email"
  | "url";

export interface CustomFieldDef {
  id: string;
  label: string;
  type: CustomFieldType;
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: string[];
  accept?: string;
  maxSizeMb?: number;
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
  activeFrom?: string | null;
  activeUntil?: string | null;
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

const FIELD_TYPE_CONFIGS: Record<
  CustomFieldType,
  { label: string; icon: any; category: string; defaultPlaceholder: string }
> = {
  text: { label: "Short Text", icon: Sliders, category: "Text Inputs", defaultPlaceholder: "e.g. Project Codename or Full Legal Entity" },
  textarea: { label: "Multi-line Paragraph", icon: FileText, category: "Text Inputs", defaultPlaceholder: "Provide comprehensive details, objectives, or scope..." },
  file: { label: "Document / Brief (PDF, Docs)", icon: FileSpreadsheet, category: "File Uploads", defaultPlaceholder: "Drag and drop or browse documents..." },
  image: { label: "Photo / Image (PNG, JPG)", icon: ImageIcon, category: "File Uploads", defaultPlaceholder: "Upload high-res corporate logo, photo, or CAC certificate..." },
  select: { label: "Dropdown Menu", icon: Layers, category: "Choice & Select", defaultPlaceholder: "Select from options" },
  radio: { label: "Radio Choice Cards", icon: CircleDot, category: "Choice & Select", defaultPlaceholder: "Choose one option" },
  checkbox: { label: "Multi-Select Checkboxes", icon: CheckSquare, category: "Choice & Select", defaultPlaceholder: "Select all that apply" },
  date: { label: "Calendar Date", icon: CalendarDays, category: "Specialized Inputs", defaultPlaceholder: "Select date" },
  phone: { label: "Phone / WhatsApp", icon: Phone, category: "Specialized Inputs", defaultPlaceholder: "+234 800 000 0000" },
  email: { label: "Email Address", icon: Mail, category: "Specialized Inputs", defaultPlaceholder: "name@company.com" },
  number: { label: "Numeric / Currency ($)", icon: Hash, category: "Specialized Inputs", defaultPlaceholder: "e.g. 250000" },
  url: { label: "Website / Portfolio URL", icon: Globe, category: "Specialized Inputs", defaultPlaceholder: "https://yourorganization.com" },
};

export default function FormsManagementPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [forms, setForms] = React.useState<FormItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [copiedSlug, setCopiedSlug] = React.useState<string | null>(null);

  // Studio Modal State
  const [isStudioOpen, setIsStudioOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [studioTab, setStudioTab] = React.useState<"details" | "fields" | "email" | "consent" | "preview">("details");

  // Form Details
  const [formType, setFormType] = React.useState<"event" | "onboarding" | "partner" | "survey">("event");
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [eventDate, setEventDate] = React.useState("");
  const [eventLocation, setEventLocation] = React.useState("");
  const [status, setStatus] = React.useState<"active" | "closed" | "draft">("active");

  // Custom Fields Builder
  const [customFields, setCustomFields] = React.useState<CustomFieldDef[]>([]);

  // Active Timeline Settings
  const [activeFrom, setActiveFrom] = React.useState("");
  const [activeUntil, setActiveUntil] = React.useState("");

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
    let mounted = true;
    async function loadInitial() {
      setLoading(true);
      try {
        const res = await fetch("/api/forms");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch forms");
        if (mounted) setForms(data.forms || []);
      } catch (err: any) {
        if (mounted) toastError(err.message || "Failed to load forms");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadInitial();
    return () => {
      mounted = false;
    };
  }, [toastError]);

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
    setActiveFrom("");
    setActiveUntil("");
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
    setActiveFrom(item.activeFrom ? item.activeFrom.slice(0, 16) : "");
    setActiveUntil(item.activeUntil ? item.activeUntil.slice(0, 16) : "");
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

  // Add field with selected type
  const handleAddFieldOfType = (type: CustomFieldType) => {
    const id = `fld_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const config = FIELD_TYPE_CONFIGS[type];
    const newField: CustomFieldDef = {
      id,
      label: "",
      type,
      placeholder: config.defaultPlaceholder,
      description: "",
      required: false,
      options: type === "select" || type === "radio" || type === "checkbox" ? ["Option 1", "Option 2"] : [],
      accept: type === "file" ? ".pdf,.doc,.docx,.xlsx" : type === "image" ? "image/png,image/jpeg,image/webp" : undefined,
      maxSizeMb: type === "file" || type === "image" ? 25 : undefined,
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

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= customFields.length) return;
    const reordered = [...customFields];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    setCustomFields(reordered);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      toastError("Title and link identifier are required");
      setStudioTab("details");
      return;
    }

    // Validate custom fields
    for (const fld of customFields) {
      if (!fld.label.trim()) {
        toastError("Please provide a question/label for all added fields.");
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
        activeFrom: activeFrom ? new Date(activeFrom).toISOString() : null,
        activeUntil: activeUntil ? new Date(activeUntil).toISOString() : null,
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
            Architect custom client onboarding forms, event registrations, and intake portals with support for document and photo uploads, automated confirmation emails, and regulatory data protection acknowledgments.
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
            <p className="text-xs font-mono">Loading Registration Portals...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0f1420] border border-dashed border-neutral-800 text-neutral-400 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">No Custom Forms Configured</h3>
            <p className="text-xs text-neutral-400 mb-4 max-w-sm mx-auto leading-relaxed">
              Build your first registration link with custom fields, file/image uploaders, automated confirmation receipts, and legal consent checkboxes.
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
              const hasCustomFields = Array.isArray(item.fields) && item.fields.length > 0;
              const hasUploads = Array.isArray(item.fields) && item.fields.some((f) => f.type === "file" || f.type === "image");
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
                        /register/{item.slug}
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

                      {hasUploads && (
                        <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-400 font-semibold">
                          <UploadCloud className="w-3 h-3" />
                          <span>Uploads Active</span>
                        </span>
                      )}

                      {hasEmailReceipt && (
                        <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400">
                          <Mail className="w-3 h-3" />
                          <span>Email Receipt</span>
                        </span>
                      )}

                      {hasConsent && (
                        <span className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded text-purple-400">
                          <ShieldCheck className="w-3 h-3" />
                          <span>NDPR Consent</span>
                        </span>
                      )}

                      {/* Timeline status */}
                      {item.activeUntil && new Date(item.activeUntil).getTime() < Date.now() ? (
                        <span className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded text-red-400 font-semibold">
                          <Lock className="w-3 h-3" />
                          <span>Closed: {new Date(item.activeUntil).toLocaleDateString()}</span>
                        </span>
                      ) : item.activeFrom && new Date(item.activeFrom).getTime() > Date.now() ? (
                        <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-400 font-semibold">
                          <Clock className="w-3 h-3" />
                          <span>Opens: {new Date(item.activeFrom).toLocaleDateString()}</span>
                        </span>
                      ) : item.activeUntil ? (
                        <span className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded text-blue-400">
                          <Clock className="w-3 h-3" />
                          <span>Closes: {new Date(item.activeUntil).toLocaleDateString()}</span>
                        </span>
                      ) : null}

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
                        <span>Public Link</span>
                      </Link>

                      <button
                        onClick={() => openEditModal(item)}
                        className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
                        title="Configure form fields, emails, and consent"
                      >
                        <Settings className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Studio</span>
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
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                    >
                      <span>Responses</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modern High-End Form Studio Workspace (5XL Modern Width) */}
      <Modal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        title={editingId ? "Form Studio: Configure Portal & Field Architecture" : "Form Studio: Architect Intake Portal"}
        maxWidth="5xl"
      >
        <form onSubmit={handleSaveForm} className="space-y-6 text-xs">
          {/* Executive Studio Navigation Bar */}
          <div className="flex items-center gap-2 p-1.5 bg-[#0d121c] border border-neutral-800 rounded-2xl overflow-x-auto scrollbar-none shadow-inner">
            {[
              { id: "details" as const, label: "Identity & Timeline", icon: Sliders, badge: null, badgeColor: "" },
              { id: "fields" as const, label: "Field Architecture", icon: Layers, badge: `${customFields.length} Fields`, badgeColor: "bg-blue-500/20 text-blue-400 border border-blue-500/30" },
              { id: "email" as const, label: "Email Auto-Responder", icon: Mail, badge: sendConfirmationEmail ? "Active" : "Off", badgeColor: sendConfirmationEmail ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-neutral-800 text-neutral-400" },
              { id: "consent" as const, label: "Legal & NDPR", icon: ShieldCheck, badge: requireConsent ? "Enforced" : "Optional", badgeColor: requireConsent ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-neutral-800 text-neutral-400" },
              { id: "preview" as const, label: "Live Form Preview", icon: Eye, badge: "Interactive", badgeColor: "bg-amber-500/20 text-amber-400 border border-amber-500/30" },
            ].map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = studioTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStudioTab(tab.id)}
                  className={`flex-1 min-w-fit whitespace-nowrap flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                      isActive ? "bg-black/30 text-white" : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="tracking-tight">{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium shrink-0 ml-1.5 ${
                        isActive
                          ? "bg-white/20 text-white border border-white/20"
                          : tab.badgeColor
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 1: PORTAL IDENTITY & CLEAN URL */}
          {studioTab === "details" && (
            <div className="space-y-5 animate-fadeIn">
              {/* Purpose Selector Cards */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Portal Purpose & Classification *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      type: "event" as const,
                      title: "Event Registration",
                      desc: "Symposiums, live conferences, & attendee management",
                      icon: Calendar,
                    },
                    {
                      type: "onboarding" as const,
                      title: "Client Onboarding",
                      desc: "Corporate partner intake, briefs, & kickoff documents",
                      icon: Building2,
                    },
                    {
                      type: "partner" as const,
                      title: "Partner Intake",
                      desc: "Concession partners, vendors, & compliance records",
                      icon: Users,
                    },
                    {
                      type: "survey" as const,
                      title: "Intake & Briefs",
                      desc: "Applications, questionnaires, & document collections",
                      icon: FileText,
                    },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = formType === opt.type;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setFormType(opt.type)}
                        className={`p-3.5 rounded-xl text-left border transition-all ${
                          isSelected
                            ? "bg-red-500/10 border-red-500/70 text-white shadow-lg shadow-red-500/10"
                            : "bg-[#111624] border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? "text-red-400" : "text-neutral-500"}`} />
                          <div className="font-semibold text-xs text-white">{opt.title}</div>
                        </div>
                        <div className="text-[11px] text-neutral-400 leading-snug">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Live Clean URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1.5">
                    Portal Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Corporate Client Project Scope & Intake"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#111624] border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-300 mb-1.5">
                    Live URL Identifier (Slug) *
                  </label>
                  <div className="flex items-center bg-[#111624] border border-neutral-800 rounded-xl px-3 py-2 text-sm focus-within:border-red-500 transition-colors">
                    <span className="text-neutral-500 font-mono text-xs select-none shrink-0 whitespace-nowrap pr-1.5">/register/</span>
                    <input
                      type="text"
                      required
                      placeholder="client-onboard"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "-"))}
                      className="w-full bg-transparent text-neutral-100 font-mono text-sm focus:outline-none pl-1 min-w-0"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1 font-mono">
                    Public Endpoint: https://dextaafrica.com/register/{slug || "slug-id"}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-neutral-300 mb-1.5">
                  Brief Overview & Respondent Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide context or instructions shown at the top of the intake portal..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#111624] border border-neutral-800 rounded-xl text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500 resize-none text-xs leading-relaxed"
                />
              </div>

              {/* Event / Optional Metadata & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1.5">Event / Kickoff Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111624] border border-neutral-800 rounded-xl text-neutral-100 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-300 mb-1.5">Venue / Physical Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Dexta HQ, Lagos or Virtual Room"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111624] border border-neutral-800 rounded-xl text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-300 mb-1.5">Portal Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#111624] border border-neutral-800 rounded-xl text-neutral-100 focus:outline-none focus:border-red-500"
                  >
                    <option value="active">Active (Open to Public Submissions)</option>
                    <option value="closed">Closed (Submissions Suspended)</option>
                    <option value="draft">Draft (Admin Access Only)</option>
                  </select>
                </div>
              </div>

              {/* Active Timeline & Automated Scheduling */}
              <div className="p-4 rounded-xl bg-[#0f1422] border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-semibold text-white">Active Timeline & Automated Scheduling</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {activeFrom || activeUntil ? "Scheduled Window" : "Open Indefinitely"}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Define an automated availability window. Outside these dates, public submissions will automatically be disabled and respondents will be shown the respective opening or closure advisory.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                      Start Date & Time (Opens at)
                    </label>
                    <input
                      type="datetime-local"
                      value={activeFrom}
                      onChange={(e) => setActiveFrom(e.target.value)}
                      className="w-full px-3 py-2 bg-[#141a29] border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-red-500"
                    />
                    <span className="text-[10px] text-neutral-500 mt-0.5 block">Leave blank to open immediately</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                      End Date & Time (Closes at)
                    </label>
                    <input
                      type="datetime-local"
                      value={activeUntil}
                      onChange={(e) => setActiveUntil(e.target.value)}
                      className="w-full px-3 py-2 bg-[#141a29] border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-red-500"
                    />
                    <span className="text-[10px] text-neutral-500 mt-0.5 block">Leave blank for no expiration</span>
                  </div>
                </div>

                {(activeFrom || activeUntil) && (
                  <div className="mt-2 p-2.5 rounded-lg bg-[#141a29] border border-neutral-800/80 flex items-center gap-2 text-[11px] font-mono">
                    <span className="text-neutral-400">Schedule Status:</span>
                    {activeUntil && new Date(activeUntil).getTime() < Date.now() ? (
                      <span className="text-red-400 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Registration Expired
                      </span>
                    ) : activeFrom && new Date(activeFrom).getTime() > Date.now() ? (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Scheduled to Open on {new Date(activeFrom).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Currently Active (Closes {activeUntil ? new Date(activeUntil).toLocaleString() : "Never"})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FIELD ARCHITECTURE & FILE UPLOADS */}
          {studioTab === "fields" && (
            <div className="space-y-5 animate-fadeIn">
              {/* Quick Add Toolset */}
              <div className="p-4 rounded-2xl bg-[#0f1420] border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h4 className="font-bold text-white text-xs">Add Dynamic Fields & File Uploaders</h4>
                    <p className="text-[11px] text-neutral-400">
                      Standard contact inputs (Full Name, Email, Phone, Company, Designation) are automatically included. Add custom questions, documents, or photos below.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-500">
                    {customFields.length} Custom Field{customFields.length === 1 ? "" : "s"}
                  </span>
                </div>

                {/* Field Type Quick-Add Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {(Object.keys(FIELD_TYPE_CONFIGS) as CustomFieldType[]).map((type) => {
                    const cfg = FIELD_TYPE_CONFIGS[type];
                    const Icon = cfg.icon;
                    const isUpload = type === "file" || type === "image";
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleAddFieldOfType(type)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          isUpload
                            ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : "bg-[#141a29] hover:bg-neutral-800 text-neutral-300 border-neutral-800 hover:border-neutral-700"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field Cards List */}
              {customFields.length === 0 ? (
                <div className="p-10 text-center rounded-2xl bg-[#0d121c] border border-dashed border-neutral-800 text-neutral-400">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-800/60 text-neutral-400 flex items-center justify-center mx-auto mb-3">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-white text-sm mb-1">No Custom Fields Added Yet</h4>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-4 leading-relaxed">
                    Choose an input type above to accept PDF briefs, image uploads, dropdown choices, or custom questions.
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddFieldOfType("file")}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium text-xs hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>+ Accept Documents (PDF/Docs)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddFieldOfType("image")}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium text-xs hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>+ Accept Photos / Logos</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                  {customFields.map((fld, idx) => {
                    const cfg = FIELD_TYPE_CONFIGS[fld.type] || FIELD_TYPE_CONFIGS.text;
                    const FieldIcon = cfg.icon;
                    const isUpload = fld.type === "file" || fld.type === "image";

                    return (
                      <div
                        key={fld.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isUpload
                            ? "bg-[#111726] border-amber-500/25 shadow-lg shadow-amber-950/10"
                            : "bg-[#101522] border-neutral-800"
                        }`}
                      >
                        {/* Header bar */}
                        <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-neutral-800/80">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-neutral-400">
                              #{idx + 1}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${
                                isUpload
                                  ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                                  : "bg-neutral-800 border-neutral-700 text-neutral-300"
                              }`}
                            >
                              <FieldIcon className="w-3.5 h-3.5" />
                              <span>{cfg.label}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Move Up / Down */}
                            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveField(idx, "up")}
                                className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
                                title="Move Up"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === customFields.length - 1}
                                onClick={() => handleMoveField(idx, "down")}
                                className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
                                title="Move Down"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Required toggle */}
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-neutral-300 ml-1">
                              <input
                                type="checkbox"
                                checked={fld.required || false}
                                onChange={(e) => handleUpdateField(fld.id, { required: e.target.checked })}
                                className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-900 text-red-600 focus:ring-red-500 accent-red-600"
                              />
                              <span className="font-medium">Required</span>
                            </label>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleRemoveField(fld.id)}
                              className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors ml-1"
                              title="Delete Question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Field Configuration Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                              Question / Field Label *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Upload Project Brief or CAC Registration Document"
                              value={fld.label}
                              onChange={(e) => handleUpdateField(fld.id, { label: e.target.value })}
                              className="w-full px-3 py-2 bg-[#0c101a] border border-neutral-800 rounded-xl text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                              Field Type Selector
                            </label>
                            <select
                              value={fld.type}
                              onChange={(e) => handleUpdateField(fld.id, { type: e.target.value as any })}
                              className="w-full px-3 py-2 bg-[#0c101a] border border-neutral-800 rounded-xl text-neutral-100 focus:outline-none focus:border-red-500"
                            >
                              {(Object.keys(FIELD_TYPE_CONFIGS) as CustomFieldType[]).map((t) => (
                                <option key={t} value={t}>
                                  {FIELD_TYPE_CONFIGS[t].label} ({FIELD_TYPE_CONFIGS[t].category})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                              Help Subtitle / Guidance Note (optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Please provide PDF or DOCX file, maximum 25MB."
                              value={fld.description || ""}
                              onChange={(e) => handleUpdateField(fld.id, { description: e.target.value })}
                              className="w-full px-3 py-2 bg-[#0c101a] border border-neutral-800 rounded-xl text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
                            />
                          </div>

                          {/* Upload specific settings */}
                          {isUpload && (
                            <>
                              <div>
                                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                                  Allowed File Extensions
                                </label>
                                <input
                                  type="text"
                                  placeholder={fld.type === "file" ? ".pdf,.doc,.docx,.xlsx" : "image/png,image/jpeg,image/webp"}
                                  value={fld.accept || ""}
                                  onChange={(e) => handleUpdateField(fld.id, { accept: e.target.value })}
                                  className="w-full px-3 py-2 bg-[#0c101a] border border-neutral-800 rounded-xl text-neutral-100 font-mono text-[11px] focus:outline-none focus:border-red-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                                  Max File Size Limit (MB)
                                </label>
                                <select
                                  value={fld.maxSizeMb || 25}
                                  onChange={(e) => handleUpdateField(fld.id, { maxSizeMb: Number(e.target.value) })}
                                  className="w-full px-3 py-2 bg-[#0c101a] border border-neutral-800 rounded-xl text-neutral-100 focus:outline-none focus:border-red-500"
                                >
                                  <option value={5}>5 MB (Light documents & receipts)</option>
                                  <option value={15}>15 MB (Standard presentations & PDFs)</option>
                                  <option value={25}>25 MB (Full enterprise decks & media)</option>
                                  <option value={50}>50 MB (High-res CAD & video archives)</option>
                                </select>
                              </div>
                            </>
                          )}

                          {/* Dropdown / Radio / Checkbox options editor */}
                          {(fld.type === "select" || fld.type === "radio" || fld.type === "checkbox") && (
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                                Available Options (comma-separated list)
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Under $100k, $100k - $500k, $500k - $2M, $2M+"
                                value={Array.isArray(fld.options) ? fld.options.join(", ") : ""}
                                onChange={(e) =>
                                  handleUpdateField(fld.id, {
                                    options: e.target.value
                                      .split(",")
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className="w-full px-3 py-2 bg-[#0c101a] border border-neutral-800 rounded-xl text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUTOMATED EMAIL RESPONSE */}
          {studioTab === "email" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-[#0f1420] border border-neutral-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Instant Confirmation Email Auto-Responder</h4>
                    <p className="text-[11px] text-neutral-400 leading-snug">
                      Automatically dispatches a branded registration receipt and submission record to the registrant.
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
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                </label>
              </div>

              {sendConfirmationEmail && (
                <div className="space-y-4 bg-[#111624] p-5 rounded-2xl border border-neutral-800">
                  <div>
                    <label className="block font-semibold text-neutral-300 mb-1.5">
                      Email Subject Line
                    </label>
                    <input
                      type="text"
                      placeholder={`Registration Confirmed: ${title || "Your Registration"}`}
                      value={confirmationSubject}
                      onChange={(e) => setConfirmationSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0c101a] border border-neutral-800 rounded-xl text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
                    />
                    <p className="text-[10px] text-neutral-500 mt-1 font-mono">
                      Dynamic tokens available: {"{{name}}"}, {"{{portalTitle}}"}, {"{{date}}"}, {"{{referenceId}}"}
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-300 mb-1.5">
                      Custom Body Message & Instructions
                    </label>
                    <textarea
                      rows={3}
                      placeholder={DEFAULT_CONFIRMATION_MESSAGE}
                      value={confirmationMessage}
                      onChange={(e) => setConfirmationMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0c101a] border border-neutral-800 rounded-xl text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500 text-xs leading-relaxed"
                    />
                  </div>

                  {/* Visual Receipt Card Preview */}
                  <div className="p-4 rounded-xl bg-[#090d15] border border-neutral-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 border-b border-neutral-800 pb-2">
                      <span className="font-semibold text-white">Live Dispatched Receipt Preview</span>
                      <span className="font-mono text-emerald-400">● Auto-Dispatched via Dexta Mail</span>
                    </div>
                    <div className="text-xs text-neutral-300 leading-relaxed pt-1">
                      Dear <strong className="text-white">Applicant Name</strong>,
                      <p className="text-neutral-400 mt-1">
                        {confirmationMessage || DEFAULT_CONFIRMATION_MESSAGE}
                      </p>
                    </div>
                    <div className="pt-2 text-[10px] font-mono text-neutral-500 flex items-center justify-between">
                      <span>Audit: NDPR Verified</span>
                      <span>Ref: DEX-REG-2026-XXXX</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DATA PROTECTION & LEGAL CONSENT */}
          {studioTab === "consent" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-[#0f1420] border border-neutral-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Mandatory Data Protection Acknowledgment</h4>
                    <p className="text-[11px] text-neutral-400 leading-snug">
                      Requires applicants to explicitly acknowledge regulatory data usage (NDPR & GDPR) to protect Dexta against misuse claims.
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
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                </label>
              </div>

              <div className="space-y-3 bg-[#111624] p-5 rounded-2xl border border-neutral-800">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1.5">
                    Regulatory Legal Notice Text (NDPR / GDPR)
                  </label>
                  <textarea
                    rows={4}
                    value={consentNotice}
                    onChange={(e) => setConsentNotice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0c101a] border border-neutral-800 rounded-xl text-neutral-100 focus:outline-none focus:border-red-500 leading-relaxed text-xs"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    This exact legal disclaimer is displayed next to the interactive acknowledgment button and checkbox.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs leading-relaxed flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Submissions record the applicant&apos;s verified consent timestamp, IP address, and browser signature for compliance audits.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LIVE FORM PREVIEW */}
          {studioTab === "preview" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-[#0f1420] border border-neutral-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">Live Form Interactive Simulation</h4>
                  <p className="text-[11px] text-neutral-400">
                    Preview how your customized inputs, file upload dropzones, and legal consent appear to public applicants.
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  Preview Mode
                </span>
              </div>

              {/* Mock Public Form View */}
              <div className="p-6 rounded-2xl bg-[#0a0e17] border border-neutral-800 space-y-5 max-w-2xl mx-auto shadow-2xl">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 uppercase">
                    {formType}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1.5">{title || "Untitled Intake Portal"}</h3>
                  <p className="text-xs text-neutral-400 mt-1">{description || "No overview provided."}</p>
                </div>

                {/* Simulated Core Contact Fields */}
                <div className="grid grid-cols-2 gap-3 text-neutral-400 text-xs">
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                    Full Name *
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                    Email Address *
                  </div>
                </div>

                {/* Simulated Custom Fields */}
                {customFields.map((fld) => (
                  <div key={fld.id} className="space-y-1 text-xs">
                    <label className="font-medium text-neutral-200">
                      {fld.label || "Untitled Field"} {fld.required && <span className="text-red-400">*</span>}
                    </label>
                    {fld.description && (
                      <p className="text-[11px] text-neutral-400">{fld.description}</p>
                    )}

                    {fld.type === "file" ? (
                      <div className="p-4 rounded-xl border border-dashed border-neutral-700 bg-neutral-900/60 text-center text-neutral-400">
                        <FileSpreadsheet className="w-6 h-6 mx-auto mb-1 text-amber-400" />
                        <div className="font-medium text-neutral-200">Drag & Drop Document or Click to Browse</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          {fld.accept || "PDF, DOCX, XLSX"} up to {fld.maxSizeMb || 25} MB
                        </div>
                      </div>
                    ) : fld.type === "image" ? (
                      <div className="p-4 rounded-xl border border-dashed border-neutral-700 bg-neutral-900/60 text-center text-neutral-400">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 text-amber-400" />
                        <div className="font-medium text-neutral-200">Drag & Drop Image or Click to Browse</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          PNG, JPG, WEBP up to {fld.maxSizeMb || 25} MB
                        </div>
                      </div>
                    ) : fld.type === "textarea" ? (
                      <textarea
                        rows={2}
                        disabled
                        placeholder={fld.placeholder}
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 resize-none"
                      />
                    ) : (
                      <input
                        type="text"
                        disabled
                        placeholder={fld.placeholder}
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400"
                      />
                    )}
                  </div>
                ))}

                {/* Simulated Consent */}
                {requireConsent && (
                  <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 text-[11px] text-neutral-300 flex items-center justify-between gap-3">
                    <span>{consentNotice}</span>
                    <button
                      type="button"
                      disabled
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 font-semibold shrink-0"
                    >
                      Acknowledge Terms
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 flex items-center justify-between border-t border-neutral-800">
            <div className="text-[11px] text-neutral-400">
              {editingId ? "Updating portal configuration" : "Ready to publish portal configuration"}
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
                className="bg-red-600 hover:bg-red-500 text-white font-semibold shadow-lg shadow-red-600/20"
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
