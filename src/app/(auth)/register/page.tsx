"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Building2,
  AlertCircle,
  RefreshCw,
  Send,
  Home,
  Info,
} from "lucide-react";
import { Input, PasswordInput } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { DextaLogo } from "@/components/ui/DextaLogo";

export default function AccountRegistrationPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = React.useState<"activate" | "request">("activate");

  // Form for Activating IT-Provisioned Account
  const [activationForm, setActivationForm] = React.useState({
    email: "",
    activationKey: "",
    preferredPassword: "",
    confirmPassword: "",
  });
  const [isActivating, setIsActivating] = React.useState(false);
  const [activationError, setActivationError] = React.useState("");

  // Form for Requesting Access from IT
  const [requestForm, setRequestForm] = React.useState({
    fullName: "",
    email: "",
    department: "Operations",
    jobTitle: "",
    reason: "",
  });
  const [isSubmittingRequest, setIsSubmittingRequest] = React.useState(false);
  const [requestSubmittedTicket, setRequestSubmittedTicket] = React.useState<string | null>(null);

  // Handle Account Activation & Password Setup
  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError("");

    if (
      !activationForm.email ||
      !activationForm.activationKey ||
      !activationForm.preferredPassword
    ) {
      setActivationError("All fields are required.");
      return;
    }

    if (activationForm.preferredPassword.length < 8) {
      setActivationError("Preferred password must be at least 8 characters long.");
      return;
    }

    if (activationForm.preferredPassword !== activationForm.confirmPassword) {
      setActivationError("Passwords do not match. Please verify.");
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
        toastError(data.error || "Could not verify activation key");
        return;
      }

      toastSuccess(
        "Account Activated",
        "Your preferred password has been established. Entering workspace..."
      );
      router.push("/dashboard");
      router.refresh();
    } catch {
      setActivationError("Connection error while communicating with IT security service.");
    } finally {
      setIsActivating(false);
    }
  };

  // Handle Requesting IT Provisioning
  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.email || !requestForm.fullName || !requestForm.reason) {
      toastError("Please complete all required fields");
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const res = await fetch("/api/it/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName: requestForm.fullName,
          requesterEmail: requestForm.email,
          department: requestForm.department,
          requestType: "ACCOUNT_PROVISION",
          priority: "MEDIUM",
          reason: `${requestForm.jobTitle ? `[${requestForm.jobTitle}] ` : ""}${requestForm.reason}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to log provisioning request");
      }

      const ticketNum = data.request?.ticketNumber || "SEC-2026";
      setRequestSubmittedTicket(ticketNum);
      toastSuccess(`Provisioning ticket ${ticketNum} logged for IT review`);
      setRequestForm({
        fullName: "",
        email: "",
        department: "Operations",
        jobTitle: "",
        reason: "",
      });
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Error submitting request");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between p-4 sm:p-6 bg-slate-950 text-white relative overflow-hidden select-none">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/20 via-black to-black" />

      {/* Header bar */}
      <header className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between pt-1">
        <Link
          href="/login"
          className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xl hover:bg-[#ED2618] hover:border-[#ED2618] transition-all duration-200 shadow-lg"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Sign In</span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xl hover:bg-white/20 transition-all duration-200"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Home Page</span>
        </Link>
      </header>

      {/* Main card */}
      <div className="relative z-10 my-auto mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-[#0c0d12]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <Link href="/">
            <DextaLogo className="h-10 w-auto" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Staff Access & Provisioning
          </h1>
          <p className="text-xs text-slate-400 max-w-md">
            Direct public self-registration is disabled per corporate governance. Account creation is controlled by the IT Department.
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/[0.04] border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("activate")}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === "activate"
                ? "bg-[#ED2618] text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Activate IT-Provisioned Account
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("request")}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === "request"
                ? "bg-[#ED2618] text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Request Access from IT
          </button>
        </div>

        {/* TAB 1: Activate Account & Set Preferred Password */}
        {activeTab === "activate" && (
          <form onSubmit={handleActivateAccount} className="space-y-4">
            {activationError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{activationError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Official Work Email *
              </label>
              <Input
                type="email"
                required
                placeholder="e.g. adebayo.ogunlesi@dextaafrica.com"
                value={activationForm.email}
                onChange={(e) =>
                  setActivationForm({ ...activationForm, email: e.target.value })
                }
                className="bg-black/50 border-white/10 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                IT Security Authorization Key / Temporary Key *
              </label>
              <Input
                type="text"
                required
                placeholder="e.g. DXT-ACT-XXXX or provided temporary key"
                value={activationForm.activationKey}
                onChange={(e) =>
                  setActivationForm({ ...activationForm, activationKey: e.target.value })
                }
                className="bg-black/50 border-white/10 text-white font-mono text-sm tracking-wider"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Issued by the IT & Security Department upon account provisioning.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your Preferred Password *
                </label>
                <PasswordInput
                  required
                  placeholder="Min 8 characters"
                  value={activationForm.preferredPassword}
                  onChange={(e) =>
                    setActivationForm({
                      ...activationForm,
                      preferredPassword: e.target.value,
                    })
                  }
                  className="bg-black/50 border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Preferred Password *
                </label>
                <PasswordInput
                  required
                  placeholder="Re-enter password"
                  value={activationForm.confirmPassword}
                  onChange={(e) =>
                    setActivationForm({
                      ...activationForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="bg-black/50 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Zero-knowledge storage: IT does not know your personal password.</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isActivating}
              className="w-full h-11 bg-[#ED2618] hover:bg-[#d02013] text-white font-semibold shadow-lg shadow-red-500/20"
            >
              {isActivating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Verifying Authorization & Saving...
                </>
              ) : (
                <>
                  <span>Activate Account & Sign In</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* TAB 2: Request IT Provisioning */}
        {activeTab === "request" && (
          <form onSubmit={handleRequestAccess} className="space-y-4">
            {requestSubmittedTicket && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Provisioning Ticket Submitted to IT Queue
                </div>
                <p className="text-slate-400">
                  Ticket Number:{" "}
                  <span className="font-mono font-bold text-white">
                    {requestSubmittedTicket}
                  </span>
                  . The IT department will review your request, create your account, and issue your activation key.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Samuel Adeleke"
                  value={requestForm.fullName}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, fullName: e.target.value })
                  }
                  className="bg-black/50 border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Corporate Work Email *
                </label>
                <Input
                  type="email"
                  required
                  placeholder="e.g. samuel.adeleke@dextaafrica.com"
                  value={requestForm.email}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, email: e.target.value })
                  }
                  className="bg-black/50 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Assigned Department
                </label>
                <select
                  aria-label="Staff department"
                  value={requestForm.department}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, department: e.target.value })
                  }
                  className="w-full h-10 rounded-xl border border-white/10 bg-black/50 px-3 text-xs text-white"
                >
                  <option value="Executive">Executive</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Architecture">Architecture</option>
                  <option value="Operations">Operations</option>
                  <option value="Finance">Finance</option>
                  <option value="Legal">Legal</option>
                  <option value="HR">HR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Job Title
                </label>
                <Input
                  placeholder="e.g. Senior Quantity Surveyor"
                  value={requestForm.jobTitle}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, jobTitle: e.target.value })
                  }
                  className="bg-black/50 border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Business Reason for Access *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. New employee joining the Architecture engineering team..."
                value={requestForm.reason}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, reason: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-black/50 p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#ED2618]"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmittingRequest}
              className="w-full h-11 bg-white hover:bg-slate-100 text-black font-semibold"
            >
              {isSubmittingRequest ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Submitting to IT...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request to IT Department
                </>
              )}
            </Button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-slate-400">
          Already have an active account?{" "}
          <Link href="/login" className="font-semibold text-white hover:text-[#ED2618] transition-colors">
            Sign In to Workspace →
          </Link>
        </div>
      </div>
    </div>
  );
}
