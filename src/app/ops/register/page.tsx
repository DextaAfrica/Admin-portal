"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HardHat,
  Building2,
  Briefcase,
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  ArrowLeft,
  Home,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { Input, PasswordInput } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { DextaLogo } from "@/components/ui/DextaLogo";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { evaluatePasswordStrength } from "@/lib/auth/validation";

export default function OperationsRegisterPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [form, setForm] = React.useState({
    fullName: "",
    email: "",
    department: "OPERATIONS",
    jobTitle: "",
    phone: "",
    password: "",
    confirmPassword: "",
    accessPasscode: "DEXTA-2026",
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!form.fullName || !form.email || !form.password) {
      setErrorMessage("Full Name, Corporate Email, and Password are required.");
      return;
    }

    const strength = evaluatePasswordStrength(form.password);
    if (strength.errors.length > 0) {
      setErrorMessage(strength.errors[0]);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          department: form.department,
          jobTitle: form.jobTitle,
          phone: form.phone,
          accessPasscode: form.accessPasscode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Registration failed");
        toastError("Registration Issue", data.error || "Could not register account");
        return;
      }

      toastSuccess(
        "Operations Account Created",
        `Welcome to Dexta Africa Operations, ${data.user.fullName}. Redirecting...`
      );
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Connection error while connecting to authorization service.");
    } finally {
      setIsLoading(false);
    }
  };

  const isSubdomain = typeof window !== "undefined" && window.location.hostname.startsWith("ops.");
  const loginPath = isSubdomain ? "/login" : "/ops/login";
  const landingPath = isSubdomain ? "/" : "/ops";

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#070A0F] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-[#ED2618] selection:text-white font-sans relative overflow-x-hidden">
      {/* Background Ambient Glow - Red & Slate */}
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
              ops.dextaafrica.org
            </span>
          </div>

          <Link
            href={loginPath}
            className="text-xs font-bold text-[#ED2618] hover:underline"
          >
            Already have an account? Sign In &rarr;
          </Link>
        </div>
      </header>

      {/* Main Registration Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 py-10">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200/90 dark:border-white/[0.14] bg-white dark:bg-[#141722] dark:bg-gradient-to-b dark:from-[#171A26] dark:to-[#11141E] p-6 sm:p-10 shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.65)] dark:ring-1 dark:ring-white/[0.08] backdrop-blur-2xl relative overflow-hidden space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <Link href={landingPath}>
              <DextaLogo className="h-9 w-auto" />
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200/90 dark:border-red-500/25 bg-red-50/90 dark:bg-red-500/10 px-3.5 py-1 text-[11px] font-bold text-[#ED2618] dark:text-red-400">
              <HardHat className="h-3.5 w-3.5" />
              <span>Operations Onboarding</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Establish Operations Profile
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Authorized provisioning for Dexta Africa infrastructure, capital deals, and logistics fleet.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 dark:text-red-400 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Legal Name *
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Olufemi Adeyemi"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618]"
                  />
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Corporate Work Email *
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    required
                    placeholder="name@dextaafrica.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618]"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Operations Department *
                </label>
                <div className="relative">
                  <select
                    aria-label="Operations Department"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full h-11 px-3.5 pl-10 rounded-xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#ED2618] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="OPERATIONS">Operations &amp; Infrastructure</option>
                    <option value="EXECUTIVE">Executive &amp; Capital</option>
                    <option value="FINANCE">Treasury &amp; Procurement</option>
                    <option value="HR">People &amp; Field Workforce</option>
                  </select>
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Job Title / Function
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="e.g. Lead Project Director"
                    value={form.jobTitle}
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                    className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618]"
                  />
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Direct Phone Number
                </label>
                <div className="relative">
                  <Input
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618]"
                  />
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Organization Access Key
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={form.accessPasscode}
                    onChange={(e) => setForm({ ...form, accessPasscode: e.target.value })}
                    className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618] font-mono tracking-wider uppercase"
                  />
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Workspace Password *
                </label>
                <div className="relative">
                  <PasswordInput
                    required
                    placeholder="Minimum 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618]"
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <PasswordInput
                    required
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618]"
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Password Entropy & Strength Meter */}
            {form.password && (
              <PasswordStrengthMeter password={form.password} showRequirements />
            )}

            {/* Primary Submit Button - Dexta Signature Crimson Exec */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-crimson-exec w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Creating Profile...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Create Operations Profile</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-center text-xs text-slate-600 dark:text-slate-400">
            <span>Already registered? </span>
            <Link href={loginPath} className="font-bold text-[#ED2618] hover:underline">
              Sign In to Operations Desk &rarr;
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#070A0F] py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Dexta Africa Enterprise Operations &bull; ops.dextaafrica.org</p>
      </footer>
    </div>
  );
}
