"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Sun,
  Moon,
  ChevronRight,
  ArrowLeft,
  Home,
  Menu,
  LogOut,
  ShieldAlert,
  Globe,
  Building2,
  ShieldCheck,
  User,
  ExternalLink,
  Edit3,
  Camera,
  Phone,
  Briefcase,
  FileText,
  Check,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { CommandPalette } from "./CommandPalette";
import { NotificationCenter } from "./NotificationCenter";
import { navigateToSubdomain, navigateToSubdomainWithSso } from "@/lib/routing";

const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard Overview",
  crm: "Strategic Client CRM & Deals",
  hr: "HR & Internal Operations",
  it: "IT Access & Security Governance",
  portfolio: "Portfolio & Developments",
  enquiries: "Client Leads & Inquiries",
  content: "Editorial CMS & Pages",
  journal: "Journal & Insights",
  careers: "Career Openings",
  storage: "Files & Media",
  campaigns: "Email Campaigns",
  audience: "Client Contacts",
  templates: "Email Templates",
  endpoints: "Connected Services",
  users: "Team Members",
  security: "Account Protection",
  "audit-logs": "Activity History",
};

export function Header({
  user,
}: {
  user?: {
    fullName: string;
    email: string;
    role: string;
    department?: string;
    seniorityLevel?: string;
    jobTitle?: string | null;
  };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [signOutModalOpen, setSignOutModalOpen] = React.useState(false);
  const [workspaceSwitchModalOpen, setWorkspaceSwitchModalOpen] = React.useState(false);
  const { success: toastSuccess, error: toastError } = useToast();
  const [userProfileModalOpen, setUserProfileModalOpen] = React.useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);

  // Live editable profile state
  const [profileData, setProfileData] = React.useState({
    fullName: user?.fullName || "Team Member",
    email: user?.email || "",
    role: user?.role || "ADMIN",
    department: user?.department || "OPERATIONS",
    seniorityLevel: user?.seniorityLevel || "SENIOR",
    jobTitle: user?.jobTitle || "",
    phone: "",
    bio: "",
    avatarUrl: "",
  });

  // Load latest profile from API on mount
  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/auth/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setProfileData((prev) => ({
              ...prev,
              fullName: data.user.fullName || prev.fullName,
              email: data.user.email || prev.email,
              role: data.user.role || prev.role,
              department: data.user.department || prev.department,
              seniorityLevel: data.user.seniorityLevel || prev.seniorityLevel,
              jobTitle: data.user.jobTitle || "",
              phone: data.user.phone || "",
              bio: data.user.bio || "",
              avatarUrl: data.user.avatarUrl || "",
            }));
          }
        }
      } catch {
        // Fallback to initial props
      }
    };
    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profileData.fullName,
          jobTitle: profileData.jobTitle,
          phone: profileData.phone,
          bio: profileData.bio,
          avatarUrl: profileData.avatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      toastSuccess("Profile Saved", "Your personal details and workspace identity have been updated.");
      setEditProfileModalOpen(false);
    } catch (err: unknown) {
      toastError("Update Error", err instanceof Error ? err.message : "Error saving profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toastError("File Too Large", "Please select a photo under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfileData((prev) => ({ ...prev, avatarUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  React.useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    const handleOpenSignOutModal = () => setSignOutModalOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("dexta:prompt-signout", handleOpenSignOutModal);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("dexta:prompt-signout", handleOpenSignOutModal);
    };
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  const lastSegment =
    segments.length > 0 ? segments[segments.length - 1] : "dashboard";
  const breadcrumbTitle =
    PAGE_LABELS[lastSegment] || lastSegment.replace(/-/g, " ");

  const triggerMobileSidebar = () => {
    window.dispatchEvent(new CustomEvent("dexta:toggle-sidebar"));
  };

  const confirmSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#0c0d12]/95 px-4 sm:px-6 backdrop-blur-md">
        {/* Left Navigation Controls: Mobile Menu + Clean Breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={triggerMobileSidebar}
            className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Conditional Back Button: Only on sub-pages, NOT on Dashboard root */}
          {pathname !== "/dashboard" && (
            <button
              type="button"
              onClick={() => router.back()}
              title="Return to previous page"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-[#ED2618]/40 hover:text-[#ED2618] transition-all cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          {/* Clean Current Page Indicator */}
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#ED2618] animate-pulse shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate max-w-[160px] sm:max-w-none capitalize">
              {breadcrumbTitle}
            </span>
          </div>
        </div>

        {/* Center Quick Search Trigger */}
        <div className="hidden md:flex items-center">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-3.5 py-1.5 text-xs text-slate-500 hover:border-red-500/30 hover:bg-white dark:hover:bg-white/[0.06] transition-all cursor-pointer"
          >
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span>Search workspace, files, actions...</span>
            <kbd className="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] px-1.5 py-0.5 font-sans text-[10px] text-slate-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Controls: Quick Switcher + Notifications + Theme + Unified User Pill */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Mobile Search Icon */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="md:hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.05] cursor-pointer"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Workspace & Portal Switcher Modal Trigger (Super Admin & Executive Only) */}
          {(user?.role === "SUPER_ADMIN" || user?.department?.toUpperCase() === "EXECUTIVE") && (
            <button
              type="button"
              onClick={() => setWorkspaceSwitchModalOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 text-slate-600 hover:text-[#ED2618] hover:border-[#ED2618]/30 dark:text-slate-300 dark:hover:text-white dark:hover:border-white/20 transition-all cursor-pointer"
              title="Switch Workspace Portal"
            >
              <Globe className="h-4 w-4" />
            </button>
          )}

          {/* Automated Notification Hub */}
          <NotificationCenter />

          {/* Theme Switcher */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white transition-colors cursor-pointer"
              title="Switch appearance"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Streamlined Unified User Profile Pill -> Opens Rich Profile Card */}
          <button
            type="button"
            onClick={() => setUserProfileModalOpen(true)}
            className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-white/10 text-left hover:opacity-85 transition-opacity cursor-pointer group"
            title="User Profile & Session Security"
          >
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/15 text-[#ED2618] dark:text-red-400 border border-red-200 dark:border-red-500/25 font-bold text-xs shadow-sm overflow-hidden">
              {profileData.avatarUrl ? (
                <Image
                  src={profileData.avatarUrl}
                  alt={profileData.fullName}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <span>{profileData.fullName.charAt(0) || "A"}</span>
              )}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[120px] lg:max-w-[160px]">
                {profileData.fullName}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="truncate">{profileData.department}</span>
                <span>&bull;</span>
                <span className="font-semibold text-slate-500 dark:text-slate-300 uppercase">
                  {profileData.seniorityLevel ? `${profileData.seniorityLevel} ` : ""}{profileData.role}
                </span>
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* Sign Out Confirmation Modal */}
      <Modal
        isOpen={signOutModalOpen}
        onClose={() => setSignOutModalOpen(false)}
        title="Sign Out of Workspace?"
        description="Please confirm that you want to end your current Dexta Africa workspace session."
        maxWidth="sm"
        footer={
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSignOutModalOpen(false)}
              disabled={isSigningOut}
            >
              Stay Signed In
            </Button>
            <Button
              size="sm"
              variant="danger"
              isLoading={isSigningOut}
              onClick={confirmSignOut}
              leftIcon={<LogOut className="h-3.5 w-3.5" />}
            >
              Yes, Sign Out
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-xl bg-red-50/70 dark:bg-red-500/10 p-3.5 border border-red-200/80 dark:border-red-500/20 text-xs text-slate-700 dark:text-slate-300">
          <ShieldAlert className="h-4 w-4 text-[#ED2618] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            You are currently signed in as{" "}
            <strong className="text-slate-900 dark:text-white">
              {user?.fullName || "Team Member"}
            </strong>
            . Signing out will lock your workspace until you sign back in with
            your password and 6-digit verification code.
          </p>
        </div>
      </Modal>

      {/* Workspace & Portal Quick Switcher Modal */}
      <Modal
        isOpen={workspaceSwitchModalOpen}
        onClose={() => setWorkspaceSwitchModalOpen(false)}
        title="Switch Workspace Portal"
        description="Jump seamlessly between Dexta Africa specialized subdomains and command consoles."
        maxWidth="md"
      >
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setWorkspaceSwitchModalOpen(false);
              navigateToSubdomainWithSso("ops", "/dashboard");
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] hover:border-[#ED2618]/60 hover:bg-red-50/20 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 text-[#ED2618]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#ED2618] transition-colors">
                  Operations Command Desk
                </p>
                <p className="text-[11px] text-slate-500 font-mono">ops.dextaafrica.org</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-[#ED2618] transition-colors" />
          </button>

          <button
            type="button"
            onClick={() => {
              setWorkspaceSwitchModalOpen(false);
              navigateToSubdomainWithSso("admin", "/dashboard");
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] hover:border-[#ED2618]/60 hover:bg-red-50/20 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 text-[#ED2618]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#ED2618] transition-colors">
                  Systems &amp; IT Command
                </p>
                <p className="text-[11px] text-slate-500 font-mono">admin.dextaafrica.org</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-[#ED2618] transition-colors" />
          </button>

          <button
            type="button"
            onClick={() => {
              setWorkspaceSwitchModalOpen(false);
              navigateToSubdomainWithSso("root", "/dashboard");
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] hover:border-[#ED2618]/60 hover:bg-red-50/20 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#ED2618] transition-colors">
                  Dexta Africa Unified Gateway
                </p>
                <p className="text-[11px] text-slate-500 font-mono">dextaafrica.org</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-[#ED2618] transition-colors" />
          </button>
        </div>
      </Modal>

      {/* Executive Facebook-Style User Profile & Quick Action Modal */}
      <Modal
        isOpen={userProfileModalOpen}
        onClose={() => setUserProfileModalOpen(false)}
        title="Workspace Identity & Profile"
        description="Your personal identity card across Dexta Africa infrastructure command centers."
        maxWidth="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setUserProfileModalOpen(false);
                setEditProfileModalOpen(true);
              }}
              leftIcon={<Edit3 className="h-3.5 w-3.5" />}
            >
              Edit Profile Details
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                setUserProfileModalOpen(false);
                setSignOutModalOpen(true);
              }}
              leftIcon={<LogOut className="h-3.5 w-3.5" />}
            >
              Sign Out
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Facebook/LinkedIn Style Profile Header Card */}
          <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] p-5 space-y-4 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <div className="relative group shrink-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ED2618] to-[#8a1209] text-white text-xl font-black shadow-md overflow-hidden">
                  {profileData.avatarUrl ? (
                    <Image
                      src={profileData.avatarUrl}
                      alt={profileData.fullName}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span>{profileData.fullName.charAt(0) || "A"}</span>
                  )}
                </div>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {profileData.fullName}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-[#ED2618] text-[10px] font-bold">
                    {profileData.role}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {profileData.jobTitle || "Operations & Infrastructure Lead"} &bull;{" "}
                  <span className="text-[#ED2618]">{profileData.department}</span>
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {profileData.email}
                </p>
                {profileData.phone && (
                  <p className="text-[11px] text-slate-500">
                    Phone: {profileData.phone}
                  </p>
                )}
                {profileData.bio && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 italic">
                    &ldquo;{profileData.bio}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/60 dark:border-white/[0.05] text-center">
              <div className="p-2 rounded-xl bg-white dark:bg-[#12141c] border border-slate-200/50 dark:border-white/[0.04]">
                <span className="text-[10px] text-slate-400 block">Workspace</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate block">
                  {profileData.department}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-[#12141c] border border-slate-200/50 dark:border-white/[0.04]">
                <span className="text-[10px] text-slate-400 block">Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] block">
                  ACTIVE
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-[#12141c] border border-slate-200/50 dark:border-white/[0.04]">
                <span className="text-[10px] text-slate-400 block">Protection</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] block">
                  Zero-Trust
                </span>
              </div>
            </div>
          </div>

          {/* Action Navigation Options */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                setUserProfileModalOpen(false);
                setEditProfileModalOpen(true);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-[#ED2618]/50 hover:bg-red-50/20 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-500/15 text-[#ED2618]">
                  <Edit3 className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white group-hover:text-[#ED2618] transition-colors">
                    Edit Profile Information
                  </p>
                  <p className="text-[11px] text-slate-400">Update photo, job title, phone number, and bio.</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#ED2618]" />
            </button>

            <Link
              href="/security"
              onClick={() => setUserProfileModalOpen(false)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-[#ED2618]/50 hover:bg-red-50/20 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white group-hover:text-[#ED2618] transition-colors">
                    Security &amp; Two-Factor Settings
                  </p>
                  <p className="text-[11px] text-slate-400">TOTP Authenticator, backup recovery keys, password update.</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#ED2618]" />
            </Link>

            {(user?.role === "SUPER_ADMIN" || user?.department?.toUpperCase() === "EXECUTIVE") && (
              <button
                type="button"
                onClick={() => {
                  setUserProfileModalOpen(false);
                  setWorkspaceSwitchModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-[#ED2618]/50 hover:bg-red-50/20 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/15 text-blue-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white group-hover:text-[#ED2618] transition-colors">
                      Switch Workspace Portal
                    </p>
                    <p className="text-[11px] text-slate-400">Navigate to Operations, Systems IT, or Executive Suite.</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#ED2618]" />
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Profile Information Modal (Facebook-Style Profile Studio) */}
      <Modal
        isOpen={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        title="Edit Personal Profile Details"
        description="Update your corporate identity, avatar, contact information, and biography."
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditProfileModalOpen(false)}
              disabled={isSavingProfile}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              isLoading={isSavingProfile}
              onClick={handleSaveProfile}
              leftIcon={<Check className="h-3.5 w-3.5" />}
            >
              Save Profile Changes
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          {/* Avatar Photo Changer */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05]">
            <div className="relative group shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ED2618] to-[#8a1209] text-white text-xl font-black shadow-md overflow-hidden">
                {profileData.avatarUrl ? (
                  <Image
                    src={profileData.avatarUrl}
                    alt="Avatar"
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span>{profileData.fullName.charAt(0) || "A"}</span>
                )}
              </div>
              <label
                htmlFor="header-avatar-upload"
                className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow text-slate-700 dark:text-slate-200 hover:text-[#ED2618] cursor-pointer"
                title="Change Photo"
              >
                <Camera className="h-3 w-3" />
                <input
                  id="header-avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">Profile Photo</p>
              <p className="text-[11px] text-slate-400">Click camera icon to upload an image from your computer.</p>
              {profileData.avatarUrl && (
                <button
                  type="button"
                  onClick={() => setProfileData((prev) => ({ ...prev, avatarUrl: "" }))}
                  className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer"
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Full Name
            </label>
            <input
              type="text"
              value={profileData.fullName}
              onChange={(e) => setProfileData((prev) => ({ ...prev, fullName: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ED2618]/30 focus:border-[#ED2618]"
              required
            />
          </div>

          {/* Job Title & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Official Job Title
              </label>
              <input
                type="text"
                value={profileData.jobTitle}
                onChange={(e) => setProfileData((prev) => ({ ...prev, jobTitle: e.target.value }))}
                placeholder="e.g. Senior Project Manager"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ED2618]/30 focus:border-[#ED2618]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Mobile Phone
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+234 800 000 0000"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ED2618]/30 focus:border-[#ED2618]"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Biography / Responsibilities
            </label>
            <textarea
              rows={3}
              value={profileData.bio}
              onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="e.g. Leading civil developments and procurement logistics at Dexta Africa..."
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ED2618]/30 focus:border-[#ED2618]"
            />
          </div>
        </form>
      </Modal>

      {/* Global Command Palette Dialog */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  );
}
