"use client";

import * as React from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-white font-sans antialiased">
        <div className="w-full max-w-md rounded-2xl border border-red-500/25 bg-[#121217] p-8 shadow-2xl text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-[#ED2618] border border-red-500/20">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              System Core Boundary Intercept
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              A root layout exception was intercepted and quarantined by the security layer.
            </p>
          </div>

          {error.digest && (
            <div className="rounded-xl bg-white/[0.03] p-2.5 border border-white/10 text-[11px] font-mono text-slate-400">
              Fault Digest: <span className="text-[#ED2618] font-bold">{error.digest}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#ED2618] hover:bg-red-700 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reload Core Environment</span>
          </button>
        </div>
      </body>
    </html>
  );
}

