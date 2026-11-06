"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Clock,
  Mail,
  User,
  Building2,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Input, PasswordInput } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { DextaLogo } from "@/components/ui/DextaLogo";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { evaluatePasswordStrength } from "@/lib/auth/validation";

function SetupPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success: toastSuccess, error: toastError } = useToast();

  const tokenParam = searchParams.get("token") || "";
  const ticketParam = searchParams.get("ticket") || "";

  // -------------------------------------------------------------
  // STATE 1: Token & Ticket Validation (Authorized Mode)
  // -------------------------------------------------------------
  const [isValidatingToken, setIsValidatingToken] = React.useState(Boolean(tokenParam && ticketParam));
  const [tokenValid, setTokenValid] = React.useState(false);
  const [tokenError, setTokenError] = React.useState("");
  const [tokenPayload, setTokenPayload] = React.useState<{
    ticketNumber: string;
    requesterEmail: string;
    user: { fullName: string; email: string; role?: string; department?: string };
    expiresAt: number;
  } | null>(null);

  // Time remaining state for countdown
  const [timeRemaining, setTimeRemaining] = React.useState<number | null>(null);

  // Form state for Authorized Password Setup
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState("");
  const [passwordSuccess, setPasswordSuccess] = React.useState(false);

  // -------------------------------------------------------------
  // STATE 2: Request IT Authorization Mode (No Token)
  // -------------------------------------------------------------
  const [requestEmail, setRequestEmail] = React.useState("");
  const [requestName, setRequestName] = React.useState("");
  const [requestDept, setRequestDept] = React.useState("OPERATIONS");
  const [requestReason, setRequestReason] = React.useState("");
  const [requestPriority, setRequestPriority] = React.useState("MEDIUM");
  const [isSubmittingRequest, setIsSubmittingRequest] = React.useState(false);
  const [requestError, setRequestError] = React.useState("");
  const [submittedTicket, setSubmittedTicket] = React.useState<any | null>(null);
  const [isCheckingTicket, setIsCheckingTicket] = React.useState(false);

  // -------------------------------------------------------------
  // Validate Token on Mount if present
  // -------------------------------------------------------------
  React.useEffect(() => {
    if (!tokenParam || !ticketParam) {
      setIsValidatingToken(false);
      return;
    }

    let isMounted = true;
    async function validateToken() {
      setIsValidatingToken(true);
      try {
        const res = await fetch(
          `/api/auth/reset-password-authorized?token=${encodeURIComponent(
            tokenParam
          )}&ticket=${encodeURIComponent(ticketParam)}`
        );
        const data = await res.json();
        if (!isMounted) return;

        if (res.ok && data.valid) {
          setTokenValid(true);
          setTokenPayload(data);
          const diff = Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000));
          setTimeRemaining(diff);
        } else {
          setTokenValid(false);
          setTokenError(
            data.error ||
              "This reset authorization link is invalid or has expired. In accordance with zero-trust security policy, credential links expire after 15 minutes."
          );
        }
      } catch {
        if (isMounted) {
          setTokenValid(false);
          setTokenError("Network error while verifying authorization ticket.");
        }
      } finally {
        if (isMounted) setIsValidatingToken(false);
      }
    }

    validateToken();
    return () => {
      isMounted = false;
    };
  }, [tokenParam, ticketParam]);

  // 15-Minute Countdown Timer
  React.useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setTokenValid(false);
          setTokenError("Authorization token expired (15-minute window elapsed). Please request a fresh authorization.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  // -------------------------------------------------------------
  // Handle Password Submission (Authorized Mode)
  // -------------------------------------------------------------
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!newPassword || !confirmPassword) {
      setPasswordError("Both password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match. Please verify.");
      return;
    }

    const strength = evaluatePasswordStrength(newPassword);
    if (strength.errors.length > 0) {
      setPasswordError(strength.errors[0]);
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await fetch("/api/auth/reset-password-authorized", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenParam,
          ticketNumber: ticketParam,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Failed to update password.");
        toastError(data.error || "Failed to update password");
        return;
      }

      setPasswordSuccess(true);
      toastSuccess("Credentials Secured", "Your corporate account password has been updated.");
    } catch {
      setPasswordError("Gateway communication error. Please try again.");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // -------------------------------------------------------------
  // Handle IT Reset Request Submission (Zero-Trust Request Mode)
  // -------------------------------------------------------------
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError("");

    if (!requestEmail || !requestReason) {
      setRequestError("Corporate email and reason for credential reset are required.");
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const res = await fetch("/api/it/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterEmail: requestEmail.trim(),
          requesterName: requestName.trim() || requestEmail.split("@")[0],
          department: requestDept,
          requestType: "PASSWORD_RESET",
          priority: requestPriority,
          reason: requestReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRequestError(data.error || "Failed to submit credential authorization request.");
        toastError(data.error || "Failed to submit request");
        return;
      }

      setSubmittedTicket(data.request);
      toastSuccess(
        "Authorization Request Dispatched",
        `Ticket #${data.request.ticketNumber} submitted to IT Security Directorate.`
      );
    } catch {
      setRequestError("Connection timeout. Please verify internet access and try again.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Poll / Check status of submitted ticket
  const handleCheckTicketStatus = async () => {
    if (!submittedTicket?.ticketNumber) return;
    setIsCheckingTicket(true);
    try {
      const res = await fetch(`/api/it/credentials?ticket=${encodeURIComponent(submittedTicket.ticketNumber)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ticket) {
          setSubmittedTicket(data.ticket);
          if (data.ticket.status === "APPROVED") {
            toastSuccess(
              "Clearance Approved!",
              "IT has approved your request! Check your corporate inbox for the single-use reset link."
            );
          } else if (data.ticket.status === "PENDING") {
            toastSuccess("Status: Pending", "Your ticket is in the IT review queue.");
          }
        }
      }
    } catch {
      toastError("Could not refresh ticket status.");
    } finally {
      setIsCheckingTicket(false);
    }
  };

  // -------------------------------------------------------------
  // RENDER: Token Validating Spinner
  // -------------------------------------------------------------
  if (isValidatingToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070A0F] p-4 text-white">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="h-8 w-8 rounded-full border-2 border-[#ED2618] border-t-transparent animate-spin" />
          <p className="text-sm font-mono text-slate-300">
            Verifying cryptographic authorization ticket #{ticketParam}...
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Token Present & Successfully Reset (Done)
  // -------------------------------------------------------------
  if (tokenParam && passwordSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070A0F] p-4 sm:p-6 text-white relative overflow-hidden select-none">
        <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0D1017] p-8 shadow-2xl space-y-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white">Credentials Secured</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your new password has been hashed and updated in the directory. Your authorization token has been single-use consumed.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Account:</span>
              <span className="font-semibold text-white font-mono">{tokenPayload?.requesterEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Clearance Ticket:</span>
              <span className="font-semibold text-emerald-400 font-mono">#{ticketParam} (FULFILLED)</span>
            </div>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-white text-sm font-bold shadow-lg shadow-red-500/25 transition-all"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Token Present but Invalid or Expired
  // -------------------------------------------------------------
  if (tokenParam && (!tokenValid || tokenError)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070A0F] p-4 sm:p-6 text-white relative overflow-hidden select-none">
        <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0D1017] p-8 shadow-2xl space-y-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-[#ED2618] border border-red-500/20">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-white">Authorization Link Expired</h1>
            <p className="text-xs text-slate-400 leading-relaxed">{tokenError}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400 text-left space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#ED2618]">Zero-Trust Security Rule</div>
            <p>
              IT authorization reset tokens are strictly single-use and expire within 15 minutes of issuance to protect account infrastructure against interception.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link
              href="/setup/password"
              className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-white text-xs font-bold shadow-sm transition-all"
            >
              <span>Request New IT Authorization &rarr;</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-bold transition-all"
            >
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Authorized Password Reset Terminal (Token is Valid!)
  // -------------------------------------------------------------
  if (tokenParam && tokenValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070A0F] p-4 sm:p-6 text-white relative overflow-hidden select-none">
        {/* Background radial gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/20 via-black to-black" />

        <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#0D1017]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <DextaLogo className="h-9 w-auto" />
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ED2618]/10 text-[#ED2618] border border-[#ED2618]/20">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase mb-2">
                <ShieldCheck className="h-3 w-3" />
                <span>IT Clearance Authorized &bull; Ticket #{ticketParam}</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Configure New Password
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Authorized for <strong className="text-white">{tokenPayload?.requesterEmail}</strong>. Please define your personal password.
              </p>
            </div>
          </div>

          {/* 15-Minute Countdown Alert */}
          {timeRemaining !== null && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#ED2618]/10 border border-[#ED2618]/25 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="h-4 w-4 text-[#ED2618]" />
                <span>Single-Use Token Expiration:</span>
              </div>
              <span className="font-mono font-bold text-[#ED2618] text-sm">
                {formatCountdown(timeRemaining)}
              </span>
            </div>
          )}

          {passwordError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                New Confidential Password *
              </label>
              <PasswordInput
                required
                placeholder="Minimum 10 characters with symbols"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-black/50 border-white/10 text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618]"
              />
              <PasswordStrengthMeter password={newPassword} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm New Password *
              </label>
              <PasswordInput
                required
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-black/50 border-white/10 text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618]"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmittingPassword}
              className="w-full h-11 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-red-500/25 mt-2"
            >
              {isSubmittingPassword ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Securing Credentials...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Confirm &amp; Update Password</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: IT Ticket Submitted & Awaiting Review
  // -------------------------------------------------------------
  if (submittedTicket) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070A0F] p-4 sm:p-6 text-white relative overflow-hidden select-none">
        <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#0D1017] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <DextaLogo className="h-8 w-auto" />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-[#ED2618] border border-red-500/20">
              <ShieldCheck className="h-7 w-7 text-[#ED2618]" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-[#ED2618] border border-red-500/20 text-xs font-mono font-bold uppercase">
                <span className="h-2 w-2 rounded-full bg-[#ED2618] animate-pulse" />
                <span>Ticket #{submittedTicket.ticketNumber} &bull; {submittedTicket.status}</span>
              </span>
              <h1 className="text-xl font-extrabold text-white mt-3">
                Clearance Request Dispatched to IT
              </h1>
              <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                In accordance with enterprise zero-trust policy, your password reset authorization request has been routed to the IT Security Directorate.
              </p>
            </div>
          </div>

          {/* Ticket Information Card */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-2.5 font-mono">
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
              <span className="text-slate-400">Tracking Ticket:</span>
              <span className="font-bold text-white text-sm text-[#ED2618]">#{submittedTicket.ticketNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Requester Email:</span>
              <span className="text-slate-200">{submittedTicket.requesterEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Department:</span>
              <span className="text-slate-200">{submittedTicket.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Status:</span>
              <span className="font-bold text-[#ED2618] uppercase">{submittedTicket.status}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-red-500/[0.04] border border-red-500/20 text-xs text-slate-300 space-y-1">
            <div className="font-bold text-[#ED2618] text-[11px] uppercase tracking-wider">What happens next?</div>
            <p className="leading-relaxed text-slate-400">
              An IT Security Administrator will verify your department clearance and approve the ticket. Once approved, a single-use, 15-minute reset link will be dispatched directly to <strong className="text-white">{submittedTicket.requesterEmail}</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCheckTicketStatus}
              disabled={isCheckingTicket}
              className="flex-1 text-xs font-bold h-11"
            >
              {isCheckingTicket ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Checking Status...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Check Status Now
                </span>
              )}
            </Button>

            <Link
              href="/login"
              className="flex-1 inline-flex items-center justify-center h-11 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-bold text-white transition-all text-center"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Zero-Trust IT Password Reset Request Form (No Token)
  // -------------------------------------------------------------
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070A0F] p-4 sm:p-6 text-white relative overflow-hidden select-none">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/20 via-black to-black" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0D1017]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <DextaLogo className="h-9 w-auto" />
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ED2618]/10 text-[#ED2618] border border-[#ED2618]/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              IT Password Reset Authorization
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Zero-Trust Enterprise Protocol: Self-service password changes are restricted. Please submit a clearance request to the IT Security Directorate.
            </p>
          </div>
        </div>

        {requestError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{requestError}</span>
          </div>
        )}

        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Corporate Email Address *
            </label>
            <div className="relative">
              <Input
                type="email"
                required
                placeholder="name@dextaafrica.com"
                value={requestEmail}
                onChange={(e) => setRequestEmail(e.target.value)}
                className="bg-black/50 border-white/10 text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618]"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Your Full Name
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="e.g. Ogba Peter"
                value={requestName}
                onChange={(e) => setRequestName(e.target.value)}
                className="bg-black/50 border-white/10 text-white pl-10 h-11 text-xs sm:text-sm focus:border-[#ED2618]"
              />
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Department
              </label>
              <select
                value={requestDept}
                onChange={(e) => setRequestDept(e.target.value)}
                className="w-full h-11 rounded-xl bg-black/50 border border-white/10 text-white px-3 text-xs focus:border-[#ED2618] outline-none"
              >
                <option value="OPERATIONS" className="bg-[#0D1017]">Operations Fleet</option>
                <option value="IT" className="bg-[#0D1017]">Systems IT</option>
                <option value="EXECUTIVE" className="bg-[#0D1017]">Executive Suite</option>
                <option value="FINANCE" className="bg-[#0D1017]">Treasury &amp; Finance</option>
                <option value="LOGISTICS" className="bg-[#0D1017]">Logistics &amp; Field</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Urgency Priority
              </label>
              <select
                value={requestPriority}
                onChange={(e) => setRequestPriority(e.target.value)}
                className="w-full h-11 rounded-xl bg-black/50 border border-white/10 text-white px-3 text-xs focus:border-[#ED2618] outline-none"
              >
                <option value="MEDIUM" className="bg-[#0D1017]">Standard (15m)</option>
                <option value="HIGH" className="bg-[#0D1017]">High (Operational)</option>
                <option value="CRITICAL" className="bg-[#0D1017]">Critical (Executive)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reason / Justification for Credential Reset *
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Forgot password / New workstation authentication"
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              className="w-full rounded-xl bg-black/50 border border-white/10 text-white p-3 text-xs focus:border-[#ED2618] outline-none resize-none"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmittingRequest}
            className="w-full h-11 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-red-500/25 mt-2"
          >
            {isSubmittingRequest ? (
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Submitting to IT Directorate...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>Request IT Authorization Link</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
        </form>

        <div className="pt-2 border-t border-white/10 text-center text-xs text-slate-400">
          Remembered your password?{" "}
          <Link href="/login" className="font-bold text-[#ED2618] hover:underline">
            Return to Sign In &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SetPreferredPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070A0F] text-white">
          <span className="h-8 w-8 rounded-full border-2 border-[#ED2618] border-t-transparent animate-spin" />
        </div>
      }
    >
      <SetupPasswordContent />
    </React.Suspense>
  );
}
