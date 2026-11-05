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
  Home,
  AlertCircle,
  KeyRound,
  Fingerprint,
  Clock,
} from "lucide-react";
import { Input, PasswordInput } from "@/components/ui/Input";
import { OTPInput } from "@/components/ui/OTPInput";
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
  const [inactivityNotice, setInactivityNotice] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("reason") === "inactivity") {
        setInactivityNotice(true);
      }
    }
  }, []);

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
        setOtpError(data.error || "Verification failed");
        setIsVerifyingOtp(false);
        return;
      }

      setOtpModalOpen(false);
      toastSuccess("Access Granted", "Welcome to Dexta Africa Systems Command.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setOtpError("Network error during verification.");
      setIsVerifyingOtp(false);
    }
  };

  const landingPath = "/";
  const registerPath = "/register";

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
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>

          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-white/10 pl-3">
            <span className="h-2 w-2 rounded-full bg-[#ED2618] animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase">
              admin.dextafrica.org
            </span>
          </div>

          <Link
            href={registerPath}
            className="text-xs font-bold text-[#ED2618] hover:underline"
          >
            Create Account &rarr;
          </Link>
        </div>
      </header>

      {/* Main Authentication Box */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200/90 dark:border-white/[0.14] bg-white dark:bg-[#141722] dark:bg-gradient-to-b dark:from-[#171A26] dark:to-[#11141E] p-6 sm:p-9 shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.65)] dark:ring-1 dark:ring-white/[0.08] backdrop-blur-2xl relative overflow-hidden space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <Link href={landingPath}>
              <DextaLogo className="h-9 w-auto" />
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200/90 dark:border-red-500/25 bg-red-50/90 dark:bg-red-500/10 px-3.5 py-1 text-[11px] font-bold text-[#ED2618] dark:text-red-400">
              <Terminal className="h-3.5 w-3.5" />
              <span>Zero-Trust Infrastructure Gateway</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Systems &amp; Web Sign In
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Authenticate with administrative credentials to manage web editorial, storage vaults, and IT watchdog rules.
              </p>
            </div>
          </div>

          {inactivityNotice && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-start gap-3 text-xs text-red-600 dark:text-red-400 animate-fade-in">
              <Clock className="h-4 w-4 shrink-0 mt-0.5 text-[#ED2618]" />
              <div>
                <strong className="block font-bold text-slate-900 dark:text-white">
                  Systems Session Terminated
                </strong>
                <span>
                  Your session timed out due to inactivity. Please authenticate again to access the Systems command.
                </span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 dark:text-red-400 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Administrator Email *
              </label>
              <div className="relative">
                <Input
                  type="email"
                  required
                  placeholder="admin@dextaafrica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618]"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password *
                </label>
                <Link
                  href="/setup/password"
                  className="text-xs text-[#ED2618] hover:underline font-medium"
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
                  className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618]"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-crimson-exec w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Authorizing Gateway...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Sign In to Systems Command</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-center text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <div>
              Need systems authorization?{" "}
              <Link href={registerPath} className="font-bold text-[#ED2618] hover:underline">
                Create Account / Activate Key &rarr;
              </Link>
            </div>
            <div>
              <Link href="/setup/password" className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                First time here? Activate account with IT key &rarr;
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
        <div className="space-y-4 p-2 text-slate-900 dark:text-white">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
            <KeyRound className="h-5 w-5 text-[#ED2618] shrink-0" />
            <div>
              <p className="font-bold">Identity Verification Required</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                {isEmailOtp
                  ? `Enter the 6-digit code dispatched to ${email}.`
                  : "Enter the code generated by your Authenticator app."}
              </p>
            </div>
          </div>

          {otpError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500 dark:text-red-400">
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
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                {isEmailOtp
                  ? "Check your corporate inbox for the one-time authentication code."
                  : "Open your authenticator app (Google Authenticator, 1Password, etc.)"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Backup Recovery Code
              </label>
              <Input
                type="text"
                placeholder="XXXXX-XXXXX"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                className="font-mono text-center tracking-widest uppercase bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                setUseRecoveryCode(!useRecoveryCode);
                setOtpError("");
              }}
              className="text-xs text-[#ED2618] hover:underline"
            >
              {useRecoveryCode ? "Use 6-digit authenticator code" : "Use a backup recovery code"}
            </button>

            <button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={isVerifyingOtp}
              className="btn-crimson-exec px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {isVerifyingOtp ? "Verifying..." : "Verify & Sign In"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#070A0F] py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Dexta Africa Enterprise Systems &bull; admin.dextafrica.org</p>
      </footer>
    </div>
  );
}
