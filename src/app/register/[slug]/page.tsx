"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Calendar,
  MapPin,
  CheckCircle2,
  Building2,
  User,
  Mail,
  Phone,
  Briefcase,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Globe2,
  Users,
  Check,
} from "lucide-react";
import { DextaLogo } from "@/components/ui/DextaLogo";

interface CustomFormField {
  id: string;
  label: string;
  type: "text" | "select" | "textarea";
  required?: boolean;
  options?: string[];
  placeholder?: string;
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
  fields: CustomFormField[];
  metadata: Record<string, any>;
  sendConfirmationEmail?: boolean;
  confirmationSubject?: string;
  confirmationMessage?: string;
  consentNotice?: string;
  requireConsent?: boolean;
}

export default function PublicRegistrationPage({
  params,
}: {
  params?: { slug?: string } | Promise<{ slug?: string }>;
}) {
  const routeParams = useParams();
  const slug =
    (typeof routeParams?.slug === "string" ? routeParams.slug : "") ||
    (params && "slug" in params && typeof params.slug === "string" ? params.slug : "");

  const [form, setForm] = React.useState<FormDataState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [jobTitle, setJobTitle] = React.useState("");
  const [category, setCategory] = React.useState("Attendee");
  const [attendanceMode, setAttendanceMode] = React.useState("in-person");
  const [customAnswers, setCustomAnswers] = React.useState<Record<string, string>>({});
  const [notes, setNotes] = React.useState("");
  const [consentAcknowledged, setConsentAcknowledged] = React.useState(false);

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
      setError(null);
      try {
        const res = await fetch(`/api/forms/public/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Registration portal not found");
        } else {
          setForm(data.form);
          if (data.form.formType === "onboarding") {
            setCategory("Client");
          } else if (data.form.formType === "partner") {
            setCategory("Partner");
          }
        }
      } catch (err: any) {
        setError("Unable to connect to registration services");
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    if (form?.requireConsent !== false && !consentAcknowledged) {
      alert("Please acknowledge and agree to the Data Protection & Legal Consent terms before submitting.");
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
        <div className="max-w-md w-full bg-[#0d111a] border border-neutral-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-neutral-100 mb-2">Portal Unavailable</h1>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            {error || "The registration link you requested is currently inactive or does not exist."}
          </p>
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
            <DextaLogo className="h-7 w-auto" />
            <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase border-l border-neutral-800 pl-3">
              Official Portal
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 bg-neutral-900/60 border border-neutral-800 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Secure Registration Open</span>
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
              been received. {form.sendConfirmationEmail !== false && (
                <>An official confirmation receipt has been dispatched to{" "}
                <span className="text-red-400 font-mono">{email}</span>.</>
              )}
            </p>

            {/* Registration Summary Box */}
            <div className="bg-[#141a29]/70 border border-neutral-800 rounded-xl p-5 text-left mb-6 space-y-2.5 text-xs text-neutral-300">
              <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Portal Link</span>
                <span className="font-mono text-neutral-200">/{form.slug}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Category</span>
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 font-medium">{category}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Attendance</span>
                <span className="capitalize text-neutral-200 font-medium">{attendanceMode}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Legal Consent</span>
                <span className="text-emerald-400 font-medium">Acknowledged (NDPR Compliant)</span>
              </div>
              {submissionId && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-400">Confirmation ID</span>
                  <span className="font-mono text-neutral-400 text-[11px]">{submissionId.slice(0, 8)}...</span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setIsSuccess(false);
                setFullName("");
                setEmail("");
                setPhone("");
                setCompany("");
                setJobTitle("");
              }}
              className="text-xs text-neutral-400 hover:text-white transition-colors underline underline-offset-4"
            >
              Submit another response
            </button>
          </div>
        ) : (
          /* Registration Form Card */
          <div className="bg-[#0e131f]/90 border border-neutral-800/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
            {/* Form Banner & Intro */}
            <div className="p-6 sm:p-10 border-b border-neutral-800/80 bg-gradient-to-b from-neutral-900/50 to-transparent">
              <div className="flex flex-wrap items-center gap-2 mb-3">
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
            <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-6">
              {/* Category Selector Pill Row */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-2">
                  Select Your Classification *
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Client", "Lead", "Investor", "Partner", "Contractor", "Attendee"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        category === cat
                          ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
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
                  <label className="block text-xs font-medium text-neutral-400 mb-2">
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
                      placeholder="e.g. Managing Director / Infrastructure Consultant"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#121724] border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Custom Fields if present */}
              {Array.isArray(form.fields) && form.fields.length > 0 && (
                <div className="pt-2 border-t border-neutral-800/80 space-y-4">
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Additional Information
                  </h3>
                  {form.fields.map((fld) => (
                    <div key={fld.id}>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        {fld.label} {fld.required && <span className="text-red-400">*</span>}
                      </label>
                      {fld.type === "select" && Array.isArray(fld.options) ? (
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
                        <textarea
                          required={fld.required}
                          rows={3}
                          placeholder={fld.placeholder || ""}
                          value={customAnswers[fld.id] || ""}
                          onChange={(e) =>
                            setCustomAnswers({ ...customAnswers, [fld.id]: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 bg-[#121724] border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
                        />
                      ) : (
                        <input
                          type="text"
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
                  ))}
                </div>
              )}

              {/* Notes or Dietary/Special Requirements */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
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
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0f1420] border border-neutral-800 space-y-3 shadow-inner">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Data Protection & Privacy Acknowledgment</span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {form.consentNotice ||
                    "I hereby consent to Dexta Africa collecting, storing, and processing my personal data strictly in accordance with NDPR & GDPR regulatory standards. I acknowledge this information will only be used for official enterprise communications and event coordination."}
                </p>
                <label className="flex items-start gap-3 cursor-pointer pt-2 group border-t border-neutral-800/80">
                  <input
                    type="checkbox"
                    required={form.requireConsent !== false}
                    checked={consentAcknowledged}
                    onChange={(e) => setConsentAcknowledged(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-red-600 focus:ring-red-500 focus:ring-offset-neutral-950 accent-red-600 shrink-0"
                  />
                  <span className="text-xs text-neutral-300 group-hover:text-white transition-colors leading-snug">
                    I have read, understood, and accept the Data Protection terms and authorize Dexta Africa to process my information. <span className="text-red-400 font-bold">*</span>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Dexta Africa Data Protection & Privacy Verified</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm shadow-lg shadow-red-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
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
