import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Mail,
  Calendar,
  Clock,
  Send,
  Users,
  LayoutTemplate,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Radio,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MarketingOverviewPage() {
  const [
    totalCampaigns,
    scheduledCampaigns,
    sentCampaigns,
    subscribersCount,
    recentCampaigns,
  ] = await Promise.all([
    prisma.emailCampaign.count(),
    prisma.emailCampaign.count({ where: { status: "SCHEDULED" } }),
    prisma.emailCampaign.count({ where: { status: "SENT" } }),
    prisma.audienceSubscriber.count({ where: { status: "SUBSCRIBED" } }),
    prisma.emailCampaign.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#ED2618] animate-pulse" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#ED2618]">
                Corporate Communications &bull; Marketing Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Email Marketing &amp; Scheduling Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Design, schedule, and broadcast corporate announcements, milestone achievements, and investor updates with zero-delay SMTP routing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/marketing/campaigns"
              className="inline-flex items-center gap-2 rounded-xl bg-[#ED2618] hover:bg-[#d01f12] text-white px-4 py-2.5 text-xs font-bold transition-all shadow-lg shadow-red-500/20"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Compose &amp; Schedule Campaign</span>
            </Link>
            <Link
              href="/marketing/audience"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#ED2618] hover:text-[#ED2618] transition-all"
            >
              <Users className="h-4 w-4" />
              <span>Audience Directory</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Scheduled Queue
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {scheduledCampaigns}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
              <Clock className="h-3.5 w-3.5" />
              <span>Awaiting Delivery Trigger</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Subscribed Audience
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {subscribersCount}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Verified Active Recipients</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Delivered Broadcasts
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Send className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {sentCampaigns}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Dispatched via SMTP</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Campaign Repository
            </span>
            <div className="p-2 rounded-xl bg-red-500/10 text-[#ED2618]">
              <Mail className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalCampaigns}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#ED2618] font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Total Drafts &amp; Dispatches</span>
            </div>
          </div>
        </div>
      </div>

      {/* Core Campaign Navigation & Quick Launch Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/marketing/campaigns"
          className="group p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm hover:border-[#ED2618] transition-all space-y-4 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-red-500/10 text-[#ED2618]">
              <Clock className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#ED2618] group-hover:translate-x-1 transition-all" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#ED2618] transition-colors">
              Campaign Delivery Scheduling
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Queue campaigns for automated delivery at specific calendar dates and times across global timezones.
            </p>
          </div>
        </Link>

        <Link
          href="/marketing/audience"
          className="group p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm hover:border-[#ED2618] transition-all space-y-4 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
              <Users className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#ED2618] group-hover:translate-x-1 transition-all" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#ED2618] transition-colors">
              Audience &amp; Segment Management
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Filter and organize target lists: staff teams, executive investors, field contractors, and public subscribers.
            </p>
          </div>
        </Link>

        <Link
          href="/marketing/templates"
          className="group p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] shadow-sm hover:border-[#ED2618] transition-all space-y-4 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#ED2618] group-hover:translate-x-1 transition-all" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#ED2618] transition-colors">
              Occasion &amp; Email Templates
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Curate reusable HTML email themes: project delivery announcements, weekly field briefs, and press notices.
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Campaign Ledger */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Email Campaign Queue
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time delivery status for latest draft, scheduled, and completed broadcasts.
            </p>
          </div>
          <Link
            href="/marketing/campaigns"
            className="text-xs font-bold text-[#ED2618] hover:underline inline-flex items-center gap-1"
          >
            <span>Open Scheduling Studio</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentCampaigns.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {recentCampaigns.map((camp) => (
              <div
                key={camp.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {camp.title}
                    </span>
                    <Badge
                      variant={
                        camp.status === "SENT"
                          ? "success"
                          : camp.status === "SCHEDULED"
                          ? "warning"
                          : "outline"
                      }
                    >
                      {camp.status}
                    </Badge>
                  </div>
                  <p className="text-slate-400 truncate text-[11px]">
                    Subject: {camp.subject}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  <span>{camp.recipientCount} Recipients</span>
                  <span>{formatDate(camp.createdAt)}</span>
                  <Link
                    href="/marketing/campaigns"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-[#ED2618] hover:text-[#ED2618] transition-colors"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No campaigns drafted or scheduled yet.
            </p>
            <Link
              href="/marketing/campaigns"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ED2618] hover:underline"
            >
              <span>Draft and schedule your first campaign &rarr;</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

