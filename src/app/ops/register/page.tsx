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
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Input, PasswordInput } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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

  return (
    <div className="min-h-screen bg-[#080B10] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black font-sans">
      {/* Top Bar */}
      <header className="border-b border-amber-500/20 bg-[#080B10]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/ops" className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Operations Landing</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-amber-400">
              ops.dextaafrica.org
            </span>
          </div>

          <Link href="/ops/login" className="text-xs text-amber-400 hover:underline">
            Already have an account? Sign In &rarr;
          </Link>
        </div>
      </header>

      {/* Main Registration Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-10">
        <div className="w-full max-w-xl rounded-3xl border border-amber-500/25 bg-[#0E131C] p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <DextaLogo className="h-9 w-auto" />
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-400">
              <HardHat className="h-3.5 w-3.5" />
              <span>Operations Onboarding</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Establish Operations Profile
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Join the Dexta Africa operations network to manage real estate developments, capital deals, and logistics.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Legal Name *
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Olufemi Adeyemi"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="bg-black/50 border-white/10 text-white pl-10"
                  />
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Corporate Work Email *
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    required
                    placeholder="name@dextaafrica.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="bg-black/50 border-white/10 text-white pl-10"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Operations Department *
                </label>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="OPERATIONS">Operations &amp; Infrastructure</option>
                  <option value="EXECUTIVE">Executive Management (MD/CEO)</option>
                  <option value="INVESTMENT">Strategic Capital &amp; Investment</option>
                  <option value="ARCHITECTURE">Urban Design &amp; Architecture</option>
                  <option value="LEGAL">Legal &amp; Regulatory Compliance</option>
                  <option value="FINANCE">Finance &amp; Treasury</option>
                  <option value="HR">People &amp; Culture</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Job Title / Function
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="e.g. Lead Project Director"
                    value={form.jobTitle}
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                    className="bg-black/50 border-white/10 text-white pl-10"
                  />
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Direct Phone Number
                </label>
                <div className="relative">
                  <Input
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="bg-black/50 border-white/10 text-white pl-10"
                  />
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Organization Access Key
                </label>
                <Input
                  type="text"
                  placeholder="DEXTA-2026"
                  value={form.accessPasscode}
                  onChange={(e) => setForm({ ...form, accessPasscode: e.target.value })}
                  className="bg-black/50 border-white/10 text-white font-mono text-sm tracking-wider"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Workspace Password *
                </label>
                <div className="relative">
                  <PasswordInput
                    required
                    placeholder="Minimum 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="bg-black/50 border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <PasswordInput
                    required
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="bg-black/50 border-white/10 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Real-Time Password Strength Meter */}
            <PasswordStrengthMeter password={form.password} />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 rounded-xl cursor-pointer"
            >
              {isLoading ? "Provisioning Profile..." : "Create Operations Profile"}
            </Button>
          </form>

          <div className="pt-2 border-t border-white/10 text-center text-xs text-slate-400">
            Already registered?{" "}
            <Link href="/ops/login" className="font-bold text-amber-400 hover:underline">
              Sign In to Operations Desk &rarr;
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Dexta Africa Enterprise Operations &bull; ops.dextaafrica.org
      </footer>
    </div>
  );
}

