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
} from "lucide-react";
import { Input, PasswordInput } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
        toastSuccess(
          "Details Confirmed",
          "Please enter your two-step verification code."
        );
        router.push(`/mfa-challenge?userId=${encodeURIComponent(data.userId)}`);
        return;
      }

      toastSuccess("Welcome Back", "Signed in successfully.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Connection error. Please try again.");
      toastError("Error", "Could not connect to the server");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Dual-Image Zoom-In / Zoom-Out Motion Backdrop */}
      <BackgroundVideo />

      {/* Top Floating Navigation Bar with Prominent Back Button */}
      <header className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between pt-1">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xl hover:bg-[#ED2618] hover:border-[#ED2618] transition-all duration-200 shadow-lg"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Home</span>
        </Link>

        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xl hover:bg-white/20 transition-all duration-200"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Create Account</span>
        </Link>
      </header>

      {/* Main Centered Login Card */}
      <div className="relative z-10 my-auto mx-auto w-full max-w-md rounded-3xl border border-white/20 dark:border-white/10 bg-white/95 dark:bg-[#121217]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl animate-reveal-up">
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
            <DextaLogo className="h-11 sm:h-12 w-auto" />
          </Link>

          <h1 className="mt-4 text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Sign in to access your Dexta Africa workspace
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
            <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 border border-red-200 dark:border-red-500/20 text-xs font-medium text-red-600 dark:text-rose-400 text-center animate-fade-in">
              {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full h-11 text-sm font-bold shadow-lg shadow-red-500/25 hover-lift"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Sign In
          </Button>
        </form>

        {/* Bottom Navigation Links */}
        <div className="mt-6 space-y-3 border-t border-slate-200/80 dark:border-white/[0.08] pt-4 text-center">
          <div>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ED2618] dark:text-rose-400 hover:underline"
            >
              <span>New team member?</span>
              <span className="font-bold underline">Create your account</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

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
          <span>Protected by two-step verification</span>
        </div>
      </div>

      {/* Bottom Spacer for Vertical Balance */}
      <div className="h-6" />
    </div>
  );
}
