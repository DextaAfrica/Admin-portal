"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  Copy,
  Download,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Home,
  LogIn,
  Sparkles,
} from "lucide-react";
import { Input, PasswordInput } from "@/components/ui/Input";
import { OTPInput } from "@/components/ui/OTPInput";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { BackgroundVideo } from "@/components/ui/BackgroundVideo";
import { DextaLogo } from "@/components/ui/DextaLogo";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError, copied } = useToast();

  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [accessPasscode, setAccessPasscode] = React.useState("DEXTA-2026");

  const [mfaSecret, setMfaSecret] = React.useState("");
  const [qrCodeUrl, setQrCodeUrl] = React.useState("");
  const [currentOtpHint, setCurrentOtpHint] = React.useState("");
  const [otpCode, setOtpCode] = React.useState("");
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[]>([]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleProceedToMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName || !email || !password) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (accessPasscode.trim().toUpperCase() !== "DEXTA-2026") {
      setErrorMessage("Invalid Company Invite Code. Use DEXTA-2026.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register-mfa-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Could not start security setup");
        setIsLoading(false);
        return;
      }

      setMfaSecret(data.secret);
      setQrCodeUrl(data.qrCodeDataUrl);
      setCurrentOtpHint(data.currentOtp || "");
      setStep(2);
    } catch {
      setErrorMessage("Connection error while preparing security code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteRegistration = async (submittedCode?: string) => {
    const codeToVerify = submittedCode || otpCode;
    if (codeToVerify.length < 6) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          accessPasscode,
          mfaSecret,
          mfaCode: codeToVerify,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Could not complete account setup");
        toastError("Setup Error", data.error || "Could not complete setup");
        setIsLoading(false);
        return;
      }

      setRecoveryCodes(data.recoveryCodes || []);
      toastSuccess("Account Created", "Two-step OTP security is now active.");
      setStep(3);
    } catch {
      setErrorMessage("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadRecoveryCodes = () => {
    const text =
      `Dexta Africa - Backup Access Codes\nAccount: ${email}\nDate: ${new Date().toISOString()}\n\n` +
      recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
      "\n\nEach code can be used once if you ever lose access to your phone.";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dexta-backup-codes-${email.split("@")[0]}.txt`;
    a.click();
    toastSuccess("Downloaded", "Backup codes saved.");
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
          onClick={() => router.push("/login")}
          className="btn-crimson-exec h-10 rounded-xl px-4 sm:px-5 text-xs sm:text-sm cursor-pointer"
        >
          <LogIn className="h-3.5 w-3.5" />
          <span>Sign In</span>
        </button>
      </header>

      {/* Main Registration Card */}
      <div className="relative z-10 my-auto mx-auto w-full max-w-lg rounded-3xl border border-white/20 dark:border-white/10 bg-white/95 dark:bg-[#121217]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl animate-fade-in">
        {/* Brand Header with Back Action */}
        <div className="relative flex flex-col items-center text-center">
          <button
            type="button"
            onClick={() => {
              if (step === 2) {
                setStep(1);
              } else {
                router.push("/");
              }
            }}
            title={step === 2 ? "Back to Step 1" : "Back to Home Page"}
            className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 text-slate-500 hover:bg-red-50 hover:text-[#ED2618] dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <Link
            href="/"
            title="Return to Dexta Africa Home"
            className="transition-transform hover:scale-105"
          >
            <DextaLogo className="h-10 sm:h-11 w-auto" />
          </Link>

          <div className="mt-4 flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Create Team Account
            </h1>
            <Badge variant="crimson" className="text-[10px]">
              Step {step} of 3
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {step === 1 &&
              "Enter your details and company invite code to join the workspace."}
            {step === 2 &&
              "Scan the QR code below or use your 6-digit verification code to activate two-step protection."}
            {step === 3 &&
              "Save your backup access codes in a safe place before entering."}
          </p>
        </div>

        {/* Stepper Bar */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                step >= s
                  ? "bg-[#ED2618]"
                  : "bg-slate-200 dark:bg-white/10"
              )}
            />
          ))}
        </div>

        {/* STEP 1: Identity & Credentials */}
        {step === 1 && (
          <form
            onSubmit={handleProceedToMfa}
            className="mt-6 space-y-4 animate-fade-in"
          >
            <Input
              label="Full Name"
              placeholder="e.g. Chidi Okonkwo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User className="h-4 w-4" />}
              required
            />

            <Input
              label="Work Email"
              type="email"
              placeholder="name@dextaafrica.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />

            <PasswordInput
              label="Create Password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              showStrength
              required
            />

            <Input
              label="Company Invite Code"
              placeholder="DEXTA-2026"
              value={accessPasscode}
              onChange={(e) => setAccessPasscode(e.target.value.toUpperCase())}
              leftIcon={<KeyRound className="h-4 w-4" />}
              helperText="Enter your Dexta Africa team invite code (Default: DEXTA-2026)"
              required
            />

            {errorMessage && (
              <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 border border-red-200 dark:border-red-500/20 text-xs font-medium text-red-600 dark:text-red-400 text-center">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-fill-up h-12 w-full rounded-xl px-6 text-sm sm:text-base cursor-pointer disabled:opacity-60"
            >
              <span>
                {isLoading
                  ? "Preparing OTP Verification..."
                  : "Continue to 6-Digit OTP Setup"}
              </span>
              <ArrowRight className="h-4 w-4 text-[#ED2618] transition-colors" />
            </button>

            <div className="space-y-3 text-center pt-4 border-t border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/[0.04] px-4 text-xs font-bold text-slate-800 dark:text-white hover:border-[#ED2618] hover:text-[#ED2618] transition-all cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5 text-[#ED2618]" />
                <span>Already have an account? Sign In</span>
              </button>
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                >
                  <Home className="h-3.5 w-3.5" />
                  <span>Return to Home Page</span>
                </Link>
              </div>
            </div>
          </form>
        )}

        {/* STEP 2: Two-Step Verification Binding */}
        {step === 2 && (
          <div className="mt-6 space-y-5 animate-fade-in">
            <div className="flex flex-col items-center text-center space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                1. Scan QR Code with Your Phone App
              </span>
              {qrCodeUrl && (
                <div className="w-40 h-40 rounded-2xl border border-slate-200 dark:border-white/10 p-2 bg-white flex items-center justify-center shadow-md">
                  <img
                    src={qrCodeUrl}
                    alt="Security QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400">Setup Key:</span>
                <span className="rounded bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-xs font-bold text-slate-900 dark:text-white">
                  {mfaSecret}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(mfaSecret);
                    copied("Setup key copied!");
                  }}
                  className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                  title="Copy Setup Key"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Instant 6-Digit OTP Verification Helper */}
            {currentOtpHint && (
              <div className="rounded-2xl border border-red-200 dark:border-red-500/25 bg-red-50/70 dark:bg-red-500/10 p-3 flex items-center justify-between gap-3">
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#ED2618] dark:text-red-400">
                    Active 6-Digit Verification Code
                  </p>
                  <p className="text-sm font-extrabold tracking-[0.2em] text-slate-900 dark:text-white">
                    {currentOtpHint}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtpCode(currentOtpHint);
                    handleCompleteRegistration(currentOtpHint);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#ED2618] hover:bg-red-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Fill &amp; Verify</span>
                </button>
              </div>
            )}

            <div className="space-y-3 text-center border-t border-slate-200/80 dark:border-white/10 pt-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                2. Enter 6-Digit Verification Code
              </span>
              <OTPInput
                length={6}
                value={otpCode}
                onChange={setOtpCode}
                onComplete={(code) => handleCompleteRegistration(code)}
                disabled={isLoading}
                error={Boolean(errorMessage)}
              />
            </div>

            {errorMessage && (
              <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 border border-red-200 dark:border-red-500/20 text-xs font-medium text-red-600 dark:text-red-400 text-center">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(1)}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                className="flex-1"
                isLoading={isLoading}
                disabled={otpCode.length < 6}
                onClick={() => handleCompleteRegistration()}
                rightIcon={<ShieldCheck className="h-4 w-4" />}
              >
                Confirm &amp; Create Account
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Backup Access Codes & Launch */}
        {step === 3 && (
          <div className="mt-6 space-y-5 animate-fade-in">
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/10 p-3.5 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-slate-900 dark:text-white">
                  Account Ready!
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  Save your backup access codes below in case you ever lose your
                  phone.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-black/40 p-3.5">
              {recoveryCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#15161c] py-1.5 px-2 text-center text-xs font-bold text-slate-900 dark:text-white tracking-widest"
                >
                  {code}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={downloadRecoveryCodes}
                leftIcon={<Download className="h-3.5 w-3.5" />}
              >
                Save as File
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(recoveryCodes.join("\n"));
                  copied("Backup codes copied!");
                }}
                leftIcon={<Copy className="h-3.5 w-3.5" />}
              >
                Copy Codes
              </Button>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => {
                router.push("/dashboard");
                router.refresh();
              }}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Enter Workspace
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Spacer */}
      <div className="h-6" />
    </div>
  );
}
