"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Phone,
  Briefcase,
  Building2,
  ShieldCheck,
  KeyRound,
  Check,
  ArrowRight,
  ArrowLeft,
  Camera,
  Sparkles,
  Zap,
  HardHat,
  Cpu,
  Landmark,
  Users,
  Eye,
  EyeOff,
  Copy,
  Download,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { DextaLogo } from "@/components/ui/DextaLogo";
import { evaluatePasswordStrength } from "@/lib/auth/validation";

interface EnterpriseProfileWizardProps {
  initialDepartment?: "OPERATIONS" | "IT" | "EXECUTIVE" | "HR";
  portalType?: "operations" | "systems" | "main";
}

const AVATAR_PRESETS = [
  { id: "crimson", bg: "from-[#ED2618] to-[#991207]", label: "Dexta Crimson" },
  { id: "obsidian", bg: "from-[#1e2330] to-[#0c0d12]", label: "Obsidian Slate" },
  { id: "sapphire", bg: "from-[#2563eb] to-[#1e40af]", label: "Electric Sapphire" },
  { id: "emerald", bg: "from-[#059669] to-[#065f46]", label: "Emerald Green" },
  { id: "imperial", bg: "from-[#7c3aed] to-[#5b21b6]", label: "Imperial Violet" },
  { id: "amber", bg: "from-[#d97706] to-[#b45309]", label: "Amber Gold" },
];

