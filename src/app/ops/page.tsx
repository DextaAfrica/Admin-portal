"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  HardHat,
  Users,
  DollarSign,
  ArrowRight,
  LogIn,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Layers,
  Sparkles,
  TrendingUp,
  MapPin,
  Clock,
  ChevronRight,
  ExternalLink,
  Flame,
  Radio,
  BarChart3,
  Search,
  Zap,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import { DextaLogo } from "@/components/ui/DextaLogo";
import { cn } from "@/lib/utils";

// Operational Suites for the Interactive Live Console
type OperationalDepartment = "projects" | "capital" | "treasury" | "workforce";

interface DepartmentData {
  id: OperationalDepartment;
  label: string;
  shortTag: string;
  icon: React.ElementType;
  headline: string;
  metric1Label: string;
  metric1Val: string;
  metric2Label: string;
  metric2Val: string;
  statusBadge: string;
  statusPulse: boolean;
  projects: Array<{
    name: string;
    location: string;
    stage: string;
    progress: number;
    budgetStatus: string;
  }>;
  quickActionText: string;
  loginDeptQuery: string;
}

const OPERATIONAL_SUITES: Record<OperationalDepartment, DepartmentData> = {
  projects: {
    id: "projects",
    label: "Project Execution",
    shortTag: "CIVIL & REAL ESTATE",
    icon: Building2,
    headline: "Landmark Coastal & Urban Tower Deliveries",
    metric1Label: "Active Sites",
    metric1Val: "14 Developments",
    metric2Label: "Avg Delivery Pace",
    metric2Val: "98.4% On Schedule",
    statusBadge: "Sites Operational",
    statusPulse: true,
    projects: [
      {
        name: "Atlantic Pearl Tower (Phase II)",
        location: "Eko Atlantic, Lagos",
        stage: "Structural Core Level 24",
        progress: 88,
        budgetStatus: "On Budget",
      },
      {
        name: "Victoria Commercial District",
        location: "Victoria Island, Lagos",
        stage: "Facade Glazing & MEP",
        progress: 72,
        budgetStatus: "Audited",
      },
      {
        name: "Savannah Tech Logistics Park",
        location: "Nairobi Corridor, Kenya",
        stage: "Foundation & Groundworks",
        progress: 35,
        budgetStatus: "Phase 1 Verified",
      },
    ],
    quickActionText: "Open Projects Desk",
    loginDeptQuery: "OPERATIONS",
  },
  capital: {
    id: "capital",
    label: "Capital & Deals",
    shortTag: "INSTITUTIONAL CRM",
    icon: Briefcase,
    headline: "Institutional Sovereign & Real Estate Deal Flow",
    metric1Label: "Active Pipeline",
    metric1Val: "$185M+ Tracked",
    metric2Label: "Syndicate Partners",
    metric2Val: "38 Global Funds",
    statusBadge: "Capital Synchronized",
    statusPulse: true,
    projects: [
      {
        name: "Consortium Sovereign Wealth Fund",
        location: "London & Dubai Syndicate",
        stage: "Term Sheet Due Diligence",
        progress: 92,
        budgetStatus: "$65M Allocation",
      },
      {
        name: "West Africa Infrastructure Debt Fund",
        location: "Lagos Hub",
        stage: "Contract Closing",
        progress: 85,
        budgetStatus: "$40M Allocation",
      },
      {
        name: "Pan-African Urban Equity Pool",
        location: "Nairobi & Johannesburg",
        stage: "Institutional Roadshow",
        progress: 60,
        budgetStatus: "$80M Target",
      },
    ],
    quickActionText: "Open Capital Desk",
    loginDeptQuery: "EXECUTIVE",
  },
  treasury: {
    id: "treasury",
    label: "Treasury & Finance",
    shortTag: "DISBURSEMENTS & AUDIT",
    icon: DollarSign,
    headline: "Milestone-Linked Procurement & Fiscal Governance",
    metric1Label: "Disbursement Cycle",
    metric1Val: "24-48 Hr Turnaround",
    metric2Label: "Leakage Audit",
    metric2Val: "0.00% Variance",
    statusBadge: "Ledger Reconciled",
    statusPulse: true,
    projects: [
      {
        name: "Concrete & Steel Batching Batch #18",
        location: "Atlantic Pearl Tower",
        stage: "Milestone Verified & Cleared",
        progress: 100,
        budgetStatus: "Disbursed",
      },
      {
        name: "Heavy Machinery Fleet Lease",
        location: "Nairobi Logistics Hub",
        stage: "Fiscal Approval Stage 2",
        progress: 68,
        budgetStatus: "Pending Treasury Sign-off",
      },
      {
        name: "Architectural Engineering Retainer",
        location: "All Development Hubs",
        stage: "Monthly Milestone Audit",
        progress: 94,
        budgetStatus: "Cleared",
      },
    ],
    quickActionText: "Open Treasury Desk",
    loginDeptQuery: "FINANCE",
  },
  workforce: {
    id: "workforce",
    label: "Field Workforce",
    shortTag: "PEOPLE & COMPLIANCE",
    icon: Users,
    headline: "Field Engineers, Vault Contracts & Safety Operations",
    metric1Label: "Field Personnel",
    metric1Val: "1,280+ Active Staff",
    metric2Label: "Safety Compliance",
    metric2Val: "100% Zero-Harm",
    statusBadge: "Vault Verified",
    statusPulse: true,
    projects: [
      {
        name: "Eko Atlantic Engineering Division",
        location: "Lagos, Nigeria",
        stage: "Shift Active (620 Personnel)",
        progress: 96,
        budgetStatus: "Biometric Pass Verified",
      },
      {
        name: "Civil Architecture & Survey Fleet",
        location: "Accra & Nairobi",
        stage: "On-site Field Survey",
        progress: 84,
        budgetStatus: "Fully Certified",
      },
      {
        name: "Safety & Emergency Response Unit",
        location: "All Active Sites",
        stage: "Continuous 24/7 Watch",
        progress: 100,
        budgetStatus: "Zero Incidents",
      },
    ],
    quickActionText: "Open Workforce Desk",
    loginDeptQuery: "HR",
  },
};

