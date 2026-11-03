"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldAlert, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DextaLogo } from "@/components/ui/DextaLogo";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log exception safely to client console or monitoring endpoint
    console.error("[Workspace Incident Boundary Captured]", error.digest || error.message);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white select-none">
      <div className="w-full max-w-md rounded-2xl border border-red-200/80 dark:border-red-500/20 bg-white dark:bg-[#121217] p-8 shadow-xl text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10 text-[#ED2618] border border-red-200 dark:border-red-500/20">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight">
            Security &amp; Resilience Boundary
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            An isolated runtime condition occurred. The enterprise workspace boundary prevented system cascading and protected session credentials.
          </p>
        </div>

        {error.digest && (
          <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-2.5 border border-slate-200 dark:border-white/10 text-[11px] font-mono text-slate-500">
            Incident Reference: <span className="text-[#ED2618] font-bold">{error.digest}</span>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <Button
            size="md"
            variant="primary"
            onClick={() => reset()}
            leftIcon={<RefreshCw className="h-4 w-4" />}
            className="w-full"
          >
            Attempt Workspace Recovery
          </Button>

          <Link href="/dashboard" className="w-full">
            <Button
              size="md"
              variant="secondary"
              leftIcon={<Home className="h-4 w-4" />}
              className="w-full"
            >
              Return to Workspace Overview
            </Button>
          </Link>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <span>Dexta Africa Enterprise Systems</span>
          <span>&bull;</span>
          <span>Zero-Trust Infrastructure</span>
        </div>
      </div>
    </div>
  );
}
