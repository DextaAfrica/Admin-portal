"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, LogOut, Clock, RefreshCw, KeyRound } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface InactivityPolicy {
  timeoutMinutes: number;
  warningSeconds: number;
}

const STORAGE_KEY = "dexta_last_user_activity";
const DEFAULT_TIMEOUT_MINUTES = 15;
const DEFAULT_WARNING_SECONDS = 60;

export function SessionInactivityGuard() {
  const router = useRouter();

  const [policy, setPolicy] = React.useState<InactivityPolicy>({
    timeoutMinutes: DEFAULT_TIMEOUT_MINUTES,
    warningSeconds: DEFAULT_WARNING_SECONDS,
  });

  const [warningModalOpen, setWarningModalOpen] = React.useState(false);
  const [secondsRemaining, setSecondsRemaining] = React.useState(DEFAULT_WARNING_SECONDS);
  const [isExtending, setIsExtending] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const lastActivityRef = React.useRef<number>(Date.now());
  const lastHeartbeatSentRef = React.useRef<number>(Date.now());

  // 1. Fetch Inactivity Policy from Backend
  React.useEffect(() => {
    let isMounted = true;
    async function loadPolicy() {
      try {
        const res = await fetch("/api/auth/inactivity-policy");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.timeoutMinutes) {
            setPolicy({
              timeoutMinutes: data.timeoutMinutes,
              warningSeconds: data.warningSeconds || 60,
            });
          }
        }
      } catch {
        // Fallback to default 15m policy
      }
    }
    loadPolicy();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Synchronize Activity Across Multi-Tab Windows via Storage
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const remoteTimestamp = parseInt(e.newValue, 10);
        if (!isNaN(remoteTimestamp) && remoteTimestamp > lastActivityRef.current) {
          lastActivityRef.current = remoteTimestamp;
          // If modal was open, remote activity in another tab dismisses it
          setWarningModalOpen(false);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // 3. User Activity Detection (Throttled Heartbeat)
  const registerUserActivity = React.useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    // Persist to localStorage for multi-tab awareness
    try {
      localStorage.setItem(STORAGE_KEY, now.toString());
    } catch {}

    // If warning modal is showing and user resumes activity, automatically extend
    if (warningModalOpen) {
      setWarningModalOpen(false);
    }

    // Send heartbeat to backend every 45s while user is actively working
    if (now - lastHeartbeatSentRef.current > 45000) {
      lastHeartbeatSentRef.current = now;
      fetch("/api/auth/heartbeat", { method: "POST" }).catch(() => {});
    }
  }, [warningModalOpen]);

  React.useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    let throttleTimeout: NodeJS.Timeout | null = null;

    const handleInteraction = () => {
      if (!throttleTimeout) {
        registerUserActivity();
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
        }, 1000); // Throttle listeners to at most once per second
      }
    };

    events.forEach((ev) => window.addEventListener(ev, handleInteraction, { passive: true }));

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleInteraction));
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [registerUserActivity]);

  // 4. Inactivity Watcher Interval Check (Every 1 second)
  React.useEffect(() => {
    const totalTimeoutMs = policy.timeoutMinutes * 60 * 1000;
    const warningLeadMs = policy.warningSeconds * 1000;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - lastActivityRef.current;
      const msLeft = totalTimeoutMs - elapsedMs;

      if (msLeft <= 0) {
        // Timeout reached -> Auto logout user
        clearInterval(intervalId);
        executeAutoLogout();
      } else if (msLeft <= warningLeadMs) {
        // Inside warning window -> Show countdown modal
        const remainingSec = Math.max(1, Math.ceil(msLeft / 1000));
        setSecondsRemaining(remainingSec);
        setWarningModalOpen(true);
      } else {
        // Outside warning window -> Ensure modal is closed
        if (warningModalOpen) {
          setWarningModalOpen(false);
        }
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [policy, warningModalOpen]);

  // 5. Extend Session / Stay Signed In
  const handleStaySignedIn = async () => {
    setIsExtending(true);
    try {
      lastActivityRef.current = Date.now();
      lastHeartbeatSentRef.current = Date.now();
      try {
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      } catch {}

      await fetch("/api/auth/heartbeat", { method: "POST" });
      setWarningModalOpen(false);
    } finally {
      setIsExtending(false);
    }
  };

  // 6. Execute Logout (Manual or Inactivity)
  const executeAutoLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      // Redirect to login with inactivity flag
      window.location.href = "/login?reason=inactivity";
    }
  };

  return (
    <Modal
      isOpen={warningModalOpen}
      onClose={() => {}} // Disallow dismissing via click-outside during security countdown
      title="Session Inactivity Warning"
      description="Protection of enterprise infrastructure & sensitive assets"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={executeAutoLogout}
            disabled={isLoggingOut}
            leftIcon={<LogOut className="h-4 w-4" />}
            className="text-xs"
          >
            {isLoggingOut ? "Signing Out..." : "Sign Out Now"}
          </Button>

          <button
            type="button"
            onClick={handleStaySignedIn}
            disabled={isExtending || isLoggingOut}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ED2618] px-4 py-2 text-xs font-bold text-white hover:bg-[#c91e12] transition-colors shadow-lg shadow-red-500/20 cursor-pointer disabled:opacity-50"
          >
            {isExtending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            <span>Stay Signed In</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-slate-800 dark:text-slate-200">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-[#ED2618] border border-red-500/30">
            <Clock className="h-6 w-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Are you still working in this workspace?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              You have been inactive for over{" "}
              <strong className="text-slate-900 dark:text-white">
                {policy.timeoutMinutes - 1} minutes
              </strong>
              . In compliance with Dexta Africa Zero-Trust security rules, inactive
              sessions are automatically terminated.
            </p>
          </div>
        </div>

        {/* Live Countdown Display */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] text-center space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Automatic Sign Out In
          </span>
          <div className="font-mono text-3xl sm:text-4xl font-extrabold text-[#ED2618]">
            00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
          </div>
          <p className="text-[11px] text-slate-500">
            Click <strong>Stay Signed In</strong> or interact with the page to keep your workspace unlocked.
          </p>
        </div>
      </div>
    </Modal>
  );
}