// Regional Hubs
interface HubData {
  id: string;
  city: string;
  country: string;
  developments: number;
  capital: string;
  lead: string;
  status: string;
}

const REGIONAL_HUBS: HubData[] = [
  {
    id: "lagos",
    city: "Lagos Gateway",
    country: "Nigeria",
    developments: 8,
    capital: "$115M Active",
    lead: "Atlantic Delivery Unit",
    status: "Primary Hub",
  },
  {
    id: "nairobi",
    city: "Nairobi Hub",
    country: "Kenya",
    developments: 4,
    capital: "$42M Active",
    lead: "East Africa Engineering",
    status: "Expanding",
  },
  {
    id: "accra",
    city: "Accra District",
    country: "Ghana",
    developments: 3,
    capital: "$28M Active",
    lead: "Coastal Projects Desk",
    status: "Active",
  },
  {
    id: "kigali",
    city: "Kigali Gateway",
    country: "Rwanda",
    developments: 2,
    capital: "$16M Active",
    lead: "Sustainable Logistics Unit",
    status: "Active",
  },
];

export default function OperationsPortalLandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<OperationalDepartment>("projects");
  const [activeHub, setActiveHub] = React.useState<string>("lagos");
  const [fastEmail, setFastEmail] = React.useState<string>("");
  const [currentTime, setCurrentTime] = React.useState<string>("");

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Africa/Lagos",
        }) + " WAT"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFastPassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastEmail.trim()) {
      router.push("/ops/login");
      return;
    }
    router.push(`/ops/login?email=${encodeURIComponent(fastEmail.trim())}`);
  };

  const currentSuite = OPERATIONAL_SUITES[activeTab];
  const CurrentIcon = currentSuite.icon;
  const currentHubData = REGIONAL_HUBS.find((h) => h.id === activeHub) || REGIONAL_HUBS[0];

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black overflow-x-hidden font-sans">
      {/* Background Ambient Glow & Grid - Dexta Gold & Slate */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/[0.07] blur-[140px] rounded-full" />
        <div className="absolute top-[35%] -right-32 w-[450px] h-[350px] bg-amber-500/[0.04] blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Top Operations Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-amber-500/20 bg-[#070A0F]/85 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <Link href="/ops" className="flex items-center shrink-0 group">
              <DextaLogo className="h-8 sm:h-9 w-auto transition-transform group-hover:scale-[1.02]" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-3">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-wider text-amber-400 uppercase">
                Operations Gateway
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3.5">
            {/* Quick Portal Switchers */}
            <Link
              href="/crm-portal"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:border-amber-500/40 hover:bg-white/[0.04] transition-all"
            >
              <Briefcase className="h-3.5 w-3.5 text-amber-400" />
              <span>CRM Portal</span>
            </Link>

            <Link
              href="/admin-portal"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-400 hover:text-white hover:border-white/25 hover:bg-white/[0.04] transition-all"
            >
              <span>Systems IT Portal &rarr;</span>
            </Link>

            {/* Quick Access Sign-In Button */}
            <button
              type="button"
              onClick={() => router.push("/ops/login")}
              className="inline-flex items-center justify-center gap-2 h-10 rounded-xl px-4 sm:px-5 text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <LogIn className="h-4 w-4 shrink-0" />
              <span>Sign In to Ops</span>
            </button>

            {/* Create Account Profile */}
            <button
              type="button"
              onClick={() => router.push("/ops/register")}
              className="inline-flex items-center justify-center gap-2 h-10 rounded-xl px-3.5 sm:px-4 text-xs sm:text-sm font-bold border border-amber-500/35 bg-white/[0.03] text-white hover:bg-amber-500/10 hover:border-amber-500 transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="hidden sm:inline">Create Ops Profile</span>
              <span className="inline sm:hidden">Register</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Operations Hero & Interactive Deck */}
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-10 py-8 sm:py-12 space-y-14">
        {/* Live Operational Ticker Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-5 rounded-2xl border border-amber-500/25 bg-[#0C1017]/90 backdrop-blur-md shadow-lg shadow-black/40">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              FLEET ONLINE
            </span>
            <div className="text-xs text-slate-300 font-medium">
              <span className="text-amber-400 font-bold font-mono">14 Active Developments</span> Across West &amp; East Africa
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
            <div className="hidden sm:flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-400/80" />
              <span>{currentTime || "12:00:00 WAT"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Audited Database Telemetry</span>
              <span className="inline md:hidden">Live Sync</span>
            </div>
          </div>
        </div>

        {/* Hero Section Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: Human-Centered Operational Gateway */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400">
                Enterprise Operations Command
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-white leading-[1.12]">
                Streamlined Operations for Africa’s Landmark Developments.
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Connect field engineers, institutional capital syndicates, and financial governance in one unified, real-time command suite. Fast, frictionless, zero guesswork.
              </p>
            </div>

            {/* Instant Fast-Pass Sign-In Bar (User Centered & Direct Access) */}
            <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#0F1420] to-[#0A0D14] shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" /> Fast-Pass Desk Access
                </span>
                <span className="text-[11px] text-slate-400">Direct Work Routing</span>
              </div>

              <form onSubmit={handleFastPassSubmit} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="email"
                    value={fastEmail}
                    onChange={(e) => setFastEmail(e.target.value)}
                    placeholder="Enter work email (e.g. director@dextaafrica.org)..."
                    className="w-full h-11 px-3.5 text-xs sm:text-sm bg-black/50 border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans"
                  />
                </div>
                <button
                  type="submit"
                  className="h-11 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 cursor-pointer shrink-0"
                >
                  <span>Enter Desk</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-400">Quick Department Jumps:</span>
                {(
                  [
                    { name: "Projects", dept: "OPERATIONS" },
                    { name: "Capital", dept: "EXECUTIVE" },
                    { name: "Treasury", dept: "FINANCE" },
                    { name: "Workforce", dept: "HR" },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => router.push(`/ops/login?department=${d.dept}`)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/[0.04] hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-white/10 hover:border-amber-500/40 transition-all cursor-pointer"
                  >
                    {d.name} &rarr;
                  </button>
                ))}
              </div>
            </div>

            {/* Department Interactive Switcher Buttons */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-slate-400 block">
                Interactive Console Mode: Select to Inspect Live Workflow
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    { id: "projects", label: "🏗️ Projects" },
                    { id: "capital", label: "💼 Capital" },
                    { id: "treasury", label: "💰 Treasury" },
                    { id: "workforce", label: "👷 Workforce" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "h-10 px-2 rounded-xl text-xs font-bold transition-all border text-center flex items-center justify-center cursor-pointer",
                      activeTab === tab.id
                        ? "bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20 font-extrabold"
                        : "bg-white/[0.03] text-slate-300 border-white/10 hover:border-amber-500/40 hover:bg-white/[0.06]"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trust and Compliance Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                <span>Zero-Trust RBAC Governance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Complete Audit Trail</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Live Operations Console */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#0E1420] to-[#0A0D15] p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-5">
              {/* Top Console Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <CurrentIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {currentSuite.label}
                      </h3>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                        {currentSuite.shortTag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{currentSuite.headline}</p>
                  </div>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {currentSuite.statusBadge}
                </span>
              </div>

              {/* Dynamic Live KPI Telemetry Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
                    {currentSuite.metric1Label}
                  </span>
                  <div className="text-base sm:text-lg font-extrabold text-white font-sans">
                    {currentSuite.metric1Val}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
                    {currentSuite.metric2Label}
                  </span>
                  <div className="text-base sm:text-lg font-extrabold text-amber-400 font-sans">
                    {currentSuite.metric2Val}
                  </div>
                </div>
              </div>

              {/* Active Real-Time Workstream Projects List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                  <span>Current Monitored Pipeline</span>
                  <span className="text-amber-400 font-mono text-[11px]">Live Stream</span>
                </div>

                {currentSuite.projects.map((item, idx) => (
                  <div
                    key={item.name}
                    className="p-3.5 rounded-2xl bg-[#080B10]/80 border border-white/10 hover:border-amber-500/40 transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                          <span>{item.location}</span>
                          <span>&bull;</span>
                          <span className="text-slate-300 font-medium">{item.stage}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/[0.06] text-amber-400 border border-white/10 shrink-0">
                        {item.budgetStatus}
                      </span>
                    </div>

                    {/* Progress Bar Animation */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Milestone Execution</span>
                        <span className="font-bold text-slate-200">{item.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-700 ease-out"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Direct Launch CTA for this Suite */}
              <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400 font-mono">
                  Role Routing: <strong className="text-white font-bold">{currentSuite.loginDeptQuery}</strong>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(`/ops/login?department=${currentSuite.loginDeptQuery}`)
                  }
                  className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 cursor-pointer"
                >
                  <span>{currentSuite.quickActionText}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Regional Hub Operations Radar & Telemetry */}
        <div className="rounded-3xl border border-white/10 bg-[#0A0E17]/90 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-widest mb-1.5">
                <Radio className="h-3.5 w-3.5 animate-pulse" /> Pan-African Hub Operations
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Active Regional Operational Gateways
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                Real-time regional telemetry coordinating local architecture, contractors, and municipal compliance across key African metropolitan centers.
              </p>
            </div>

            {/* Regional Hub Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {REGIONAL_HUBS.map((hub) => (
                <button
                  key={hub.id}
                  type="button"
                  onClick={() => setActiveHub(hub.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer",
                    activeHub === hub.id
                      ? "bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20 font-extrabold"
                      : "bg-white/[0.04] text-slate-300 border-white/10 hover:border-amber-500/40 hover:text-white"
                  )}
                >
                  {hub.city}
                </button>
              ))}
            </div>
          </div>

          {/* Regional Hub Snapshot Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Active Hub City</span>
              <div className="text-base font-bold text-white">{currentHubData.city}</div>
              <span className="text-xs text-amber-400 font-medium">{currentHubData.country}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Landmark Developments</span>
              <div className="text-base font-bold text-white">{currentHubData.developments} Active Sites</div>
              <span className="text-xs text-emerald-400 font-medium">100% Monitored</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Capital Deployment</span>
              <div className="text-base font-bold text-amber-400">{currentHubData.capital}</div>
              <span className="text-xs text-slate-300 font-medium">Milestone Allocated</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1 flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Field Leadership</span>
                <div className="text-sm font-bold text-white">{currentHubData.lead}</div>
              </div>
              <Link
                href="/ops/login"
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 pt-2"
              >
                <span>Launch Hub Desk</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Dedicated Operational Engines (Interactive Cards) */}
        <div className="space-y-6 pt-2">
          <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Operational Wings &amp; Departmental Engines
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Direct entry points tailored for field engineers, investment directors, treasury officers, and workforce leads.
              </p>
            </div>
            <Link
              href="/ops/register"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0"
            >
              <span>Onboard New Team Member &rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {(
              [
                {
                  icon: Building2,
                  tag: "CAPITAL & REAL ESTATE",
                  title: "Landmark Project Delivery",
                  desc: "End-to-end execution of coastal towers, commercial districts, and urban infrastructure with zero guesswork.",
                  stat: "High-Rise Execution",
                  badgeColor: "text-amber-400 border-amber-500/30 bg-amber-500/10",
                  dept: "OPERATIONS",
                },
                {
                  icon: Briefcase,
                  tag: "INSTITUTIONAL CRM",
                  title: "Strategic Capital & Deals",
                  desc: "Relationship ledger for sovereign wealth, pension syndicates, and high-net-worth real estate syndicates.",
                  stat: "Multi-Million Pipeline",
                  badgeColor: "text-red-400 border-red-500/30 bg-red-500/10",
                  dept: "EXECUTIVE",
                },
                {
                  icon: DollarSign,
                  tag: "TREASURY & PROCUREMENT",
                  title: "Financial Governance",
                  desc: "Milestone budgeting, vendor disbursement authorizations, and zero-leakage cashflow telemetry per site.",
                  stat: "Zero-Leakage Audit",
                  badgeColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
                  dept: "FINANCE",
                },
                {
                  icon: Users,
                  tag: "WORKFORCE LOGISTICS",
                  title: "People & Field Operations",
                  desc: "Verified vault contracts, engineer shift logistics, and automated biometric leave accounting.",
                  stat: "Direct Field Fleet",
                  badgeColor: "text-amber-400 border-amber-500/30 bg-amber-500/10",
                  dept: "HR",
                },
              ] as const
            ).map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="rounded-3xl border border-white/10 bg-[#0C1017]/90 p-6 flex flex-col justify-between space-y-4 hover:border-amber-500/50 hover:bg-[#0E1420] transition-all hover:-translate-y-1 shadow-lg hover:shadow-xl hover:shadow-amber-500/10 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.05] border border-white/10 text-amber-400 group-hover:bg-amber-500/15 group-hover:border-amber-500/30 transition-all">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={cn("text-[10px] font-bold font-mono px-2.5 py-1 rounded-full border", p.badgeColor)}>
                        {p.stat}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                        {p.tag}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1 group-hover:text-amber-300 transition-colors">
                        {p.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push(`/ops/login?department=${p.dept}`)}
                    className="inline-flex items-center justify-between w-full pt-3 border-t border-white/10 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <span>Launch Desk</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Operations Portal Footer */}
      <footer className="border-t border-white/10 bg-[#05070A] py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <DextaLogo className="h-6 w-auto" />
            <span>&copy; {new Date().getFullYear()} Dexta Africa Enterprise Operations</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-xs">
            <Link href="/ops/login" className="hover:text-white transition-colors">Ops Sign In</Link>
            <span>&bull;</span>
            <Link href="/ops/register" className="hover:text-white transition-colors">Establish Profile</Link>
            <span>&bull;</span>
            <Link href="/crm-portal" className="hover:text-white transition-colors">CRM Portal</Link>
            <span>&bull;</span>
            <Link href="/admin-portal" className="hover:text-white transition-colors">Systems Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
