"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Sun,
  Moon,
  ChevronRight,
  ArrowLeft,
  Home,
  Menu,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { CommandPalette } from "./CommandPalette";

const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard Overview",
  storage: "Files & Media",
  campaigns: "Email Campaigns",
  audience: "Client Contacts",
  templates: "Email Templates",
  endpoints: "Connected Services",
  users: "Team Members",
  security: "Account Security",
  "audit-logs": "Activity History",
};

export function Header({
  user,
}: {
  user?: { fullName: string; email: string; role: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  const lastSegment =
    segments.length > 0 ? segments[segments.length - 1] : "dashboard";
  const breadcrumbTitle =
    PAGE_LABELS[lastSegment] || lastSegment.replace(/-/g, " ");

  const triggerMobileSidebar = () => {
    window.dispatchEvent(new CustomEvent("dexta:toggle-sidebar"));
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#0c0d12]/95 px-4 sm:px-6 backdrop-blur-md">
        {/* Left Navigation Controls: Mobile Menu + Back Button + Home Link + Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={triggerMobileSidebar}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Universal Back Button */}
          <button
            type="button"
            onClick={() => {
              if (pathname === "/dashboard") {
                router.push("/");
              } else {
                router.back();
              }
            }}
            title={
              pathname === "/dashboard"
                ? "Return to Home Page"
                : "Go back to previous page"
            }
            className="group inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#ED2618]/40 hover:bg-red-50/60 hover:text-[#ED2618] dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Direct Home Link */}
          <Link
            href="/"
            title="Visit Dexta Africa Home Page"
            className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 text-slate-500 hover:border-[#ED2618]/40 hover:text-[#ED2618] dark:hover:text-white transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>

          <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />

          {/* Current Page Title */}
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate max-w-[160px] sm:max-w-none capitalize">
            {breadcrumbTitle}
          </span>
        </div>

        {/* Center Quick Search Trigger */}
        <div className="hidden md:flex items-center">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-3.5 py-1.5 text-xs text-slate-500 hover:border-red-500/30 hover:bg-white dark:hover:bg-white/[0.06] transition-all"
          >
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span>Search pages, files, or team...</span>
            <kbd className="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Icon */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="md:hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.05]"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Live Status Badge */}
          <Badge variant="success" pulse className="hidden sm:inline-flex">
            Active
          </Badge>

          {/* Theme Switcher */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white transition-colors"
              title="Switch appearance"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          )}

          {/* User Badge */}
          <div className="flex items-center gap-2.5 pl-2.5 border-l border-slate-200 dark:border-white/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ED2618] text-white font-bold text-xs shadow-sm">
              {user?.fullName?.charAt(0) || "A"}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {user?.fullName || "Team Member"}
              </p>
              <p className="text-[10px] text-slate-400">Dexta Africa</p>
            </div>
          </div>
        </div>
      </header>

      {/* Global Command Palette Dialog */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  );
}