export function EnterpriseProfileWizard({
  initialDepartment = "OPERATIONS",
  portalType = "main",
}: EnterpriseProfileWizardProps) {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [currentStep, setCurrentStep] = React.useState<1 | 2 | 3 | 4>(1);

  // Profile Identity State
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [department, setDepartment] = React.useState<string>(initialDepartment);
  const [jobTitle, setJobTitle] = React.useState(
    initialDepartment === "OPERATIONS"
      ? "Operations & Logistics Lead"
      : initialDepartment === "IT"
      ? "Systems Security Architect"
      : "Executive Director"
  );
  const [bio, setBio] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState<string>("");
  const [selectedAvatarPreset, setSelectedAvatarPreset] = React.useState<string>("crimson");

  // Credentials State
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  // Security / 2FA State
  const [enable2FA, setEnable2FA] = React.useState(false);
  const [mfaSecret, setMfaSecret] = React.useState("");
  const [mfaQrUrl, setMfaQrUrl] = React.useState("");
  const [mfaCode, setMfaCode] = React.useState("");
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[]>([]);
  const [isSettingUpMfa, setIsSettingUpMfa] = React.useState(false);

  // Submission & Loading State
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [createdUser, setCreatedUser] = React.useState<any | null>(null);

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const initials = firstName && lastName
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    : firstName
    ? firstName.charAt(0).toUpperCase()
    : "D";

  // Real-time Password Evaluation
  const passwordAnalysis = React.useMemo(() => {
    return evaluatePasswordStrength(password);
  }, [password]);

  // Handle Photo Upload via DataURL
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toastError("Image Too Large", "Please select a profile image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Step 1 Validation
  const canProceedStep1 = firstName.trim().length > 0 && lastName.trim().length > 0 && email.includes("@") && email.includes(".");

  // Step 2 Validation
  const canProceedStep2 =
    passwordAnalysis.checks.minLength &&
    passwordAnalysis.checks.hasUppercase &&
    passwordAnalysis.checks.hasLowercase &&
    passwordAnalysis.checks.hasNumber &&
    password === confirmPassword;

  // Initialize MFA Setup if requested
  const handleToggle2FA = async (enable: boolean) => {
    setEnable2FA(enable);
    if (enable && !mfaSecret) {
      setIsSettingUpMfa(true);
      try {
        const res = await fetch("/api/auth/register-mfa-init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase().trim() || "user@dextaafrica.com" }),
        });
        const data = await res.json();
        if (data.secret) {
          setMfaSecret(data.secret);
          setMfaQrUrl(data.qrCodeUrl || "");
        }
      } catch {
        // Fallback gracefully
      } finally {
        setIsSettingUpMfa(false);
      }
    }
  };

  // Submit Profile Creation
  const handleCreateProfile = async () => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const payload = {
        fullName,
        email: email.toLowerCase().trim(),
        password,
        confirmPassword,
        department,
        jobTitle,
        phone,
        avatarUrl: avatarUrl || undefined,
        bio: bio || undefined,
        ...(enable2FA && mfaSecret ? { mfaSecret, mfaCode } : {}),
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Profile creation failed");
      }

      setCreatedUser(data.user);
      if (data.recoveryCodes && data.recoveryCodes.length > 0) {
        setRecoveryCodes(data.recoveryCodes);
      }

      toastSuccess(
        "Profile Created Successfully",
        `Welcome to Dexta Africa, ${data.user.fullName}! Your workspace profile is active.`
      );

      setCurrentStep(4);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error creating profile");
      toastError("Registration Error", err instanceof Error ? err.message : "Error creating profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Launch Target Workspace Dashboard
  const handleLaunchWorkspace = () => {
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    const port = typeof window !== "undefined" && window.location.port ? `:${window.location.port}` : "";
    const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";

    // If local development with subdomains
    if (host.includes("localhost") || host.includes("127.0.0.1")) {
      if (department === "OPERATIONS") {
        window.location.href = `${protocol}//ops.localhost${port}/dashboard?tab=operations`;
        return;
      } else if (department === "IT") {
        window.location.href = `${protocol}//admin.localhost${port}/dashboard?tab=systems`;
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center py-1">
          <DextaLogo className="h-10 w-auto" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Create Your Enterprise Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            High-trust identity provisioning across Dexta Africa infrastructure command portals.
          </p>
        </div>
      </div>

      {/* Step Progress Tracker */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] p-4 shadow-sm">
        <div className="grid grid-cols-4 gap-2">
          {[
            { step: 1, title: "Identity", icon: User },
            { step: 2, title: "Security", icon: Lock },
            { step: 3, title: "Zero-Trust", icon: ShieldCheck },
            { step: 4, title: "Launch", icon: Zap },
          ].map((item) => {
            const Icon = item.icon;
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            return (
              <div
                key={item.step}
                className={`flex flex-col sm:flex-row items-center gap-2 p-2 rounded-xl transition-all ${
                  isCurrent
                    ? "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-[#ED2618]"
                    : isCompleted
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400"
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isCurrent
                      ? "bg-[#ED2618] text-white shadow-sm"
                      : isCompleted
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-white/[0.06] text-slate-400"
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : item.step}
                </div>
                <span className="text-[11px] font-bold truncate hidden sm:inline">
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2.5 animate-shake">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STEP 1: IDENTITY & PROFILE DETAILS */}
      {/* ===================================================================== */}
      {currentStep === 1 && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          {/* Avatar Setup Studio */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05]">
            <div className="relative group shrink-0">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-md overflow-hidden bg-gradient-to-br ${
                  avatarUrl
                    ? ""
                    : AVATAR_PRESETS.find((p) => p.id === selectedAvatarPreset)?.bg || "from-[#ED2618] to-[#991207]"
                }`}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar Preview" className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm text-slate-700 dark:text-slate-200 hover:text-[#ED2618] cursor-pointer transition-colors"
                title="Upload custom photo"
              >
                <Camera className="h-3.5 w-3.5" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Personal Avatar &amp; Photo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload your company headshot or choose an executive palette preset.
              </p>
              <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start flex-wrap">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setAvatarUrl("");
                      setSelectedAvatarPreset(preset.id);
                    }}
                    className={`h-6 w-6 rounded-lg bg-gradient-to-br ${preset.bg} transition-transform cursor-pointer ${
                      selectedAvatarPreset === preset.id && !avatarUrl
                        ? "scale-110 ring-2 ring-[#ED2618] ring-offset-2 dark:ring-offset-slate-950"
                        : "hover:scale-105 opacity-80"
                    }`}
                    title={preset.label}
                  />
                ))}
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl("")}
                    className="text-[10px] text-slate-400 hover:text-rose-500 font-semibold underline ml-1 cursor-pointer"
                  >
                    Reset Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Names Input (Facebook Style side-by-side) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                First Name <span className="text-[#ED2618]">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Peter"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED2618]/30 focus:border-[#ED2618] transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Last Name <span className="text-[#ED2618]">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Ogba"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED2618]/30 focus:border-[#ED2618] transition-all"
                required
              />
            </div>
          </div>

          {/* Corporate Email & Mobile Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Corporate Email Address <span className="text-[#ED2618]">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="peter.ogba@dextaafrica.com"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED2618]/30 focus:border-[#ED2618] transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Direct Mobile Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED2618]/30 focus:border-[#ED2618] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Workspace Department Selection Cards */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Primary Department &amp; Workspace Domain
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "OPERATIONS",
                  title: "Operations Fleet Desk",
                  domain: "ops.dextaafrica.org",
                  desc: "Landmark developments & contractor site deliveries",
                  icon: HardHat,
                },
                {
                  id: "IT",
                  title: "Systems IT Command",
                  domain: "admin.dextafrica.org",
                  desc: "Identity governance & cloud watchdog firewalls",
                  icon: Cpu,
                },
                {
                  id: "EXECUTIVE",
                  title: "MD / CEO Suite",
                  domain: "dextaafrica.org",
                  desc: "Sovereign treasury & corporate broadcast governance",
                  icon: Landmark,
                },
              ].map((dept) => {
                const DIcon = dept.icon;
                const isSelected = department === dept.id;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      setDepartment(dept.id);
                      if (dept.id === "OPERATIONS") setJobTitle("Operations & Fleet Lead");
                      else if (dept.id === "IT") setJobTitle("Systems Security Engineer");
                      else setJobTitle("Executive Director");
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? "border-[#ED2618] bg-red-50/50 dark:bg-red-500/10 shadow-sm"
                        : "border-slate-200/80 dark:border-white/[0.08] bg-slate-50/40 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isSelected
                            ? "bg-[#ED2618] text-white"
                            : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <DIcon className="h-4 w-4" />
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-[#ED2618]" />}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {dept.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {dept.domain}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Job Title & Bio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Official Job Title
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Project Manager"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED2618]/30 focus:border-[#ED2618] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Professional Bio / Focus
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Overseeing civil engineering deliveries across Lagos"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED2618]/30 focus:border-[#ED2618] transition-all"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/[0.06]">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              Already have an account? Sign In &rarr;
            </Link>

            <Button
              type="button"
              variant="primary"
              disabled={!canProceedStep1}
              onClick={() => setCurrentStep(2)}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Continue to Security
            </Button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STEP 2: CREDENTIALS & PASSWORD SECURITY */}
      {/* ===================================================================== */}
      {currentStep === 2 && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Choose an Executive Secure Password
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Zero-trust defense standard requiring military-grade entropy for administrative clearance.
            </p>
          </div>

          {/* Password Fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Password <span className="text-[#ED2618]">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter strong corporate passphrase"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED2618]/30 focus:border-[#ED2618] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Confirm Password <span className="text-[#ED2618]">*</span>
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type your password"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED2618]/30 focus:border-[#ED2618] transition-all"
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[11px] font-semibold text-rose-500">
                  Passwords do not match yet.
                </p>
              )}
            </div>
          </div>

          {/* Live Entropy Criteria Checklist */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05] space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300">Security Score:</span>
              <span
                className={
                  passwordAnalysis.score >= 3
                    ? "text-emerald-500 font-bold"
                    : passwordAnalysis.score === 2
                    ? "text-amber-500 font-bold"
                    : "text-rose-500 font-bold"
                }
              >
                {passwordAnalysis.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: "8+ characters", met: passwordAnalysis.checks.minLength },
                { label: "Uppercase letter (A-Z)", met: passwordAnalysis.checks.hasUppercase },
                { label: "Lowercase letter (a-z)", met: passwordAnalysis.checks.hasLowercase },
                { label: "Number (0-9)", met: passwordAnalysis.checks.hasNumber },
                { label: "Special symbol (!@#$)", met: passwordAnalysis.checks.hasSpecial },
                { label: "Passwords match", met: Boolean(password && password === confirmPassword) },
              ].map((crit, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                      crit.met
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 dark:bg-white/10 text-slate-400"
                    }`}
                  >
                    {crit.met ? "✓" : "×"}
                  </span>
                  <span className={`text-[11px] ${crit.met ? "text-slate-900 dark:text-white font-medium" : "text-slate-400"}`}>
                    {crit.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/[0.06]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCurrentStep(1)}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Identity
            </Button>

            <Button
              type="button"
              variant="primary"
              disabled={!canProceedStep2}
              onClick={() => setCurrentStep(3)}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Continue to Two-Factor
            </Button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STEP 3: TWO-FACTOR VERIFICATION & ZERO-TRUST */}
      {/* ===================================================================== */}
      {currentStep === 3 && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Identity Verification &amp; Account Protection
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure multi-factor authentication (MFA) to enforce zero-trust defense on your account.
            </p>
          </div>

          {/* 2FA Option Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleToggle2FA(false)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                !enable2FA
                  ? "border-[#ED2618] bg-red-50/50 dark:bg-red-500/10 shadow-sm"
                  : "border-slate-200/80 dark:border-white/[0.08] bg-slate-50/40 dark:bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                  <Mail className="h-4 w-4" />
                </div>
                {!enable2FA && <Check className="h-4 w-4 text-[#ED2618]" />}
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Email Sign-In Verification
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Receive instant 6-digit OTP verification codes to your corporate inbox upon sign-in.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleToggle2FA(true)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                enable2FA
                  ? "border-[#ED2618] bg-red-50/50 dark:bg-red-500/10 shadow-sm"
                  : "border-slate-200/80 dark:border-white/[0.08] bg-slate-50/40 dark:bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-500/10 text-[#ED2618]">
                  <KeyRound className="h-4 w-4" />
                </div>
                {enable2FA && <Check className="h-4 w-4 text-[#ED2618]" />}
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Authenticator App (TOTP)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Use Google Authenticator, 1Password, or Apple Keychain for military-grade protection.
              </p>
            </button>
          </div>

          {/* Authenticator QR Code Setup */}
          {enable2FA && (
            <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05] space-y-4 animate-fade-in">
              {isSettingUpMfa ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <RefreshCw className="h-4 w-4 animate-spin text-[#ED2618]" />
                  <span>Generating cryptographic secret key...</span>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {mfaQrUrl && (
                      <div className="p-2 rounded-xl bg-white shadow-sm shrink-0">
                        <img src={mfaQrUrl} alt="Authenticator QR" className="h-28 w-28" />
                      </div>
                    )}
                    <div className="space-y-1 text-center sm:text-left">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Scan QR Code in Authenticator App
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Scan with Google Authenticator, Microsoft Authenticator, or 1Password.
                      </p>
                      {mfaSecret && (
                        <div className="pt-2">
                          <span className="text-[10px] text-slate-400">Secret Key:</span>
                          <p className="font-mono text-xs font-bold text-[#ED2618] select-all">
                            {mfaSecret}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Enter 6-Digit Authenticator Code to Confirm
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 123456"
                      className="w-full text-center font-mono tracking-widest text-lg rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141c] py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ED2618]/30 focus:border-[#ED2618]"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/[0.06]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCurrentStep(2)}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Security
            </Button>

            <Button
              type="button"
              variant="primary"
              isLoading={isSubmitting}
              onClick={handleCreateProfile}
              rightIcon={<Sparkles className="h-4 w-4" />}
            >
              Finalize &amp; Create Profile
            </Button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STEP 4: PROFILE SUMMARY & LAUNCH WORKSPACE (FACEBOOK STYLE) */}
      {/* ===================================================================== */}
      {currentStep === 4 && createdUser && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          {/* Welcome Badge */}
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Check className="h-6 w-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Profile Provisioned &amp; Ready
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Your Dexta Africa corporate credentials have been verified and settled in the immutable identity ledger.
            </p>
          </div>

          {/* Top-Tier Facebook/LinkedIn Style Profile Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-6 space-y-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <div
                className={`relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-md overflow-hidden bg-gradient-to-br ${
                  createdUser.avatarUrl
                    ? ""
                    : AVATAR_PRESETS.find((p) => p.id === selectedAvatarPreset)?.bg || "from-[#ED2618] to-[#991207]"
                }`}
              >
                {createdUser.avatarUrl ? (
                  <img src={createdUser.avatarUrl} alt={createdUser.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
                <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                    {createdUser.fullName}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-[#ED2618] text-[10px] font-bold">
                    {createdUser.role || "ADMIN"}
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {createdUser.jobTitle || "Team Member"} &bull;{" "}
                  <span className="text-[#ED2618]">{createdUser.department} Directorate</span>
                </p>

                <p className="text-xs text-slate-400 font-mono truncate">
                  {createdUser.email}
                </p>
              </div>
            </div>

            {/* Profile Metrics Ribbon */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-200/60 dark:border-white/[0.05] text-center text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#12141c] border border-slate-200/60 dark:border-white/[0.04]">
                <span className="text-[10px] text-slate-400 block">Workspace</span>
                <span className="font-bold text-slate-900 dark:text-white text-[11px] truncate block">
                  {createdUser.department}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#12141c] border border-slate-200/60 dark:border-white/[0.04]">
                <span className="text-[10px] text-slate-400 block">Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] block">
                  ACTIVE
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#12141c] border border-slate-200/60 dark:border-white/[0.04]">
                <span className="text-[10px] text-slate-400 block">Zero-Trust</span>
                <span className="font-bold text-slate-900 dark:text-white text-[11px] block">
                  {createdUser.twoFactorEnabled ? "2FA TOTP" : "Email OTP"}
                </span>
              </div>
            </div>
          </div>

          {/* Backup Recovery Codes (if generated) */}
          {recoveryCodes.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Backup Emergency Recovery Codes</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(recoveryCodes.join("\n"));
                    toastSuccess("Copied", "Recovery codes copied to clipboard.");
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
                >
                  <Copy className="h-3 w-3" /> Copy All
                </button>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Save these emergency codes in a safe vault in case you lose access to your device.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                {recoveryCodes.map((code, idx) => (
                  <div key={idx} className="p-1.5 rounded bg-white dark:bg-black/40 text-center font-bold">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Launch Workspace Button */}
          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              className="w-full py-3.5 text-sm font-bold shadow-lg shadow-red-500/20"
              onClick={handleLaunchWorkspace}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Launch {department === "OPERATIONS" ? "Operations Fleet Desk" : department === "IT" ? "Systems IT Command" : "Executive Suite"} &rarr;
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

