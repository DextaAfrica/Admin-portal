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
} from "lucide-react";
import { DextaLogo } from "@/components/ui/DextaLogo";
import { Button } from "@/components/ui/Button";
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
    zoomMin: 1.08,
    zoomMax: 1.18,
  },
  {
    image: "/images/olufemi-dexta.png",
    name: "Olufemi",
    title: "Executive Leadership",
    summary:
      "Guiding strategic growth, project standards, and corporate governance across every Dexta Africa initiative.",
    objectPosition: "50% 15%",
    zoomMin: 1.14,
    zoomMax: 1.25,
  },
  {
    image: "/images/sadia-dexta.png",
    name: "Sadia",
    title: "Client Relations & Operations",
    summary:
      "Leading partner engagement, stakeholder communication, and seamless day-to-day operational delivery.",
    objectPosition: "50% 16%",
    zoomMin: 1.16,
    zoomMax: 1.28,
  },
];

const CORE_CAPABILITIES = [
  {
    number: "01",
    icon: Building2,
    title: "Project Development & Execution",
    description:
      "Delivering modern infrastructure and real estate initiatives with disciplined planning, quality control, and lasting impact.",
  },
  {
    number: "02",
    icon: Users,
    title: "Client & Partner Relations",
    description:
      "Building trusted relationships through transparent communication, dedicated support, and consistent service delivery.",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Corporate Governance & Workspace",
    description:
      "Centralized management for company documents, client outreach, team permissions, and verified two-step account protection.",
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
    }, 9500);
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
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-[#ED2618] selection:text-white overflow-x-hidden">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link href="/" className="flex items-center">
            <DextaLogo className="h-9 sm:h-10 w-auto" />
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors"
                title="Switch appearance"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            )}

            <Link href="/register">
              <Button
                variant="ghost"
                size="sm"
                className="font-semibold text-xs sm:text-sm"
              >
                Create Account
              </Button>
            </Link>

            <Link href="/login">
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                className="font-bold px-5"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 lg:px-10 py-12 lg:py-16 space-y-16">
        {/* Section 1: Hero & Portrait Showcase */}
        <div className="grid w-full grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Column: Structured Corporate Overview */}
          <div className="lg:col-span-5 space-y-6 animate-reveal-up">
            <div className="flex items-center gap-3">
              <span className="h-[2px] w-8 bg-[#ED2618]" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#ED2618]">
                Dexta Africa
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.1]">
              Shaping Modern Development &amp; Operations Across Africa.
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Dexta Africa combines experienced leadership, disciplined project
              delivery, and dedicated client service. Sign in to our official
              management portal to oversee company files, client communications,
              and team operations.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  className="w-full sm:w-auto font-bold px-7 shadow-lg shadow-red-500/20"
                >
                  Enter Workspace
                </Button>
              </Link>

              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto font-semibold px-6"
                >
                  Create Team Account
                </Button>
              </Link>
            </div>

            {/* Active Slide Details Card (Outside the Image so the Portrait Stays Clean) */}
            <div
              key={`detail-${activeSlide}`}
              className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-5 shadow-sm animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#ED2618]">
                    {PORTRAITS[activeSlide].title}
                  </p>
                  <h2 className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                    {PORTRAITS[activeSlide].name}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={prevSlide}
                    aria-label="Previous slide"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-[#ED2618] hover:text-[#ED2618] transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Next slide"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-[#ED2618] hover:text-[#ED2618] transition-colors"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {PORTRAITS[activeSlide].summary}
              </p>
            </div>
          </div>

          {/* Right Column: Clean, Unobstructed Portrait Canvas */}
          <div className="lg:col-span-7 animate-reveal-up delay-100">
            <div className="relative aspect-[4/4] sm:aspect-[16/11] w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-950 shadow-xl">
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
                      "absolute inset-0 transition-opacity duration-[1600ms] ease-in-out",
                      isActive
                        ? "opacity-100 z-10"
                        : "opacity-0 z-0 pointer-events-none"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slide.image}
                      alt={slide.name}
                      className="h-full w-full object-cover transition-transform duration-[10000ms] ease-in-out will-change-transform"
                      style={{
                        objectPosition: slide.objectPosition,
                        transform: `scale(${scaleValue})`,
                      }}
                    />
                  </div>
                );
              })}

              {/* Minimal Slide Counter Pill in Bottom Corner */}
              <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white border border-white/15">
                <span>0{activeSlide + 1}</span>
                <span className="text-white/40">/</span>
                <span className="text-white/70">0{PORTRAITS.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Structured 3-Column Capabilities Grid */}
        <section className="pt-8 border-t border-slate-200/80 dark:border-white/[0.08]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CORE_CAPABILITIES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.number}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-[#ED2618]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-300 dark:text-slate-600">
                        {item.number}
                      </span>
                    </div>

                    <h3 className="mt-5 text-base font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Clean Corporate Footer */}
      <footer className="border-t border-slate-200/70 dark:border-white/[0.07] bg-white dark:bg-[#09090b]">
        <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl px-6 lg:px-10 py-5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <DextaLogo className="h-6 w-auto" />
            <span>
              &copy; {new Date().getFullYear()} Dexta Africa. All rights
              reserved.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="hover:text-[#ED2618] transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="hover:text-[#ED2618] transition-colors font-medium"
            >
              Create Account
            </Link>
            <Link
              href="/dashboard"
              className="hover:text-[#ED2618] transition-colors font-medium"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
