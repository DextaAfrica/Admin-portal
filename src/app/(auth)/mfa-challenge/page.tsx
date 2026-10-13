"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, ArrowLeft, ArrowRight, Loader2, Home } from "lucide-react";
import { OTPInput } from "@/components/ui/OTPInput";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { BackgroundVideo } from "@/components/ui/BackgroundVideo";
import { DextaLogo } from "@/components/ui/DextaLogo";

function MfaChallengeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") || "";
  const { error: toastError, success: toastSuccess } = useToast();

  const [otpCode, setOtpCode] = React.useState("");
  const [recoveryCode, setRecoveryCode] = React.useState("");
  const [useRecoveryCode, setUseRecoveryCode] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleVerify = async (submittedCode?: string) => {
    const codeToVerify =
      submittedCode || (useRecoveryCode ? recoveryCode : otpCode);

    if (!codeToVerify) return;
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/mfa-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          code: codeToVerify,
          isRecoveryCode: useRecoveryCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Verification failed");
        toastError("Verification Failed", data.error || "Invalid code");
        setIsLoading(false);
        return;
      }

      toastSuccess("Verified", "Welcome to Dexta Africa.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Connection error. Please try again.");
      toastError("Error", "Could not complete verification");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Dual-Image Zoom-In / Zoom-Out Motion Backdrop */}
      <BackgroundVideo />

      {/* Top Floating Navigation Bar */}
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

      {/* Main Card */}
      <div className="relative z-10 my-auto mx-auto w-full max-w-md rounded-3xl border border-white/20 dark:border-white/10 bg-white/95 dark:bg-[#121217]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl animate-reveal-up">
        <div className="relative flex flex-col items-center text-center">
          <Link
            href="/login"
            title="Back to Sign In"
            className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 text-slate-500 hover:bg-red-50 hover:text-[#ED2618] dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <Link href="/" title="Return to Dexta Africa Home">
            <DextaLogo className="h-11 w-auto" />
          </Link>

          <h1 className="mt-4 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Two-Step Verification
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {useRecoveryCode
              ? "Enter one of your 10-character backup access codes."
              : "Enter the 6-digit code from your authenticator app to continue."}
          </p>
        </div>

        <div className="mt-7 space-y-6">
          {!useRecoveryCode ? (
            <div className="space-y-4">
              <OTPInput
                length={6}
                value={otpCode}
                onChange={setOtpCode}
                onComplete={(code) => handleVerify(code)}
                disabled={isLoading}
                error={Boolean(errorMessage)}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Backup Access Code"
                placeholder="e.g. A9F2B3C841"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                leftIcon={<KeyRound className="h-4 w-4" />}
                className="font-mono uppercase tracking-widest text-center"
              />
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 border border-red-200 dark:border-red-500/20 text-xs font-medium text-red-600 dark:text-rose-400 text-center animate-fade-in">
              {errorMessage}
            </div>
          )}

          <Button
            variant="primary"
            className="w-full h-11 text-sm font-bold shadow-lg shadow-red-500/25"
            isLoading={isLoading}
            disabled={
              useRecoveryCode ? recoveryCode.length < 6 : otpCode.length < 6
            }
            onClick={() => handleVerify()}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Confirm &amp; Continue
          </Button>

          {/* Toggle between Authenticator and Backup Code */}
          <div className="flex flex-col items-center gap-2.5 pt-3 border-t border-slate-200/80 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                setUseRecoveryCode(!useRecoveryCode);
                setErrorMessage("");
              }}
              className="text-xs font-medium text-[#ED2618] dark:text-rose-400 hover:underline"
            >
              {useRecoveryCode
                ? "Use 6-digit code from your phone app instead"
                : "Don't have your phone? Use a backup access code"}
            </button>

            <div className="flex items-center gap-4 pt-1">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Back to Sign In</span>
              </Link>
              <span className="text-slate-300 dark:text-white/10">&bull;</span>
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                <Home className="h-3 w-3" />
                <span>Home Page</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="h-6" />
    </div>
  );
}

export default function MfaChallengePage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      }
    >
      <MfaChallengeContent />
    </React.Suspense>
  );
}
