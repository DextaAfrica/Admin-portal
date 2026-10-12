"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Sun,
  Moon,
  ChevronRight,
  Video,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { CommandPalette } from "./CommandPalette";
import { BackgroundVideo } from "../ui/BackgroundVideo";

export function Header({
  user,
}: {
  user?: { fullName: string; email: string; role: string };
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [ambientVideoEnabled, setAmbientVideoEnabled] = React.useState(true);

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

  // Format breadcrumbs from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbTitle =
    segments.length > 0
      ? segments[segments.length - 1].replace(/-/g, " ").toUpperCase()
      : "DASHBOARD";

  return (
    <>
      {ambientVideoEnabled && (
        <BackgroundVideo overlayOpacity="bg-white/92 dark:bg-[#09090b]/88" />
      )}

      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#0a0a0c]/80 px-6 backdrop-blur-md">
        {/* Breadcrumb Trail */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-400">Dexta</span>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="font-bold text-slate-900 dark:text-white tracking-wide">
            {breadcrumbTitle}
          </span>
        </div>

        {/* Center Cmd+K Quick Search Trigger */}
        <div className="hidden md:flex items-center">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] px-3.5 py-1.5 text-xs text-slate-500 hover:border-red-500/30 hover:bg-white dark:hover:bg-white/[0.06] transition-all shadow-sm"
          >
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span>Search actions, storage, members...</span>
            <kbd className="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Ambient Construction Video Toggle */}
          <button
            onClick={() => setAmbientVideoEnabled(!ambientVideoEnabled)}
            className={`hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-mono border transition-colors ${
              ambientVideoEnabled
                ? "border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-red-600 dark:text-rose-400"
                : "border-slate-200 dark:border-white/10 text-slate-400"
            }`}
            title="Toggle Ambient Construction Video"
          >
            <Video className="h-3.5 w-3.5" />
            <span>{ambientVideoEnabled ? "Video ON" : "Video OFF"}</span>
          </button>

          {/* Live System Health Badge */}
          <Badge variant="success" pulse className="hidden sm:inline-flex">
            Systems Operational
          </Badge>

          {/* Theme Switcher */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white transition-colors"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          )}

          {/* User Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-white/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white font-bold text-xs shadow-sm shadow-red-500/30">
              {user?.fullName?.charAt(0) || "A"}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {user?.fullName || "Admin"}
              </p>
              <p className="text-[10px] font-mono text-slate-400">
                {user?.role || "SUPER_ADMIN"}
              </p>
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
