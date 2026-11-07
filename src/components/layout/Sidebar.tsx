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
  ChevronDown,
  Home,
  X,
  Building2,
  MessageSquare,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Landmark,
  KeyRound,
  HardHat,
  Check,
  Send,
  Layers,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DextaLogo } from "@/components/ui/DextaLogo";

export type PortalType = "operations" | "systems" | "executive" | "hr" | "finance";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  tabId?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface PortalConfig {
  id: PortalType;
  title: string;
  shortTitle: string;
  badge: string;
  subdomain: string;
  description: string;
  icon: React.ElementType;
  sections: NavSection[];
}

// 1. Operations Fleet Desk Navigation
const OPERATIONS_NAV: NavSection[] = [
  {
    label: "Operations Command",
    items: [
      { title: "Operations Overview", href: "/dashboard?tab=operations", tabId: "operations", icon: LayoutDashboard, badge: "Live" },
      { title: "Operations Public Landing", href: "/", icon: Home },
    ],
  },
  {
    label: "Site Deliveries & Projects",
    items: [
      { title: "Landmark Developments", href: "/portfolio", icon: Building2, badge: "Active" },
      { title: "Site Approvals & Clearances", href: "/dashboard?tab=approvals", tabId: "approvals", icon: CheckCircle2, badge: "Reqs" },
      { title: "Client Leads & Inquiries", href: "/enquiries", icon: MessageSquare, badge: "Leads" },
    ],
  },
  {
    label: "Logistics & Procurement",
    items: [
      { title: "Equipment & Asset Vault", href: "/storage", icon: HardDrive, badge: "S3" },
      { title: "Capital Procurement Deals", href: "/crm", icon: Briefcase, badge: "Deals" },
      { title: "Corporate Field Dispatch", href: "/dashboard?tab=dispatch", tabId: "dispatch", icon: Mail, badge: "SMTP" },
      { title: "Email Campaign Broadcasts", href: "/marketing", icon: Send, badge: "Broadcast" },
    ],
  },
  {
    label: "Field Workforce & Safety",
    items: [
      { title: "Field Operations Team", href: "/users", icon: Users },
      { title: "Site Safety & Key Access", href: "/security", icon: ShieldCheck },
      { title: "Site Incident Audit Logs", href: "/audit-logs", icon: FileText },
    ],
  },
];

// 2. Systems IT Command Navigation
const SYSTEMS_NAV: NavSection[] = [
  {
    label: "Systems Workspace",
    items: [
      { title: "IT Command Overview", href: "/dashboard?tab=systems", tabId: "systems", icon: LayoutDashboard, badge: "Gov" },
      { title: "Systems Landing", href: "/", icon: Home },
    ],
  },
  {
    label: "Zero-Trust Identity",
    items: [
      { title: "Identity & User Governance", href: "/users", icon: UserCheck, badge: "RBAC" },
      { title: "Security & Firewall Policies", href: "/it", icon: ShieldCheck, badge: "Enforced" },
      { title: "Account Protection & 2FA", href: "/security", icon: KeyRound },
      { title: "Immutable Audit Trails", href: "/audit-logs", icon: FileText },
    ],
  },
  {
    label: "Cloud & Microservices",
    items: [
      { title: "S3 Enterprise Storage Vault", href: "/storage", icon: HardDrive, badge: "AWS S3" },
      { title: "Connected Microservices", href: "/endpoints", icon: Radio, badge: "Live" },
      { title: "System Clearances", href: "/dashboard?tab=approvals", tabId: "approvals", icon: CheckCircle2 },
    ],
  },
  {
    label: "Web Core CMS",
    items: [
      { title: "Editorial CMS & Pages", href: "/content", icon: FileCode2 },
      { title: "Email Campaigns & Marketing", href: "/marketing", icon: Mail, badge: "SMTP" },
      { title: "Journal & Insights", href: "/journal", icon: BookOpen },
      { title: "Career Openings", href: "/careers", icon: Briefcase },
    ],
  },
];

// 3. MD / CEO Executive Command Navigation
const EXECUTIVE_NAV: NavSection[] = [
  {
    label: "Executive Leadership",
    items: [
      { title: "MD / CEO Command Suite", href: "/dashboard?tab=overview", tabId: "overview", icon: LayoutDashboard, badge: "CEO" },
      { title: "Enterprise Gateway", href: "/", icon: Home },
    ],
  },
  {
    label: "Sovereign Capital & Treasury",
    items: [
      { title: "Sovereign Deals Pipeline", href: "/crm", icon: Briefcase, badge: "Pipeline" },
      { title: "Enterprise Treasury & Inflow", href: "/dashboard?tab=treasury", tabId: "treasury", icon: Landmark, badge: "Ledger" },
      { title: "Landmark Developments", href: "/portfolio", icon: Building2 },
    ],
  },
  {
    label: "Enterprise Governance",
    items: [
      { title: "Clearance Authorizations", href: "/dashboard?tab=approvals", tabId: "approvals", icon: CheckCircle2, badge: "Clearance" },
      { title: "Corporate Dispatch & Broadcast", href: "/dashboard?tab=dispatch", tabId: "dispatch", icon: Mail, badge: "Broadcast" },
      { title: "Email Campaigns & Scheduling", href: "/marketing", icon: Send, badge: "Marketing" },
      { title: "Workforce & Culture", href: "/hr", icon: Users },
    ],
  },
  {
    label: "Infrastructure & Audit",
    items: [
      { title: "Systems & IT Security", href: "/it", icon: ShieldCheck },
      { title: "Executive Team Directory", href: "/users", icon: UserCheck },
      { title: "Global Compliance Logs", href: "/audit-logs", icon: FileText },
    ],
  },
];

