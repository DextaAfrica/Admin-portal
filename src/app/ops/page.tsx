"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase,
  Building2,
  HardHat,
  Users,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Lock,
  AlertCircle,
  KeyRound,
  LogIn,
  UserPlus,
  Radio,
  Clock,
  Sparkles,
} from "lucide-react";
import { Input, PasswordInput } from "@/components/ui/Input";
import { OTPInput } from "@/components/ui/OTPInput";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { DextaLogo } from "@/components/ui/DextaLogo";
import { cn } from "@/lib/utils";

type DepartmentKey = "OPERATIONS" | "FINANCE" | "EXECUTIVE" | "HR";

const DEPARTMENTS: Array<{
  key: DepartmentKey;
  label: string;
  icon: React.ElementType;
  badge: string;
}> = [
  { key: "OPERATIONS", label: "Operations & Projects", icon: Building2, badge: "Site Execution" },
  { key: "FINANCE", label: "Treasury & Finance", icon: DollarSign, badge: "Fiscal Audit" },
  { key: "EXECUTIVE", label: "Capital & Leadership", icon: Briefcase, badge: "Deal Pipeline" },
  { key: "HR", label: "Field & Workforce", icon: Users, badge: "Staff Vault" },
];

function OperationsPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { error: toastError, success: toastSuccess } = useToast();

  const [email, setEmail] = React.useState(searchParams.get("email") || "");
  const [password, setPassword] = React.useState("");
  const [selectedDept, setSelectedDept] = React.useState<DepartmentKey>(
    (searchParams.get("department") as DepartmentKey) || "OPERATIONS"
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  // OTP Verification Modal
  const [otpModalOpen, setOtpModalOpen] = React.useState(false);
  const [pendingUserId, setPendingUserId] = React.useState("");
  const [pendingUserName, setPendingUserName] = React.useState("");
  const [isEmailOtp, setIsEmailOtp] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState("");
  const [recoveryCode, setRecoveryCode] = React.useState("");
  const [useRecoveryCode, setUseRecoveryCode] = React.useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
  const [otpError, setOtpError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage("Please enter both work email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Sign in failed. Check your email and password.");
        toastError("Sign In Failed", data.error || "Invalid credentials");
        setIsLoading(false);
        return;
      }

      if (data.requiresMfa) {
        setPendingUserId(data.userId);
        setPendingUserName(data.fullName || email);
        setIsEmailOtp(Boolean(data.emailOtpSent));
        setOtpCode("");
        setRecoveryCode("");
        setOtpError("");
        setUseRecoveryCode(false);
        setOtpModalOpen(true);
        setIsLoading(false);
        toastSuccess(
          "Verification Required",
          data.emailOtpSent
            ? "A 6-digit code has been sent to your email."
            : "Enter the code from your authenticator app."
        );
        return;
      }

      toastSuccess("Operations Authorized", "Signed in to Dexta Africa Operations Desk.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Network error while connecting to authorization service.");
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (submittedCode?: string) => {
    const codeToVerify = submittedCode || (useRecoveryCode ? recoveryCode : otpCode);
    if (!codeToVerify || codeToVerify.length < 6) return;

    setIsVerifyingOtp(true);
    setOtpError("");

    try {
      const res = await fetch("/api/auth/mfa-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: pendingUserId,
          code: codeToVerify,
          isRecoveryCode: useRecoveryCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "Verification failed");
        setIsVerifyingOtp(false);
        return;
      }

      setOtpModalOpen(false);
      toastSuccess("Operations Authenticated", "Welcome to Dexta Africa Operations Desk.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setOtpError("Network error during verification.");
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black font-sans relative overflow-x-hidden">
      {/* Background Subtle Ambient Glow - Dexta Gold & Slate */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 left-1/3 w-[600px] h-[300px] bg-amber-500/[0.06] blur-[140px] rounded-full" />
        <div className="absolute top-[40%] -right-24 w-[400px] h-[300px] bg-amber-500/[0.04] blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff06_1px,transparent_1px)] [background-size:24px_24px] opacity-35" />
      </div>

      {/* Top Operations Header */}
      <header className="relative z-20 border-b border-amber-500/20 bg-[#070A0F]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <Link href="/ops" className="flex items-center shrink-0">
              <DextaLogo className="h-8 sm:h-9 w-auto" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-3">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-wider text-amber-400 uppercase">
                ops.dextaafrica.org
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/crm-portal"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:border-amber-500/40 hover:bg-white/[0.04] transition-all"
            >
              <Briefcase className="h-3.5 w-3.5 text-amber-400" />
              <span>CRM Portal</span>
            </Link>

            <Link
              href="/admin-portal"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all"
            >
              <span>Systems IT Portal &rarr;</span>
            </Link>

            <Link
              href="/ops/register"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-amber-500/35 bg-white/[0.03] text-xs font-bold text-white hover:bg-amber-500/10 hover:border-amber-500 transition-all"
            >
              <UserPlus className="h-3.5 w-3.5 text-amber-400" />
              <span>Create Ops Profile</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Single-Viewport Login & Access Split */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-10">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Column: Focused Executive Presence & Department Context */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400">
                Enterprise Operations Command
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-white leading-[1.12]">
                Executing African Infrastructure, Capital &amp; Operations.
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                Single sign-on gateway for project directors, investment syndicates, treasury governance, and field engineering fleets.
              </p>
            </div>

            {/* Department Quick Switcher Pills */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Targeted Workspace Scope
              </span>
              <div className="grid grid-cols-2 gap-2 max-w-lg">
                {DEPARTMENTS.map((dept) => {
                  const Icon = dept.icon;
                  const isSelected = selectedDept === dept.key;
                  return (
                    <button
                      key={dept.key}
                      type="button"
                      onClick={() => setSelectedDept(dept.key)}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                        isSelected
                          ? "bg-amber-500/15 border-amber-500 text-white shadow-sm"
                          : "bg-white/[0.03] border-white/10 text-slate-300 hover:border-amber-500/40 hover:bg-white/[0.05]"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", isSelected ? "text-amber-400" : "text-slate-400")} />
                        <span className="text-xs font-bold">{dept.label}</span>
                      </div>
                      <span className={cn(
                        "text-[9px] font-mono px-1.5 py-0.5 rounded border",
                        isSelected
                          ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                          : "text-slate-500 border-white/5 bg-white/[0.02]"
                      )}>
                        {dept.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* High-Signal Security & Trust Footprint */}
            <div className="pt-2 flex flex-wrap items-center gap-5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Zero-Trust 2FA Protected</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Real-Time Audit Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-blue-400 shrink-0" />
                <span>Lagos • Nairobi • Accra • Kigali</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean, Direct, High-End Login Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto lg:max-w-none">
            <div className="rounded-3xl border border-amber-500/30 bg-[#0E131C] p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6 backdrop-blur-xl">
              {/* Form Title */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-amber-400">
                    Operations Gateway
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    SYSTEM SECURE
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Sign In to Operations Desk
                </h2>
                <p className="text-xs text-slate-400">
                  Enter your credentials to access live project milestones and budgets.
                </p>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Corporate Email
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      required
                      placeholder="director@dextaafrica.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-black/60 border-white/10 text-white pl-10 h-11 text-sm focus:border-amber-500 focus:ring-amber-500/20"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <Link
                      href="/setup/password"
                      className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                    >
                      Forgot or need key?
                    </Link>
                  </div>
                  <div className="relative">
                    <PasswordInput
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black/60 border-white/10 text-white pl-10 h-11 text-sm focus:border-amber-500 focus:ring-amber-500/20"
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                      <span>Verifying Credentials...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In to Operations Desk</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Activation Key & IT Ticket Conduits */}
              <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <Link
                  href="/setup/password"
                  className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium transition-colors"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Activate with IT Key</span>
                </Link>

                <Link
                  href="/ops/register"
                  className="hover:text-white transition-colors"
                >
                  Create Ops Profile &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Operations Portal Footer */}
      <footer className="relative z-20 border-t border-white/10 bg-[#05070A] py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <DextaLogo className="h-5 w-auto" />
            <span>&copy; {new Date().getFullYear()} Dexta Africa Enterprise Operations</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-xs">
            <Link href="/crm-portal" className="hover:text-white transition-colors">CRM Portal</Link>
            <span>&bull;</span>
            <Link href="/admin-portal" className="hover:text-white transition-colors">Systems Portal</Link>
            <span>&bull;</span>
            <Link href="/setup/password" className="hover:text-white transition-colors">Activate Account</Link>
          </div>
        </div>
      </footer>

      {/* MFA Verification Modal */}
      <Modal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        title="Two-Factor Authentication"
        description={`Enter the 6-digit verification code to access Operations as ${pendingUserName}`}
      >
        <div className="space-y-4 py-2">
          {otpError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{otpError}</span>
            </div>
          )}

          {!useRecoveryCode ? (
            <div className="space-y-3">
              <div className="flex justify-center py-2">
                <OTPInput
                  value={otpCode}
                  onChange={setOtpCode}
                  onComplete={handleVerifyOtp}
                  error={Boolean(otpError)}
                />
              </div>
              <p className="text-center text-xs text-slate-400">
                {isEmailOtp
                  ? "Check your corporate inbox for your 6-digit one-time code."
                  : "Open your authenticator app (Google Authenticator, 1Password, etc.)"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Emergency Recovery Code
              </label>
              <Input
                type="text"
                placeholder="XXXXX-XXXXX"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                className="font-mono text-center tracking-widest uppercase bg-black/50 border-white/10 text-white"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setUseRecoveryCode(!useRecoveryCode);
                setOtpError("");
              }}
              className="text-amber-400 hover:text-amber-300 transition-colors"
            >
              {useRecoveryCode ? "Use 6-digit authenticator code" : "Use a backup recovery code"}
            </button>

            <button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={isVerifyingOtp}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isVerifyingOtp ? "Verifying..." : "Verify & Enter"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function OperationsPortalPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#070A0F] text-slate-100 flex items-center justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <OperationsPortalContent />
    </React.Suspense>
  );
}
