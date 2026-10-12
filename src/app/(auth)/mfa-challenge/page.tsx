"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, KeyRound, ArrowLeft, ArrowRight, Loader2, Lock } from "lucide-react";
import { OTPInput } from "@/components/ui/OTPInput";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { BackgroundVideo } from "@/components/ui/BackgroundVideo";

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
    const codeToVerify = submittedCode || (useRecoveryCode ? recoveryCode : otpCode);

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
        toastError("MFA Verification Failed", data.error || "Invalid code");
        setIsLoading(false);
        return;
      }

      toastSuccess("Identity Verified", "Welcome to Dexta Africa.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Network error. Please try again.");
      toastError("Error", "Could not complete verification");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Construction Video */}
      <BackgroundVideo />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/20 dark:border-white/10 bg-white/90 dark:bg-[#121217]/90 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/15 text-red-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 shadow-md">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Two-Factor Authentication
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {useRecoveryCode
              ? "Enter one of your 10-character emergency backup recovery codes."
              : "Enter the 6-digit verification code from your authenticator app."}
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
                label="Emergency Recovery Code"
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
            disabled={useRecoveryCode ? recoveryCode.length < 6 : otpCode.length < 6}
            onClick={() => handleVerify()}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Verify & Continue
          </Button>

          {/* Toggle between TOTP and Recovery Code */}
          <div className="flex flex-col items-center gap-2.5 pt-2 border-t border-slate-200/80 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                setUseRecoveryCode(!useRecoveryCode);
                setErrorMessage("");
              }}
              className="text-xs font-medium text-red-600 dark:text-rose-400 hover:underline"
            >
              {useRecoveryCode
                ? "Use 6-digit authenticator app code instead"
                : "Cannot access authenticator? Use an emergency recovery code"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to Login</span>
            </button>
          </div>
        </div>
      </div>
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
