"use client";

import * as React from "react";
import {
  ShieldCheck,
  QrCode,
  Laptop,
  Smartphone,
  Copy,
  Download,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { OTPInput } from "@/components/ui/OTPInput";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate, timeAgo } from "@/lib/utils";

interface SessionItem {
  id: string;
  ipAddress: string;
  userAgent: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

function formatDeviceLabel(userAgent: string): string {
  const ua = (userAgent || "").toLowerCase();
  const isMobile = ua.includes("mobile") || ua.includes("iphone") || ua.includes("android");
  const browser = ua.includes("chrome")
    ? "Chrome Browser"
    : ua.includes("safari")
    ? "Safari Browser"
    : ua.includes("firefox")
    ? "Firefox Browser"
    : "Web Browser";
  const os = ua.includes("mac")
    ? "Mac"
    : ua.includes("win")
    ? "Windows PC"
    : isMobile
    ? "Mobile Phone"
    : "Computer";
  return `${os} • ${browser}`;
}

export default function SecurityPage() {
  const { success: toastSuccess, error: toastError, copied } = useToast();
  const [sessions, setSessions] = React.useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [isSetupOpen, setIsSetupOpen] = React.useState(false);
  const [mfaSecret, setMfaSecret] = React.useState("");
  const [qrCodeUrl, setQrCodeUrl] = React.useState("");
  const [verificationCode, setVerificationCode] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[]>([]);
  const [is2faEnabled, setIs2faEnabled] = React.useState(false);

  const fetchSecurityData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/sessions");
      const data = await res.json();
      if (res.ok) setSessions(data.sessions || []);
    } catch {
      toastError("Unable to Load", "Could not load your signed-in devices.");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  React.useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  const startMfaSetup = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/mfa-setup", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMfaSecret(data.secret);
        setQrCodeUrl(data.qrCodeDataUrl);
        setIsSetupOpen(true);
      } else {
        toastError("Setup Issue", "Could not start two-step verification setup.");
      }
    } catch {
      toastError("Connection Error", "Please check your connection and try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyAndEnableMfa = async (code: string) => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/mfa-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code, secret: mfaSecret }),
      });
      const data = await res.json();
      if (res.ok) {
        setIs2faEnabled(true);
        setRecoveryCodes(data.recoveryCodes || []);
        toastSuccess("Protection Activated", "Your account is now protected with two-step verification.");
      } else {
        toastError("Incorrect Code", data.error || "Please check the 6-digit code and try again.");
      }
    } catch {
      toastError("Verification Issue", "Could not verify the code.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRevokeSession = async (sessionId?: string, revokeAllOthers = false) => {
    try {
      const res = await fetch("/api/auth/sessions/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, revokeAllOthers }),
      });
      if (res.ok) {
        toastSuccess("Device Signed Out", "The selected device has been signed out.");
        fetchSecurityData();
      } else {
        toastError("Sign-Out Failed", "Could not sign out the device.");
      }
    } catch {
      toastError("Connection Error", "Please check your connection and try again.");
    }
  };

  const downloadRecoveryCodes = () => {
    const text =
      `Dexta Africa Workspace - Backup Sign-In Codes\nGenerated: ${new Date().toLocaleDateString()}\n\n` +
      recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
      "\n\nKeep these codes in a safe place. Each code can be used once if you do not have your phone.";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dexta-backup-codes.txt";
    a.click();
    toastSuccess("Saved", "Backup codes downloaded to your computer.");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Account Protection & Signed-In Devices
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Set up two-step verification on your phone and manage the computers or phones signed into your account
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => fetchSecurityData()}
          leftIcon={<RefreshCw className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />}
        >
          Refresh
        </Button>
      </div>

      {/* Two-Step Verification Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Two-Step Phone Verification
                </h3>
                <Badge variant={is2faEnabled ? "success" : "warning"} pulse={is2faEnabled}>
                  {is2faEnabled ? "Active" : "Recommended"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                Add an extra layer of safety to your Dexta Africa account using Google Authenticator or Microsoft Authenticator on your phone.
              </p>
            </div>
          </div>

          <Button
            size="md"
            variant={is2faEnabled ? "secondary" : "primary"}
            onClick={startMfaSetup}
            leftIcon={<QrCode className="h-4 w-4" />}
          >
            {is2faEnabled ? "Update Phone App" : "Turn On Two-Step Verification"}
          </Button>
        </div>

        {recoveryCodes.length > 0 && (
          <div className="mt-6 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50/60 dark:bg-red-500/5 p-4 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                  Emergency Backup Sign-In Codes
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Keep these codes in a safe place. Each code can be used once if you do not have your phone with you.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={downloadRecoveryCodes}
                  leftIcon={<Download className="h-3 w-3" />}
                >
                  Save to Computer
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(recoveryCodes.join("\n"));
                    copied("Backup codes copied!");
                  }}
                  leftIcon={<Copy className="h-3 w-3" />}
                >
                  Copy Codes
                </Button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {recoveryCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#15161c] p-2 text-center text-xs font-bold text-slate-900 dark:text-white tracking-wider"
                >
                  {code}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Signed-In Devices */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Where You&apos;re Signed In
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Computers and phones currently signed into your Dexta Africa account
            </p>
          </div>

          {sessions.length > 1 && (
            <Button
              size="xs"
              variant="danger"
              onClick={() => handleRevokeSession(undefined, true)}
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Sign Out All Other Devices
            </Button>
          )}
        </div>

        <div className="mt-4 divide-y divide-slate-100 dark:divide-white/[0.04]">
          {sessions.map((sess) => {
            const isMobile = sess.userAgent.toLowerCase().includes("mobile");
            return (
              <div key={sess.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300">
                    {isMobile ? (
                      <Smartphone className="h-5 w-5" />
                    ) : (
                      <Laptop className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatDeviceLabel(sess.userAgent)}
                      </p>
                      {sess.isCurrent && (
                        <Badge variant="crimson" className="text-[10px]">
                          Current Device
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Last active {timeAgo(sess.lastActiveAt)} • Signed in {formatDate(sess.createdAt)}
                    </p>
                  </div>
                </div>

                {!sess.isCurrent && (
                  <Button size="xs" variant="ghost" onClick={() => handleRevokeSession(sess.id)}>
                    Sign Out
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Step Setup Modal */}
      <Modal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        title="Set Up Two-Step Phone Verification"
        description="Follow these two simple steps with your phone."
        maxWidth="md"
      >
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              Step 1: Scan This Code With Your Phone App
            </span>
            {qrCodeUrl && (
              <div className="mx-auto w-48 h-48 rounded-2xl border border-slate-200 dark:border-white/10 p-2 bg-white flex items-center justify-center shadow-sm">
                <img src={qrCodeUrl} alt="Phone Verification QR Code" className="w-full h-full object-contain" />
              </div>
            )}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <span className="text-xs text-slate-500">Setup Key:</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">{mfaSecret}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(mfaSecret);
                  copied("Setup key copied!");
                }}
                className="text-slate-400 hover:text-red-600 cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-3 text-center border-t border-slate-100 dark:border-white/10 pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              Step 2: Enter the 6-Digit Code Shown on Your Phone
            </span>
            <OTPInput
              length={6}
              value={verificationCode}
              onChange={setVerificationCode}
              onComplete={(code) => verifyAndEnableMfa(code)}
              disabled={isVerifying}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
            <Button size="sm" variant="ghost" onClick={() => setIsSetupOpen(false)}>
              Close
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={verificationCode.length < 6 || isVerifying}
              isLoading={isVerifying}
              onClick={() => verifyAndEnableMfa(verificationCode)}
            >
              Confirm & Turn On
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
