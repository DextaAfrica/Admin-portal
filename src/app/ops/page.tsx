"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  LogIn,
  UserPlus,
  Lock,
  Mail,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { DextaLogo } from "@/components/ui/DextaLogo";
import { OTPInput } from "@/components/ui/OTPInput";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface PortraitSlide {
  image: string;
  name: string;
  title: string;
  summary: string;
  objectPosition: string;
  zoomMin: number;
  zoomMax: number;
}

const OPERATIONS_PORTRAITS: PortraitSlide[] = [
  {
    image: "/images/team-dexta.jpg",
    name: "Dexta Africa Operations Fleet",
    title: "Field & Executive Operations",
    summary:
      "Coordinating landmark real estate deliveries, infrastructure logistics, and operational standards across Africa.",
    objectPosition: "50% 14%",
    zoomMin: 1.06,
    zoomMax: 1.15,
  },
  {
    image: "/images/olufemi-dexta.png",
    name: "Olufemi",
    title: "Infrastructure & Strategic Delivery",
    summary:
      "Guiding high-rise tower milestones, engineering governance, and corporate excellence across every Dexta Africa project.",
    objectPosition: "50% 15%",
    zoomMin: 1.1,
    zoomMax: 1.2,
  },
  {
    image: "/images/sadia-dexta.png",
    name: "Sadia",
    title: "Operations & Capital Coordination",
    summary:
      "Managing institutional stakeholder alignments, contractor milestones, and operations workflows with precision.",
    objectPosition: "50% 16%",
    zoomMin: 1.12,
    zoomMax: 1.22,
  },
];

