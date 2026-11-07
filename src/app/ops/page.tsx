"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  Building2,
  HardHat,
  ShieldCheck,
  Lock,
  Layers,
  Activity,
  DollarSign,
  Users,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import { DextaLogo } from "@/components/ui/DextaLogo";
import { cn } from "@/lib/utils";

interface FleetSlide {
  image: string;
  name: string;
  role: string;
  department: string;
  summary: string;
  objectPosition: string;
}

const FLEET_PORTRAITS: FleetSlide[] = [
  {
    image: "/images/team-dexta.jpg",
    name: "Dexta Operations Fleet",
    role: "Field & Executive Operations",
    department: "Enterprise Operations",
    summary:
      "Coordinating landmark real estate deliveries, infrastructure logistics, and contractor execution across Africa.",
    objectPosition: "50% 14%",
  },
  {
    image: "/images/olufemi-dexta.png",
    name: "Olufemi",
    role: "Director of Infrastructure Delivery",
    department: "Operations Directorate",
    summary:
      "Overseeing site milestones, high-value procurement approvals, and rigorous engineering compliance.",
    objectPosition: "50% 15%",
  },
  {
    image: "/images/sadia-dexta.png",
    name: "Sadia",
    role: "Head of Project Operations & Logistics",
    department: "Logistics & Clearance",
    summary:
      "Managing inter-directorate clearances, partner communications, and continuous timeline tracking.",
    objectPosition: "50% 16%",
  },
];

