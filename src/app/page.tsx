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
  FileText,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";
import { DextaLogo } from "@/components/ui/DextaLogo";
import { navigateToSubdomainWithSso } from "@/lib/routing";
import { cn } from "@/lib/utils";

interface PortraitSlide {
  image: string;
  name: string;
  title: string;
  summary: string;
  objectPosition: string;
}

const PORTRAITS: PortraitSlide[] = [
  {
    image: "/images/team-dexta.jpg",
    name: "Dexta Africa Leadership",
    title: "Executive Team",
    summary:
      "Guiding high-integrity capital projects, physical infrastructure delivery, and operational excellence across Africa.",
    objectPosition: "50% 14%",
  },
  {
    image: "/images/olufemi-dexta.png",
    name: "Olufemi",
    title: "Infrastructure Delivery",
    summary:
      "Directing ground execution schedules, contractor mobilization, and strict civil engineering standards.",
    objectPosition: "50% 15%",
  },
  {
    image: "/images/sadia-dexta.png",
    name: "Sadia",
    title: "Operations & Logistics",
    summary:
      "Ensuring coordinated site communications, material procurement logistics, and verified milestone turnarounds.",
    objectPosition: "50% 16%",
  },
];

export default function LandingPage() {
  const [activeSlide, setActiveSlide] = React.useState(0);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % PORTRAITS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [activeSlide]);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % PORTRAITS.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + PORTRAITS.length) % PORTRAITS.length);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#070A0F] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-[#ED2618] selection:text-white transition-colors duration-200">
      {/* Clean Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#0C0F17]/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center shrink-0">
              <DextaLogo className="h-7 sm:h-9 w-auto" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 dark:border-white/10 pl-3">
              <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                Operations &amp; Infrastructure
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Appearance Toggle */}
            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 hover:border-[#ED2618] hover:text-[#ED2618] dark:text-slate-300 dark:hover:border-[#ED2618] dark:hover:text-white transition-all cursor-pointer shrink-0"
                title="Switch light or dark appearance"
                aria-label="Toggle appearance theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            )}

            {/* Single Primary Action: Sign In / Access Workspace */}
            <button
              type="button"
              onClick={() => navigateToSubdomainWithSso("ops", "/dashboard")}
              className="btn-crimson-exec h-10 rounded-xl px-5 sm:px-6 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Value Proposition */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-10 py-12 sm:py-16 flex flex-col justify-center">
        <div className="grid w-full grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Focused Executive Copy & Primary Access */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200/80 dark:border-red-500/20 bg-red-50/80 dark:bg-red-500/10 px-3.5 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[#ED2618]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ED2618] dark:text-red-400">
                Dexta Africa &bull; Enterprise Operations
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.15]">
              Delivering Africa&apos;s Landmark Infrastructure &amp; Capital Projects.
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              The centralized operational workspace for Dexta Africa. Seamlessly coordinate
              ground mobilization, site milestones, daily field reporting, and contractor
              clearances with total clarity and accountability.
            </p>

            {/* Primary Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                type="button"
                onClick={() => navigateToSubdomainWithSso("ops", "/dashboard")}
                className="btn-crimson-exec h-12 px-7 rounded-xl text-sm font-bold flex items-center gap-2.5 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 cursor-pointer transition-all"
              >
                <Building2 className="h-4 w-4" />
                <span>Access Operations Portal</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>

              <button
                type="button"
                onClick={() => navigateToSubdomainWithSso("admin", "/dashboard")}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>IT Administrator Access</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Structured Value Indicators */}
            <div className="pt-6 border-t border-slate-200/80 dark:border-white/[0.08] grid grid-cols-3 gap-4">
              <div>
                <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white block">
                  Ground Delivery
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Site milestones &amp; engineering
                </span>
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white block">
                  Field Dossiers
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Daily logs &amp; executive reports
                </span>
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white block">
                  Clearances
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Multi-tier authorizations
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean, High-End Leadership Carousel */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/10 bg-slate-950 shadow-2xl">
              {PORTRAITS.map((slide, index) => {
                const isActive = index === activeSlide;

                return (
                  <div
                    key={slide.image}
                    className={cn(
                      "absolute inset-0 transition-opacity duration-700 ease-in-out",
                      isActive
                        ? "opacity-100 z-10"
                        : "opacity-0 z-0 pointer-events-none"
                    )}
                  >
                    <Image
                      src={slide.image}
                      alt={slide.name}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                      style={{
                        objectPosition: slide.objectPosition,
                      }}
                    />
                    {/* Subtle, Natural Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                  </div>
                );
              })}

              {/* Slide Caption & Minimalist Controls */}
              <div className="absolute bottom-0 inset-x-0 z-20 p-6 sm:p-8 flex items-end justify-between gap-4">
                <div className="space-y-1.5 max-w-md">
                  <span className="inline-block rounded-full bg-[#ED2618] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                    {PORTRAITS[activeSlide].title}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {PORTRAITS[activeSlide].name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed line-clamp-2">
                    {PORTRAITS[activeSlide].summary}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={prevSlide}
                    aria-label="Previous portrait"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-[#ED2618] hover:border-[#ED2618] transition-all cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Next portrait"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-[#ED2618] hover:border-[#ED2618] transition-all cursor-pointer"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Pillar Operational Highlights Grid */}
        <div className="mt-16 sm:mt-24 pt-12 border-t border-slate-200/80 dark:border-white/[0.08]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-3">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 text-[#ED2618] flex items-center justify-center">
                <HardHat className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Site &amp; Ground Infrastructure
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Track active development corridors, contractor squads, and physical delivery
                progress across every milestone from ground mobilization to final commissioning.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Daily Field Reports &amp; Dossiers
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Generate structured operations summaries, site photo evidence logs, and
                work breakdown matrices ready for line manager review and publication-grade export.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Inter-Department Clearances
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Seamless approval routing for field requisitions, contractor disbursements, and
                management sign-offs between Operations, Finance, and Executive leadership.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Minimalist Corporate Footer */}
      <footer className="border-t border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#09090B] py-6 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <DextaLogo className="h-5 w-auto" />
            <span>&copy; {new Date().getFullYear()} Dexta Africa Enterprise &bull; Operations &amp; Infrastructure</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => navigateToSubdomainWithSso("ops", "/dashboard")}
              className="text-slate-600 dark:text-slate-400 hover:text-[#ED2618] transition-colors cursor-pointer"
            >
              Operations Desk
            </button>
            <button
              type="button"
              onClick={() => navigateToSubdomainWithSso("admin", "/dashboard")}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Systems IT
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
