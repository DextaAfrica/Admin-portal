"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { DextaLogo } from "@/components/ui/DextaLogo";

export interface PortalLoaderProps {
  message?: string;
  fullScreen?: boolean;
  onComplete?: () => void;
  durationMs?: number;
}

export function PortalLoader({
  message = "Loading...",
  fullScreen = false,
  onComplete,
  durationMs = 1800,
}: PortalLoaderProps) {
  const [progress, setProgress] = React.useState(15);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (onComplete) onComplete();
          return 100;
        }
        return Math.min(prev + 25, 100);
      });
    }, durationMs / 4);

    return () => clearInterval(interval);
  }, [durationMs, onComplete]);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-10 select-none z-50 animate-fade-in",
        fullScreen
          ? "fixed inset-0 bg-white dark:bg-[#09090b] text-slate-900 dark:text-white"
          : "w-full min-h-[300px] rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] shadow-sm"
      )}
    >
      <DextaLogo className="h-10 w-auto" />

      <div className="mt-6 h-6 w-6 rounded-full border-2 border-slate-200 dark:border-white/15 border-t-[#ED2618] dark:border-t-[#ED2618] animate-spin" />

      <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
        {message}
      </p>

      <div className="mt-3 h-1 w-40 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
        <div
          className="h-full bg-[#ED2618] transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
