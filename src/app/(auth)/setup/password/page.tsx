"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, KeyRound, CheckCircle2, ShieldCheck, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { Input, PasswordInput } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { DextaLogo } from "@/components/ui/DextaLogo";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { evaluatePasswordStrength } from "@/lib/auth/validation";

export default function SetPreferredPasswordPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const strength = evaluatePasswordStrength(newPassword);
    if (strength.errors.length > 0) {
      setErrorMessage(strength.errors[0]);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update password.");
        toastError(data.error || "Error updating password");
        return;
      }

      toastSuccess("Password Configured", "Your preferred personal password has been saved.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 sm:p-6 text-white relative overflow-hidden select-none">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/20 via-black to-black" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0e1015]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <DextaLogo className="h-10 w-auto" />
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ED2618]/10 text-[#ED2618] border border-[#ED2618]/20">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Set Your Preferred Password
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Your account was provisioned by IT. Please configure your personal, confidential password. IT administrators do not retain access to this password.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              New Preferred Password *
            </label>
            <PasswordInput
              required
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-black/50 border-white/10 text-white"
            />
          </div>

          <PasswordStrengthMeter password={newPassword} />

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Zero-knowledge enterprise encryption</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Full confidentiality from IT administration</span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-[#ED2618] hover:bg-[#d02013] text-white font-semibold shadow-lg shadow-red-500/20"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Encrypting & Saving...
              </>
            ) : (
              <>
                <span>Save Password & Enter Workspace</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

