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
import { Button } from "@/components/ui/Button";
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

      toastSuccess("Key Activated", "Systems access granted. Redirecting to console...");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setActivationError("Connection error during key verification.");
    } finally {
      setIsActivating(false);
    }
  };

  const handleDirectRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectError("");

    if (!directForm.fullName || !directForm.email || !directForm.password) {
      setDirectError("Full Name, Email, and Password are required.");
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
    if (!requestForm.fullName || !requestForm.email || !requestForm.reason) {
      toastError("Incomplete", "Please fill all required fields");
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
          requestType: "ACCOUNT_PROVISION",
          priority: "HIGH",
          reason: `[Systems Command Access]: ${requestForm.reason}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError("Error", data.error || "Could not submit ticket");
        return;
      }

      setRequestTicket(data.request?.ticketNumber || "SEC-SUBMITTED");
      toastSuccess("Ticket Logged", "IT security officers have been notified.");
    } catch {
      toastError("Error", "Network connection failed");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 flex flex-col justify-between selection:bg-[#ED2618] selection:text-white font-mono">
      {/* Top Bar */}
      <header className="border-b border-red-500/20 bg-[#050508]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/admin-portal" className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Systems Landing</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-mono font-bold text-red-500 uppercase">
              admin.dextafrica.org
            </span>
          </div>

          <Link href="/admin-portal/login" className="text-xs text-red-400 hover:underline">
            Already authenticated? Sign In &rarr;
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-10">
        <div className="w-full max-w-xl rounded-3xl border border-red-500/30 bg-[#090A0F] p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          <div className="flex flex-col items-center text-center space-y-3 font-sans">
            <DextaLogo className="h-9 w-auto" />
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-bold text-red-400 font-mono">
              <Terminal className="h-3.5 w-3.5" />
              <span>Systems Identity Provisioning</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Systems &amp; Web Infrastructure Access
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Activate an IT-issued cryptographic key, provision systems engineering credentials, or submit an access ticket.
              </p>
            </div>
          </div>

          {/* 3 Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab("activate")}
              className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === "activate"
                  ? "bg-[#ED2618] text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
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
                  : "text-slate-400 hover:text-white"
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
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Request Access
            </button>
          </div>

          {/* TAB 1: ACTIVATE KEY */}
          {activeTab === "activate" && (
            <form onSubmit={handleActivate} className="space-y-4 font-sans">
              {activationError && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-mono">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{activationError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                  Administrator Email *
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    required
                    placeholder="admin@dextaafrica.com"
                    value={activationForm.email}
                    onChange={(e) => setActivationForm({ ...activationForm, email: e.target.value })}
                    className="bg-black/50 border-white/10 text-white pl-10 font-mono text-sm"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                  IT-Issued Activation Key *
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    placeholder="DXT-SEC-XXXX"
                    value={activationForm.activationKey}
                    onChange={(e) => setActivationForm({ ...activationForm, activationKey: e.target.value })}
                    className="bg-black/50 border-white/10 text-white pl-10 font-mono text-sm tracking-widest uppercase"
                  />
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    Preferred Personal Password *
                  </label>
                  <PasswordInput
                    required
                    placeholder="Minimum 8 characters"
                    value={activationForm.preferredPassword}
                    onChange={(e) => setActivationForm({ ...activationForm, preferredPassword: e.target.value })}
                    className="bg-black/50 border-white/10 text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    Confirm Preferred Password *
                  </label>
                  <PasswordInput
                    required
                    placeholder="Re-enter password"
                    value={activationForm.confirmPassword}
                    onChange={(e) => setActivationForm({ ...activationForm, confirmPassword: e.target.value })}
                    className="bg-black/50 border-white/10 text-white font-mono text-sm"
                  />
                </div>
              </div>

              <PasswordStrengthMeter password={activationForm.preferredPassword} />

              <Button
                type="submit"
                disabled={isActivating}
                className="w-full h-12 bg-[#ED2618] hover:bg-[#d02013] text-white font-bold text-sm shadow-xl shadow-red-500/25 rounded-xl cursor-pointer"
              >
                {isActivating ? "Verifying Cryptographic Key..." : "Activate Systems Credentials"}
              </Button>
            </form>
          )}

          {/* TAB 2: DIRECT PROVISIONING */}
          {activeTab === "direct" && (
            <form onSubmit={handleDirectRegister} className="space-y-4 font-sans">
              {directError && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-mono">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{directError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    Full Legal Name *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Tariq Ibrahim"
                    value={directForm.fullName}
                    onChange={(e) => setDirectForm({ ...directForm, fullName: e.target.value })}
                    className="bg-black/50 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    Corporate Email *
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="tariq.it@dextaafrica.com"
                    value={directForm.email}
                    onChange={(e) => setDirectForm({ ...directForm, email: e.target.value })}
                    className="bg-black/50 border-white/10 text-white font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    IT Function / Title
                  </label>
                  <Input
                    type="text"
                    value={directForm.jobTitle}
                    onChange={(e) => setDirectForm({ ...directForm, jobTitle: e.target.value })}
                    className="bg-black/50 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    Organization Key *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="DEXTA-2026"
                    value={directForm.accessPasscode}
                    onChange={(e) => setDirectForm({ ...directForm, accessPasscode: e.target.value })}
                    className="bg-black/50 border-white/10 text-white font-mono text-sm tracking-wider"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    Security Password *
                  </label>
                  <PasswordInput
                    required
                    placeholder="Minimum 8 characters"
                    value={directForm.password}
                    onChange={(e) => setDirectForm({ ...directForm, password: e.target.value })}
                    className="bg-black/50 border-white/10 text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    Confirm Password *
                  </label>
                  <PasswordInput
                    required
                    placeholder="Re-enter password"
                    value={directForm.confirmPassword}
                    onChange={(e) => setDirectForm({ ...directForm, confirmPassword: e.target.value })}
                    className="bg-black/50 border-white/10 text-white font-mono text-sm"
                  />
                </div>
              </div>

              <PasswordStrengthMeter password={directForm.password} />

              <Button
                type="submit"
                disabled={isDirectRegistering}
                className="w-full h-12 bg-[#ED2618] hover:bg-[#d02013] text-white font-bold text-sm shadow-xl shadow-red-500/25 rounded-xl cursor-pointer"
              >
                {isDirectRegistering ? "Provisioning Systems Account..." : "Provision Systems Account"}
              </Button>
            </form>
          )}

          {/* TAB 3: REQUEST ACCESS */}
          {activeTab === "request" && (
            <div className="space-y-4 font-sans">
              {requestTicket ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-center space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                  <h3 className="text-base font-bold text-white font-mono">Access Ticket Dispatched</h3>
                  <p className="text-xs text-slate-300">
                    Your request ticket <strong className="font-mono text-emerald-400">{requestTicket}</strong> has been forwarded to IT access governance.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRequestTicket(null);
                      setActiveTab("activate");
                    }}
                    className="mt-2 text-xs"
                  >
                    Return to Activation
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleRequestAccess} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                      Your Full Name *
                    </label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Esther Adeyemi"
                      value={requestForm.fullName}
                      onChange={(e) => setRequestForm({ ...requestForm, fullName: e.target.value })}
                      className="bg-black/50 border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                      Work Email *
                    </label>
                    <Input
                      type="email"
                      required
                      placeholder="name@dextaafrica.com"
                      value={requestForm.email}
                      onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })}
                      className="bg-black/50 border-white/10 text-white font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                      Business Justification &amp; Desired Privileges *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Specify your technical role and why systems command access is needed..."
                      value={requestForm.reason}
                      onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                      className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isRequesting}
                    className="w-full h-12 bg-[#ED2618] hover:bg-[#d02013] text-white font-bold text-sm shadow-xl shadow-red-500/25 rounded-xl cursor-pointer"
                  >
                    {isRequesting ? "Submitting Ticket..." : "Submit Access Request Ticket"}
                  </Button>
                </form>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-white/10 text-center text-xs text-slate-400 font-mono">
            Already have active credentials?{" "}
            <Link href="/admin-portal/login" className="font-bold text-red-400 hover:underline">
              Sign In to Command &rarr;
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-4 text-center text-xs text-slate-500 font-mono">
        &copy; {new Date().getFullYear()} Dexta Africa Systems &amp; Web Infrastructure Command &bull; admin.dextafrica.org
      </footer>
    </div>
  );
}

