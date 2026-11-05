"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  Building2,
  ShieldCheck,
  Lock,
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

export default function LandingPage() {
  const router = useRouter();
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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-[#ED2618] selection:text-white overflow-x-hidden transition-colors duration-200">
      {/* Top Navigation Bar - Minimalist, Professional, Clean Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center shrink-0">
              <DextaLogo className="h-7 sm:h-10 w-auto" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 dark:border-white/10 pl-3">
              <span className="flex h-2 w-2 rounded-full bg-[#ED2618] animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase">
                dextafrica.org
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3.5">
            {/* Light / Dark Mode Toggle */}
            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200/90 dark:border-white/15 text-slate-600 hover:border-[#ED2618] hover:text-[#ED2618] dark:text-slate-300 dark:hover:border-[#ED2618] dark:hover:text-white transition-all cursor-pointer shrink-0"
                title="Switch light or dark appearance"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            )}

            {/* Direct Quick Launch into Operations */}
            <button
              type="button"
              onClick={() => router.push("/ops")}
              className="btn-crimson-exec h-9 sm:h-10 rounded-xl px-4 sm:px-6 text-xs sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span>Operations Desk</span>
            </button>

            {/* Direct Quick Launch into Systems IT */}
            <button
              type="button"
              onClick={() => router.push("/admin-portal")}
              className="btn-fill-up h-9 sm:h-10 rounded-xl px-4 sm:px-6 text-xs sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#ED2618] transition-colors" />
              <span className="hidden sm:inline">Systems Command</span>
              <span className="inline sm:hidden">IT Command</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Single-Viewport Hero Section (Direct Gateway + Slant-Curvy Visual) */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-10 py-10 sm:py-16 flex items-center">
        <div className="grid w-full grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Focused Executive Gateway Selection */}
          <div className="lg:col-span-6 space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200/90 dark:border-red-500/25 bg-red-50/90 dark:bg-red-500/10 px-3.5 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[#ED2618]" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#ED2618] dark:text-red-400 whitespace-nowrap">
                Dexta Africa Enterprise Gateway
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
              Executing African Infrastructure, Capital &amp; Operations.
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              The unified corporate gateway for Dexta Africa. Select your designated operational environment
              below to authenticate and access real-time infrastructure delivery, procurement, or systems command.
            </p>

            {/* Direct Dual Workspace Launchers */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Operations Portal Button */}
              <button
                type="button"
                onClick={() => router.push("/ops")}
                className="group flex flex-col items-start p-4 rounded-2xl border border-red-500/30 bg-white dark:bg-[#0C1017] hover:border-[#ED2618] shadow-sm hover:shadow-lg hover:shadow-red-500/10 transition-all text-left cursor-pointer"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-[#ED2618] group-hover:bg-[#ED2618] group-hover:text-white transition-all mb-3">
                  <Building2 className="h-4.5 w-4.5" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#ED2618]">
                  ops.dextaafrica.org
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#ED2618] transition-colors mt-0.5">
                  Operations Command Desk
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  Landmark deliveries, field engineering, and procurement treasury.
                </span>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#ED2618]">
                  <span>Sign In &rarr;</span>
                </div>
              </button>

              {/* Systems IT Command Button */}
              <button
                type="button"
                onClick={() => router.push("/admin-portal")}
                className="group flex flex-col items-start p-4 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0C1017] hover:border-[#ED2618] shadow-sm hover:shadow-lg hover:shadow-red-500/10 transition-all text-left cursor-pointer"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 group-hover:bg-[#ED2618] group-hover:text-white transition-all mb-3">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  admin.dextafrica.org
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#ED2618] transition-colors mt-0.5">
                  Systems &amp; IT Command
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  Zero-trust IT access, AWS S3 storage vaults, and core web CMS.
                </span>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-[#ED2618] transition-colors">
                  <span>Authenticate &rarr;</span>
                </div>
              </button>
            </div>

            {/* Zero-Trust Notice */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <Lock className="h-3.5 w-3.5 text-[#ED2618] shrink-0" />
              <span>
                Protected by Dexta Zero-Trust Identity &bull; 256-Bit Encrypted &bull; Mandatory 2FA Support
              </span>
            </div>
          </div>

          {/* Right Column: Cinematic Slant-Curvy Showcase (Pure Red & Slate Palette) */}
          <div className="lg:col-span-6 animate-fade-in delay-100">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden rounded-[2.5rem] rounded-tr-[5.5rem] rounded-bl-[4.5rem] border border-slate-200/90 dark:border-white/10 bg-slate-950 shadow-2xl">
              {/* Slant-Curvy Architectural Accent Waves */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-red-500/20 via-transparent to-transparent rounded-bl-[100px] pointer-events-none z-20" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-red-500/10 via-transparent to-transparent rounded-tr-[80px] pointer-events-none z-20" />

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
                    <Image
                      src={slide.image}
                      alt={slide.name}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-[9500ms] ease-out will-change-transform"
                      style={{
                        objectPosition: slide.objectPosition,
                        transform: `scale(${scaleValue})`,
                      }}
                    />
                    {/* Dark Vignette Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/25 to-transparent" />
                  </div>
                );
              })}

              {/* Integrated Bottom Caption & Curved Slider Controls */}
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
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md text-white hover:bg-[#ED2618] hover:border-[#ED2618] transition-all cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Next portrait"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md text-white hover:bg-[#ED2618] hover:border-[#ED2618] transition-all cursor-pointer"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#09090B] py-5 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <DextaLogo className="h-5 w-auto" />
            <span>&copy; {new Date().getFullYear()} Dexta Africa Enterprise &bull; dextafrica.org</span>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs">
            <span>Zero-Trust Enterprise Gateway</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
