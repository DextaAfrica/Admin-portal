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
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

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
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operations & Assets",
    items: [
      { title: "S3 Cloud Storage", href: "/storage", icon: HardDrive },
      { title: "Email Campaigns", href: "/marketing/campaigns", icon: Mail },
      { title: "Audience & Contacts", href: "/marketing/audience", icon: Users },
      { title: "Email Templates", href: "/marketing/templates", icon: FileCode2 },
    ],
  },
  {
    label: "Gateways",
    items: [
      { title: "API Endpoints", href: "/endpoints", icon: Radio, badge: "Live" },
    ],
  },
  {
    label: "Security & Governance",
    items: [
      { title: "Team & RBAC", href: "/users", icon: UserCheck },
      { title: "2FA & Sessions", href: "/security", icon: ShieldCheck, badge: "MFA" },
      { title: "Audit Trail", href: "/audit-logs", icon: FileText },
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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0d12] transition-all duration-300 z-30 select-none",
        isCollapsed ? "w-18" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] px-4">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white font-bold shadow-md shadow-red-500/25">
              D
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  Dexta Africa
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
              </div>
              <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                Operations Portal
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white font-bold shadow-md shadow-red-500/25">
            D
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-600 dark:hover:text-white transition-colors",
            isCollapsed && "hidden"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {isCollapsed && (
        <div className="flex justify-center py-2 border-b border-slate-200/60 dark:border-white/[0.05]">
          <button
            onClick={() => setIsCollapsed(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
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
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all",
                    isActive
                      ? "bg-rose-50 dark:bg-rose-500/10 text-red-600 dark:text-rose-400 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/[0.03] hover:text-slate-900 dark:hover:text-white",
                    isCollapsed && "justify-center px-0"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  {/* Left electric crimson indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-red-600 dark:bg-rose-500 shadow-sm" />
                  )}

                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive
                        ? "text-red-600 dark:text-rose-400"
                        : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                    )}
                  />

                  {!isCollapsed && <span className="flex-1">{item.title}</span>}

                  {!isCollapsed && item.badge && (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[9px] font-bold font-mono uppercase tracking-wider",
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
            isCollapsed && "justify-center p-1"
          )}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-500/15 text-red-700 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-500/20">
                {user?.fullName?.charAt(0) || "A"}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                  {user?.fullName || "Admin"}
                </p>
                <p className="truncate text-[10px] font-mono text-slate-400">
                  {user?.role || "SUPER_ADMIN"}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            title="Sign out"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-red-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