// 4. People & HR Operations Navigation
const HR_NAV: NavSection[] = [
  {
    label: "People Workspace",
    items: [
      { title: "HR Command Overview", href: "/dashboard?tab=overview", tabId: "overview", icon: LayoutDashboard },
      { title: "Enterprise Gateway", href: "/", icon: Home },
    ],
  },
  {
    label: "Workforce & Culture",
    items: [
      { title: "HR Department & Records", href: "/hr", icon: Users, badge: "Staff" },
      { title: "Staff Directory", href: "/users", icon: UserCheck },
      { title: "Talent & Career Openings", href: "/careers", icon: Briefcase },
    ],
  },
  {
    label: "Inter-Department Requests",
    items: [
      { title: "Personnel Clearances", href: "/dashboard?tab=approvals", tabId: "approvals", icon: CheckCircle2, badge: "Reqs" },
      { title: "Internal Staff Dispatch", href: "/dashboard?tab=dispatch", tabId: "dispatch", icon: Mail },
      { title: "Access Key Provisioning", href: "/it", icon: ShieldCheck },
      { title: "Security & Protection", href: "/security", icon: ShieldCheck },
    ],
  },
];

// 5. Finance & Accounts Treasury Navigation
const FINANCE_NAV: NavSection[] = [
  {
    label: "Treasury & Capital",
    items: [
      { title: "Treasury Liquidity", href: "/dashboard?tab=treasury", tabId: "treasury", icon: Landmark, badge: "Ledger" },
      { title: "Capital & Inflow Ledger", href: "/dashboard?tab=treasury", tabId: "treasury", icon: DollarSign, badge: "Inflow" },
      { title: "Sovereign Deals Pipeline", href: "/crm", icon: Briefcase, badge: "Deals" },
    ],
  },
  {
    label: "Disbursements & Clearances",
    items: [
      { title: "Disbursement Approvals", href: "/dashboard?tab=approvals", tabId: "approvals", icon: CheckCircle2, badge: "Payouts" },
      { title: "Contractor Payout Ledger", href: "/dashboard?tab=treasury", tabId: "treasury", icon: FileText },
      { title: "Financial Audit Trail", href: "/audit-logs", icon: ShieldCheck },
    ],
  },
  {
    label: "Corporate Finance Dispatch",
    items: [
      { title: "Inter-Office Dispatch", href: "/dashboard?tab=dispatch", tabId: "dispatch", icon: Mail },
      { title: "Finance Team Directory", href: "/users", icon: Users },
    ],
  },
];

const PORTALS: Record<PortalType, PortalConfig> = {
  operations: {
    id: "operations",
    title: "Operations Fleet Desk",
    shortTitle: "Operations",
    badge: "Fleet Ops",
    subdomain: "ops.dextaafrica.org",
    description: "Landmark developments, logistics fleet, and site deliveries",
    icon: HardHat,
    sections: OPERATIONS_NAV,
  },
  systems: {
    id: "systems",
    title: "Systems IT Command",
    shortTitle: "Systems IT",
    badge: "Zero-Trust",
    subdomain: "admin.dextafrica.org",
    description: "Identity governance, watchdog shields, and cloud S3 assets",
    icon: ShieldCheck,
    sections: SYSTEMS_NAV,
  },
  executive: {
    id: "executive",
    title: "MD / CEO Executive Suite",
    shortTitle: "Executive",
    badge: "CEO Level",
    subdomain: "dextaafrica.org",
    description: "Sovereign capital, treasury balance, and cross-department clearance",
    icon: Landmark,
    sections: EXECUTIVE_NAV,
  },
  hr: {
    id: "hr",
    title: "People & Culture Desk",
    shortTitle: "People & HR",
    badge: "HR & People",
    subdomain: "dextaafrica.org",
    description: "Workforce directory, attendance, leaves, and staff dispatch",
    icon: Users,
    sections: HR_NAV,
  },
  finance: {
    id: "finance",
    title: "Finance & Accounts Desk",
    shortTitle: "Finance & Accounts",
    badge: "Treasury",
    subdomain: "dextaafrica.org",
    description: "Capital inflows, project disbursements, financial ledgers, and escrow",
    icon: Landmark,
    sections: FINANCE_NAV,
  },
};

