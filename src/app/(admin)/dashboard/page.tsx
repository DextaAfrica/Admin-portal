import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Users,
  HardDrive,
  Mail,
  ShieldCheck,
  Radio,
  ArrowRight,
  UploadCloud,
  UserPlus,
  KeyRound,
  Activity,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Layers,
} from "lucide-react";
import { StatCard, Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TelemetryChart, RadialGauge } from "@/components/ui/TelemetryChart";
import { formatBytes, timeAgo, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  // Real DB aggregations
  const totalUsers = await prisma.user.count();
  const mfaUsers = await prisma.user.count({ where: { twoFactorEnabled: true } });
  const mfaPercent = totalUsers > 0 ? Math.round((mfaUsers / totalUsers) * 100) : 0;

  const storageAggregate = await prisma.storageAsset.aggregate({
    _sum: { fileSize: true },
    _count: { id: true },
  });
  const totalStorageBytes = storageAggregate._sum.fileSize || 0;
  const totalStorageFiles = storageAggregate._count.id || 0;

  // Max quota 50GB
  const maxQuotaBytes = 50 * 1024 * 1024 * 1024;
  const storagePercent = Math.min(Math.round((totalStorageBytes / maxQuotaBytes) * 100), 100) || 1;

  const totalSubscribers = await prisma.audienceSubscriber.count();
  const campaignsSent = await prisma.emailCampaign.count({ where: { status: "SENT" } });

  const totalEndpoints = await prisma.apiEndpoint.count();
  const healthyEndpoints = await prisma.apiEndpoint.count({ where: { healthStatus: "HEALTHY" } });

  const recentLogs = await prisma.auditLog.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Live Operational Status Strip with High-Tech Architecture Texture */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-lg shadow-red-500/25">
              <Cpu className="h-6 w-6" />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#121217]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Dexta Africa Infrastructure Grid
                </h4>
                <Badge variant="success" pulse>
                  Telemetry Online
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Core DB: <span className="text-emerald-600 dark:text-emerald-400 font-medium">SQLite Relational Engine</span> &bull; Bucket: <code className="font-mono text-slate-700 dark:text-slate-300">dexta-assets-storage</code> &bull; Cluster: <span className="font-mono text-xs text-red-600 dark:text-rose-400">AF-EAST-1</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/security">
              <Button size="sm" variant="primary" leftIcon={<ShieldCheck className="h-4 w-4" />}>
                Security Center
              </Button>
            </Link>
            <Link href="/storage">
              <Button size="sm" variant="secondary" leftIcon={<UploadCloud className="h-4 w-4" />}>
                Upload Asset
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="2FA Security Adoption"
          value={`${mfaPercent}%`}
          icon={<ShieldCheck className="h-5 w-5" />}
          trend={{ value: `${mfaUsers}/${totalUsers} Protected`, isPositive: true }}
          description="Privileged operation gate"
        />

        <StatCard
          title="Cloud S3 Assets"
          value={formatBytes(totalStorageBytes)}
          icon={<HardDrive className="h-5 w-5" />}
          trend={{ value: `${totalStorageFiles} Stored Files`, isPositive: true }}
          description="Direct presigned upload"
        />

        <StatCard
          title="Subscriber Reach"
          value={totalSubscribers}
          icon={<Mail className="h-5 w-5" />}
          trend={{ value: `${campaignsSent} Broadcasts Sent`, isPositive: true }}
          description="Marketing & notifications"
        />

        <StatCard
          title="API Gateway Health"
          value={totalEndpoints > 0 ? `${Math.round((healthyEndpoints / totalEndpoints) * 100)}%` : "100%"}
          icon={<Radio className="h-5 w-5" />}
          trend={{ value: `${healthyEndpoints} Nodes Online`, isPositive: true }}
          description="Average response ~41ms"
        />
      </div>

      {/* Interactive Visual Charts & Radial Gauges Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Operational Throughput Area Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-red-600 dark:text-rose-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Operational Throughput (7-Day Activity)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hourly API calls, S3 file writes, and marketing dispatches
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              +28.4% this week
            </span>
          </div>

          <div className="mt-4 pt-2">
            <TelemetryChart />
          </div>
        </div>

        {/* Right: Dual Circular Gauges */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100 dark:border-white/[0.06]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              System Health Gauges
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time resource allocation
            </p>
          </div>

          <div className="py-6 grid grid-cols-2 gap-4">
            <RadialGauge
              percentage={mfaPercent}
              label="2FA Coverage"
              sublabel={`${mfaUsers} of ${totalUsers} admins`}
              size={110}
            />
            <RadialGauge
              percentage={storagePercent}
              label="Storage Quota"
              sublabel="50GB allocation"
              size={110}
            />
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-white/[0.02] p-3 text-[11px] text-slate-500 font-mono text-center border border-slate-200/60 dark:border-white/[0.04]">
            Node Status: Optimal &bull; Zero Failures
          </div>
        </div>
      </div>

      {/* Quick Action Operations Strip */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
          Direct Infrastructure Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/security" className="block">
            <div className="group flex items-center gap-3.5 rounded-2xl border border-slate-200 dark:border-white/10 p-3.5 hover:border-red-500/40 hover:bg-rose-50/40 dark:hover:bg-rose-500/5 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10 text-red-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Configure 2FA</p>
                <p className="text-[11px] text-slate-500">Live QR & backup codes</p>
              </div>
            </div>
          </Link>

          <Link href="/storage" className="block">
            <div className="group flex items-center gap-3.5 rounded-2xl border border-slate-200 dark:border-white/10 p-3.5 hover:border-red-500/40 hover:bg-rose-50/40 dark:hover:bg-rose-500/5 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10 text-red-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Upload to S3</p>
                <p className="text-[11px] text-slate-500">Presigned direct uploads</p>
              </div>
            </div>
          </Link>

          <Link href="/marketing/campaigns" className="block">
            <div className="group flex items-center gap-3.5 rounded-2xl border border-slate-200 dark:border-white/10 p-3.5 hover:border-red-500/40 hover:bg-rose-50/40 dark:hover:bg-rose-500/5 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10 text-red-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">New Campaign</p>
                <p className="text-[11px] text-slate-500">Broadcast to audience</p>
              </div>
            </div>
          </Link>

          <Link href="/users" className="block">
            <div className="group flex items-center gap-3.5 rounded-2xl border border-slate-200 dark:border-white/10 p-3.5 hover:border-red-500/40 hover:bg-rose-50/40 dark:hover:bg-rose-500/5 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10 text-red-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Add Team Member</p>
                <p className="text-[11px] text-slate-500">RBAC tier assignment</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Live Compliance & Activity Feed */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Live Compliance & Audit Trail
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Immutable event log capturing authentication events, S3 assets, and administrative mutations
            </p>
          </div>
          <Link href="/audit-logs">
            <Button size="xs" variant="ghost" rightIcon={<ArrowRight className="h-3 w-3" />}>
              Full Trail View
            </Button>
          </Link>
        </div>

        <div className="mt-4 divide-y divide-slate-100 dark:divide-white/[0.04]">
          {recentLogs.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">No activity logged yet.</p>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-2 w-2 rounded-full bg-red-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {log.action}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        ({log.entity})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Actor: <span className="font-medium text-slate-700 dark:text-slate-300">{log.actorEmail || "System"}</span> &bull; IP: <code className="font-mono text-[10px]">{log.ipAddress}</code>
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  {timeAgo(log.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
