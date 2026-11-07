"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  Sun,
  Moon,
  ShieldCheck,
  Lock,
  Cpu,
  Server,
  Terminal,
  Activity,
  KeyRound,
  Users,
  HardHat,
  Sparkles,
} from "lucide-react";
import { DextaLogo } from "@/components/ui/DextaLogo";
import { cn } from "@/lib/utils";

interface CommandSlide {
  image: string;
  name: string;
  role: string;
  department: string;
  summary: string;
  objectPosition: string;
}

const COMMAND_PORTRAITS: CommandSlide[] = [
  {
    image: "/images/team-dexta.jpg",
    name: "Enterprise IT & Systems Command",
    role: "Global Infrastructure Governance",
    department: "Systems & Security Operations",
    summary:
      "Administering zero-trust perimeter policies, distributed node clusters, and directory federation across African jurisdictions.",
    objectPosition: "50% 14%",
  },
  {
    image: "/images/olufemi-dexta.png",
    name: "Olufemi",
    role: "Chief Technology & Operations Officer",
    department: "Enterprise Architecture",
    summary:
      "Directing core transactional security, high-availability data infrastructure, and cryptographically signed audit registries.",
    objectPosition: "50% 15%",
  },
  {
    image: "/images/sadia-dexta.png",
    name: "Sadia",
    role: "Director of Identity & Compliance",
    department: "Governance & Access Assurance",
    summary:
      "Enforcing strict RBAC permissions, credential rotations, and end-to-end access governance for thousands of corporate operators.",
    objectPosition: "50% 16%",
  },
];

