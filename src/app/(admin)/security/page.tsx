"use client";

import * as React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  QrCode,
  Laptop,
  Smartphone,
  Copy,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
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

export default function SecurityPage() {
  const { success: toastSuccess, error: toastError, copied } = useToast();
  const [sessions, setSessions] = React.useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // 2FA Setup State
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
      toastError("Error", "Could not load sessions");
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
        toastError("Error", "Failed to initiate MFA");
      }
    } catch {
      toastError("Error", "Network error");
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
        toastSuccess("2FA Activated", "Your account is now secured with authenticator 2FA.");
      } else {
        toastError("Verification Failed", data.error || "Invalid 6-digit code");
      }
    } catch {
      toastError("Error", "Could not verify code");
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
        toastSuccess("Session Terminated", "Session has been invalidated.");
        fetchSecurityData();
      } else {
        toastError("Error", "Could not revoke session");
      }
    } catch {
      toastError("Error", "Network error");
    }
  };

  const downloadRecoveryCodes = () => {
    const text = `Dexta Africa Admin Portal - Emergency Backup Recovery Codes\nGenerated: ${new Date().toISOString()}\n\n` +
      recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
      "\n\nEach code can be used only once to access your account if you lose your phone.";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dexta-recovery-codes.txt";
    a.click();
    toastSuccess("Downloaded", "Recovery codes saved to file.");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Security & MFA Command Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multi-factor authentication (TOTP), emergency backup codes, and active device sessions
          </p>
        </div>

        <Button size="sm" variant="secondary" onClick={() => fetchSecurityData()} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
          Refresh Telemetry
        </Button>
      </div>

      {/* 2FA Enrollment Hero Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-red-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Authenticator App (RFC 6238 TOTP)
                </h3>
                <Badge variant={is2faEnabled ? "success" : "warning"} pulse={is2faEnabled}>
                  {is2faEnabled ? "Enabled & Active" : "Setup Recommended"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                Protect your administrative account with time-based 6-digit codes generated by Google Authenticator, Microsoft Authenticator, Authy, or 1Password.
              </p>
            </div>
          </div>

          <Button
            size="md"
            variant={is2faEnabled ? "secondary" : "primary"}
            onClick={startMfaSetup}
            leftIcon={<QrCode className="h-4 w-4" />}
          >
            {is2faEnabled ? "Reconfigure 2FA" : "Enable 2FA Now"}
          </Button>
        </div>

        {/* Recovery Codes Banner if just generated */}
        {recoveryCodes.length > 0 && (
          <div className="mt-6 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/60 dark:bg-rose-500/5 p-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-rose-400">
                  Emergency Single-Use Recovery Codes
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Save these codes safely. Each code can be used once if you cannot access your authenticator device.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="xs" variant="secondary" onClick={downloadRecoveryCodes} leftIcon={<Download className="h-3 w-3" />}>
                  Download .txt
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(recoveryCodes.join("\n"));
                    copied("Recovery codes copied!");
                  }}
                  leftIcon={<Copy className="h-3 w-3" />}
                >
                  Copy All
                </Button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {recoveryCodes.map((code, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#15161c] p-2 text-center font-mono text-xs font-bold text-slate-900 dark:text-white tracking-widest shadow-xs">
                  {code}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active Device Sessions */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Active Administrative Sessions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Devices and IP addresses currently authenticated with your credentials
            </p>
          </div>

          {sessions.length > 1 && (
            <Button
              size="xs"
              variant="danger"
              onClick={() => handleRevokeSession(undefined, true)}
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Revoke All Other Sessions
            </Button>
          )}
        </div>

        <div className="mt-4 divide-y divide-slate-100 dark:divide-white/[0.04]">
          {sessions.map((sess) => (
            <div key={sess.id} className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300">
                  {sess.userAgent.toLowerCase().includes("mobile") ? (
                    <Smartphone className="h-5 w-5" />
                  ) : (
                    <Laptop className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      IP: <code className="font-mono text-xs">{sess.ipAddress}</code>
                    </p>
                    {sess.isCurrent && (
                      <Badge variant="crimson" className="text-[10px]">
                        This Device
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-md">
                    {sess.userAgent}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">
                    Active {timeAgo(sess.lastActiveAt)} &bull; Signed in {formatDate(sess.createdAt)}
                  </p>
                </div>
              </div>

              {!sess.isCurrent && (
                <Button size="xs" variant="ghost" onClick={() => handleRevokeSession(sess.id)}>
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2FA Setup Modal */}
      <Modal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        title="Enroll Multi-Factor Authentication"
        description="Follow the 2-step setup to bind your device."
        maxWidth="md"
      >
        <div className="space-y-6">
          {/* Step 1: Scan QR */}
          <div className="space-y-2 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-rose-400">
              Step 1: Scan with Authenticator App
            </span>
            {qrCodeUrl && (
              <div className="mx-auto w-48 h-48 rounded-xl border border-slate-200 dark:border-white/10 p-2 bg-white flex items-center justify-center shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCodeUrl} alt="2FA QR Code" className="w-full h-full object-contain" />
              </div>
            )}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 font-mono">Manual Secret:</span>
              <code className="text-xs font-mono font-bold text-slate-900 dark:text-white">{mfaSecret}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(mfaSecret);
                  copied("Secret copied!");
                }}
                className="text-slate-400 hover:text-red-600"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Step 2: Enter 6 digits */}
          <div className="space-y-3 text-center border-t border-slate-100 dark:border-white/10 pt-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-rose-400">
              Step 2: Enter 6-Digit Code
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
              Done / Close
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={verificationCode.length < 6 || isVerifying}
              isLoading={isVerifying}
              onClick={() => verifyAndEnableMfa(verificationCode)}
            >
              Verify & Enable
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

