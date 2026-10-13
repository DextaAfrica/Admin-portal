"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { DextaLogo } from "@/components/ui/DextaLogo";

export function GlobalPreloader() {
  const [isVisible, setIsVisible] = React.useState(true);
  const [isFading, setIsFading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 4;

      if (currentProgress >= 100) {
        currentProgress = 100;
        setProgress(100);
        clearInterval(interval);

        setTimeout(() => {
          setIsFading(true);
          setTimeout(() => {
            setIsVisible(false);
          }, 600);
        }, 300);
        return;
      }

      setProgress(currentProgress);
    }, 45);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-[#09090b] text-slate-900 dark:text-white select-none transition-all duration-700 ease-out",
        isFading && "opacity-0 pointer-events-none"
      )}
    >
      <div className="relative z-10 flex flex-col items-center px-6">
        <DextaLogo className="h-12 sm:h-14 w-auto" />

        {/* Minimalist Precision Spinner Ring */}
        <div className="mt-7 h-7 w-7 rounded-full border-2 border-slate-200 dark:border-white/15 border-t-[#ED2618] dark:border-t-[#ED2618] animate-spin" />

        {/* Clean Progress Line */}
        <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
          <div
            className="h-full bg-[#ED2618] transition-all duration-150 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
