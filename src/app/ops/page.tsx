"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  HardHat,
  Users,
  DollarSign,
  ArrowRight,
  LogIn,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Layers,
  Sparkles,
  TrendingUp,
  MapPin,
  Clock,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { DextaLogo } from "@/components/ui/DextaLogo";
import { cn } from "@/lib/utils";

const OPERATIONS_PILLARS = [
  {
    icon: Building2,
    tag: "CAPITAL & REAL ESTATE",
    title: "Landmark Project Delivery",
    desc: "End-to-end execution of signature coastal towers, commercial districts, and urban infrastructure projects across Africa.",
    stat: "High-Rise Execution",
    badgeColor: "text-amber-500 border-amber-500/20 bg-amber-500/10",
  },
  {
    icon: Briefcase,
    tag: "INSTITUTIONAL CRM",
    title: "Strategic Capital & Deals",
    desc: "Centralized relationship ledger for global sovereign wealth, pension syndicates, and high-net-worth real estate investors.",
    stat: "Multi-Million Pipeline",
    badgeColor: "text-red-500 border-red-500/20 bg-red-500/10",
  },
  {
    icon: DollarSign,
    tag: "TREASURY & PROCUREMENT",
    title: "Financial Governance",
    desc: "Rigorous milestone budgeting, vendor disbursement authorizations, and real-time cashflow telemetry per development.",
    stat: "Zero-Leakage Fiscal Audit",
    badgeColor: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10",
  },
  {
    icon: Users,
    tag: "WORKFORCE LOGISTICS",
    title: "People & Field Operations",
    desc: "Internal employee records, verified vault contracts, shift logistics, and automated leave balance accounting.",
    stat: "Direct Internal Fleet",
    badgeColor: "text-blue-500 border-blue-500/20 bg-blue-500/10",
  },
];

export default function OperationsPortalLandingPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#080B10] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black overflow-x-hidden font-sans">
      {/* Top Operations Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-amber-500/20 bg-[#080B10]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <Link href="/ops" className="flex items-center shrink-0">
              <DextaLogo className="h-8 sm:h-9 w-auto" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-3">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase">
                ops.dextaafrica.org
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/crm-portal"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-medium text-slate-300 hover:text-white hover:border-amber-500/40 transition-colors"
            >
              <Briefcase className="h-3.5 w-3.5 text-amber-400" />
              <span>CRM Portal</span>
            </Link>

            <Link
              href="/admin-portal"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-medium text-slate-400 hover:text-white hover:border-white/20 transition-colors"
            >
              <span>Systems IT Portal &rarr;</span>
            </Link>

            <button
              type="button"
              onClick={() => router.push("/ops/login")}
              className="inline-flex items-center justify-center gap-2 h-10 rounded-xl px-4 sm:px-5 text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <LogIn className="h-4 w-4 shrink-0" />
              <span>Sign In to Ops</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/ops/register")}
              className="inline-flex items-center justify-center gap-2 h-10 rounded-xl px-4 sm:px-5 text-xs sm:text-sm font-bold border border-amber-500/40 bg-white/[0.04] text-white hover:bg-amber-500/10 hover:border-amber-500 transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="hidden sm:inline">Create Ops Profile</span>
              <span className="inline sm:hidden">Register</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Operations Hero Section */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-10 py-10 sm:py-16 space-y-16">
        {/* Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400">
                  Dexta Africa Enterprise Operations
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Subdomain: ops.dextaafrica.org
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[46px] font-extrabold tracking-tight text-white leading-[1.12]">
              Executing African Infrastructure, Capital &amp; Operations at Scale.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Welcome to the dedicated operations workspace. Coordinate landmark real estate deliveries, 
              institutional investor milestones, procurement treasury, and departmental logistics with zero guesswork.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                type="button"
                onClick={() => router.push("/ops/login")}
                className="inline-flex items-center justify-center gap-2 h-12 rounded-xl px-7 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xl shadow-amber-500/20 transition-all cursor-pointer"
              >
                <span>Enter Operations Desk</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => router.push("/ops/register")}
                className="inline-flex items-center justify-center gap-2 h-12 rounded-xl px-6 text-sm font-bold border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-white/30 transition-all cursor-pointer"
              >
                <UserPlus className="h-4 w-4 text-amber-400" />
                <span>Establish Team Profile</span>
              </button>
            </div>

            {/* Trust Indicator */}
            <div className="pt-2 flex items-center gap-3 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Authorized operations access with real-time database audit tracking.
              </span>
            </div>
          </div>

          {/* Right Visual: Industrial Operations Radar */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-amber-500/20 bg-[#0E131C] p-6 shadow-2xl relative overflow-hidden space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Operations Real-Time Radar</h3>
                    <p className="text-[11px] text-slate-400">Active Live Fleet &amp; Pipeline</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SYSTEM ONLINE
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Strategic Deals Pipeline</span>
                    <span className="font-bold text-amber-400 font-mono">Live Sync</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Connected to Prisma CRM deal pipeline &amp; investor accounts.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Landmark Developments</span>
                    <span className="font-bold text-emerald-400 font-mono">Go Core Synchronized</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Synchronized with core real estate portfolios &amp; milestone tracker.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Internal Vault &amp; People</span>
                    <span className="font-bold text-blue-400 font-mono">100% Paperless</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Employee compliance, contracts, and leave requests accounting.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span>Access Node: <strong>ops.dextaafrica.org</strong></span>
                <span className="font-mono">PORT 3000 / STANDALONE</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Operations Pillars Grid */}
        <div className="space-y-6 pt-4">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Operational Wings &amp; Departmental Engines
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Purpose-built operational suites connecting field engineers, capital directors, and executive leadership.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {OPERATIONS_PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="rounded-3xl border border-white/10 bg-[#0E131C]/80 p-6 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all hover:translate-y-[-2px]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={cn("text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border", p.badgeColor)}>
                        {p.stat}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                        {p.tag}
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">{p.title}</h3>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>

                  <Link
                    href="/ops/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 pt-2 border-t border-white/5"
                  >
                    <span>Launch Desk</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#05070A] py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <DextaLogo className="h-6 w-auto" />
            <span>&copy; {new Date().getFullYear()} Dexta Africa Enterprise Operations</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-xs">
            <Link href="/ops/login" className="hover:text-white">Ops Sign In</Link>
            <span>&bull;</span>
            <Link href="/ops/register" className="hover:text-white">Create Account</Link>
            <span>&bull;</span>
            <Link href="/admin-portal" className="hover:text-white">Systems Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