export default function AdminPortalLandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [zoomToggle, setZoomToggle] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setZoomToggle(true), 150);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % COMMAND_PORTRAITS.length);
      setZoomToggle((prev) => !prev);
    }, 8000);
    return () => clearInterval(timer);
  }, [activeSlide]);

  const currentSlide = COMMAND_PORTRAITS[activeSlide];

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#070A0F] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-[#ED2618] selection:text-white overflow-x-hidden transition-colors duration-200 relative">
      {/* Ambient Radial Lights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[650px] h-[380px] bg-red-600/[0.07] blur-[160px] rounded-full dark:opacity-100 opacity-20" />
        <div className="absolute top-1/2 -right-32 w-[550px] h-[350px] bg-slate-700/[0.06] blur-[150px] rounded-full dark:opacity-100 opacity-20" />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/[0.12] bg-white/95 dark:bg-[#0C0F17]/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center shrink-0">
              <DextaLogo className="h-8 sm:h-10 w-auto" />
            </Link>
            <div className="flex items-center gap-2 border-l border-slate-200 dark:border-white/10 pl-3">
              <span className="flex h-2 w-2 rounded-full bg-[#ED2618] animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase">
                admin.dextafrica.org
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200/90 dark:border-white/15 text-slate-600 hover:border-[#ED2618] hover:text-[#ED2618] dark:text-slate-300 dark:hover:border-[#ED2618] dark:hover:text-white transition-all cursor-pointer shrink-0"
                title="Toggle Theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}

            <Link
              href="/register"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#ED2618] dark:hover:text-white transition-colors"
            >
              <span>Request Admin Key</span>
            </Link>

            <Link
              href="/login"
              className="btn-crimson-exec h-9 sm:h-10 rounded-xl px-4 sm:px-6 text-xs sm:text-sm font-bold shadow-md shadow-red-500/20 hover:shadow-red-500/35 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Sign In to Command</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Welcome Showcase */}
      <main className="relative z-10 flex-1">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-12 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-200/90 dark:border-red-500/25 bg-red-50/90 dark:bg-red-500/10 px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-[#ED2618] animate-pulse" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#ED2618] dark:text-red-400">
                  Dexta Africa Systems Command
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[50px] font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
                Centralized Governance, Identity &amp; System Infrastructure.
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                The administrative and IT nerve center of Dexta Africa. Engineered to support thousands of
                concurrent staff sessions, cryptographic audit trails, zero-trust RBAC permissions, and real-time system monitoring.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  href="/login"
                  className="btn-crimson-exec h-12 rounded-xl px-7 text-sm font-bold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Access Systems Command</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/register"
                  className="h-12 rounded-xl px-7 text-sm font-bold border border-slate-200 dark:border-white/15 bg-white dark:bg-[#141722] hover:border-[#ED2618] text-slate-800 dark:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
                >
                  <KeyRound className="h-4 w-4 text-[#ED2618]" />
                  <span>Register IT Operator</span>
                </Link>
              </div>

              {/* High-Concurrency Trust Badges */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-200/80 dark:border-white/10">
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">FIPS 140-3</div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Crypto Standard</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">100%</div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Audit Coverage</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">RBAC + MFA</div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Zero-Trust Gate</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">Sub-ms</div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Session Check</div>
                </div>
              </div>
            </div>

            {/* Right Interactive Visual Carousel */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5] w-full rounded-3xl overflow-hidden border border-slate-200/90 dark:border-white/[0.14] bg-slate-900 shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.65)] dark:ring-1 dark:ring-white/[0.08]">
                <Image
                  src={currentSlide.image}
                  alt={currentSlide.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  priority
                  className={cn(
                    "object-cover transition-transform duration-[6000ms] ease-out",
                    zoomToggle ? "scale-105" : "scale-100"
                  )}
                  style={{ objectPosition: currentSlide.objectPosition }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />

                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-[11px] font-mono text-white">
                  <span className="h-2 w-2 rounded-full bg-[#ED2618] animate-pulse" />
                  <span>{currentSlide.department}</span>
                </div>

                <div className="absolute bottom-0 inset-x-0 p-6 z-20 text-white space-y-2">
                  <div className="inline-block px-2.5 py-0.5 rounded-md bg-[#ED2618] text-[10px] font-extrabold uppercase tracking-wider">
                    {currentSlide.role}
                  </div>
                  <h3 className="text-xl font-bold">{currentSlide.name}</h3>
                  <p className="text-xs text-slate-200/90 leading-relaxed max-w-sm line-clamp-3">
                    {currentSlide.summary}
                  </p>

                  <div className="pt-3 flex items-center justify-between border-t border-white/15">
                    <div className="flex items-center gap-1.5">
                      {COMMAND_PORTRAITS.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setActiveSlide(i);
                            setZoomToggle((prev) => !prev);
                          }}
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            activeSlide === i ? "w-8 bg-[#ED2618]" : "w-2 bg-white/40 hover:bg-white/70"
                          )}
                          aria-label={`Go to slide ${i + 1}`}
                        />
                      ))}
                    </div>

                    <span className="text-[11px] font-mono text-slate-300">
                      0{activeSlide + 1} / 0{COMMAND_PORTRAITS.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Systems Pillars Grid */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 pb-20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white">
              Enterprise Governance &amp; Scale Architecture
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Designed from first principles to enforce strict institutional compliance across thousands of operators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#11141E] shadow-sm hover:border-[#ED2618]/50 transition-all space-y-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-[#ED2618]">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Zero-Trust Directory</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Hardware-backed TOTP and cryptographic verification gates ensure authenticated identity at every boundary.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#11141E] shadow-sm hover:border-[#ED2618]/50 transition-all space-y-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-[#ED2618]">
                <Terminal className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Immutable Audit Trails</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Every permission escalation, session creation, and record modification is permanently logged with actor metadata.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#11141E] shadow-sm hover:border-[#ED2618]/50 transition-all space-y-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-[#ED2618]">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Inactivity Sentinel</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Adaptive idle timers instantly invalidate inactive tokens to safeguard unattended workstations in the field.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#11141E] shadow-sm hover:border-[#ED2618]/50 transition-all space-y-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-[#ED2618]">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Hierarchical RBAC</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Fine-grained division of power between Admin, Manager, and Field Officer roles across departmental domains.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#070A0F] py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Dexta Africa Enterprise Systems Command &bull; admin.dextafrica.org</p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-[#ED2618] transition-colors">
              Operator Sign In
            </Link>
            <Link href="/register" className="hover:text-[#ED2618] transition-colors">
              Access Request
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
