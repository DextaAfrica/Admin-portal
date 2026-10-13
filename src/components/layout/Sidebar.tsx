"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  HardDrive,
  Mail,
  Users,
  FileCode2,
  Radio,
  ShieldCheck,
  FileText,
  UserCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DextaLogo } from "@/components/ui/DextaLogo";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Workspace",
    items: [
      { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { title: "Home Page", href: "/", icon: Home },
    ],
  },
  {
    label: "Files & Outreach",
    items: [
      { title: "Files & Media", href: "/storage", icon: HardDrive },
      { title: "Email Campaigns", href: "/marketing/campaigns", icon: Mail },
      { title: "Client Contacts", href: "/marketing/audience", icon: Users },
      { title: "Email Templates", href: "/marketing/templates", icon: FileCode2 },
    ],
  },
  {
    label: "Connections",
    items: [
      { title: "Connected Services", href: "/endpoints", icon: Radio, badge: "Live" },
    ],
  },
  {
    label: "Team & Protection",
    items: [
      { title: "Team Members", href: "/users", icon: UserCheck },
      { title: "Account Security", href: "/security", icon: ShieldCheck },
      { title: "Activity History", href: "/audit-logs", icon: FileText },
    ],
  },
];

export function Sidebar({
  user,
}: {
  user?: { fullName: string; email: string; role: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Listen for mobile menu toggle triggered from Header
  React.useEffect(() => {
    const handleToggle = () => setMobileOpen((prev) => !prev);
    window.addEventListener("dexta:toggle-sidebar", handleToggle);
    return () => window.removeEventListener("dexta:toggle-sidebar", handleToggle);
  }, []);

  // Automatically close mobile drawer on route change
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:static lg:z-30 flex flex-col border-r border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] transition-all duration-300 select-none",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          mobileOpen
            ? "translate-x-0 w-72 shadow-2xl"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] px-4">
          {!isCollapsed ? (
            <Link href="/" className="flex items-center py-1" title="Visit Dexta Africa Home">
              <DextaLogo className="h-9 w-auto" />
            </Link>
          ) : (
            <Link
              href="/"
              className="mx-auto flex items-center justify-center"
              title="Visit Dexta Africa Home"
            >
              <DextaLogo onlyMark className="h-7 w-auto" />
            </Link>
          )}

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "hidden lg:inline-flex rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-600 dark:hover:text-white transition-colors",
              isCollapsed && "lg:hidden"
            )}
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Mobile Close Drawer Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-700 dark:hover:text-white"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isCollapsed && (
          <div className="hidden lg:flex justify-center py-2 border-b border-slate-200/60 dark:border-white/[0.05]">
            <button
              onClick={() => setIsCollapsed(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
              title="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <h5 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  {section.label}
                </h5>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href ||
                      pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all",
                      isActive
                        ? "bg-rose-50 dark:bg-rose-500/10 text-[#ED2618] dark:text-rose-400 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white",
                      isCollapsed && "lg:justify-center lg:px-0"
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#ED2618] shadow-sm" />
                    )}

                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive
                          ? "text-[#ED2618] dark:text-rose-400"
                          : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                      )}
                    />

                    {(!isCollapsed || mobileOpen) && (
                      <span className="flex-1">{item.title}</span>
                    )}

                    {(!isCollapsed || mobileOpen) && item.badge && (
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                          isActive
                            ? "bg-red-200/60 text-red-700 dark:bg-rose-500/20 dark:text-rose-300"
                            : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Profile & Logout Footer */}
        <div className="border-t border-slate-200/80 dark:border-white/[0.08] p-3">
          <div
            className={cn(
              "flex items-center justify-between rounded-xl p-2",
              isCollapsed && "lg:justify-center lg:p-1"
            )}
          >
            {(!isCollapsed || mobileOpen) && (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-500/15 text-[#ED2618] dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-500/20">
                  {user?.fullName?.charAt(0) || "A"}
                </div>
                <div className="overflow-hidden">
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                    {user?.fullName || "Team Member"}
                  </p>
                  <p className="truncate text-[10px] text-slate-400">
                    {user?.email || "Dexta Africa"}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              title="Sign out"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-[#ED2618] dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
