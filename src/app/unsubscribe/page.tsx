"use client";

import * as React from "react";
import { CheckCircle2, MailX, AlertCircle, RefreshCw } from "lucide-react";
import { DextaLogo } from "@/components/ui/DextaLogo";

function UnsubscribeContent() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const e = params.get("email");
    if (e) {
      setEmail(e);
    }
  }, []);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatus("loading");
    try {
      const res = await fetch("/api/marketing/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Unable to process your request.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setErrorMsg("Connection error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0E131D] p-7 sm:p-9 shadow-2xl space-y-6 text-center">
        <DextaLogo className="h-9 w-auto mx-auto" />

        {status === "done" ? (
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-extrabold text-white">You Have Been Unsubscribed</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-white">{email}</strong> has been removed from Dexta Africa promotional &amp; newsletter broadcasts.
            </p>
          </div>
        ) : (
          <form onSubmit={handleUnsubscribe} className="space-y-4 text-left">
            <div className="text-center space-y-1.5">
              <div className="h-12 w-12 rounded-2xl bg-[#ED2618]/15 text-[#ED2618] flex items-center justify-center mx-auto mb-3">
                <MailX className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-extrabold text-white">Email Preferences</h1>
              <p className="text-xs text-slate-400">
                Confirm your email address below to opt out of future campaign broadcasts.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full h-11 rounded-xl bg-black/40 border border-white/10 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ED2618]"
              />
            </div>

            {status === "error" && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 text-[#ED2618] shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full h-11 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
            >
              {status === "loading" ? "Updating Preferences..." : "Confirm Unsubscribe"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#070A0F] flex items-center justify-center text-slate-400 text-xs">
          <RefreshCw className="h-4 w-4 animate-spin mr-2 text-[#ED2618]" />
          Loading...
        </div>
      }
    >
      <UnsubscribeContent />
    </React.Suspense>
  );
}
