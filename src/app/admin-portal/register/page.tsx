"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Home, Terminal, ArrowRight } from "lucide-react";
import { EnterpriseProfileWizard } from "@/components/auth/EnterpriseProfileWizard";

export default function AdminPortalRegisterPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#070A0F] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-[#ED2618] selection:text-white font-sans relative overflow-x-hidden">
      {/* Background Ambient Systems Banner */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <Image
          src="/images/olufemi-dexta.png"
          alt="Dexta Africa Systems Command"
          fill
          priority
          className="object-cover opacity-15 dark:opacity-10 scale-105 blur-sm"
          style={{ objectPosition: "50% 15%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/95 to-white dark:from-[#070A0F]/85 dark:via-[#070A0F]/95 dark:to-[#070A0F]" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-red-500/[0.05] blur-[140px] rounded-full" />
      </div>

      {/* Top Header */}
      <header className="relative z-20 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#070A0F]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#ED2618] dark:hover:text-white transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>

          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-white/10 pl-3">
            <span className="h-2 w-2 rounded-full bg-[#ED2618] animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase">
              admin.dextafrica.org
            </span>
          </div>

          <Link
            href="/login"
            className="text-xs font-bold text-[#ED2618] hover:underline flex items-center gap-1.5"
          >
            <span>Sign In to Command</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Registration Wizard Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 py-10">
        <EnterpriseProfileWizard initialDepartment="IT" portalType="systems" />
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#070A0F] py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Dexta Africa Enterprise Systems Command &bull; admin.dextafrica.org</p>
      </footer>
    </div>
  );
}