export default function OperationsLandingPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { error: toastError, success: toastSuccess } = useToast();

  const [activeSlide, setActiveSlide] = React.useState(0);
  const [zoomToggle, setZoomToggle] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Direct In-Hero Login State
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  // OTP Verification Modal
  const [otpModalOpen, setOtpModalOpen] = React.useState(false);
  const [pendingUserId, setPendingUserId] = React.useState("");
  const [pendingUserName, setPendingUserName] = React.useState("");
  const [isEmailOtp, setIsEmailOtp] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState("");
  const [recoveryCode, setRecoveryCode] = React.useState("");
  const [useRecoveryCode, setUseRecoveryCode] = React.useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
  const [otpError, setOtpError] = React.useState("");

  React.useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setZoomToggle(true), 120);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % OPERATIONS_PORTRAITS.length);
      setZoomToggle((prev) => !prev);
    }, 9000);
    return () => clearInterval(timer);
  }, [activeSlide]);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % OPERATIONS_PORTRAITS.length);
    setZoomToggle((prev) => !prev);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + OPERATIONS_PORTRAITS.length) % OPERATIONS_PORTRAITS.length);
    setZoomToggle((prev) => !prev);
  };

  const registerPath = "/register";

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage("Please enter both corporate email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Sign in failed");
        toastError("Sign In Failed", data.error || "Invalid credentials");
        setIsLoading(false);
        return;
      }

      if (data.requiresMfa) {
        setPendingUserId(data.userId);
        setPendingUserName(data.fullName || email);
        setIsEmailOtp(Boolean(data.emailOtpSent));
        setOtpCode(data.devOtp || "");
        setRecoveryCode("");
        setOtpError("");
        setUseRecoveryCode(false);
        setOtpModalOpen(true);
        setIsLoading(false);
        toastSuccess(
          "Verification Required",
          data.devOtp
            ? `Development Mode: Verification code is ${data.devOtp}`
            : data.emailOtpSent
            ? "A 6-digit verification code has been dispatched to your email."
            : "Please enter your 6-digit code from your authenticator app."
        );
        return;
      }

      toastSuccess("Operations Authorized", "Signed in to Dexta Africa Operations Desk.");
      window.location.replace("/dashboard");
    } catch {
      setErrorMessage("Connection error while accessing authorization service.");
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (submittedCode?: string) => {
    const codeToVerify = submittedCode || (useRecoveryCode ? recoveryCode : otpCode);
    if (!codeToVerify || codeToVerify.length < 6) return;

    setIsVerifyingOtp(true);
    setOtpError("");

    try {
      const res = await fetch("/api/auth/mfa-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: pendingUserId,
          code: codeToVerify,
          isRecoveryCode: useRecoveryCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "Verification failed");
        setIsVerifyingOtp(false);
        return;
      }

      setOtpModalOpen(false);
      toastSuccess("Operations Authenticated", "Welcome to Dexta Africa Operations Desk.");
      window.location.replace(data.mustChangePassword ? "/setup/password" : "/dashboard");
    } catch {
      setOtpError("Network error during verification.");
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#070A0F] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-[#ED2618] selection:text-white overflow-x-hidden transition-colors duration-200 relative">
      {/* Background Ambient Radial Highlights for Dark Mode Depth */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[650px] h-[380px] bg-red-600/[0.06] blur-[160px] rounded-full dark:opacity-100 opacity-20" />
        <div className="absolute top-1/2 -right-32 w-[550px] h-[350px] bg-slate-700/[0.06] blur-[150px] rounded-full dark:opacity-100 opacity-20" />
      </div>

      {/* Top Navigation Bar - Minimalist, Professional, Clean Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-white/[0.12] bg-white/95 dark:bg-[#0C0F17]/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center shrink-0">
              <DextaLogo className="h-7 sm:h-10 w-auto" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 dark:border-white/10 pl-3">
              <span className="flex h-2 w-2 rounded-full bg-[#ED2618] animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase">
                ops.dextaafrica.org
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3.5">
            {/* Light / Dark Mode Toggle */}
            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200/90 dark:border-white/15 text-slate-600 hover:border-[#ED2618] hover:text-[#ED2618] dark:text-slate-300 dark:hover:border-[#ED2618] dark:hover:text-white transition-all cursor-pointer shrink-0"
                title="Switch light or dark appearance"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            )}

            {/* Direct Link to Onboarding / Register */}
            <Link
              href={registerPath}
              className="btn-fill-up h-9 sm:h-10 rounded-xl px-4 sm:px-6 text-xs sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5 shrink-0 text-[#ED2618] transition-colors" />
              <span className="hidden sm:inline">Create Ops Profile</span>
              <span className="inline sm:hidden">Register</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Single-Viewport Hero Section (Direct Login + Slant-Curvy Visual) */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-10 py-8 sm:py-12 flex items-center">
        <div className="grid w-full grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Direct Operations Sign In Desk */}
          <div className="lg:col-span-6 space-y-5 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200/90 dark:border-red-500/25 bg-red-50/90 dark:bg-red-500/10 px-3.5 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[#ED2618]" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#ED2618] dark:text-red-400 whitespace-nowrap">
                Dexta Africa Enterprise Operations
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.15]">
                Operations Command Desk
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed max-w-lg">
                Direct authentication for Dexta Africa infrastructure directors, contractor procurement officers,
                and field engineering teams.
              </p>
            </div>

            {/* In-Hero Authentication Card */}
            <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-white/[0.14] bg-white dark:bg-[#141722] dark:bg-gradient-to-b dark:from-[#171A26] dark:to-[#11141E] p-6 sm:p-8 shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.65)] dark:ring-1 dark:ring-white/[0.08] backdrop-blur-xl relative space-y-4">
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 dark:text-red-400 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleDirectLogin} className="space-y-4">
                {/* Corporate Work Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Corporate Work Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="name@dextaafrica.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/[0.12] bg-slate-50 dark:bg-[#0A0D15] pl-10 pr-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#ED2618] focus:ring-1 focus:ring-[#ED2618] transition-all"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Workspace Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Workspace Password
                    </label>
                    <Link
                      href={registerPath}
                      className="text-[11px] font-semibold text-[#ED2618] hover:underline"
                    >
                      Forgot key?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter operations password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/[0.12] bg-slate-50 dark:bg-[#0A0D15] pl-10 pr-10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#ED2618] focus:ring-1 focus:ring-[#ED2618] transition-all"
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-crimson-exec w-full h-11 rounded-xl text-xs sm:text-sm font-bold justify-center cursor-pointer shadow-lg shadow-red-500/20 hover:shadow-red-500/35 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In to Operations Desk</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Direct Link to Registration */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  New to Operations?
                </span>
                <Link
                  href={registerPath}
                  className="font-bold text-[#ED2618] hover:underline inline-flex items-center gap-1"
                >
                  <span>Establish Team Profile</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Zero-Trust Notice */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#ED2618] shrink-0" />
              <span>
                Authorized operations access with real-time audit tracking &amp; OTP verification.
              </span>
            </div>
          </div>

          {/* Right Column: Cinematic Slant-Curvy Showcase (Pure Red & Slate Palette) */}
          <div className="lg:col-span-6 animate-fade-in delay-100">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden rounded-[2.5rem] rounded-tr-[5.5rem] rounded-bl-[4.5rem] border border-slate-200/90 dark:border-white/[0.16] bg-slate-950 shadow-2xl dark:shadow-[0_24px_60px_rgba(0,0,0,0.85)] dark:ring-1 dark:ring-white/[0.1]">
              {/* Slant-Curvy Architectural Accent Waves */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-red-500/20 via-transparent to-transparent rounded-bl-[100px] pointer-events-none z-20" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-red-500/10 via-transparent to-transparent rounded-tr-[80px] pointer-events-none z-20" />

              {OPERATIONS_PORTRAITS.map((slide, index) => {
                const isActive = index === activeSlide;
                const scaleValue = isActive
                  ? zoomToggle
                    ? slide.zoomMax
                    : slide.zoomMin
                  : slide.zoomMin;

                return (
                  <div
                    key={slide.image}
                    className={cn(
                      "absolute inset-0 transition-opacity duration-[1400ms] ease-in-out",
                      isActive
                        ? "opacity-100 z-10"
                        : "opacity-0 z-0 pointer-events-none"
                    )}
                  >
                    <Image
                      src={slide.image}
                      alt={slide.name}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-[9500ms] ease-out will-change-transform"
                      style={{
                        objectPosition: slide.objectPosition,
                        transform: `scale(${scaleValue})`,
                      }}
                    />
                    {/* Dark Vignette Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/25 to-transparent" />
                  </div>
                );
              })}

              {/* Integrated Bottom Caption & Curved Slider Controls */}
              <div className="absolute bottom-0 inset-x-0 z-20 p-5 sm:p-7 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1 max-w-lg">
                  <span className="inline-block rounded-full bg-[#ED2618] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white">
                    {OPERATIONS_PORTRAITS[activeSlide].title}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {OPERATIONS_PORTRAITS[activeSlide].name}
                  </h2>
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed line-clamp-2">
                    {OPERATIONS_PORTRAITS[activeSlide].summary}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={prevSlide}
                    aria-label="Previous portrait"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md text-white hover:bg-[#ED2618] hover:border-[#ED2618] transition-all cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Next portrait"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md text-white hover:bg-[#ED2618] hover:border-[#ED2618] transition-all cursor-pointer"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#09090B] py-5 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <DextaLogo className="h-5 w-auto" />
            <span>&copy; {new Date().getFullYear()} Dexta Africa Enterprise Operations &bull; ops.dextaafrica.org</span>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs">
            <span>Authorized Enterprise Operations Portal</span>
          </div>
        </div>
      </footer>

      {/* Two-Factor Verification Modal */}
      <Modal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        title="Two-Factor Security Verification"
        maxWidth="md"
      >
        <div className="space-y-6 pt-2">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-[#ED2618] border border-red-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm">
              {isEmailOtp
                ? `A 6-digit one-time passcode was dispatched to your registered address for ${pendingUserName}.`
                : `Enter the 6-digit security code generated by your corporate authenticator device.`}
            </p>
          </div>

          {otpError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{otpError}</span>
            </div>
          )}

          {!useRecoveryCode ? (
            <div className="space-y-4">
              <OTPInput
                length={6}
                value={otpCode}
                onChange={setOtpCode}
                onComplete={(val) => handleVerifyOtp(val)}
                error={Boolean(otpError)}
              />
              <button
                type="button"
                onClick={() => setUseRecoveryCode(true)}
                className="w-full text-center text-xs font-semibold text-slate-500 hover:text-[#ED2618] transition-colors"
              >
                Use a backup recovery code instead
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  8-Character Backup Recovery Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                    placeholder="e.g. A1B2-C3D4"
                    className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/50 pl-10 pr-4 text-xs sm:text-sm font-mono tracking-widest uppercase focus:outline-none focus:border-[#ED2618]"
                  />
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUseRecoveryCode(false)}
                className="w-full text-center text-xs font-semibold text-slate-500 hover:text-[#ED2618] transition-colors"
              >
                Return to 6-digit OTP verification
              </button>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setOtpModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={isVerifyingOtp}
              className="btn-crimson-exec px-5 py-2 rounded-xl text-xs font-bold"
            >
              {isVerifyingOtp ? "Verifying..." : "Verify & Enter"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
