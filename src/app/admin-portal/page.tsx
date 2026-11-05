"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  HardDrive,
  Globe,
  Lock,
  ArrowRight,
  LogIn,
  Fingerprint,
  Terminal,
  Activity,
  Server,
  Sparkles,
  RefreshCw,
  Cpu,
} from "lucide-react";
import { DextaLogo } from "@/components/ui/DextaLogo";
import { cn } from "@/lib/utils";

const IT_SYSTEMS_PILLARS = [
  {
    icon: ShieldCheck,
    tag: "ACCESS & IDENTITY",
    title: "Zero-Trust Governance",
    desc: "Strict Role-Based Access Control (RBAC), multi-factor authenticator enforcement, session revoking, and hardware key policies.",
    status: "ENFORCED",
    badgeColor: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  },
  {
    icon: ShieldAlert,
    tag: "WATCHDOG DEFENSE",
    title: "Threat & Intrusion Monitor",
    desc: "Automated perimeter anomaly detection, brute-force defense shields, and real-time security policy alert incident escalation.",
    status: "ACTIVE 24/7",
    badgeColor: "text-red-400 border-red-500/20 bg-red-500/10",
  },
  {
    icon: HardDrive,
    tag: "STORAGE VAULT",
    title: "Enterprise S3 Cloud Storage",
    desc: "Cryptographically signed presigned upload conduits, isolated directory hierarchies, and media CDN distribution.",
    status: "ENCRYPTED",
    badgeColor: "text-sky-400 border-sky-500/20 bg-sky-500/10",
  },
  {
    icon: Globe,
    tag: "CORE CMS & APIS",
    title: "Web Engine & Gateways",
    desc: "Direct synchronization with Go Core Backend microservices, on-demand edge cache revalidation, and API endpoint telemetry.",
    status: "SYNCED",
    badgeColor: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  },
];

export default function AdminSystemsPortalLandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 flex flex-col justify-between selection:bg-[#ED2618] selection:text-white overflow-x-hidden font-mono">
      {/* Top IT Systems Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-red-500/20 bg-[#050508]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <Link href="/admin-portal" className="flex items-center shrink-0">
              <DextaLogo className="h-8 sm:h-9 w-auto" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-3">
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-mono font-bold tracking-wider text-red-500 uppercase">
                admin.dextafrica.org
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 font-sans">
            <Link
              href="/ops"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-medium text-slate-400 hover:text-white hover:border-white/20 transition-colors"
            >
              <span>Operations Portal &rarr;</span>
            </Link>

            <button
              type="button"
              onClick={() => router.push("/admin-portal/login")}
              className="inline-flex items-center justify-center gap-2 h-10 rounded-xl px-4 sm:px-5 text-xs sm:text-sm font-bold bg-[#ED2618] hover:bg-[#d02013] text-white transition-all shadow-lg shadow-red-500/20 cursor-pointer"
            >
              <Lock className="h-4 w-4 shrink-0" />
              <span>Authenticate</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin-portal/register")}
              className="inline-flex items-center justify-center gap-2 h-10 rounded-xl px-4 sm:px-5 text-xs sm:text-sm font-bold border border-red-500/40 bg-white/[0.04] text-white hover:bg-red-500/10 hover:border-red-500 transition-all cursor-pointer"
            >
              <KeyRound className="h-4 w-4 shrink-0 text-red-400" />
              <span className="hidden sm:inline">Activate Key</span>
              <span className="inline sm:hidden">Activate</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main IT Systems Hero */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-10 py-10 sm:py-16 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6 font-sans">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-red-500 font-mono">
                  Systems &amp; Web Infrastructure Command
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Subdomain: admin.dextafrica.org
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[46px] font-extrabold tracking-tight text-white leading-[1.12]">
              Zero-Trust IT Governance, Web Core CMS &amp; Cloud Infrastructure.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Centralized administrative console governing web editorial schemas, AWS S3 storage vaults, 
              security policy watchdog alerts, and cryptographic access key provisioning.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                type="button"
                onClick={() => router.push("/admin-portal/login")}
                className="inline-flex items-center justify-center gap-2 h-12 rounded-xl px-7 text-sm font-bold bg-[#ED2618] hover:bg-[#d02013] text-white shadow-xl shadow-red-500/25 transition-all cursor-pointer font-sans"
              >
                <span>Authenticate to Command</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => router.push("/admin-portal/register")}
                className="inline-flex items-center justify-center gap-2 h-12 rounded-xl px-6 text-sm font-bold border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-white/30 transition-all cursor-pointer font-sans"
              >
                <KeyRound className="h-4 w-4 text-red-400" />
                <span>Activate IT-Issued Key</span>
              </button>
            </div>

            <div className="pt-2 flex items-center gap-3 text-xs text-slate-400 font-mono">
              <Fingerprint className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>NIST-Aligned Password Entropy &bull; Mandatory 2FA Support</span>
            </div>
          </div>

          {/* Right Visual: Cyber Security Console Terminal */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-red-500/25 bg-[#090A0F] p-6 shadow-2xl relative overflow-hidden space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-red-400" />
                  <span className="font-bold text-white tracking-wider">SYSTEMS WATCHDOG</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  SHIELD ACTIVE
                </div>
              </div>

              <div className="space-y-2.5 text-slate-300 font-mono text-[11px]">
                <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-1">
                  <span className="text-slate-500 text-[10px]"># Zero-Trust Policy Matrix</span>
                  <p className="text-emerald-400">STATUS: ENFORCING_MFA &amp; RBAC_ROLES</p>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-1">
                  <span className="text-slate-500 text-[10px]"># Go Core Backend Link</span>
                  <p className="text-sky-400">ENDPOINT: BACKEND_API_URL / 8080</p>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-1">
                  <span className="text-slate-500 text-[10px]"># Cloud Asset Vault Quota</span>
                  <p className="text-amber-400">STORAGE: AWS_S3_BUCKET / PRIVATE_CONDUIT</p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500">
                <span>Domain: <strong>admin.dextafrica.org</strong></span>
                <span>SHA-256 JWT AUTH</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Systems Pillars */}
        <div className="space-y-6 pt-4 font-sans">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Systems Infrastructure &amp; Security Controls
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
              Core technical backplanes maintaining absolute data integrity and regulatory security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {IT_SYSTEMS_PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="rounded-3xl border border-white/10 bg-[#090A0F]/90 p-6 flex flex-col justify-between space-y-4 hover:border-red-500/40 transition-all hover:translate-y-[-2px]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={cn("text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border", p.badgeColor)}>
                        {p.status}
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
                    href="/admin-portal/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 pt-2 border-t border-white/5"
                  >
                    <span>Authenticate Console</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#030305] py-8 text-center text-xs text-slate-500 font-sans">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <DextaLogo className="h-6 w-auto" />
            <span>&copy; {new Date().getFullYear()} Dexta Africa Systems &amp; Web Infrastructure Command</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-xs">
            <Link href="/admin-portal/login" className="hover:text-white">Systems Sign In</Link>
            <span>&bull;</span>
            <Link href="/admin-portal/register" className="hover:text-white">Activate Key</Link>
            <span>&bull;</span>
            <Link href="/ops" className="hover:text-white">Operations Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

