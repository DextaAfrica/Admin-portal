"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  HardHat,
  ArrowLeft,
  AlertCircle,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { Input, PasswordInput } from "@/components/ui/Input";
import { OTPInput } from "@/components/ui/OTPInput";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { DextaLogo } from "@/components/ui/DextaLogo";

export default function OperationsLoginPage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
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
      setErrorMessage("Please enter both corporate email and password.");
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
        setErrorMessage(data.error || "Sign in failed");
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
            ? "A 6-digit verification code has been dispatched to your email."
            : "Please enter your 6-digit code from your authenticator app."
        );
        return;
      }

      toastSuccess("Operations Authorized", "Signed in to Dexta Africa Operations Desk.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Connection error while accessing authorization service.");
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
    <div className="min-h-screen bg-[#080B10] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black font-sans">
      {/* Top Bar */}
      <header className="border-b border-amber-500/20 bg-[#080B10]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/ops" className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Operations Landing</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-amber-400">
              ops.dextaafrica.org
            </span>
          </div>

          <Link href="/admin-portal/login" className="text-xs text-slate-400 hover:text-white transition-colors">
            Systems IT Portal &rarr;
          </Link>
        </div>
      </header>

      {/* Main Form Split */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-3xl border border-amber-500/25 bg-[#0E131C] p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <DextaLogo className="h-9 w-auto" />
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-400">
              <HardHat className="h-3.5 w-3.5" />
              <span>Operations Desk Access</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Sign In to Operations
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Enter your verified credentials to access real estate projects, CRM deals, and field logistics.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Corporate Work Email *
              </label>
              <div className="relative">
                <Input
                  type="email"
                  required
                  placeholder="name@dextaafrica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-black/50 border-white/10 text-white pl-10"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Workspace Password *
              </label>
              <div className="relative">
                <PasswordInput
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black/50 border-white/10 text-white pl-10"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 rounded-xl cursor-pointer"
            >
              {isLoading ? "Authorizing Operations..." : "Sign In to Operations Desk"}
            </Button>
          </form>

          {/* Links */}
          <div className="pt-2 border-t border-white/10 text-center text-xs text-slate-400 space-y-2">
            <div>
              Need an operations account?{" "}
              <Link href="/ops/register" className="font-bold text-amber-400 hover:underline">
                Establish Team Profile &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* In-App OTP Verification Modal */}
      <Modal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        title="Two-Step Operations Verification"
      >
        <div className="space-y-4 p-2 text-white">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <KeyRound className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold">Identity Verification Required</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {isEmailOtp
                  ? `Enter the 6-digit code dispatched to ${email}.`
                  : "Enter the code generated by your Authenticator app."}
              </p>
            </div>
          </div>

          {otpError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{otpError}</span>
            </div>
          )}

          {!useRecoveryCode ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300 text-center">
                6-Digit Security Code
              </label>
              <OTPInput
                length={6}
                value={otpCode}
                onChange={setOtpCode}
                onComplete={(code) => handleVerifyOtp(code)}
                disabled={isVerifyingOtp}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Backup Recovery Code
              </label>
              <Input
                type="text"
                placeholder="XXXXX-XXXXX"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                className="bg-black/50 border-white/10 text-white font-mono text-center tracking-widest uppercase"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setUseRecoveryCode(!useRecoveryCode)}
              className="text-xs text-amber-400 hover:underline"
            >
              {useRecoveryCode ? "Use Authenticator App" : "Use Backup Recovery Code"}
            </button>

            <Button
              size="sm"
              onClick={() => handleVerifyOtp()}
              disabled={isVerifyingOtp}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
            >
              {isVerifyingOtp ? "Verifying..." : "Verify & Authorize"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Dexta Africa Enterprise Operations &bull; ops.dextaafrica.org
      </footer>
    </div>
  );
}

