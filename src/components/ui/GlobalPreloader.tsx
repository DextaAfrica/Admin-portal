"use client";

import * as React from "react";
import { ShieldCheck, HardDrive, Radio, Construction } from "lucide-react";
import { cn } from "@/lib/utils";

export function GlobalPreloader() {
  const [isVisible, setIsVisible] = React.useState(true);
  const [isFading, setIsFading] = React.useState(false);
  const [progress, setProgress] = React.useState(10);
  const [statusMessage, setStatusMessage] = React.useState("Initializing Dexta Operations System...");

  React.useEffect(() => {
    // Check if session has already seen preloader in this tab
    const alreadyShown = sessionStorage.getItem("dexta_preloader_seen");
    if (alreadyShown) {
      setIsVisible(false);
      return;
    }

    const messages = [
      "Establishing Secure Cryptographic Handshake...",
      "Mounting AWS S3 Storage Pipeline...",
      "Calibrating Infrastructure Telemetry...",
      "Operational Readiness Confirmed",
    ];

    let step = 0;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 24;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsFading(true);
            setTimeout(() => {
              setIsVisible(false);
              sessionStorage.setItem("dexta_preloader_seen", "true");
            }, 600);
          }, 300);
          return 100;
        }
        return next;
      });

      if (step < messages.length) {
        setStatusMessage(messages[step]);
        step++;
      }
    }, 280);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#08090c] text-white select-none transition-all duration-700 ease-out",
        isFading && "opacity-0 scale-105 pointer-events-none"
      )}
    >
      {/* Background Architectural Blueprint Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Ambient Red Glow Halo */}
      <div className="absolute h-96 w-96 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />

      {/* Rotating Crimson Emblem */}
      <div className="relative flex h-28 w-28 items-center justify-center">
        {/* Outer fast spinning ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-red-600 border-r-rose-500 animate-spin" />
        {/* Middle reverse dashed ring */}
        <div
          className="absolute inset-2.5 rounded-full border border-dashed border-red-500/40 animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "4s" }}
        />
        {/* Center Illuminated Core */}
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 text-white font-extrabold text-2xl shadow-xl shadow-red-500/40 animate-pulse">
          D
        </div>
      </div>

      {/* Brand Identity */}
      <div className="mt-8 flex flex-col items-center text-center">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-extrabold tracking-tight text-white">
            Dexta Africa
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-400 border border-rose-500/20">
            <Construction className="h-3 w-3" /> Ops Engine
          </span>
        </div>
        <p className="mt-1 font-mono text-xs text-rose-400 h-5 transition-all">
          {statusMessage}
        </p>
      </div>

      {/* Glowing Linear Progress Bar */}
      <div className="mt-6 h-1.5 w-64 overflow-hidden rounded-full bg-white/10 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-red-600 transition-all duration-300 rounded-full shadow-[0_0_15px_rgba(225,29,72,0.9)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Telemetry Status Badges */}
      <div className="mt-8 flex items-center gap-6 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> 2FA Vault Ready
        </span>
        <span className="flex items-center gap-1.5">
          <HardDrive className="h-3.5 w-3.5 text-rose-400" /> S3 Bucket Ready
        </span>
        <span className="flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5 text-amber-400" /> Cluster Active
        </span>
      </div>
    </div>
  );
}

