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
  QrCode,
  Copy,
  Download,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Construction,
} from "lucide-react";
import { Input, PasswordInput } from "@/components/ui/Input";
import { OTPInput } from "@/components/ui/OTPInput";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { BackgroundVideo } from "@/components/ui/BackgroundVideo";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError, copied } = useToast();

  // Wizard step: 1 = Identity, 2 = 2FA Binding, 3 = Recovery Codes & Launch
  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  // Form State
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [accessPasscode, setAccessPasscode] = React.useState("DEXTA-2026");

  // 2FA State
  const [mfaSecret, setMfaSecret] = React.useState("");
  const [qrCodeUrl, setQrCodeUrl] = React.useState("");
  const [otpCode, setOtpCode] = React.useState("");
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[]>([]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  // Step 1 -> Step 2: Generate live 2FA QR Code for this email
  const handleProceedToMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName || !email || !password) {
      setErrorMessage("Please fill in all identity fields.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Master password must be at least 8 characters long.");
      return;
    }

    if (accessPasscode.trim().toUpperCase() !== "DEXTA-2026") {
      setErrorMessage("Invalid Organization Access Passcode. Use DEXTA-2026.");
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
        setErrorMessage(data.error || "Could not initialize 2FA");
        setIsLoading(false);
        return;
      }

      setMfaSecret(data.secret);
      setQrCodeUrl(data.qrCodeDataUrl);
      setStep(2);
    } catch {
      setErrorMessage("Network error while generating 2FA secret.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 -> Step 3: Verify TOTP & Create Admin Account in DB
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
        setErrorMessage(data.error || "Registration failed");
        toastError("Registration Error", data.error || "Could not complete registration");
        setIsLoading(false);
        return;
      }

      setRecoveryCodes(data.recoveryCodes || []);
      toastSuccess("Admin Account Created", "2FA verified and session initialized.");
      setStep(3);
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadRecoveryCodes = () => {
    const text =
      `Dexta Africa Admin Portal - Emergency Backup Recovery Codes\nAccount: ${email}\nGenerated: ${new Date().toISOString()}\n\n` +
      recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
      "\n\nEach code can be used only once if you lose access to your authenticator device.";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dexta-recovery-${email.split("@")[0]}.txt`;
    a.click();
    toastSuccess("Downloaded", "Emergency recovery codes saved.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Construction Video & Blueprint Engine */}
      <BackgroundVideo />

      {/* Main Registration Card */}
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/20 dark:border-white/10 bg-white/95 dark:bg-[#121217]/95 p-8 shadow-2xl backdrop-blur-2xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 text-white font-extrabold text-xl shadow-lg shadow-red-500/35">
            D
          </div>
          <div className="mt-3 flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Administrator Onboarding
            </h1>
            <Badge variant="crimson" className="text-[10px]">
              Step {step} of 3
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {step === 1 && "Provision your administrative identity and organization access credentials."}
            {step === 2 && "Bind your authenticator app (Google Authenticator / 1Password) to enforce 2FA."}
            {step === 3 && "Save your single-use emergency backup codes before entering the portal."}
          </p>
        </div>

        {/* Stepper Bar */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                step >= s ? "bg-red-600 shadow-[0_0_8px_rgba(225,29,72,0.6)]" : "bg-slate-200 dark:bg-white/10"
              )}
            />
          ))}
        </div>

        {/* STEP 1: Identity & Credentials */}
        {step === 1 && (
          <form onSubmit={handleProceedToMfa} className="mt-6 space-y-4 animate-fade-in">
            <Input
              label="Full Official Name"
              placeholder="e.g. Chidi Okonkwo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User className="h-4 w-4" />}
              required
            />

            <Input
              label="Administrative Email"
              type="email"
              placeholder="name@dextaafrica.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />

            <PasswordInput
              label="Master Password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              showStrength
              required
            />

            <Input
              label="Organization Access Passcode"
              placeholder="DEXTA-2026"
              value={accessPasscode}
              onChange={(e) => setAccessPasscode(e.target.value.toUpperCase())}
              leftIcon={<KeyRound className="h-4 w-4" />}
              helperText="Required enterprise passcode to authorize new admin self-registration (Default: DEXTA-2026)"
              required
            />

            {errorMessage && (
              <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 border border-red-200 dark:border-red-500/20 text-xs font-medium text-red-600 dark:text-rose-400 text-center">
                {errorMessage}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 text-sm font-bold shadow-lg shadow-red-500/25"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Continue to Mandatory 2FA Setup
            </Button>

            <div className="text-center pt-2 border-t border-slate-200/80 dark:border-white/10">
              <Link
                href="/login"
                className="text-xs font-medium text-slate-500 hover:text-red-600 dark:hover:text-rose-400 transition-colors"
              >
                Already registered? <span className="font-bold underline">Sign in to your account</span>
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: Mandatory 2FA Binding */}
        {step === 2 && (
          <div className="mt-6 space-y-5 animate-fade-in">
            <div className="flex flex-col items-center text-center space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-rose-400">
                1. Scan QR Code with Authenticator App
              </span>
              {qrCodeUrl && (
                <div className="w-44 h-44 rounded-2xl border border-slate-200 dark:border-white/10 p-2 bg-white flex items-center justify-center shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCodeUrl} alt="2FA QR Code" className="w-full h-full object-contain" />
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-mono">Secret Key:</span>
                <code className="rounded bg-slate-100 dark:bg-white/10 px-2 py-0.5 font-mono text-xs font-bold text-slate-900 dark:text-white">
                  {mfaSecret}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(mfaSecret);
                    copied("Secret key copied!");
                  }}
                  className="text-slate-400 hover:text-red-600 p-1"
                  title="Copy Secret Key"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-center border-t border-slate-200/80 dark:border-white/10 pt-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-rose-400">
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
              <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 border border-red-200 dark:border-red-500/20 text-xs font-medium text-red-600 dark:text-rose-400 text-center">
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
                className="flex-1 h-10 font-bold"
                isLoading={isLoading}
                disabled={otpCode.length < 6}
                onClick={() => handleCompleteRegistration()}
                rightIcon={<ShieldCheck className="h-4 w-4" />}
              >
                Verify 2FA & Provision Account
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Emergency Recovery Vault & Portal Launch */}
        {step === 3 && (
          <div className="mt-6 space-y-5 animate-fade-in">
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/10 p-3.5 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-slate-900 dark:text-white">Account & 2FA Verified!</p>
                <p className="text-slate-600 dark:text-slate-300">
                  Save your 10 single-use backup codes below before entering the portal.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-black/40 p-3.5">
              {recoveryCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#15161c] py-1.5 px-2 text-center font-mono text-xs font-bold text-slate-900 dark:text-white tracking-widest"
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
                Download .txt
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(recoveryCodes.join("\n"));
                  copied("Recovery codes copied!");
                }}
                leftIcon={<Copy className="h-3.5 w-3.5" />}
              >
                Copy Codes
              </Button>
            </div>

            <Button
              type="button"
              variant="primary"
              className="w-full h-11 text-sm font-bold shadow-lg shadow-red-500/25"
              onClick={() => {
                router.push("/dashboard");
                router.refresh();
              }}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Launch Operations Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

