"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Shield, ArrowRight, Construction, CheckCircle } from "lucide-react";
import { Input, PasswordInput } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { BackgroundVideo } from "@/components/ui/BackgroundVideo";

export default function LoginPage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();
  const [email, setEmail] = React.useState("admin@dextaafrica.com");
  const [password, setPassword] = React.useState("AdminPassword2026!");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

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
        setErrorMessage(data.error || "Authentication failed");
        toastError("Login Failed", data.error || "Invalid credentials");
        setIsLoading(false);
        return;
      }

      if (data.requiresMfa) {
        toastSuccess("Credentials Verified", "Please complete Multi-Factor Authentication.");
        router.push(`/mfa-challenge?userId=${encodeURIComponent(data.userId)}`);
        return;
      }

      toastSuccess("Welcome Back", "Authentication successful.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Network error. Please try again.");
      toastError("Error", "Could not connect to authentication server");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Construction Video with Vignette */}
      <BackgroundVideo />

      {/* Glassmorphic Login Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/20 dark:border-white/10 bg-white/90 dark:bg-[#121217]/90 p-8 shadow-2xl backdrop-blur-2xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 text-white font-extrabold text-2xl shadow-xl shadow-red-500/35">
              D
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] text-white font-bold ring-2 ring-white dark:ring-[#121217]">
              ✓
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Dexta Africa
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-red-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
              <Construction className="h-3 w-3" /> Ops v2.4
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Enterprise Management & Infrastructure Operations Hub
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <Input
            label="Administrative Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
            placeholder="admin@dextaafrica.com"
            required
          />

          <PasswordInput
            label="Master Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
            placeholder="••••••••••••"
            required
          />

          {errorMessage && (
            <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 border border-red-200 dark:border-red-500/20 text-xs font-medium text-red-600 dark:text-rose-400 text-center animate-fade-in">
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
            Access Operations Portal
          </Button>
        </form>

        {/* Register CTA */}
        <div className="mt-5 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-rose-400 hover:underline"
          >
            <span>New Administrator?</span>
            <span className="font-bold underline">Register Official Account</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Security Credentials Tip */}
        <div className="mt-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] p-2.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span className="font-mono">Demo: admin@dextaafrica.com</span>
          <span className="font-mono font-bold text-red-600 dark:text-rose-400">AdminPassword2026!</span>
        </div>

        {/* Security Assurance Badge */}
        <div className="mt-5 flex items-center justify-center gap-1.5 border-t border-slate-200/80 dark:border-white/[0.08] pt-4 text-[11px] text-slate-400">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          <span>Zero Mock Data &bull; RFC 6238 TOTP Multi-Factor Secured</span>
        </div>
      </div>
    </div>
  );
}
