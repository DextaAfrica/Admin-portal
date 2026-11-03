"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function AdminRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[Admin Module Error Boundary]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[60vh] animate-fade-in text-center">
      <div className="max-w-md w-full rounded-2xl border border-red-200/80 dark:border-red-500/20 bg-white dark:bg-[#121217] p-8 shadow-sm space-y-5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10 text-[#ED2618]">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Module Error Encountered
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            This module encountered an issue while communicating with the data engine. Your administrative session remains secure.
          </p>
        </div>

        {error.digest && (
          <p className="font-mono text-[11px] text-slate-400 bg-slate-50 dark:bg-white/[0.02] p-2 rounded-lg border border-slate-100 dark:border-white/5">
            Reference: {error.digest}
          </p>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => reset()}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Retry Module
          </Button>
          <Link href="/dashboard">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<LayoutDashboard className="h-3.5 w-3.5" />}
            >
              Overview
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