export function Sidebar({
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
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [activeTabSearch, setActiveTabSearch] = React.useState<string>("");

  // Determine portal STRICTLY from authenticated account department & role
  // Zero dropdown switcher; zero localStorage manipulation.
  const dept = (user?.department || "").toUpperCase();
  const role = (user?.role || "").toUpperCase();

  const activePortal: PortalType = React.useMemo(() => {
    if (role === "SUPER_ADMIN" || dept === "EXECUTIVE") {
      return "executive";
    }
    if (dept === "FINANCE" || dept === "ACCOUNTING" || dept === "ACCOUNTS") {
      return "finance";
    }
    if (dept === "IT") {
      return "systems";
    }
    if (dept === "HR") {
      return "hr";
    }
    // Operations Manager & Operations Fleet
    return "operations";
  }, [dept, role]);

  // Sync activeTab from URL search parameters (?tab=...)
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const updateSearch = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveTabSearch(params.get("tab") || "");
    };
    updateSearch();
    window.addEventListener("popstate", updateSearch);
    return () => window.removeEventListener("popstate", updateSearch);
  }, []);

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

  const handleNavItemClick = (item: NavItem) => {
    if (item.tabId && pathname === "/dashboard") {
      window.dispatchEvent(new CustomEvent("dexta:switch-tab", { detail: item.tabId }));
      setActiveTabSearch(item.tabId === "dispatch" ? "communications" : item.tabId);
    }
    setMobileOpen(false);
  };

  const handleLogout = () => {
    setMobileOpen(false);
    window.dispatchEvent(new CustomEvent("dexta:prompt-signout"));
  };

  const currentConfig = PORTALS[activePortal] || PORTALS.operations;
  const CurrentIcon = currentConfig.icon;

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
              "hidden lg:inline-flex rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer",
              isCollapsed && "lg:hidden"
            )}
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Mobile Close Drawer Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-700 dark:hover:text-white cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isCollapsed && (
          <div className="hidden lg:flex justify-center py-2 border-b border-slate-200/60 dark:border-white/[0.05]">
            <button
              onClick={() => setIsCollapsed(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Verified Directorate & Enterprise Role Badge (Locked to Authenticated Account) */}
        <div className="border-b border-slate-200/80 dark:border-white/[0.08] p-3 bg-slate-50/60 dark:bg-white/[0.02]">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 px-1 py-0.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/15 text-[#ED2618] border border-red-200 dark:border-red-500/25">
                <CurrentIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentConfig.shortTitle}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-500/20 text-[#ED2618] dark:text-red-400 uppercase tracking-wider">
                    {currentConfig.badge}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
                  {currentConfig.subdomain}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={`${currentConfig.title} (${currentConfig.subdomain})`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/15 text-[#ED2618] border border-red-200 dark:border-red-500/25">
                <CurrentIcon className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Navigation Sections per Dashboard */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {currentConfig.sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <h5 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  {section.label}
                </h5>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                
                // Active route evaluation (including tab parameter matching)
                let isActive = false;
                if (item.href === "/") {
                  isActive = pathname === "/";
                } else if (item.tabId) {
                  isActive = pathname === "/dashboard" && (activeTabSearch === item.tabId || (!activeTabSearch && item.tabId === "overview"));
                } else {
                  isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => handleNavItemClick(item)}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all",
                      isActive
                        ? "bg-red-50 dark:bg-red-500/10 text-[#ED2618] dark:text-red-400 font-semibold"
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
                          ? "text-[#ED2618] dark:text-red-400"
                          : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                      )}
                    />

                    {(!isCollapsed || mobileOpen) && (
                      <span className="flex-1 truncate">{item.title}</span>
                    )}

                    {(!isCollapsed || mobileOpen) && item.badge && (
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                          isActive
                            ? "bg-red-200/60 text-red-700 dark:bg-red-500/20 dark:text-red-300"
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

        {/* User Profile & Full-Width Sign Out Button Footer */}
        <div className="border-t border-slate-200/80 dark:border-white/[0.08] p-3 space-y-2">
          {(!isCollapsed || mobileOpen) && (
            <div className="flex items-center gap-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] px-3 py-2 overflow-hidden border border-slate-100 dark:border-white/[0.05]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/15 text-[#ED2618] dark:text-red-400 font-bold text-xs border border-red-200 dark:border-red-500/20">
                {user?.fullName?.charAt(0) || "A"}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                  {user?.fullName || "Team Member"}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 truncate">
                    {user?.department || "Dexta"}
                  </span>
                  {user?.seniorityLevel && (
                    <span className="text-[8px] font-mono font-bold px-1 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 uppercase">
                      {user.seniorityLevel}
                    </span>
                  )}
                  <span className="text-[9px] font-mono font-bold px-1 rounded bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                    {user?.role || "STAFF"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out of Workspace"
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl border border-red-200/80 dark:border-red-500/20 bg-red-50/70 dark:bg-red-500/10 px-3 py-2.5 text-xs font-bold text-[#ED2618] dark:text-red-400 hover:bg-[#ED2618] hover:text-white dark:hover:bg-[#ED2618] dark:hover:text-white transition-all cursor-pointer",
              isCollapsed && !mobileOpen && "px-0"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {(!isCollapsed || mobileOpen) && (
              <span>Sign Out</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