export default function OperationsLandingPage() {
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
      setActiveSlide((prev) => (prev + 1) % FLEET_PORTRAITS.length);
      setZoomToggle((prev) => !prev);
    }, 8000);
    return () => clearInterval(timer);
  }, [activeSlide]);

  const currentFleet = FLEET_PORTRAITS[activeSlide];

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#070A0F] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-[#ED2618] selection:text-white overflow-x-hidden transition-colors duration-200 relative">
      {/* Ambient Radial Lights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[650px] h-[380px] bg-red-600/[0.07] blur-[160px] rounded-full dark:opacity-100 opacity-20" />
        <div className="absolute top-1/2 -right-32 w-[550px] h-[350px] bg-slate-700/[0.06] blur-[150px] rounded-full dark:opacity-100 opacity-20" />
      </div>

      {/* Top Navigation Bar - Ultra-Clean, Responsive & Spacious */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/[0.12] bg-white/95 dark:bg-[#0C0F17]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center shrink-0">
              <DextaLogo className="h-7 sm:h-9 w-auto" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 dark:border-white/10 pl-3">
              <span className="flex h-2 w-2 rounded-full bg-[#ED2618] animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase">
                ops.dextaafrica.org
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3.5">
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
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#ED2618] dark:hover:text-white transition-colors"
            >
              <span>Create Profile</span>
            </Link>

            <Link
              href="/login"
              className="btn-crimson-exec h-9 sm:h-10 rounded-xl px-3.5 sm:px-5 text-xs sm:text-sm font-bold shadow-md shadow-red-500/20 hover:shadow-red-500/35 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Sign In</span>
              <span className="hidden sm:inline">to Desk</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Welcome Showcase - Perfectly Engineered for Mobile & Desktop */}
      <main className="relative z-10 flex-1 flex items-center">
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 py-6 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-200/90 dark:border-red-500/25 bg-red-50/90 dark:bg-red-500/10 px-3.5 py-1 animate-fade-in">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ED2618] animate-pulse" />
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#ED2618] dark:text-red-400">
                  Dexta Africa Enterprise Operations
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-[46px] font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.18] animate-reveal-up">
                Executing{" "}
                <span className="italic font-serif font-black tracking-tight bg-gradient-to-r from-[#ED2618] via-rose-500 to-amber-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-text-shimmer drop-shadow-sm inline-block">
                  Landmark Infrastructure
                </span>
                ,{" "}
                <span className="italic font-bold bg-gradient-to-r from-slate-900 via-red-600 to-slate-900 dark:from-white dark:via-rose-400 dark:to-white bg-clip-text text-transparent bg-[length:200%_auto] animate-text-shimmer inline-block">
                  Capital &amp; Field Deliveries.
                </span>
              </h1>

              <p className="text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl animate-fade-in delay-100">
                The unified operations desk for Dexta Africa. Engineered for infrastructure directors, contractor engineers, procurement officers, and institutional partners coordinating ground milestones with zero latency.
              </p>

              {/* Action Buttons - Side by Side on Mobile & Desktop to Save Space */}
              <div className="pt-1 grid grid-cols-2 gap-2.5 sm:flex sm:flex-row sm:items-center sm:gap-4 animate-fade-in delay-200">
                <Link
                  href="/login"
                  className="btn-crimson-exec h-11 sm:h-12 rounded-xl px-4 sm:px-7 text-xs sm:text-sm font-bold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer text-center"
                >
                  <HardHat className="h-3.5 w-3.5 shrink-0" />
                  <span>Access Desk</span>
                  <ArrowRight className="h-3.5 w-3.5 hidden sm:inline" />
                </Link>

                <Link
                  href="/register"
                  className="h-11 sm:h-12 rounded-xl px-4 sm:px-7 text-xs sm:text-sm font-bold border border-slate-200 dark:border-white/15 bg-white dark:bg-[#141722] hover:border-[#ED2618] text-slate-800 dark:text-white transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-sm hover:shadow-md text-center"
                >
                  <Users className="h-3.5 w-3.5 text-[#ED2618] shrink-0" />
                  <span>Create Profile</span>
                </Link>
              </div>

              {/* Trust & Scale Highlights - Ultra-Crisp Mobile Grid */}
              <div className="pt-4 sm:pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 border-t border-slate-200/80 dark:border-white/10 animate-fade-in delay-300">
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    24/7
                  </div>
                  <div className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 leading-snug">
                    Always Online
                  </div>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="text-lg sm:text-2xl font-extrabold text-[#ED2618] tracking-tight">
                    Live
                  </div>
                  <div className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 leading-snug">
                    Milestone Tracking
                  </div>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Secured
                  </div>
                  <div className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 leading-snug">
                    Two-Step Verification
                  </div>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Tailored
                  </div>
                  <div className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 leading-snug">
                    Role-Based Access
                  </div>
                </div>
              </div>
            </div>

            {/* Right Interactive Visual Carousel - Wider & Diagonal Curvy Showcase */}
            <div className="lg:col-span-6 relative w-full pt-2 lg:pt-0">
              <div className="relative aspect-[16/10] sm:aspect-[4/3] lg:aspect-[5/4] w-full overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] rounded-tr-[4rem] sm:rounded-tr-[5.5rem] rounded-bl-[3rem] sm:rounded-bl-[4.5rem] border border-slate-200/90 dark:border-white/[0.16] bg-slate-950 shadow-2xl dark:shadow-[0_24px_60px_rgba(0,0,0,0.85)] dark:ring-1 dark:ring-white/[0.1]">
                {/* Slant-Curvy Architectural Accent Waves */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-red-500/20 via-transparent to-transparent rounded-bl-[100px] pointer-events-none z-20" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-red-500/10 via-transparent to-transparent rounded-tr-[80px] pointer-events-none z-20" />

                {/* Smooth Cross-Fade Image Slides */}
                {FLEET_PORTRAITS.map((slide, index) => {
                  const isActive = index === activeSlide;
                  return (
                    <div
                      key={slide.image}
                      className={cn(
                        "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                        isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                      )}
                    >
                      <Image
                        src={slide.image}
                        alt={slide.name}
                        fill
                        priority={index === 0}
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className={cn(
                          "object-cover transition-transform duration-[7000ms] ease-out will-change-transform",
                          isActive && zoomToggle ? "scale-105" : "scale-100"
                        )}
                        style={{ objectPosition: slide.objectPosition }}
                      />
                    </div>
                  );
                })}

                {/* Soft Bottom-Only Gradient for Controls Legibility */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none z-20" />

                {/* Modest Bottom Controls & Subtle Identity */}
                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 z-30 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ED2618] animate-pulse" />
                    <span className="text-xs sm:text-sm font-semibold tracking-wide text-white/95">
                      {currentFleet.name}
                    </span>
                  </div>

                  {/* Clean Indicators & Subtle Arrows */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5">
                      {FLEET_PORTRAITS.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setActiveSlide(i);
                            setZoomToggle((prev) => !prev);
                          }}
                          className={cn(
                            "h-1.5 rounded-full transition-all cursor-pointer",
                            activeSlide === i ? "w-5 bg-[#ED2618]" : "w-1.5 bg-white/40 hover:bg-white/70"
                          )}
                          title={`Slide ${i + 1}`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSlide((prev) => (prev - 1 + FLEET_PORTRAITS.length) % FLEET_PORTRAITS.length);
                          setZoomToggle((prev) => !prev);
                        }}
                        className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
                        title="Previous"
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSlide((prev) => (prev + 1) % FLEET_PORTRAITS.length);
                          setZoomToggle((prev) => !prev);
                        }}
                        className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
                        title="Next"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#070A0F] py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Dexta Africa Enterprise Operations &bull; ops.dextaafrica.org</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/login" className="hover:text-[#ED2618] transition-colors">Sign In</Link>
            <span>&bull;</span>
            <Link href="/register" className="hover:text-[#ED2618] transition-colors">Create Profile</Link>
            <span>&bull;</span>
            <span className="text-slate-400">Zero-Trust Protected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
