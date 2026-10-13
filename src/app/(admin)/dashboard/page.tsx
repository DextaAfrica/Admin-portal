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
} from "lucide-react";
import { StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TelemetryChart, RadialGauge } from "@/components/ui/TelemetryChart";
import { formatBytes, timeAgo } from "@/lib/utils";

export default async function DashboardPage() {
  // Real Database Aggregations & Recent Records
  const [
    totalUsers,
    mfaUsers,
    storageAggregate,
    totalSubscribers,
    campaignsSent,
    totalCampaigns,
    totalEndpoints,
    healthyEndpoints,
    recentAssets,
    recentCampaigns,
    teamMembers,
    recentLogs,
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
  ]);

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
            <Badge variant="success" pulse>
              All Systems Ready
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitor company documents, client outreach campaigns, team access,
            and recent workspace activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/storage">
            <Button
              size="sm"
              variant="primary"
              leftIcon={<UploadCloud className="h-4 w-4" />}
            >
              Upload File
            </Button>
          </Link>
          <Link href="/marketing/campaigns">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Send className="h-4 w-4" />}
            >
              New Campaign
            </Button>
          </Link>
          <Link href="/users">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<UserPlus className="h-4 w-4" />}
            >
              Add Member
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Files & Documents"
          value={formatBytes(totalStorageBytes)}
          icon={<HardDrive className="h-5 w-5" />}
          trend={{
            value: `${totalStorageFiles} Saved Files`,
            isPositive: true,
          }}
          description="Company storage library"
        />

        <StatCard
          title="Client Contacts"
          value={totalSubscribers}
          icon={<Users className="h-5 w-5" />}
          trend={{
            value: `${campaignsSent} Updates Sent`,
            isPositive: true,
          }}
          description="Active mailing audience"
        />

        <StatCard
          title="Team Security"
          value={`${mfaPercent}%`}
          icon={<ShieldCheck className="h-5 w-5" />}
          trend={{
            value: `${mfaUsers} of ${totalUsers} Protected`,
            isPositive: true,
          }}
          description="Two-step verification"
        />

        <StatCard
          title="Connected Services"
          value={
            totalEndpoints > 0
              ? `${Math.round((healthyEndpoints / totalEndpoints) * 100)}%`
              : "100%"
          }
          icon={<Radio className="h-5 w-5" />}
          trend={{
            value: `${healthyEndpoints} Active`,
            isPositive: true,
          }}
          description="Service connections online"
        />
      </div>

      {/* Main 12-Column Structured Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns: Activity Chart + Recent Files + Recent Campaigns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Weekly Workspace Activity Card */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#ED2618]" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Weekly Workspace Activity
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Summary of file uploads, client outreach, and team actions over
                  the past 7 days
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Files: </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {totalStorageFiles}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Campaigns: </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {totalCampaigns}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2">
              <TelemetryChart />
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
                    Latest files uploaded to your company storage
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
                    Recent Email Campaigns
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Client announcements and newsletter dispatches
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
                  No email campaigns created yet.
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

            <div className="py-6 grid grid-cols-2 gap-4">
              <RadialGauge
                percentage={mfaPercent}
                label="Team Protected"
                sublabel={`${mfaUsers} of ${totalUsers} members`}
                size={105}
              />
              <RadialGauge
                percentage={storagePercent}
                label="Storage Used"
                sublabel="50 GB limit"
                size={105}
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
                  Security Settings
                </Button>
              </Link>
              <Link href="/storage" className="w-full">
                <Button
                  size="xs"
                  variant="outline"
                  className="w-full"
                  leftIcon={<UploadCloud className="h-3.5 w-3.5" />}
                >
                  Manage Files
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
                  Recent Activity
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Latest actions across the portal
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
                  No recent activity.
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
