"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ShieldCheck,
  Terminal,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  KeyRound,
  Fingerprint,
} from "lucide-react";
import { Input, PasswordInput } from "@/components/ui/Input";
import { OTPInput } from "@/components/ui/OTPInput";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { DextaLogo } from "@/components/ui/DextaLogo";

export default function AdminPortalLoginPage() {
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
      setErrorMessage("Please enter both administrator email and password.");
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
        setErrorMessage(data.error || "Authentication failed");
        toastError("Authentication Failed", data.error || "Invalid credentials");
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

      toastSuccess("Command Authenticated", "Signed in to Dexta Africa Systems Command.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Secure gateway connection timeout.");
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
        setOtpError(data.error || "MFA validation failed");
        setIsVerifyingOtp(false);
        return;
      }

      setOtpModalOpen(false);
      toastSuccess("Access Granted", "Welcome to Dexta Africa Systems Console.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setOtpError("Network error during MFA validation.");
      setIsVerifyingOtp(false);
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

          <Link href="/ops/login" className="text-xs text-slate-400 hover:text-white transition-colors font-sans">
            Operations Portal &rarr;
          </Link>
        </div>
      </header>

      {/* Main Authentication Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-[#090A0F] p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <DextaLogo className="h-9 w-auto" />
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-bold text-red-400">
              <Terminal className="h-3.5 w-3.5" />
              <span>Zero-Trust Infrastructure Gateway</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
                Systems &amp; Web Sign In
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Enter your administrative key credentials to manage web editorial, storage vaults, and IT watchdog rules.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-sans">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-sans">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                Administrator Email *
              </label>
              <div className="relative">
                <Input
                  type="email"
                  required
                  placeholder="admin@dextaafrica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-black/50 border-white/10 text-white pl-10 font-mono text-sm"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                Security Password *
              </label>
              <div className="relative">
                <PasswordInput
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black/50 border-white/10 text-white pl-10 font-mono text-sm"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#ED2618] hover:bg-[#d02013] text-white font-bold text-sm shadow-xl shadow-red-500/25 rounded-xl cursor-pointer font-sans"
            >
              {isLoading ? "Validating Cryptographic Session..." : "Authenticate to Systems Command"}
            </Button>
          </form>

          <div className="pt-2 border-t border-white/10 text-center text-xs text-slate-400 space-y-2 font-mono">
            <div>
              Need to activate an IT-provisioned key?{" "}
              <Link href="/admin-portal/register" className="font-bold text-red-400 hover:underline">
                Activate Key &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* In-App OTP Verification Modal */}
      <Modal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        title="Zero-Trust Authentication Challenge"
      >
        <div className="space-y-4 p-2 text-white font-sans">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
            <KeyRound className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <p className="font-bold font-mono">MFA Challenge Triggered</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {isEmailOtp
                  ? `Enter the 6-digit code dispatched to ${email}.`
                  : "Enter the code generated by your hardware or software Authenticator."}
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
              <label className="block text-xs font-semibold text-slate-300 text-center font-mono">
                6-Digit Authenticator Code
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
              <label className="block text-xs font-semibold text-slate-300 font-mono">
                Emergency Backup Recovery Code
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
              className="text-xs text-red-400 hover:underline font-mono"
            >
              {useRecoveryCode ? "Use Authenticator TOTP" : "Use Backup Code"}
            </button>

            <Button
              size="sm"
              onClick={() => handleVerifyOtp()}
              disabled={isVerifyingOtp}
              className="bg-[#ED2618] hover:bg-[#d02013] text-white font-bold"
            >
              {isVerifyingOtp ? "Validating..." : "Verify & Authorize"}
            </Button>
          </div>
        </div>
      </Modal>

      <footer className="border-t border-white/10 py-4 text-center text-xs text-slate-500 font-mono">
        &copy; {new Date().getFullYear()} Dexta Africa Systems &amp; Web Infrastructure Command &bull; admin.dextafrica.org
      </footer>
    </div>
  );
}

