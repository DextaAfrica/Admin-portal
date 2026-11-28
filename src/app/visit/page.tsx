"use client";

import * as React from "react";
import QRCode from "qrcode";
import {
  User,
  Phone,
  Mail,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  LogIn,
  LogOut,
  ArrowRight,
  AlertCircle,
  Sparkles,
  FileText,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { DextaLogo } from "@/components/ui/DextaLogo";
import { cn } from "@/lib/utils";

interface VisitorFormOptions {
  purposes: string[];
  departments: string[];
  countryCodes: Array<{ code: string; country: string; iso: string }>;
}

interface VisitorPass {
  id: string;
  passCode: string;
  fullName: string;
  phone: string;
  email: string;
  company: string;
  position: string;
  purpose: string;
  purposeOther: string;
  hostName: string;
  department: string;
  hasAppointment: boolean;
  invitedBy: string;
  visitDate: string;
  checkInAt: string;
  checkOutAt: string | null;
  status: "checked_in" | "checked_out";
}

export default function PublicVisitorPortalPage() {
  const [mode, setMode] = React.useState<"checkin" | "checkout">("checkin");
  const [formStep, setFormStep] = React.useState<1 | 2>(1);
  // Keep the server and first browser render identical; the live clock starts after hydration.
  const [nowClock, setNowClock] = React.useState<Date | null>(null);
  const [phoneCountryCode, setPhoneCountryCode] = React.useState("+234");
  const [visitorOptions, setVisitorOptions] = React.useState<VisitorFormOptions | null>(null);
  const [optionsError, setOptionsError] = React.useState("");
  const [validatingStep, setValidatingStep] = React.useState(false);

  // Section 1: Visitor Information
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [position, setPosition] = React.useState("");

  // Section 2: Purpose of Visit
  const [purpose, setPurpose] = React.useState<string>("Business Meeting");
  const [purposeOther, setPurposeOther] = React.useState("");
  const [hostName, setHostName] = React.useState("");
  const [department, setDepartment] = React.useState<string>("Operations & Administration");
  const [hasAppointment, setHasAppointment] = React.useState<boolean>(true);
  const [invitedBy, setInvitedBy] = React.useState("");
  const [visitDescription, setVisitDescription] = React.useState("");

  // Section 4: Visitor Declaration
  const [agreedGuidelines, setAgreedGuidelines] = React.useState<"yes" | "no" | "">("yes");
  const [consentedData, setConsentedData] = React.useState(false);

  // Submission & Pass State
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [activePass, setActivePass] = React.useState<VisitorPass | null>(null);

  // Section 5: Check-Out State
  const [checkoutIdentifier, setCheckoutIdentifier] = React.useState("");
  const [checkoutSubmitting, setCheckoutSubmitting] = React.useState(false);
  const [checkoutError, setCheckoutError] = React.useState("");
  const [checkedOutPass, setCheckedOutPass] = React.useState<VisitorPass | null>(null);
  const [passQrUrl, setPassQrUrl] = React.useState<string>("");

  React.useEffect(() => {
    setNowClock(new Date());
    const timer = setInterval(() => setNowClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadFormOptions = React.useCallback(async () => {
    setOptionsError("");
    try {
      const res = await fetch("/api/visitors/options", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.purposes) || !Array.isArray(data.departments) || !Array.isArray(data.countryCodes)) {
        throw new Error("Registration choices could not be loaded.");
      }
      setVisitorOptions(data);
      if (!data.countryCodes.some((item: VisitorFormOptions["countryCodes"][number]) => item.code === "+234")) {
        setPhoneCountryCode(data.countryCodes[0]?.code || "");
      }
      setPurpose((current) => data.purposes.includes(current) ? current : data.purposes[0] || "");
      setDepartment((current) => data.departments.includes(current) ? current : data.departments[0] || "");
    } catch {
      setOptionsError("We could not load the registration choices. Check your connection and retry.");
    }
  }, []);

  React.useEffect(() => { void loadFormOptions(); }, [loadFormOptions]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("checkout");
    if (code) {
      setMode("checkout");
      setCheckoutIdentifier(code.trim().toUpperCase());
    }
  }, []);

  React.useEffect(() => {
    if (!activePass?.passCode || typeof window === "undefined") {
      setPassQrUrl("");
      return;
    }
    const checkoutUrl = `${window.location.origin}/visit?checkout=${encodeURIComponent(activePass.passCode)}`;
    QRCode.toDataURL(checkoutUrl, {
      width: 220,
      margin: 1,
      color: { dark: "#070A0F", light: "#FFFFFF" },
    })
      .then(setPassQrUrl)
      .catch(() => setPassQrUrl(""));
  }, [activePass]);

  const formattedDate = nowClock?.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }) ?? "Loading date…";
  const formattedTime = nowClock?.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Africa/Lagos",
  }) ?? "--:--:--";

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    setSubmitting(true);
    try {
      const res = await fetch("/api/visitors/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone: `${phoneCountryCode} ${phone}`,
          email: email.trim().toLowerCase(),
          company,
          position,
          purpose,
          purposeOther: purpose === "Other" ? purposeOther : "",
          hostName,
          department,
          hasAppointment,
          invitedBy,
          visitDescription,
          agreedGuidelines: agreedGuidelines === "yes",
          consentedData,
        }),
      });
      const responseText = await res.text();
      let data: any = {};
      try { data = responseText ? JSON.parse(responseText) : {}; } catch { /* handled below */ }
      if (!res.ok) {
        const serverError = res.status >= 500;
        setErrorMsg(serverError
          ? `${data.error || "The registration service is unavailable."}${data.referenceId ? ` Reference: ${data.referenceId}` : " Please ask reception to assist."}`
          : data.error || "Unable to complete check-in. Please verify your details.");
        setSubmitting(false);
        return;
      }
      if (!data.visitor?.passCode) throw new Error("The check-in service returned an incomplete visitor pass.");
      setActivePass(data.visitor);
      setCheckoutIdentifier(data.visitor.passCode);
    } catch (error) {
      console.error("Visitor check-in request failed:", error);
      setErrorMsg(error instanceof Error && error.message.includes("incomplete visitor pass")
        ? "Check-in could not be confirmed. Please contact Front Desk Reception before submitting again."
        : "Unable to reach the check-in service. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueToVisit = async () => {
    setErrorMsg("");
    setValidatingStep(true);
    try {
      const res = await fetch("/api/visitors/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone: `${phoneCountryCode} ${phone}`,
          email,
          company,
          position,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Please review your personal details.");
        return;
      }
      setFormStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErrorMsg("We could not validate your details. Check your connection and retry.");
    } finally {
      setValidatingStep(false);
    }
  };

  const handleSelfCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError("");
    setCheckoutSubmitting(true);
    try {
      const res = await fetch("/api/visitors/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: checkoutIdentifier.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error || "Could not locate an active Checked-In visit.");
        setCheckoutSubmitting(false);
        return;
      }
      setCheckedOutPass(data.visitor);
      if (activePass && activePass.id === data.visitor.id) {
        setActivePass(data.visitor);
      }
    } catch {
      setCheckoutError("Connection error. Please try again.");
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const resetForNewVisitor = () => {
    setFormStep(1);
    setActivePass(null);
    setCheckedOutPass(null);
    setFullName("");
    setPhone("");
    setPhoneCountryCode("+234");
    setEmail("");
    setCompany("");
    setPosition("");
    setPurpose("Business Meeting");
    setPurposeOther("");
    setHostName("");
    setDepartment("Operations & Administration");
    setHasAppointment(true);
    setInvitedBy("");
    setVisitDescription("");
    setAgreedGuidelines("yes");
    setConsentedData(false);
    setErrorMsg("");
    setCheckoutError("");
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 relative overflow-x-hidden selection:bg-[#ED2618] selection:text-white">
      {/* Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[820px] h-[420px] bg-[#ED2618]/[0.09] blur-[170px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[520px] h-[360px] bg-slate-700/[0.08] blur-[150px] rounded-full" />
      </div>

      {/* Top Reception Header */}
      <header className="relative z-20 border-b border-white/[0.08] bg-[#0B0F17]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <DextaLogo className="h-8 w-auto" />
            <div className="border-l border-white/15 pl-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ED2618]">
                Dexta Africa Reception
              </p>
              <p className="text-xs text-slate-400">
                Visitor Registration &amp; Digital Pass Portal
              </p>
            </div>
          </div>

          {/* Live Date & Clock Pill */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-[#ED2618]" />
              <span className="font-medium">{formattedDate}</span>
            </div>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-semibold">
              <Clock className="h-3.5 w-3.5" />
              <span>{formattedTime}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-4xl px-3 sm:px-6 py-5 sm:py-10 space-y-5 sm:space-y-6">
        {/* Mode Switcher: Check In vs Check Out */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {mode === "checkin" ? "Visitor Check-In" : "Visitor Check-Out"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {mode === "checkin"
                ? "Welcome to Dexta Africa. Please complete your registration to receive your Digital Visitor Pass."
                : "Departing the premises? Record your departure time using the Pass Code on your digital visitor pass."}
            </p>
          </div>

          <div className="inline-flex max-w-full p-1 rounded-2xl bg-[#111622] border border-white/10 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setMode("checkin");
                setCheckedOutPass(null);
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                mode === "checkin"
                  ? "bg-[#ED2618] text-white shadow-lg shadow-red-500/25"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Check In</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("checkout")}
              className={cn(
                "flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                mode === "checkout"
                  ? "bg-[#ED2618] text-white shadow-lg shadow-red-500/25"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Check Out</span>
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* CHECK-IN SUCCESS: DIGITAL VISITOR PASS                           */}
        {/* ================================================================ */}
        {mode === "checkin" && activePass && (
          <div className="rounded-3xl border border-emerald-500/30 bg-[#0F141F] p-4 sm:p-8 shadow-2xl space-y-5 sm:space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Checked In
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-1">
                    Digital Visitor Pass Issued
                  </h2>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                {passQrUrl && (
                  <div className="rounded-2xl bg-white p-2 shadow-lg shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={passQrUrl}
                      alt={`QR Code for ${activePass.passCode}`}
                      className="h-20 w-20"
                    />
                  </div>
                )}
                <div className="w-full sm:w-auto rounded-2xl border border-white/15 bg-black/40 px-4 sm:px-5 py-3 text-center">
                  <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                    Visitor Pass Code
                  </span>
                  <span className="block text-2xl font-mono font-black tracking-wider text-white mt-0.5">
                    {activePass.passCode}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    Scan QR to self check-out
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-3 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                <span className="text-slate-400 block">Visitor</span>
                <span className="text-sm font-bold text-white mt-0.5 block">
                  {activePass.fullName}
                </span>
                {activePass.company && (
                  <span className="text-slate-400 mt-0.5 block">
                    {activePass.position ? `${activePass.position} • ` : ""}
                    {activePass.company}
                  </span>
                )}
              </div>

                <div className="p-3 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                <span className="text-slate-400 block">Host &amp; Department</span>
                <span className="text-sm font-bold text-white mt-0.5 block">
                  {activePass.hostName}
                </span>
                <span className="text-slate-400 mt-0.5 block">{activePass.department}</span>
              </div>

                <div className="p-3 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                <span className="text-slate-400 block">Date &amp; Time of Arrival</span>
                <span className="text-sm font-bold text-white mt-0.5 block">
                  {activePass.visitDate}
                </span>
                <span className="text-emerald-400 font-mono mt-0.5 block">
                  {new Date(activePass.checkInAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-xs text-slate-400">
                Save your Pass Code (<strong className="text-white font-mono">{activePass.passCode}</strong>) for quick self check-out when leaving.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMode("checkout")}
                  className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5 text-[#ED2618]" />
                  <span>Go to Check-Out</span>
                </button>
                <button
                  type="button"
                  onClick={resetForNewVisitor}
                  className="px-4 py-2.5 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-red-500/20"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Register Another Visitor</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* CHECK-IN FORM (SECTIONS 1 - 4)                                   */}
        {/* ================================================================ */}
        {mode === "checkin" && !activePass && (
          <form noValidate onSubmit={handleCheckIn} className="space-y-5 sm:space-y-6">
            {optionsError && <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] p-4 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between"><span>{optionsError}</span><button type="button" onClick={() => void loadFormOptions()} className="min-h-10 rounded-xl border border-amber-200/20 px-4 text-xs font-bold hover:bg-white/5">Retry</button></div>}
            <div className="rounded-2xl border border-white/10 bg-[#0E131D]/80 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Registration progress</span>
                <span className="text-slate-400">Step {formStep} of 2</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={formStep} aria-valuemin={1} aria-valuemax={2} aria-label="Registration progress">
                <div className={cn("h-full rounded-full bg-gradient-to-r from-[#ED2618] to-orange-400 transition-all duration-500", formStep === 1 ? "w-1/2" : "w-full")} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] sm:text-xs">
                <span className={formStep === 1 ? "font-bold text-white" : "text-emerald-400"}>01 · Your details</span>
                <span className={formStep === 2 ? "text-right font-bold text-white" : "text-right text-slate-500"}>02 · Visit &amp; declaration</span>
              </div>
            </div>
            {errorMsg && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-relaxed text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#ED2618]" /><span className="break-words">{errorMsg}</span></div>}
            {/* Section 1: Visitor Information */}
            {formStep === 1 && <section className="rounded-3xl border border-white/10 bg-[#0E131D]/95 p-5 sm:p-8 shadow-xl space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
                <span className="h-8 w-8 rounded-xl bg-[#ED2618]/15 text-[#ED2618] flex items-center justify-center text-xs font-black">
                  01
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Visitor Information
                  </h2>
                  <p className="text-xs text-slate-400">
                    Basic personal and organization details
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Chinedu Okafor"
                      className="w-full h-11 rounded-xl bg-black/40 border border-white/10 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ED2618]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Phone Number *
                  </label>
                  <div className="flex h-11 overflow-hidden rounded-xl border border-white/10 bg-black/40 focus-within:border-[#ED2618]">
                    <Phone className="ml-3.5 h-4 w-4 shrink-0 self-center text-slate-500" />
                    <select aria-label="Country calling code" value={phoneCountryCode} onChange={(e) => setPhoneCountryCode(e.target.value)} disabled={!visitorOptions} className="ml-2 max-w-[102px] shrink-0 border-r border-white/10 bg-transparent px-1.5 text-xs sm:text-sm text-white outline-none disabled:opacity-50">
                      {(visitorOptions?.countryCodes || []).map((item) => <option key={item.code} value={item.code} className="bg-[#0E131D]">{item.code} {item.iso}</option>)}
                    </select>
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="800 000 0000"
                      className="min-w-0 w-full bg-transparent px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.trimStart())}
                      placeholder="name@company.com"
                      className="w-full h-11 rounded-xl bg-black/40 border border-white/10 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ED2618]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Company / Organisation Name{" "}
                    <span className="text-slate-500 font-normal">(if applicable)</span>
                  </label>
                  <div className="relative">
                    <Building2 className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Organisation or Firm"
                      className="w-full h-11 rounded-xl bg-black/40 border border-white/10 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ED2618]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Position / Designation{" "}
                    <span className="text-slate-500 font-normal">(if applicable)</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="e.g. Managing Partner"
                      className="w-full h-11 rounded-xl bg-black/40 border border-white/10 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ED2618]"
                    />
                  </div>
                </div>
              </div>
              <button type="button" onClick={handleContinueToVisit} disabled={validatingStep || !visitorOptions} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ED2618] to-[#c81e12] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                {validatingStep ? "Checking your details…" : "Continue to visit details"} <ArrowRight className="h-4 w-4" />
              </button>
            </section>}

            {formStep === 2 && <div className="space-y-6 animate-fade-in">
            <button type="button" onClick={() => { setFormStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]">← Back to your details</button>
            {/* Section 2: Purpose of Visit */}
            <section className="rounded-3xl border border-white/10 bg-[#0E131D]/95 p-4 sm:p-8 shadow-xl space-y-5">
              <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
                <span className="h-8 w-8 rounded-xl bg-[#ED2618]/15 text-[#ED2618] flex items-center justify-center text-xs font-black">
                  02
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Purpose of Visit
                  </h2>
                  <p className="text-xs text-slate-400">
                    Tell us who you are meeting and what brings you in today
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  1. What is the purpose of your visit? *
                </label>
                <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 text-sm text-white outline-none transition focus:border-[#ED2618]">
                  {(visitorOptions?.purposes || []).map((item) => <option key={item} value={item} className="bg-[#0E131D]">{item === "Other" ? "Other (please specify)" : item}</option>)}
                </select>

                {purpose === "Other" && (
                  <input
                    type="text"
                    required
                    value={purposeOther}
                    onChange={(e) => setPurposeOther(e.target.value)}
                    placeholder="Please specify the purpose of your visit..."
                    className="mt-3 w-full h-11 rounded-xl bg-black/40 border border-white/10 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ED2618]"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Who are you here to see? *
                  </label>
                  <div className="relative">
                    <UserCheck className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      placeholder="Staff / Executive Name"
                      className="w-full h-11 rounded-xl bg-black/40 border border-white/10 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ED2618]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Which department are you visiting? *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-11 rounded-xl bg-black/40 border border-white/10 px-3.5 text-sm text-white focus:outline-none focus:border-[#ED2618]"
                  >
                    {(visitorOptions?.departments || []).map((dept) => (
                      <option key={dept} value={dept} className="bg-[#0E131D]">
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Do you have a scheduled appointment? *
                  </label>
                  <select value={hasAppointment ? "yes" : "no"} onChange={(e) => setHasAppointment(e.target.value === "yes")} className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-[#ED2618]">
                    <option value="yes" className="bg-[#0E131D]">Yes, scheduled</option>
                    <option value="no" className="bg-[#0E131D]">No, walk-in</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Name of the person who scheduled or invited you{" "}
                    <span className="text-slate-500 font-normal">(if applicable)</span>
                  </label>
                  <input
                    type="text"
                    value={invitedBy}
                    onChange={(e) => setInvitedBy(e.target.value)}
                    placeholder="Inviting staff member"
                    className="w-full h-11 rounded-xl bg-black/40 border border-white/10 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ED2618]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Brief description of your visit{" "}
                  <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <FileText className="h-4 w-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <textarea
                    rows={2}
                    value={visitDescription}
                    onChange={(e) => setVisitDescription(e.target.value)}
                    placeholder="Short note regarding your meeting, delivery, or inspection..."
                    className="w-full rounded-xl bg-black/40 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ED2618]"
                  />
                </div>
              </div>
            </section>

            {/* Section 3: Visit Details (Auto-Generated) */}
            <section className="rounded-3xl border border-white/10 bg-[#0E131D]/95 p-4 sm:p-8 shadow-xl space-y-4">
              <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
                <span className="h-8 w-8 rounded-xl bg-[#ED2618]/15 text-[#ED2618] flex items-center justify-center text-xs font-black">
                  03
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Visit Details
                  </h2>
                  <p className="text-xs text-slate-400">
                    Automatically generated and timestamped at check-in
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                      Date of Visit
                    </span>
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      {formattedDate}
                    </span>
                  </div>
                  <Calendar className="h-5 w-5 text-[#ED2618]" />
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                      Time of Arrival (Auto-Recorded)
                    </span>
                    <span className="text-sm font-mono font-bold text-emerald-400 mt-0.5 block">
                      {formattedTime}
                    </span>
                  </div>
                  <Clock className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
            </section>

            {/* Section 4: Visitor Declaration */}
            <section className="rounded-3xl border border-white/10 bg-[#0E131D]/95 p-4 sm:p-8 shadow-xl space-y-5">
              <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
                <span className="h-8 w-8 rounded-xl bg-[#ED2618]/15 text-[#ED2618] flex items-center justify-center text-xs font-black">
                  04
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Visitor Declaration
                  </h2>
                  <p className="text-xs text-slate-400">
                    Safety, office regulations, and data processing consent
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-2">
                    1. Do you agree to comply with the company&apos;s visitor guidelines and office regulations? *
                  </label>
                <div className="grid grid-cols-2 gap-2 max-w-[15rem]">
                    <button
                      type="button"
                      onClick={() => setAgreedGuidelines("yes")}
                      className={cn(
                        "h-10 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                        agreedGuidelines === "yes"
                          ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                          : "border-white/10 bg-black/30 text-slate-400 hover:border-white/25"
                      )}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgreedGuidelines("no")}
                      className={cn(
                        "h-10 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                        agreedGuidelines === "no"
                          ? "border-red-500 bg-red-500/15 text-red-300"
                          : "border-white/10 bg-black/30 text-slate-400 hover:border-white/25"
                      )}
                    >
                      No
                    </button>
                  </div>
                </div>

                <label className="flex items-start gap-3 p-4 rounded-2xl bg-black/40 border border-white/10 cursor-pointer hover:border-white/25 transition-colors">
                  <input
                    type="checkbox"
                    checked={consentedData}
                    onChange={(e) => setConsentedData(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#ED2618] rounded cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-white block mb-0.5">
                      I agree — Visitor Data Processing Consent *
                    </strong>
                    Consent to the collection and processing of your registration information for visitor management and office security purposes.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-11 rounded-xl bg-gradient-to-r from-[#ED2618] to-[#c81e12] px-3 py-2.5 text-center text-white font-bold text-xs sm:text-sm leading-tight shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{submitting ? "Completing Check-In..." : "Complete Check-In & Issue Pass"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>
            </div>}
          </form>
        )}

        {/* ================================================================ */}
        {/* SECTION 5: VISITOR SELF CHECK-OUT                                */}
        {/* ================================================================ */}
        {mode === "checkout" && (
          <section className="rounded-3xl border border-white/10 bg-[#0E131D]/95 p-4 sm:p-8 shadow-xl space-y-5 sm:space-y-6">
            <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
              <span className="h-8 w-8 rounded-xl bg-[#ED2618]/15 text-[#ED2618] flex items-center justify-center text-xs font-black">
                05
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Visitor Check-Out
                </h2>
                <p className="text-xs text-slate-400">
                  Automatically records your Time of Departure and closes your visit status
                </p>
              </div>
            </div>

            {checkedOutPass ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Thank You for Visiting, {checkedOutPass.fullName}
                      </h3>
                      <p className="text-xs text-slate-300">
                        Your departure has been recorded. Safe travels!
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-200 border border-white/15">
                    Checked Out
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                  <div className="p-3 rounded-xl bg-black/30 border border-white/10">
                    <span className="text-slate-400 block">Pass Code</span>
                    <span className="font-mono font-bold text-white">{checkedOutPass.passCode}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/30 border border-white/10">
                    <span className="text-slate-400 block">Time of Arrival</span>
                    <span className="font-mono font-bold text-white">
                      {new Date(checkedOutPass.checkInAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/30 border border-white/10">
                    <span className="text-slate-400 block">Time of Departure</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {checkedOutPass.checkOutAt
                        ? new Date(checkedOutPass.checkOutAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : formattedTime}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetForNewVisitor}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form noValidate onSubmit={handleSelfCheckOut} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Visitor Pass Code *
                  </label>
                  <input
                    type="text"
                    value={checkoutIdentifier}
                    onChange={(e) => setCheckoutIdentifier(e.target.value)}
                    placeholder="e.g. DXV-8K92PA"
                    autoCapitalize="characters"
                    autoComplete="off"
                    className="w-full h-12 rounded-xl bg-black/40 border border-white/10 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ED2618]"
                  />
                </div>

                {checkoutError && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4 text-[#ED2618] shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={checkoutSubmitting}
                  className="w-full sm:w-auto px-6 h-11 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 cursor-pointer disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{checkoutSubmitting ? "Recording Departure..." : "Record Departure & Check Out"}</span>
                </button>
              </form>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
