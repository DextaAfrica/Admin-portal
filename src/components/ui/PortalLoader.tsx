"use client";

import * as React from "react";
import { ShieldCheck, HardDrive, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PortalLoaderProps {
  message?: string;
  fullScreen?: boolean;
  onComplete?: () => void;
  durationMs?: number;
}

export function PortalLoader({
  message = "Initializing Operations Engine...",
  fullScreen = false,
  onComplete,
  durationMs = 1200,
}: PortalLoaderProps) {
  const [progress, setProgress] = React.useState(15);
  const [stepText, setStepText] = React.useState(message);

  React.useEffect(() => {
    const steps = [
      "Verifying Session Cryptography...",
      "Connecting AWS S3 Storage Pipeline...",
      "Synchronizing Gateway Telemetry...",
      "Ready",
    ];
    let idx = 0;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (onComplete) onComplete();
          return 100;
        }
        return Math.min(prev + 28, 100);
      });

      if (idx < steps.length) {
        setStepText(steps[idx]);
        idx++;
      }
    }, durationMs / 4);

    return () => clearInterval(interval);
  }, [durationMs, onComplete]);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 select-none z-50",
        fullScreen
          ? "fixed inset-0 bg-[#09090b] text-white"
          : "w-full min-h-[380px] rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#121217]/80 backdrop-blur-md"
      )}
    >
      {/* Animated Geometric Spinner */}
      <div className="relative flex h-24 w-24 items-center justify-center">
        {/* Outer rotating crimson ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-red-600 border-r-rose-500 animate-spin" />
        {/* Middle counter-rotating ring */}
        <div
          className="absolute inset-2 rounded-full border border-dashed border-red-500/40 animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "3s" }}
        />
        {/* Inner glowing core */}
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white font-bold text-xl shadow-lg shadow-red-500/40 animate-pulse">
          D
        </div>
      </div>

      {/* Brand Title */}
      <h3 className="mt-6 text-base font-bold tracking-tight text-slate-900 dark:text-white">
        Dexta Africa Operations
      </h3>

      {/* Dynamic Step Telemetry */}
      <p className="mt-1.5 font-mono text-xs text-red-600 dark:text-rose-400">
        {stepText}
      </p>

      {/* Precision Progress Bar */}
      <div className="mt-5 h-1.5 w-56 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-red-600 transition-all duration-300 rounded-full shadow-[0_0_12px_rgba(225,29,72,0.8)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Micro-status badges */}
      <div className="mt-6 flex items-center gap-4 text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-emerald-500" /> 2FA Guard
        </span>
        <span className="flex items-center gap-1">
          <HardDrive className="h-3 w-3 text-rose-500" /> S3 Cloud
        </span>
        <span className="flex items-center gap-1">
          <Radio className="h-3 w-3 text-amber-500" /> Live API
        </span>
      </div>
    </div>
  );
}

