import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  HardDrive,
  Mail,
  ShieldCheck,
  Radio,
  ArrowRight,
  UploadCloud,
  UserPlus,
  KeyRound,
  TrendingUp,
  FileText,
  Users,
  CheckCircle2,
  FolderOpen,
  Send,
  Building2,
  MessageSquare,
  Globe,
  BookOpen,
  Briefcase,
  Layers,
} from "lucide-react";
import { StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TelemetryChart, RadialGauge } from "@/components/ui/TelemetryChart";
import { formatBytes, timeAgo } from "@/lib/utils";
import { backendApi } from "@/lib/backend-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  // 1. Calculate Real 7-Day Activity Aggregation from AuditLog
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // 2. Query Local Database Records & Aggregations with safe fallback
  let totalUsers = 0;
  let mfaUsers = 0;
  let storageAggregate: { _sum: { fileSize: number | null }; _count: { id: number } } = {
    _sum: { fileSize: 0 },
    _count: { id: 0 },
  };
  let totalSubscribers = 0;
  let campaignsSent = 0;
  let totalCampaigns = 0;
  let totalEndpoints = 0;
  let healthyEndpoints = 0;
  let recentAssets: any[] = [];
  let recentCampaigns: any[] = [];
  let teamMembers: any[] = [];
  let recentLogs: any[] = [];
  let pastWeekLogs: { createdAt: Date }[] = [];

  try {
    const [
      tu,
      mu,
      sa,
      ts,
      cs,
      tc,
      te,
      he,
      ra,
      rc,
      tm,
      rl,
      pwl,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { twoFactorEnabled: true } }),
      prisma.storageAsset.aggregate({
        _sum: { fileSize: true },
        _count: { id: true },
      }),
      prisma.audienceSubscriber.count(),
      prisma.emailCampaign.count({ where: { status: "SENT" } }),
      prisma.emailCampaign.count(),
      prisma.apiEndpoint.count(),
      prisma.apiEndpoint.count({ where: { healthStatus: "HEALTHY" } }),
      prisma.storageAsset.findMany({
        take: 4,
        orderBy: { createdAt: "desc" },
      }),
      prisma.emailCampaign.findMany({
        take: 4,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        take: 4,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

    totalUsers = tu;
    mfaUsers = mu;
    storageAggregate = sa;
    totalSubscribers = ts;
    campaignsSent = cs;
    totalCampaigns = tc;
    totalEndpoints = te;
    healthyEndpoints = he;
    recentAssets = ra;
    recentCampaigns = rc;
    teamMembers = tm;
    recentLogs = rl;
    pastWeekLogs = pwl;
  } catch (error) {
    console.warn("[Dashboard] Database queries deferred or unavailable during initial bootstrap:", error);
  }

  // Aggregate past week's audit logs by day of week
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayBuckets: Record<string, number> = {};

  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dayName = daysOfWeek[d.getDay()];
    dayBuckets[dayName] = 0;
  }

  for (const log of pastWeekLogs) {
    const dayName = daysOfWeek[new Date(log.createdAt).getDay()];
    if (dayBuckets[dayName] !== undefined) {
      dayBuckets[dayName] += 1;
    }
  }

  const weeklyActivityData = Object.entries(dayBuckets).map(([label, value]) => ({
    label,
    value,
  }));

  // 3. Query Go Core Backend API Surface with zero crash fallback
  const [
    backendHealthRes,
    portfolioRes,
    enquiriesRes,
    contentRes,
    journalRes,
  ] = await Promise.allSettled([
    backendApi.health(),
    backendApi.portfolio.list({ perPage: 1 }),
    backendApi.enquiries.list({ perPage: 1 }),
    backendApi.content.list(),
    backendApi.journal.list({ perPage: 1 }),
  ]);

  const backendHealthy =
    backendHealthRes.status === "fulfilled" &&
    backendHealthRes.value.status === "HEALTHY";
  const backendLatency =
    backendHealthRes.status === "fulfilled" ? backendHealthRes.value.latencyMs : 0;

  const portfolioCount =
    portfolioRes.status === "fulfilled"
      ? portfolioRes.value.meta.totalItems
      : 0;

  const enquiriesCount =
    enquiriesRes.status === "fulfilled"
      ? enquiriesRes.value.meta.totalItems
      : 0;

  const contentCount =
    contentRes.status === "fulfilled"
      ? (contentRes.value.data || []).length
      : 0;

  const journalCount =
    journalRes.status === "fulfilled"
      ? journalRes.value.meta.totalItems
      : 0;

  const mfaPercent =
    totalUsers > 0 ? Math.round((mfaUsers / totalUsers) * 100) : 0;
  const totalStorageBytes = storageAggregate._sum.fileSize || 0;
  const totalStorageFiles = storageAggregate._count.id || 0;

  const maxQuotaBytes = 50 * 1024 * 1024 * 1024;
  const storagePercent =
    Math.min(Math.round((totalStorageBytes / maxQuotaBytes) * 100), 100) || 1;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Executive Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Executive Overview
            </h1>
            <Badge
              variant={backendHealthy ? "success" : "warning"}
              pulse={backendHealthy}
            >
              {backendHealthy
                ? `Core Backend Connected (${backendLatency}ms)`
                : "Backend Syncing..."}
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitor real estate developments, client investment leads, editorial content, and enterprise security.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/portfolio">
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Building2 className="h-4 w-4" />}
            >
              Developments
            </Button>
          </Link>
          <Link href="/enquiries">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<MessageSquare className="h-4 w-4" />}
            >
              Client Leads
            </Button>
          </Link>
          <Link href="/content">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Globe className="h-4 w-4" />}
            >
              Editorial CMS
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Real Estate & Core Business KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/portfolio" className="block group">
          <StatCard
            title="Portfolio Assets"
            value={portfolioCount}
            icon={<Building2 className="h-5 w-5 text-[#ED2618]" />}
            trend={{
              value: "Live Active",
              isPositive: true,
            }}
            description="Landmark real estate projects"
          />
        </Link>

        <Link href="/enquiries" className="block group">
          <StatCard
            title="Client Inquiries"
            value={enquiriesCount}
            icon={<MessageSquare className="h-5 w-5 text-red-600" />}
            trend={{
              value: "Investor Leads",
              isPositive: true,
            }}
            description="Property inquiries & leads"
          />
        </Link>

        <Link href="/content" className="block group">
          <StatCard
            title="Editorial CMS"
            value={contentCount}
            icon={<Globe className="h-5 w-5 text-sky-500" />}
            trend={{
              value: "Edge Synced",
              isPositive: true,
            }}
            description="Active web schema pages"
          />
        </Link>

        <Link href="/journal" className="block group">
          <StatCard
            title="Market Insights"
            value={journalCount}
            icon={<BookOpen className="h-5 w-5 text-emerald-500" />}
            trend={{
              value: "Published",
              isPositive: true,
            }}
            description="Published research pieces"
          />
        </Link>
      </div>

      {/* Secondary Operations KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Files & Media Assets"
          value={formatBytes(totalStorageBytes)}
          icon={<HardDrive className="h-5 w-5" />}
          trend={{
            value: `${totalStorageFiles} Documents`,
            isPositive: true,
          }}
          description="Cloud asset library"
        />

        <StatCard
          title="Subscriber Reach"
          value={totalSubscribers}
          icon={<Users className="h-5 w-5" />}
          trend={{
            value: `${campaignsSent} Updates Sent`,
            isPositive: true,
          }}
          description="Client & investor audience"
        />

        <StatCard
          title="Team MFA Protection"
          value={`${mfaPercent}%`}
          icon={<ShieldCheck className="h-5 w-5" />}
          trend={{
            value: `${mfaUsers} of ${totalUsers} Protected`,
            isPositive: true,
          }}
          description="Two-step authenticator active"
        />
      </div>

      {/* Main 12-Column Structured Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns: Dynamic Activity Chart + Recent Files + Recent Campaigns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Weekly Workspace Activity Card with REAL Dynamic Aggregations */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#ED2618]" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Weekly Workspace Operations
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Real audit log activity, content mutations, and administrative logins over the past 7 days
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Past 7 Days: </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {pastWeekLogs.length} actions
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2">
              <TelemetryChart data={weeklyActivityData} />
            </div>
          </div>

          {/* Recent Company Files Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/10 text-[#ED2618]">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Recent Files &amp; Documents
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Latest media assets uploaded to cloud storage
                  </p>
                </div>
              </div>

              <Link href="/storage">
                <Button
                  size="xs"
                  variant="ghost"
                  rightIcon={<ArrowRight className="h-3 w-3" />}
                >
                  View All Files
                </Button>
              </Link>
            </div>

            <div className="mt-3 divide-y divide-slate-100 dark:divide-white/[0.05]">
              {recentAssets.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">
                  No files uploaded yet.
                </p>
              ) : (
                recentAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between py-3 gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-300">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {asset.fileName}
                        </p>
                        <p className="text-[11px] text-slate-400 capitalize">
                          Folder: {asset.folder} &bull;{" "}
                          {formatBytes(asset.fileSize)}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400 shrink-0">
                      {timeAgo(asset.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Email Campaigns Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/10 text-[#ED2618]">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Client Communications
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Announcements and portfolio brochures
                  </p>
                </div>
              </div>

              <Link href="/marketing/campaigns">
                <Button
                  size="xs"
                  variant="ghost"
                  rightIcon={<ArrowRight className="h-3 w-3" />}
                >
                  All Campaigns
                </Button>
              </Link>
            </div>

            <div className="mt-3 divide-y divide-slate-100 dark:divide-white/[0.05]">
              {recentCampaigns.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">
                  No email campaigns dispatched yet.
                </p>
              ) : (
                recentCampaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="flex items-center justify-between py-3 gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {camp.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Subject: {camp.subject}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        variant={
                          camp.status === "SENT" ? "success" : "default"
                        }
                      >
                        {camp.status}
                      </Badge>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        {camp.recipientCount} recipients
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Gauges + Team Directory + Activity Log */}
        <div className="lg:col-span-4 space-y-6">
          {/* Storage & Protection Gauges */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm">
            <div className="pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Workspace Capacity &amp; Security
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current team protection and file storage usage
              </p>
            </div>

            <div className="py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 justify-items-center">
              <RadialGauge
                percentage={mfaPercent}
                label="Team Protected"
                sublabel={`${mfaUsers} of ${totalUsers} members`}
                size={92}
              />
              <RadialGauge
                percentage={storagePercent}
                label="Storage Used"
                sublabel="50 GB limit"
                size={92}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <Link href="/security" className="w-full">
                <Button
                  size="xs"
                  variant="secondary"
                  className="w-full"
                  leftIcon={<KeyRound className="h-3.5 w-3.5" />}
                >
                  Security
                </Button>
              </Link>
              <Link href="/storage" className="w-full">
                <Button
                  size="xs"
                  variant="outline"
                  className="w-full"
                  leftIcon={<UploadCloud className="h-3.5 w-3.5" />}
                >
                  Files
                </Button>
              </Link>
            </div>
          </div>

          {/* Active Team Members Card */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Team Directory
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Authorized workspace members
                </p>
              </div>
              <Link href="/users">
                <Button size="xs" variant="ghost">
                  Manage
                </Button>
              </Link>
            </div>

            <div className="mt-3 space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/10 text-[#ED2618] font-bold text-xs border border-red-100 dark:border-red-500/20">
                      {member.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {member.fullName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  {member.twoFactorEnabled && (
                    <span
                      title="Two-Step Verified"
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity History Card */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recent Audit Activity
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Compliance and operational logs
                </p>
              </div>
              <Link href="/audit-logs">
                <Button size="xs" variant="ghost">
                  All History
                </Button>
              </Link>
            </div>

            <div className="mt-3 divide-y divide-slate-100 dark:divide-white/[0.05]">
              {recentLogs.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-500">
                  No recent activity recorded.
                </p>
              ) : (
                recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {log.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {log.actorEmail || "Team Member"}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {timeAgo(log.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
