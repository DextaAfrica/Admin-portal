"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  CheckCircle2,
  Building2,
  User,
  Mail,
  Phone,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  X,
  RefreshCw,
  ShieldCheck,
  Globe2,
  Users,
  Check,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Paperclip,
  CheckSquare,
  CircleDot,
  Globe,
  Hash,
  Sliders,
} from "lucide-react";
import { DextaLogo } from "@/components/ui/DextaLogo";

interface CustomFormField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
  accept?: string;
  maxSizeMb?: number;
}

interface FormDataState {
  id: string;
  slug: string;
  title: string;
  description: string;
  formType: string;
  status: string;
  coverImageUrl: string;
  eventDate: string | null;
  eventLocation: string;
  activeFrom?: string | null;
  activeUntil?: string | null;
  fields: CustomFormField[];
  metadata: Record<string, any>;
  sendConfirmationEmail?: boolean;
  confirmationSubject?: string;
  confirmationMessage?: string;
  consentNotice?: string;
  requireConsent?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function PublicRegistrationPage({
  params,
}: {
  params?: { slug?: string } | Promise<{ slug?: string }>;
}) {
  const routeParams = useParams();
  const router = useRouter();
  const slug =
    (typeof routeParams?.slug === "string" ? routeParams.slug : "") ||
    (params && "slug" in params && typeof params.slug === "string" ? params.slug : "");

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const [form, setForm] = React.useState<FormDataState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [jobTitle, setJobTitle] = React.useState("");
  const [category, setCategory] = React.useState("Client");
  const [attendanceMode, setAttendanceMode] = React.useState("in-person");
  const [customAnswers, setCustomAnswers] = React.useState<Record<string, any>>({});
  const [notes, setNotes] = React.useState("");
  const [consentAcknowledged, setConsentAcknowledged] = React.useState(false);

  // Upload progress states
  const [uploadingFieldId, setUploadingFieldId] = React.useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [submissionId, setSubmissionId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadForm() {
      if (!slug) {
        setLoading(false);
        setError("Invalid or missing registration link.");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/forms/public/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "This registration portal is unavailable or inactive.");
          setForm(null);
        } else {
          setForm(data.form);
          setError(null);
        }
      } catch (err: any) {
        setError("Unable to connect to registration server. Please check your network.");
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [slug]);

  const handleFileUpload = async (fieldId: string, file: File, maxSizeMb?: number) => {
    const maxBytes = (maxSizeMb || 25) * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(`File size exceeds the allowed limit of ${maxSizeMb || 25} MB.`);
      return;
    }

    setUploadingFieldId(fieldId);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/storage/local-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setCustomAnswers((prev) => ({
        ...prev,
        [fieldId]: {
          url: data.path,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        },
      }));
    } catch (err: any) {
      alert(err.message || "Failed to upload file");
    } finally {
      setUploadingFieldId(null);
    }
  };

  const handleRemoveUploadedFile = (fieldId: string) => {
    setCustomAnswers((prev) => {
      const copy = { ...prev };
      delete copy[fieldId];
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    if (form?.requireConsent !== false && !consentAcknowledged) {
      alert("Please acknowledge and accept the Data Protection terms before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/forms/public/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          company,
          jobTitle,
          category,
          attendanceMode,
          answers: customAnswers,
          notes,
          consentAcknowledged,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to submit registration");
      } else {
        setIsSuccess(true);
        setSubmissionId(data.submissionId);
      }
    } catch (err) {
      alert("Network error submitting registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          <p className="text-xs tracking-wider uppercase text-neutral-400 font-mono">
            Loading Registration Portal...
          </p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0d111a] border border-neutral-800 rounded-2xl p-8 text-center shadow-2xl relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-lg bg-neutral-900 border border-neutral-800 transition-colors"
            title="Close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-neutral-100 mb-2">Portal Unavailable</h1>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            {error || "The registration link you requested is currently inactive or does not exist."}
          </p>
          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Previous</span>
            </button>
            <button
              onClick={handleClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-medium text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit Portal</span>
            </button>
          </div>
          <div className="text-xs text-neutral-500 font-mono">Dexta Africa Enterprise Systems</div>
        </div>
      </div>
    );
  }

  // Active Timeline Validation
  const now = Date.now();
  const isUpcoming = form.activeFrom ? new Date(form.activeFrom).getTime() > now : false;
  const isExpired = form.activeUntil ? new Date(form.activeUntil).getTime() < now : false;

  if (isUpcoming) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0d111a] border border-neutral-800 rounded-2xl p-8 text-center shadow-2xl relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-lg bg-neutral-900 border border-neutral-800 transition-colors"
            title="Close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            Registration Opens Soon
          </span>
          <h1 className="text-xl font-bold text-neutral-100 mt-3 mb-2">{form.title}</h1>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            Submissions for this portal will officially open on{" "}
            <span className="text-white font-medium">
              {new Date(form.activeFrom!).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
            . Please check back at the scheduled opening time.
          </p>
          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={handleClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-medium text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit Portal</span>
            </button>
          </div>
          <div className="text-xs text-neutral-500 font-mono">Dexta Africa Enterprise Systems</div>
        </div>
      </div>
    );
  }

  if (isExpired || form.status === "closed") {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0d111a] border border-neutral-800 rounded-2xl p-8 text-center shadow-2xl relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-lg bg-neutral-900 border border-neutral-800 transition-colors"
            title="Close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
            Registration Closed
          </span>
          <h1 className="text-xl font-bold text-neutral-100 mt-3 mb-2">{form.title}</h1>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            {form.activeUntil ? (
              <>
                Registration for this portal closed on{" "}
                <span className="text-white font-medium">
                  {new Date(form.activeUntil).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                . No further submissions are being accepted.
              </>
            ) : (
              "This registration portal is currently closed for submissions."
            )}
          </p>
          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={handleClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-medium text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit Portal</span>
            </button>
          </div>
          <div className="text-xs text-neutral-500 font-mono">Dexta Africa Enterprise Systems</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-neutral-100 flex flex-col selection:bg-red-500/30 selection:text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-red-600/10 blur-[140px] rounded-full" />
        <div className="absolute top-1/3 -right-40 w-[450px] h-[450px] bg-neutral-800/20 blur-[120px] rounded-full" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 border-b border-neutral-800/60 bg-[#07090e]/70 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-all group shadow-sm"
              title="Go back"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-400 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="h-5 w-px bg-neutral-800 hidden sm:block" />

            <DextaLogo className="h-7 w-auto" />
            <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase border-l border-neutral-800 pl-3">
              Official Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-neutral-400 bg-neutral-900/60 border border-neutral-800 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">
                {form.activeUntil
                  ? `Registration Open • Closes ${new Date(form.activeUntil).toLocaleDateString()}`
                  : "Secure Registration Open"}
              </span>
            </div>

            {/* X Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl bg-neutral-900/80 hover:bg-red-500/10 border border-neutral-800 hover:border-red-500/30 text-neutral-400 hover:text-red-400 transition-all shadow-sm"
              title="Close form"
              aria-label="Close form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 py-10">
        {isSuccess ? (
          /* Confirmation Success Card */
          <div className="bg-[#0e131f]/90 border border-neutral-800/80 rounded-2xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl text-center max-w-xl mx-auto">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20 mb-3">
              <Check className="w-3.5 h-3.5" />
              <span>Registration Confirmed</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
              Thank You, {fullName.split(" ")[0]}!
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              Your registration for <strong className="text-neutral-200">{form.title}</strong> has
              been officially received. {form.sendConfirmationEmail !== false && (
                <>An official confirmation receipt has been dispatched to{" "}
                <span className="text-red-400 font-mono">{email}</span>.</>
              )}
            </p>

            {/* Registration Summary Box */}
            <div className="bg-[#141a29]/70 border border-neutral-800 rounded-xl p-5 text-left mb-6 space-y-2.5 text-xs text-neutral-300">
              <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Portal Link</span>
                <span className="font-mono text-neutral-200">/register/{form.slug}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Classification</span>
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 font-medium">{category}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Legal Consent</span>
                <span className="text-emerald-400 font-medium">NDPR Verified</span>
              </div>
              {submissionId && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-400">Confirmation ID</span>
                  <span className="font-mono text-neutral-400 text-[11px]">{submissionId.slice(0, 8)}...</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
                title="Exit portal"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close Portal</span>
              </button>

              <button
                onClick={() => {
                  setIsSuccess(false);
                  setFullName("");
                  setEmail("");
                  setPhone("");
                  setCompany("");
                  setJobTitle("");
                  setCustomAnswers({});
                  setConsentAcknowledged(false);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Submit another response</span>
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form Card */
          <div className="bg-[#0e131f]/95 border border-neutral-800/80 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden">
            {/* Form Banner & Intro */}
            <div className="p-6 sm:p-10 border-b border-neutral-800/80 bg-gradient-to-b from-neutral-900/50 to-transparent">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white text-xs transition-colors shadow-sm"
                    title="Return to previous"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wider uppercase bg-red-500/10 text-red-400 border border-red-500/20">
                    {form.formType === "onboarding"
                      ? "Onboarding Portal"
                      : form.formType === "partner"
                      ? "Partner Intake"
                      : "Official Registration"}
                  </span>
                  <span className="text-neutral-400 text-xs font-mono">
                    dextaafrica.com/register/{form.slug}
                  </span>
                </div>

                {/* X Close Button on Card */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 rounded-xl bg-neutral-900/80 hover:bg-red-500/20 border border-neutral-800 hover:border-red-500/40 text-neutral-400 hover:text-red-400 transition-all"
                  title="Close form"
                  aria-label="Close form"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
                {form.title}
              </h1>

              {form.description && (
                <p className="text-sm text-neutral-300 leading-relaxed max-w-2xl mb-4">
                  {form.description}
                </p>
              )}

              {/* Event Metadata (Date & Location) */}
              {(form.eventDate || form.eventLocation) && (
                <div className="flex flex-wrap gap-4 pt-2 text-xs text-neutral-300">
                  {form.eventDate && (
                    <div className="flex items-center gap-2 bg-[#141a29] border border-neutral-800 px-3.5 py-2 rounded-xl">
                      <Calendar className="w-4 h-4 text-red-400" />
                      <span>{new Date(form.eventDate).toLocaleDateString(undefined, { dateStyle: "full" })}</span>
                    </div>
                  )}
                  {form.eventLocation && (
                    <div className="flex items-center gap-2 bg-[#141a29] border border-neutral-800 px-3.5 py-2 rounded-xl">
                      <MapPin className="w-4 h-4 text-red-400" />
                      <span>{form.eventLocation}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Form Body */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-7">
              {/* Category Selector Pill Row */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2.5">
                  Select Your Classification *
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Client", "Lead", "Investor", "Partner", "Contractor", "Attendee"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        category === cat
                          ? "bg-red-600 text-white shadow-lg shadow-red-600/30 scale-[1.02]"
                          : "bg-[#141a29] text-neutral-400 hover:text-neutral-200 border border-neutral-800"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attendance Mode (if event) */}
              {form.formType === "event" && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-2.5">
                    Mode of Attendance *
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    <button
                      type="button"
                      onClick={() => setAttendanceMode("in-person")}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs transition-all ${
                        attendanceMode === "in-person"
                          ? "bg-red-500/10 border-red-500/50 text-white"
                          : "bg-[#141a29]/60 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      <Users className="w-4 h-4 text-red-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-neutral-200">In-Person</div>
                        <div className="text-[11px] text-neutral-400">Attend at physical venue</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceMode("virtual")}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs transition-all ${
                        attendanceMode === "virtual"
                          ? "bg-red-500/10 border-red-500/50 text-white"
                          : "bg-[#141a29]/60 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      <Globe2 className="w-4 h-4 text-red-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-neutral-200">Virtual Access</div>
                        <div className="text-[11px] text-neutral-400">Stream via live link</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Contact Information Grid */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Primary Contact & Organization Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Olamide Adeyemi"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#121724] border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="name@organization.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#121724] border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="+234 803 555 0192"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#121724] border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Organization / Company
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. Lekki Free Zone Authority"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#121724] border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Designation / Job Title
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. Managing Director / Concession Lead"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#121724] border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Custom Fields (Documents, Photos, Radio, Checkbox, Select, Dates) */}
              {Array.isArray(form.fields) && form.fields.length > 0 && (
                <div className="pt-4 border-t border-neutral-800/80 space-y-5">
                  <div>
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Additional Intake & Documentation
                    </h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Please supply the requested parameters, briefs, and supporting documentation.
                    </p>
                  </div>

                  {form.fields.map((fld) => {
                    const isUploading = uploadingFieldId === fld.id;
                    const uploadedData = customAnswers[fld.id];

                    return (
                      <div key={fld.id} className="space-y-1.5">
                        <label className="block text-xs font-semibold text-neutral-200">
                          {fld.label} {fld.required && <span className="text-red-400 font-bold">*</span>}
                        </label>
                        {fld.description && (
                          <p className="text-[11px] text-neutral-400 leading-snug">{fld.description}</p>
                        )}

                        {/* 1. DOCUMENT / FILE UPLOAD */}
                        {fld.type === "file" ? (
                          <div>
                            {uploadedData ? (
                              <div className="p-3.5 rounded-2xl bg-[#111726] border border-amber-500/40 flex items-center justify-between gap-3 shadow-md">
                                <div className="flex items-center gap-3 truncate">
                                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                                    <FileSpreadsheet className="w-5 h-5" />
                                  </div>
                                  <div className="truncate">
                                    <div className="text-xs font-semibold text-white truncate">
                                      {uploadedData.fileName || "Uploaded Document"}
                                    </div>
                                    <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-2">
                                      {uploadedData.fileSize && <span>{formatBytes(uploadedData.fileSize)}</span>}
                                      <a
                                        href={uploadedData.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-amber-400 hover:underline flex items-center gap-0.5"
                                      >
                                        <span>View Document</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveUploadedFile(fld.id)}
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                                  title="Remove File"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <label
                                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                                  isUploading
                                    ? "bg-amber-500/5 border-amber-500/50"
                                    : "bg-[#111624] border-neutral-800 hover:border-amber-500/50 hover:bg-[#131929]"
                                }`}
                              >
                                <input
                                  type="file"
                                  accept={fld.accept || ".pdf,.doc,.docx,.xlsx"}
                                  disabled={isUploading}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(fld.id, file, fld.maxSizeMb);
                                  }}
                                  className="sr-only"
                                />
                                {isUploading ? (
                                  <div className="flex flex-col items-center gap-2">
                                    <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                                    <span className="text-xs text-amber-300 font-mono">Uploading Document...</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-2 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                                      <UploadCloud className="w-6 h-6" />
                                    </div>
                                    <div className="text-xs font-semibold text-neutral-200">
                                      Click to upload document or drag and drop
                                    </div>
                                    <div className="text-[11px] text-neutral-400">
                                      {fld.accept || "PDF, DOCX, XLSX"} (Max {fld.maxSizeMb || 25} MB)
                                    </div>
                                  </div>
                                )}
                              </label>
                            )}
                          </div>
                        ) : fld.type === "image" ? (
                          /* 2. PHOTO / IMAGE UPLOAD */
                          <div>
                            {uploadedData ? (
                              <div className="p-3.5 rounded-2xl bg-[#111726] border border-amber-500/40 flex items-center justify-between gap-3 shadow-md">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-xl border border-neutral-700 overflow-hidden bg-black shrink-0 relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={uploadedData.url}
                                      alt="Uploaded Preview"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="truncate">
                                    <div className="text-xs font-semibold text-white truncate">
                                      {uploadedData.fileName || "Uploaded Image"}
                                    </div>
                                    <div className="text-[10px] text-neutral-400 font-mono">
                                      {uploadedData.fileSize ? formatBytes(uploadedData.fileSize) : "Verified Image"}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveUploadedFile(fld.id)}
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                                  title="Remove Image"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <label
                                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                                  isUploading
                                    ? "bg-amber-500/5 border-amber-500/50"
                                    : "bg-[#111624] border-neutral-800 hover:border-amber-500/50 hover:bg-[#131929]"
                                }`}
                              >
                                <input
                                  type="file"
                                  accept={fld.accept || "image/*"}
                                  disabled={isUploading}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(fld.id, file, fld.maxSizeMb);
                                  }}
                                  className="sr-only"
                                />
                                {isUploading ? (
                                  <div className="flex flex-col items-center gap-2">
                                    <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                                    <span className="text-xs text-amber-300 font-mono">Uploading Image...</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-2 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                                      <ImageIcon className="w-6 h-6" />
                                    </div>
                                    <div className="text-xs font-semibold text-neutral-200">
                                      Click to upload image or drag and drop
                                    </div>
                                    <div className="text-[11px] text-neutral-400">
                                      PNG, JPG, WEBP, SVG (Max {fld.maxSizeMb || 25} MB)
                                    </div>
                                  </div>
                                )}
                              </label>
                            )}
                          </div>
                        ) : fld.type === "radio" && Array.isArray(fld.options) ? (
                          /* 3. RADIO CHOICE CARDS */
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {fld.options.map((opt) => {
                              const isSelected = customAnswers[fld.id] === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setCustomAnswers({ ...customAnswers, [fld.id]: opt })}
                                  className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 text-xs transition-all ${
                                    isSelected
                                      ? "bg-red-500/10 border-red-500/60 text-white"
                                      : "bg-[#121724] border-neutral-800 text-neutral-300 hover:border-neutral-700"
                                  }`}
                                >
                                  <span>{opt}</span>
                                  <span
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? "border-red-500 bg-red-600"
                                        : "border-neutral-700 bg-neutral-900"
                                    }`}
                                  >
                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : fld.type === "checkbox" && Array.isArray(fld.options) ? (
                          /* 4. MULTI-SELECT CHECKBOXES */
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {fld.options.map((opt) => {
                              const currentSelected: string[] = Array.isArray(customAnswers[fld.id])
                                ? customAnswers[fld.id]
                                : [];
                              const isChecked = currentSelected.includes(opt);

                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => {
                                    const next = isChecked
                                      ? currentSelected.filter((x) => x !== opt)
                                      : [...currentSelected, opt];
                                    setCustomAnswers({ ...customAnswers, [fld.id]: next });
                                  }}
                                  className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 text-xs transition-all ${
                                    isChecked
                                      ? "bg-red-500/10 border-red-500/60 text-white"
                                      : "bg-[#121724] border-neutral-800 text-neutral-300 hover:border-neutral-700"
                                  }`}
                                >
                                  <span>{opt}</span>
                                  <span
                                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                      isChecked
                                        ? "border-red-500 bg-red-600 text-white"
                                        : "border-neutral-700 bg-neutral-900"
                                    }`}
                                  >
                                    {isChecked && <Check className="w-3 h-3" />}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : fld.type === "select" && Array.isArray(fld.options) ? (
                          /* 5. DROPDOWN SELECTION */
                          <select
                            required={fld.required}
                            value={customAnswers[fld.id] || ""}
                            onChange={(e) =>
                              setCustomAnswers({ ...customAnswers, [fld.id]: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 bg-[#121724] border border-neutral-800 rounded-xl text-sm text-neutral-100 focus:outline-none focus:border-red-500"
                          >
                            <option value="">Select an option</option>
                            {fld.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : fld.type === "textarea" ? (
                          /* 6. MULTI-LINE TEXTAREA */
                          <textarea
                            required={fld.required}
                            rows={3}
                            placeholder={fld.placeholder || ""}
                            value={customAnswers[fld.id] || ""}
                            onChange={(e) =>
                              setCustomAnswers({ ...customAnswers, [fld.id]: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 bg-[#121724] border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500 resize-none"
                          />
                        ) : fld.type === "date" ? (
                          /* 7. DATE PICKER */
                          <input
                            type="date"
                            required={fld.required}
                            value={customAnswers[fld.id] || ""}
                            onChange={(e) =>
                              setCustomAnswers({ ...customAnswers, [fld.id]: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 bg-[#121724] border border-neutral-800 rounded-xl text-sm text-neutral-100 focus:outline-none focus:border-red-500"
                          />
                        ) : fld.type === "url" ? (
                          /* 8. URL INPUT */
                          <div className="relative">
                            <Globe className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="url"
                              required={fld.required}
                              placeholder={fld.placeholder || "https://..."}
                              value={customAnswers[fld.id] || ""}
                              onChange={(e) =>
                                setCustomAnswers({ ...customAnswers, [fld.id]: e.target.value })
                              }
                              className="w-full pl-10 pr-4 py-2.5 bg-[#121724] border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
                            />
                          </div>
                        ) : (
                          /* 9. STANDARD TEXT / NUMBER / PHONE */
                          <input
                            type={fld.type === "number" ? "number" : fld.type === "email" ? "email" : "text"}
                            required={fld.required}
                            placeholder={fld.placeholder || ""}
                            value={customAnswers[fld.id] || ""}
                            onChange={(e) =>
                              setCustomAnswers({ ...customAnswers, [fld.id]: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 bg-[#121724] border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Special Notes / Objectives */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Special Notes / Objectives
                </label>
                <textarea
                  rows={3}
                  placeholder="Share any specific interest, project scope, or requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#121724] border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              {/* Mandatory Data Protection & Legal Consent Section */}
              <div
                className={`p-5 sm:p-6 rounded-2xl transition-all duration-200 border ${
                  consentAcknowledged
                    ? "bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/20"
                    : "bg-[#0f1420] border-neutral-800"
                } space-y-4 shadow-inner`}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-200">
                    <ShieldCheck
                      className={`w-4 h-4 ${
                        consentAcknowledged ? "text-emerald-400" : "text-neutral-400"
                      } shrink-0`}
                    />
                    <span>Data Protection & Privacy Acknowledgment</span>
                  </div>
                  {consentAcknowledged ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                      <Check className="w-3 h-3" />
                      <span>NDPR Verified</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-neutral-500">
                      Acknowledgment Required *
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  {form.consentNotice ||
                    "I hereby consent to Dexta Africa collecting, storing, and processing my personal data strictly in accordance with NDPR & GDPR regulatory standards. I acknowledge this information will only be used for official enterprise communications and event coordination."}
                </p>

                <div className="pt-3 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="flex items-start gap-3 cursor-pointer group flex-1">
                    <input
                      type="checkbox"
                      required={form.requireConsent !== false}
                      checked={consentAcknowledged}
                      onChange={(e) => setConsentAcknowledged(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-neutral-950 accent-emerald-600 shrink-0"
                    />
                    <span className="text-xs text-neutral-300 group-hover:text-white transition-colors leading-snug">
                      I have read, understood, and accept the Data Protection terms and authorize Dexta Africa to process my information. <span className="text-red-400 font-bold">*</span>
                    </span>
                  </label>

                  {/* Dedicated Acknowledge Button */}
                  <button
                    type="button"
                    onClick={() => setConsentAcknowledged((prev) => !prev)}
                    className={`shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-sm ${
                      consentAcknowledged
                        ? "bg-emerald-600/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/30"
                        : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/20 hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                  >
                    {consentAcknowledged ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Terms Acknowledged</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Acknowledge Terms *</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Dexta Africa Data Protection & Privacy Verified</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || uploadingFieldId !== null}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm shadow-lg shadow-red-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {consentAcknowledged ? "Complete Registration" : "Acknowledge & Complete Registration"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-800/60 py-6 text-center text-xs text-neutral-400">
        <p>© 2026 Dexta Africa Enterprise Systems. All rights reserved.</p>
      </footer>
    </div>
  );
}
