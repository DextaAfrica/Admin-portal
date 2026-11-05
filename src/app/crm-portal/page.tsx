"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle2,
  Award,
  Layers,
  ChevronRight,
  Eye,
  KeyRound,
  Sparkles,
  ArrowLeft,
  Mail,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, PasswordInput } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { DextaLogo } from "@/components/ui/DextaLogo";

export default function CrmLandingPortalPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleCrmLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Enter your official CRM executive credentials.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Authentication failed. Verify credentials.");
        toastError("Authentication Issue", data.error || "Sign in failed");
        return;
      }

      if (data.requiresMfa) {
        toastSuccess("Credentials Verified", "Please complete two-factor authentication.");
        router.push(`/mfa-challenge?userId=${encodeURIComponent(data.userId)}`);
        return;
      }

      toastSuccess("Access Granted", "Redirecting to Strategic Deal Pipeline...");
      router.push("/crm");
      router.refresh();
    } catch {
      setErrorMessage("Connection error communicating with CRM authentication service.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-white selection:bg-[#ED2618] selection:text-white relative overflow-x-hidden">
      {/* Dynamic ambient gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-red-900/15 rounded-full blur-[140px]" />
      </div>

      {/* Navigation Header */}
      <nav className="relative z-20 border-b border-white/[0.08] bg-black/60 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <DextaLogo className="h-9 w-auto" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-4">
              <span className="text-xs uppercase tracking-widest font-extrabold text-amber-500">
                Strategic Capital CRM
              </span>
              <span className="text-[10px] text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                Institutional v2.6
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold px-4 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all"
            >
              Master Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Strategic Value Proposition */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Institutional Real Estate &amp; Private Equity CRM</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08]">
                Precision Capital &amp; Landmark Deal Governance.
              </h1>
              <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl">
                Dexta Africa&apos;s dedicated CRM suite unifies institutional investor relationships, milestone-driven escrow agreements, and multi-million dollar real estate pipelines into an isolated, zero-spreadsheet vault.
              </p>
            </div>

            {/* Metrics Ticker */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  $250M+
                </span>
                <p className="text-xs text-slate-400 mt-1">Managed Asset Deals</p>
              </div>

              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                  100%
                </span>
                <p className="text-xs text-slate-400 mt-1">Audit Traceability</p>
              </div>

              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                  Zero
                </span>
                <p className="text-xs text-slate-400 mt-1">External File Loss</p>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-[#ED2618] shrink-0" />
                <span>Multi-tier deal pipeline: Inquiry, Discovery, Proposal, Negotiation, Closing.</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-[#ED2618] shrink-0" />
                <span>Confidential interaction memo vault: Calls, Board meetings, Escrow milestones.</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-[#ED2618] shrink-0" />
                <span>Zero IT access boundary: Customer contracts isolated from IT admin inspection.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Executive CRM Dedicated Sign-In Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-[#13151c]/95 to-[#0b0c10]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ED2618]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[#ED2618]" />
                    CRM Executive Entrance
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Authorized Investor &amp; Deal Lead Sign In
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Briefcase className="h-5 w-5" />
                </div>
              </div>

              {errorMessage && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleCrmLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Official Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      type="email"
                      required
                      placeholder="e.g. lead.partner@dextaafrica.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-black/60 border-white/10 text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Executive Access Password
                  </label>
                  <PasswordInput
                    required
                    placeholder="Enter confidential password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black/60 border-white/10 text-white text-sm"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-[#ED2618] hover:bg-[#d02013] text-white font-bold text-sm tracking-wide shadow-lg shadow-red-500/20 transition-all cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Verifying Clearance...
                      </>
                    ) : (
                      <>
                        <span>Authenticate to Deal Pipeline</span>
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                  <Link
                    href="/register"
                    className="hover:text-slate-300 transition-colors"
                  >
                    Register / Activate Key &rarr;
                  </Link>
                  <Link
                    href="/login"
                    className="hover:text-slate-300 transition-colors"
                  >
                    Standard Login
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-black/80 py-8 relative z-10 text-center text-xs text-slate-500">
        <p>&copy; 2026 Dexta Africa Operations Portal. Confidential &amp; Proprietary Real Estate Architecture.</p>
      </footer>
    </div>
  );
}
