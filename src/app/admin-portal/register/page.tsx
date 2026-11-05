"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  ShieldCheck,
  Terminal,
  Lock,
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Fingerprint,
} from "lucide-react";
import { Input, PasswordInput } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { DextaLogo } from "@/components/ui/DextaLogo";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { evaluatePasswordStrength } from "@/lib/auth/validation";

export default function AdminPortalRegisterPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = React.useState<"activate" | "direct" | "request">("activate");

  // TAB 1: Activation Form
  const [activationForm, setActivationForm] = React.useState({
    email: "",
    activationKey: "",
    preferredPassword: "",
    confirmPassword: "",
  });
  const [isActivating, setIsActivating] = React.useState(false);
  const [activationError, setActivationError] = React.useState("");

  // TAB 2: Direct Systems Admin Provisioning
  const [directForm, setDirectForm] = React.useState({
    fullName: "",
    email: "",
    jobTitle: "Systems Infrastructure Engineer",
    password: "",
    confirmPassword: "",
    accessPasscode: "DEXTA-2026",
  });
  const [isDirectRegistering, setIsDirectRegistering] = React.useState(false);
  const [directError, setDirectError] = React.useState("");

  // TAB 3: Request Access
  const [requestForm, setRequestForm] = React.useState({
    fullName: "",
    email: "",
    jobTitle: "",
    reason: "",
  });
  const [isRequesting, setIsRequesting] = React.useState(false);
  const [requestTicket, setRequestTicket] = React.useState<string | null>(null);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError("");

    if (!activationForm.email || !activationForm.activationKey || !activationForm.preferredPassword) {
      setActivationError("All fields are required.");
      return;
    }

    const strength = evaluatePasswordStrength(activationForm.preferredPassword);
    if (strength.errors.length > 0) {
      setActivationError(strength.errors[0]);
      return;
    }

    if (activationForm.preferredPassword !== activationForm.confirmPassword) {
      setActivationError("Passwords do not match.");
      return;
    }

    setIsActivating(true);
    try {
      const res = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: activationForm.email,
          activationKey: activationForm.activationKey,
          preferredPassword: activationForm.preferredPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActivationError(data.error || "Activation failed");
        toastError("Activation Issue", data.error || "Could not verify key");
        return;
      }

      toastSuccess("Key Activated", "Account activated. Redirecting...");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setActivationError("Connection error.");
    } finally {
      setIsActivating(false);
    }
  };

  const handleDirectRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectError("");

    if (!directForm.fullName || !directForm.email || !directForm.password) {
      setDirectError("Full name, email, and password are required.");
      return;
    }

    const strength = evaluatePasswordStrength(directForm.password);
    if (strength.errors.length > 0) {
      setDirectError(strength.errors[0]);
      return;
    }

    if (directForm.password !== directForm.confirmPassword) {
      setDirectError("Passwords do not match.");
      return;
    }

    setIsDirectRegistering(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: directForm.fullName,
          email: directForm.email,
          password: directForm.password,
          department: "TECHNOLOGY",
          jobTitle: directForm.jobTitle,
          accessPasscode: directForm.accessPasscode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDirectError(data.error || "Registration failed");
        return;
      }

      toastSuccess("Systems Account Provisioned", "Redirecting to console...");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setDirectError("Connection error.");
    } finally {
      setIsDirectRegistering(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.email || !requestForm.fullName || !requestForm.reason) {
      toastError("Incomplete Request", "Please provide name, email, and justification.");
      return;
    }

    setIsRequesting(true);
    try {
      const res = await fetch("/api/it/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName: requestForm.fullName,
          requesterEmail: requestForm.email,
          department: "TECHNOLOGY",
          requestType: "SYSTEMS_IT_PROVISIONING",
          businessJustification: requestForm.reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError("Submission Error", data.error || "Failed to submit request");
        return;
      }

      setRequestTicket(data.ticket?.id || "REQ-" + Math.floor(100000 + Math.random() * 900000));
      toastSuccess("Access Ticket Submitted", "IT administration has been notified.");
    } catch {
      toastError("Error", "Could not reach ticket service.");
    } finally {
      setIsRequesting(false);
    }
  };

  const isSubdomain = typeof window !== "undefined" && window.location.hostname.startsWith("admin.");
  const landingPath = isSubdomain ? "/" : "/admin-portal";
  const loginPath = isSubdomain ? "/login" : "/admin-portal/login";

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#070A0F] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-[#ED2618] selection:text-white font-sans relative overflow-x-hidden">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-500/[0.04] blur-[140px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
      </div>

      {/* Top Bar */}
      <header className="relative z-20 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#070A0F]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link
            href={landingPath}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#ED2618] dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Systems Landing</span>
          </Link>

          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-white/10 pl-3">
            <span className="h-2 w-2 rounded-full bg-[#ED2618] animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase">
              admin.dextafrica.org
            </span>
          </div>

          <Link
            href={loginPath}
            className="text-xs font-bold text-[#ED2618] hover:underline"
          >
            Already authenticated? Sign In &rarr;
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 py-10">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#0C1017]/95 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl relative overflow-hidden space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <Link href={landingPath}>
              <DextaLogo className="h-9 w-auto" />
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200/90 dark:border-red-500/25 bg-red-50/90 dark:bg-red-500/10 px-3.5 py-1 text-[11px] font-bold text-[#ED2618] dark:text-red-400">
              <Terminal className="h-3.5 w-3.5" />
              <span>Systems Identity Provisioning</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Systems &amp; Web Infrastructure Access
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Activate an IT-issued cryptographic key, provision systems engineering credentials, or submit an access ticket.
              </p>
            </div>
          </div>

          {/* 3 Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-black/60 border border-slate-200 dark:border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("activate")}
              className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === "activate"
                  ? "bg-[#ED2618] text-white font-bold shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Activate Key
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("direct")}
              className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === "direct"
                  ? "bg-[#ED2618] text-white font-bold shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Direct Provision
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("request")}
              className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === "request"
                  ? "bg-[#ED2618] text-white font-bold shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Request Ticket
            </button>
          </div>

          {/* TAB 1: Activate Key */}
          {activeTab === "activate" && (
            <form onSubmit={handleActivate} className="space-y-4 animate-fade-in">
              {activationError && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{activationError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Authorized Work Email *
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      required
                      placeholder="admin@dextaafrica.com"
                      value={activationForm.email}
                      onChange={(e) => setActivationForm({ ...activationForm, email: e.target.value })}
                      className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618]"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    IT-Issued Activation Key *
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      required
                      placeholder="e.g. IT-SEC-9402"
                      value={activationForm.activationKey}
                      onChange={(e) => setActivationForm({ ...activationForm, activationKey: e.target.value })}
                      className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 h-11 text-xs sm:text-sm font-mono focus:border-[#ED2618]"
                    />
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Configure Preferred Password *
                  </label>
                  <div className="relative">
                    <PasswordInput
                      required
                      placeholder="Minimum 8 characters"
                      value={activationForm.preferredPassword}
                      onChange={(e) => setActivationForm({ ...activationForm, preferredPassword: e.target.value })}
                      className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618]"
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <PasswordInput
                      required
                      placeholder="Re-enter password"
                      value={activationForm.confirmPassword}
                      onChange={(e) => setActivationForm({ ...activationForm, confirmPassword: e.target.value })}
                      className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618]"
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {activationForm.preferredPassword && (
                <PasswordStrengthMeter password={activationForm.preferredPassword} showRequirements />
              )}

              <button
                type="submit"
                disabled={isActivating}
                className="btn-crimson-exec w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isActivating ? "Verifying IT Key..." : "Authorize & Activate Account"}
              </button>
            </form>
          )}

          {/* TAB 2: Direct Provision */}
          {activeTab === "direct" && (
            <form onSubmit={handleDirectRegister} className="space-y-4 animate-fade-in">
              {directError && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{directError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Administrator Full Name *
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Babatunde Fashola"
                      value={directForm.fullName}
                      onChange={(e) => setDirectForm({ ...directForm, fullName: e.target.value })}
                      className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618]"
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Official Work Email *
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      required
                      placeholder="babatunde@dextaafrica.com"
                      value={directForm.email}
                      onChange={(e) => setDirectForm({ ...directForm, email: e.target.value })}
                      className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618]"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Infrastructure Passcode
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={directForm.accessPasscode}
                      onChange={(e) => setDirectForm({ ...directForm, accessPasscode: e.target.value })}
                      className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 h-11 text-xs sm:text-sm font-mono tracking-wider focus:border-[#ED2618]"
                    />
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Systems Function
                  </label>
                  <Input
                    type="text"
                    value={directForm.jobTitle}
                    onChange={(e) => setDirectForm({ ...directForm, jobTitle: e.target.value })}
                    className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white h-11 text-xs sm:text-sm focus:border-[#ED2618]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Root Password *
                  </label>
                  <div className="relative">
                    <PasswordInput
                      required
                      placeholder="Minimum 8 characters"
                      value={directForm.password}
                      onChange={(e) => setDirectForm({ ...directForm, password: e.target.value })}
                      className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618]"
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <PasswordInput
                      required
                      placeholder="Re-enter password"
                      value={directForm.confirmPassword}
                      onChange={(e) => setDirectForm({ ...directForm, confirmPassword: e.target.value })}
                      className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618]"
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {directForm.password && (
                <PasswordStrengthMeter password={directForm.password} showRequirements />
              )}

              <button
                type="submit"
                disabled={isDirectRegistering}
                className="btn-crimson-exec w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isDirectRegistering ? "Provisioning..." : "Provision Systems Account"}
              </button>
            </form>
          )}

          {/* TAB 3: Request Access */}
          {activeTab === "request" && (
            <div className="space-y-4 animate-fade-in">
              {requestTicket ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Access Ticket Logged Successfully
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Your request has been routed to Dexta Africa IT Security. You will receive an activation key upon identity clearance.
                  </p>
                  <div className="inline-block p-2 px-4 rounded-xl bg-black/40 font-mono text-xs text-emerald-400 font-bold border border-emerald-500/30">
                    Ticket ID: {requestTicket}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRequestAccess} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Full Name *
                      </label>
                      <Input
                        required
                        placeholder="e.g. Chinelo Okonkwo"
                        value={requestForm.fullName}
                        onChange={(e) => setRequestForm({ ...requestForm, fullName: e.target.value })}
                        className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white h-11 text-xs sm:text-sm focus:border-[#ED2618]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Official Work Email *
                      </label>
                      <Input
                        type="email"
                        required
                        placeholder="chinelo@dextaafrica.com"
                        value={requestForm.email}
                        onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })}
                        className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white h-11 text-xs sm:text-sm focus:border-[#ED2618]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Business Justification for Systems Access *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Specify your technical role, project scope, and required permission conduits..."
                      value={requestForm.reason}
                      onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-[#ED2618] transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isRequesting}
                    className="btn-crimson-exec w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 cursor-pointer disabled:opacity-50"
                  >
                    {isRequesting ? "Submitting Ticket..." : "Submit IT Provisioning Ticket"}
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-center text-xs text-slate-600 dark:text-slate-400">
            <span>Already have an account? </span>
            <Link href={loginPath} className="font-bold text-[#ED2618] hover:underline">
              Sign In to Systems Command &rarr;
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#070A0F] py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Dexta Africa Enterprise Systems &bull; admin.dextafrica.org</p>
      </footer>
    </div>
  );
}
