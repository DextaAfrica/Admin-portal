"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  Building2,
  Users,
  ShieldCheck,
  LogIn,
  UserPlus,
  LayoutDashboard,
} from "lucide-react";
import { DextaLogo } from "@/components/ui/DextaLogo";
import { cn } from "@/lib/utils";

interface PortraitSlide {
  image: string;
  name: string;
  title: string;
  summary: string;
  objectPosition: string;
  zoomMin: number;
  zoomMax: number;
}

const PORTRAITS: PortraitSlide[] = [
  {
    image: "/images/team-dexta.jpg",
    name: "Dexta Africa Leadership",
    title: "Executive Team",
    summary:
      "Committed to high-integrity development, operational excellence, and long-term value across Africa.",
    objectPosition: "50% 14%",
    zoomMin: 1.06,
    zoomMax: 1.15,
  },
  {
    image: "/images/olufemi-dexta.png",
    name: "Olufemi",
    title: "Executive Leadership",
    summary:
      "Guiding strategic growth, project standards, and corporate excellence across every Dexta Africa initiative.",
    objectPosition: "50% 15%",
    zoomMin: 1.1,
    zoomMax: 1.2,
  },
  {
    image: "/images/sadia-dexta.png",
    name: "Sadia",
    title: "Client Relations & Operations",
    summary:
      "Ensuring every project, conversation, and milestone is handled with warmth, clarity, and attention to detail.",
    objectPosition: "50% 16%",
    zoomMin: 1.12,
    zoomMax: 1.22,
  },
];

const CORE_PILLARS = [
  {
    icon: Building2,
    title: "Project Excellence",
    description:
      "Delivering modern infrastructure and real estate developments with disciplined planning and lasting quality.",
  },
  {
    icon: Users,
    title: "Client Experience",
    description:
      "Building trusted relationships through transparent communication, dedicated support, and warm service.",
  },
  {
    icon: ShieldCheck,
    title: "Unified Workspace",
    description:
      "One organized home for company media, branded client emails, team collaboration, and account protection.",
  },
];

export default function LandingPage() {
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [zoomToggle, setZoomToggle] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setZoomToggle(true), 120);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % PORTRAITS.length);
      setZoomToggle((prev) => !prev);
    }, 9000);
    return () => clearInterval(timer);
  }, [activeSlide]);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % PORTRAITS.length);
    setZoomToggle((prev) => !prev);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + PORTRAITS.length) % PORTRAITS.length);
    setZoomToggle((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-[#ED2618] selection:text-white overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/" className="flex items-center shrink-0">
            <DextaLogo className="h-8 sm:h-10 w-auto" />
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 dark:border-white/10 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white transition-all cursor-pointer"
                title="Switch appearance"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            )}

            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.05] px-4 sm:px-5 text-xs sm:text-sm font-bold text-slate-800 dark:text-white hover:border-[#ED2618] hover:text-[#ED2618] dark:hover:border-[#ED2618] transition-all shadow-sm"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>

            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#ED2618] hover:bg-red-700 px-4 sm:px-5 text-xs sm:text-sm font-bold text-white shadow-md shadow-red-600/20 hover:shadow-lg hover:shadow-red-600/30 transition-all"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-10 py-10 sm:py-14 lg:py-16 space-y-14 lg:space-y-16">
        {/* Hero Split Section */}
        <div className="grid w-full grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Clean Executive Introduction */}
          <div className="lg:col-span-5 space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-red-200/80 dark:border-red-500/25 bg-red-50/80 dark:bg-red-500/10 px-3.5 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[#ED2618]" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#ED2618] dark:text-red-400">
                Dexta Africa Workspace
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
              Putting People, Quality &amp; Partnerships First.
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Welcome to the official Dexta Africa portal. Manage project documents,
              design branded client communications, and coordinate with your team in
              one simple, organized workspace.
            </p>

            {/* Primary & Secondary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-[#ED2618] hover:bg-red-700 px-7 text-sm sm:text-base font-bold text-white shadow-lg shadow-red-600/20 hover:shadow-xl hover:shadow-red-600/30 transition-all hover:-translate-y-0.5"
              >
                <span>Sign In to Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 dark:border-white/15 bg-white dark:bg-[#14151C] hover:border-[#ED2618] hover:text-[#ED2618] dark:hover:border-red-500 px-6 text-sm sm:text-base font-bold text-slate-800 dark:text-white transition-all shadow-sm"
              >
                <UserPlus className="h-4 w-4 text-[#ED2618]" />
                <span>Create Team Account</span>
              </Link>
            </div>

            {/* Clean Quick-Access Link to Dashboard if already signed in */}
            <div className="pt-2 flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 hover:text-[#ED2618] transition-colors"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-[#ED2618]" />
                <span>Go directly to Dashboard →</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Cinematic Portrait Showcase with Docked Caption Bar */}
          <div className="lg:col-span-7 animate-fade-in delay-100">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/10 bg-slate-950 shadow-2xl">
              {PORTRAITS.map((slide, index) => {
                const isActive = index === activeSlide;
                const scaleValue = isActive
                  ? zoomToggle
                    ? slide.zoomMax
                    : slide.zoomMin
                  : slide.zoomMin;

                return (
                  <div
                    key={slide.image}
                    className={cn(
                      "absolute inset-0 transition-opacity duration-[1400ms] ease-in-out",
                      isActive
                        ? "opacity-100 z-10"
                        : "opacity-0 z-0 pointer-events-none"
                    )}
                  >
                    <img
                      src={slide.image}
                      alt={slide.name}
                      className="h-full w-full object-cover transition-transform duration-[9500ms] ease-out will-change-transform"
                      style={{
                        objectPosition: slide.objectPosition,
                        transform: `scale(${scaleValue})`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                  </div>
                );
              })}

              {/* Integrated Bottom Caption & Slider Controls inside Portrait Frame */}
              <div className="absolute bottom-0 inset-x-0 z-20 p-5 sm:p-7 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1 max-w-lg">
                  <span className="inline-block rounded-full bg-[#ED2618] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white">
                    {PORTRAITS[activeSlide].title}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {PORTRAITS[activeSlide].name}
                  </h2>
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed line-clamp-2">
                    {PORTRAITS[activeSlide].summary}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={prevSlide}
                    aria-label="Previous portrait"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-[#ED2618] hover:border-[#ED2618] transition-all cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Next portrait"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-[#ED2618] hover:border-[#ED2618] transition-all cursor-pointer"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clean 3-Column Pillars Strip */}
        <section className="pt-8 border-t border-slate-200/80 dark:border-white/[0.08]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CORE_PILLARS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121318] p-6 shadow-sm hover:border-red-500/30 transition-all"
                >
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-[#ED2618]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
