"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Shield,
  ArrowRight,
  ArrowLeft,
  Home,
  UserPlus,
  KeyRound,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Input, PasswordInput } from "@/components/ui/Input";
import { OTPInput } from "@/components/ui/OTPInput";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { BackgroundVideo } from "@/components/ui/BackgroundVideo";
import { DextaLogo } from "@/components/ui/DextaLogo";

export default function LoginPage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();
  const [email, setEmail] = React.useState("admin@dextaafrica.com");
  const [password, setPassword] = React.useState("AdminPassword2026!");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  // In-App OTP Verification Modal State
  const [otpModalOpen, setOtpModalOpen] = React.useState(false);
  const [pendingUserId, setPendingUserId] = React.useState("");
  const [pendingUserName, setPendingUserName] = React.useState("");
  const [demoOtpCode, setDemoOtpCode] = React.useState("");
  const [otpCode, setOtpCode] = React.useState("");
  const [recoveryCode, setRecoveryCode] = React.useState("");
  const [useRecoveryCode, setUseRecoveryCode] = React.useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
  const [otpError, setOtpError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Sign in failed");
        toastError("Sign In Failed", data.error || "Invalid email or password");
        setIsLoading(false);
        return;
      }

      if (data.requiresMfa) {
        setPendingUserId(data.userId);
        setPendingUserName(data.fullName || email);
        setDemoOtpCode(data.demoOtpCode || "");
        setOtpCode("");
        setRecoveryCode("");
        setOtpError("");
        setUseRecoveryCode(false);
        setOtpModalOpen(true);
        setIsLoading(false);
        toastSuccess(
          "Step 1 Confirmed",
          "Please enter your 6-digit verification code in the prompt to complete sign-in."
        );
        return;
      }

      toastSuccess("Welcome Back", "Signed in to Dexta Africa Workspace.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Connection error. Please try again.");
      toastError("Error", "Could not connect to the workspace");
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (submittedCode?: string) => {
    const codeToVerify =
      submittedCode || (useRecoveryCode ? recoveryCode : otpCode);

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
        setOtpError(
          data.error || "Incorrect 6-digit code. Please check and try again."
        );
        toastError("Verification Failed", data.error || "Invalid code");
        setIsVerifyingOtp(false);
        return;
      }

      toastSuccess(
        "Identity Verified",
        `Welcome to the Dexta Africa Workspace, ${data.user?.fullName || "Team Member"}.`
      );
      setOtpModalOpen(false);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setOtpError("Connection error. Please try again.");
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Dual-Image Zoom-In / Zoom-Out Motion Backdrop */}
      <BackgroundVideo />

      {/* Top Floating Navigation Bar */}
      <header className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between pt-1">
        <Link
          href="/"
          className="group inline-flex h-10 items-center gap-2 rounded-xl border border-white/25 bg-black/60 px-4 sm:px-5 text-xs sm:text-sm font-bold text-white backdrop-blur-xl hover:bg-[#ED2618] hover:border-[#ED2618] transition-all duration-200 shadow-lg"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Home</span>
        </Link>

        <button
          type="button"
          onClick={() => router.push("/register")}
          className="btn-fill-up h-10 rounded-xl bg-white/95 dark:bg-[#121217]/95 px-4 sm:px-5 text-xs sm:text-sm cursor-pointer"
        >
          <UserPlus className="h-3.5 w-3.5 text-[#ED2618] transition-colors" />
          <span>Create Account</span>
        </button>
      </header>

      {/* Main Centered Login Card */}
      <div className="relative z-10 my-auto mx-auto w-full max-w-md rounded-3xl border border-white/20 dark:border-white/10 bg-white/95 dark:bg-[#121217]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl animate-fade-in">
        {/* Card Top Row: Quick Back Icon + Logo */}
        <div className="relative flex flex-col items-center text-center">
          <Link
            href="/"
            title="Back to Home Page"
            className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 text-slate-500 hover:bg-red-50 hover:text-[#ED2618] dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <Link
            href="/"
            title="Return to Dexta Africa Home"
            className="transition-transform hover:scale-105"
          >
            <DextaLogo className="h-10 sm:h-11 w-auto" />
          </Link>

          <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sign In to Workspace
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Enter your Dexta Africa email and password to receive your 6-digit
            verification prompt
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <Input
            label="Work Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
            placeholder="name@dextaafrica.com"
            required
          />

          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
            placeholder="••••••••••••"
            required
          />

          {errorMessage && (
            <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 border border-red-200 dark:border-red-500/20 text-xs font-medium text-red-600 dark:text-red-400 text-center animate-fade-in">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-crimson-exec h-12 w-full rounded-xl px-6 text-sm sm:text-base cursor-pointer disabled:opacity-60"
          >
            <span>
              {isLoading ? "Verifying Credentials..." : "Continue to OTP Verification"}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Bottom Navigation Links */}
        <div className="mt-6 space-y-3 border-t border-slate-200/80 dark:border-white/[0.08] pt-5 text-center">
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="btn-fill-up h-11 w-full rounded-xl px-4 text-xs sm:text-sm cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5 text-[#ED2618] transition-colors" />
            <span>New team member? Create Team Account</span>
          </button>

          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Return to Dexta Africa Home Page</span>
            </Link>
          </div>
        </div>

        {/* Security Assurance Footer */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          <span>Protected by 6-digit OTP two-step verification</span>
        </div>
      </div>

      {/* In-App Two-Step OTP Verification Modal */}
      <Modal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        title="Two-Step OTP Verification"
        description={`Confirm your identity for ${pendingUserName} (${email}) before entering the Dexta Africa workspace.`}
        maxWidth="md"
      >
        <div className="space-y-5">
          {/* Instant OTP Helper Banner so User Can See & Test the 6-Digit Code Immediately */}
          {!useRecoveryCode && demoOtpCode && (
            <div className="rounded-2xl border border-red-200 dark:border-red-500/25 bg-red-50/70 dark:bg-red-500/10 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ED2618] text-white">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#ED2618] dark:text-red-400">
                    Your 6-Digit Verification Code
                  </p>
                  <p className="text-base font-extrabold tracking-[0.22em] text-slate-900 dark:text-white">
                    {demoOtpCode}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOtpCode(demoOtpCode);
                  handleVerifyOtp(demoOtpCode);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#ED2618] hover:bg-red-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Fill &amp; Verify</span>
              </button>
            </div>
          )}

          {!useRecoveryCode ? (
            <div className="space-y-3 text-center">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Enter the 6-digit verification code below (or from your
                authenticator app):
              </p>
              <OTPInput
                length={6}
                value={otpCode}
                onChange={setOtpCode}
                onComplete={(code) => handleVerifyOtp(code)}
                disabled={isVerifyingOtp}
                error={Boolean(otpError)}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                label="10-Character Backup Access Code"
                placeholder="e.g. A9F2B3C841"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                leftIcon={<KeyRound className="h-4 w-4" />}
              />
            </div>
          )}

          {otpError && (
            <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 border border-red-200 dark:border-red-500/20 text-xs font-medium text-red-600 dark:text-red-400 text-center">
              {otpError}
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isVerifyingOtp}
              disabled={
                useRecoveryCode ? recoveryCode.length < 6 : otpCode.length < 6
              }
              onClick={() => handleVerifyOtp()}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Verify OTP &amp; Enter Workspace
            </Button>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/10 text-xs">
              <button
                type="button"
                onClick={() => {
                  setUseRecoveryCode(!useRecoveryCode);
                  setOtpError("");
                }}
                className="font-semibold text-[#ED2618] hover:underline cursor-pointer"
              >
                {useRecoveryCode
                  ? "Use 6-digit OTP code instead"
                  : "Use a backup access code"}
              </button>

              <button
                type="button"
                onClick={() => setOtpModalOpen(false)}
                className="font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Bottom Spacer for Vertical Balance */}
      <div className="h-6" />
    </div>
  );
}
