"use client";

import * as React from "react";
import {
  Mail,
  Plus,
  Send,
  Eye,
  RefreshCw,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  Copy,
  Users,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import {
  EmailComposerStudio,
  EMAIL_OCCASION_PRESETS,
  type EmailOccasionId,
} from "@/components/marketing/EmailComposerStudio";

interface EmailCampaign {
  id: string;
  title: string;
  subject: string;
  contentHtml: string;
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "FAILED";
  recipientCount: number;
  openCount: number;
  clickCount: number;
  sentAt?: string | null;
  createdAt: string;
  creator?: { fullName: string; email: string };
}

export default function CampaignsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [campaigns, setCampaigns] = React.useState<EmailCampaign[]>([]);
  const [subscribersCount, setSubscribersCount] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState(true);

  // Views: "scheduled" | "drafts" | "sent" | "compose"
  const [activeTab, setActiveTab] = React.useState<"scheduled" | "drafts" | "sent" | "compose">("scheduled");
  const [selectedPreset, setSelectedPreset] = React.useState<EmailOccasionId>("project_update");
  const [editingCampaign, setEditingCampaign] = React.useState<EmailCampaign | null>(null);
  const [previewCampaign, setPreviewCampaign] = React.useState<EmailCampaign | null>(null);

  // Scheduling Modal State
  const [schedulingCampaign, setSchedulingCampaign] = React.useState<EmailCampaign | null>(null);
  const [scheduledDateTime, setScheduledDateTime] = React.useState<string>("");
  const [isScheduling, setIsScheduling] = React.useState(false);

  // Dispatch / Delete Modal State
  const [sendConfirmCampaign, setSendConfirmCampaign] = React.useState<EmailCampaign | null>(null);
  const [deleteConfirmCampaign, setDeleteConfirmCampaign] = React.useState<EmailCampaign | null>(null);
  const [dispatchingId, setDispatchingId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchCampaigns = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [campRes, audRes] = await Promise.all([
        fetch("/api/marketing/campaigns"),
        fetch("/api/marketing/audience"),
      ]);

      if (campRes.ok) {
        const campData = await campRes.json();
        setCampaigns(campData.campaigns || []);
      }
      if (audRes.ok) {
        const audData = await audRes.json();
        setSubscribersCount((audData.subscribers || []).filter((s: any) => s.status === "SUBSCRIBED").length);
      }
    } catch {
      toastError("Unable to Load", "Could not load your email campaigns.");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  React.useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Derived Campaign Groups
  const scheduledCampaigns = campaigns.filter((c) => c.status === "SCHEDULED");
  const draftCampaigns = campaigns.filter((c) => c.status === "DRAFT");
  const sentCampaigns = campaigns.filter((c) => c.status === "SENT");

  // Save Campaign from Studio
  const handleSaveCampaign = async (payload: {
    id?: string;
    title: string;
    subject: string;
    contentHtml: string;
    occasion: EmailOccasionId;
  }) => {
    try {
      const isUpdating = Boolean(payload.id);
      const res = await fetch("/api/marketing/campaigns", {
        method: isUpdating ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payload.id,
          title: payload.title,
          subject: payload.subject,
          contentHtml: payload.contentHtml,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toastSuccess(
          isUpdating ? "Campaign Updated" : "Campaign Saved to Drafts",
          "Your email design and subject are ready for scheduling or dispatch."
        );
        setEditingCampaign(null);
        await fetchCampaigns();
        setActiveTab("drafts");
      } else {
        toastError("Save Issue", "Could not save campaign.");
      }
    } catch {
      toastError("Connection Error", "Please verify connection to email service.");
    }
  };

  // Schedule Campaign
  const openScheduleModal = (camp: EmailCampaign) => {
    // Default to tomorrow at 09:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    // Format for datetime-local: YYYY-MM-DDTHH:mm
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    const localISOTime = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);

    setScheduledDateTime(localISOTime);
    setSchedulingCampaign(camp);
  };

  const handleConfirmSchedule = async () => {
    if (!schedulingCampaign || !scheduledDateTime) return;
    setIsScheduling(true);
    try {
      const res = await fetch(`/api/marketing/campaigns/${schedulingCampaign.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: new Date(scheduledDateTime).toISOString() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule campaign");

      toastSuccess("Campaign Scheduled", data.message || "Scheduled for automated delivery.");
      setSchedulingCampaign(null);
      await fetchCampaigns();
      setActiveTab("scheduled");
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Scheduling error");
    } finally {
      setIsScheduling(false);
    }
  };

  // Cancel Schedule
  const handleCancelSchedule = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}/schedule`, {
        method: "DELETE",
      });
      if (res.ok) {
        toastSuccess("Schedule Cancelled", "Campaign reverted back to drafts.");
        await fetchCampaigns();
      } else {
        toastError("Cancel Error", "Could not cancel scheduled campaign.");
      }
    } catch {
      toastError("Connection Error", "Failed to contact scheduling engine.");
    }
  };

  // Dispatch Immediately via SMTP
  const handleDispatchNow = async (campaignId: string) => {
    setDispatchingId(campaignId);
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}/dispatch`, {
        method: "POST",
      });

      if (res.ok) {
        toastSuccess("Email Broadcast Dispatched", "Delivered to active subscribers via corporate SMTP.");
        setSendConfirmCampaign(null);
        await fetchCampaigns();
        setActiveTab("sent");
      } else {
        toastError("Dispatch Error", "Could not dispatch campaign.");
      }
    } catch {
      toastError("Connection Error", "Could not reach email delivery daemon.");
    } finally {
      setDispatchingId(null);
    }
  };

  // Delete Campaign
  const handleDeleteCampaign = async (campaignId: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: campaignId }),
      });

      if (res.ok) {
        toastSuccess("Campaign Deleted", "Campaign removed from workspace.");
        setDeleteConfirmCampaign(null);
        await fetchCampaigns();
      } else {
        toastError("Delete Error", "Could not delete campaign.");
      }
    } catch {
      toastError("Connection Error", "Failed to communicate with service.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Set quick preset schedule time
  const applyPresetTime = (hoursFromNow: number) => {
    const target = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
    const tzOffset = target.getTimezoneOffset() * 60000;
    const localISOTime = new Date(target.getTime() - tzOffset).toISOString().slice(0, 16);
    setScheduledDateTime(localISOTime);
  };

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-7xl mx-auto">
      {/* 1. Executive Top Header */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#ED2618] animate-pulse" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#ED2618]">
                Corporate Communications &bull; SMTP Live
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Email Marketing &amp; Broadcast Scheduling
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Design, schedule, and automate branded client broadcasts, project delivery announcements, and operational notices.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchCampaigns}
              isLoading={isLoading}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              className="text-xs"
            >
              Sync Campaigns
            </Button>

            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setEditingCampaign(null);
                setActiveTab("compose");
              }}
              leftIcon={<Plus className="h-4 w-4" />}
              className="bg-[#ED2618] hover:bg-[#c91e12] text-xs font-bold"
            >
              Compose New Broadcast
            </Button>
          </div>
        </div>

        {/* Real Metrics Overview Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-100 dark:border-white/[0.06]">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05]">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Scheduled in Queue</span>
              <Clock className="h-4 w-4 text-[#ED2618]" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {scheduledCampaigns.length}
            </div>
            <span className="text-[10px] text-slate-400">Automated background dispatch</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05]">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Active Drafts</span>
              <Pencil className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {draftCampaigns.length}
            </div>
            <span className="text-[10px] text-slate-400">In design or awaiting schedule</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05]">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Delivered Broadcasts</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {sentCampaigns.length}
            </div>
            <span className="text-[10px] text-slate-400">Successfully sent via SMTP</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05]">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Audience Reach</span>
              <Users className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {subscribersCount}
            </div>
            <span className="text-[10px] text-slate-400">Subscribed partner contacts</span>
          </div>
        </div>

        {/* Modern Tab Bar */}
        <div className="flex items-center gap-2 pt-6 mt-6 border-t border-slate-100 dark:border-white/[0.06] overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("scheduled")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "scheduled"
                ? "bg-[#ED2618] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Scheduled Queue ({scheduledCampaigns.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("drafts")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "drafts"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
            }`}
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Drafts ({draftCampaigns.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sent")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "sent"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Delivered History ({sentCampaigns.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingCampaign(null);
              setActiveTab("compose");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "compose"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#ED2618]" />
            <span>Campaign Studio Composer</span>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT: SCHEDULED QUEUE */}
      {activeTab === "scheduled" && (
        <div className="space-y-4">
          {scheduledCampaigns.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-[#0D1017]/50 p-12 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10 text-[#ED2618] mx-auto">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Scheduled Broadcasts in Queue
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                You can draft a campaign in the Studio and set an automated dispatch time for future delivery.
              </p>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setEditingCampaign(null);
                  setActiveTab("compose");
                }}
                className="bg-[#ED2618] hover:bg-[#c91e12] text-xs font-bold"
              >
                Schedule Your First Broadcast
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scheduledCampaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-500/15 text-[#ED2618] border border-red-200 dark:border-red-500/25">
                        <Clock className="h-3 w-3 animate-pulse" />
                        Scheduled
                      </span>

                      <span className="text-[11px] text-slate-400 font-mono">
                        {camp.recipientCount || subscribersCount} Recipients
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                        {camp.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        Subject: <em>&ldquo;{camp.subject}&rdquo;</em>
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05] flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-[#ED2618] shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Scheduled Delivery Time
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {camp.sentAt ? new Date(camp.sentAt).toLocaleString() : "Upcoming"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-white/[0.05]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewCampaign(camp)}
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
                        title="Preview HTML Email"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openScheduleModal(camp)}
                        className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
                      >
                        Reschedule
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCancelSchedule(camp.id)}
                        className="text-xs font-semibold text-red-500 hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setSendConfirmCampaign(camp)}
                      leftIcon={<Send className="h-3.5 w-3.5" />}
                      className="bg-[#ED2618] hover:bg-[#c91e12] text-xs font-bold"
                    >
                      Dispatch Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. TAB CONTENT: DRAFTS */}
      {activeTab === "drafts" && (
        <div className="space-y-4">
          {draftCampaigns.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-[#0D1017]/50 p-12 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/[0.05] text-slate-500 mx-auto">
                <Pencil className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Draft Campaigns Available
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                All created broadcasts have either been delivered or scheduled. Start a new draft in the Studio.
              </p>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setEditingCampaign(null);
                  setActiveTab("compose");
                }}
                className="bg-[#ED2618] hover:bg-[#c91e12] text-xs font-bold"
              >
                Compose New Draft
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {draftCampaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        Draft
                      </Badge>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(camp.createdAt)}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                      {camp.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      Subject: {camp.subject}
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-white/[0.05]">
                    <div className="flex items-center justify-between gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openScheduleModal(camp)}
                        leftIcon={<Clock className="h-3.5 w-3.5 text-[#ED2618]" />}
                        className="text-xs font-bold flex-1"
                      >
                        Schedule
                      </Button>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setEditingCampaign(camp);
                          setActiveTab("compose");
                        }}
                        leftIcon={<Pencil className="h-3.5 w-3.5" />}
                        className="text-xs font-bold flex-1 bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                      >
                        Edit
                      </Button>
                    </div>

                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewCampaign(camp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
                        title="Preview"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmCampaign(camp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete Draft"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB CONTENT: DELIVERED HISTORY */}
      {activeTab === "sent" && (
        <div className="space-y-4">
          {sentCampaigns.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-[#0D1017]/50 p-12 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Delivered Broadcasts Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Broadcasts sent via corporate SMTP will appear here with delivery telemetry and recipient metrics.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-white/[0.03] text-slate-500 border-b border-slate-200/80 dark:border-white/[0.08]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Broadcast Title &amp; Subject</th>
                      <th className="px-5 py-3 font-semibold">Delivery Timestamp</th>
                      <th className="px-5 py-3 font-semibold">Recipients</th>
                      <th className="px-5 py-3 font-semibold">SMTP Status</th>
                      <th className="px-5 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {sentCampaigns.map((camp) => (
                      <tr key={camp.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {camp.title}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-sm">
                            {camp.subject}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                          {camp.sentAt ? formatDate(camp.sentAt) : "Delivered"}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                          {camp.recipientCount || subscribersCount} contacts
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />
                            Delivered via SMTP
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPreviewCampaign(camp)}
                            leftIcon={<Eye className="h-3.5 w-3.5" />}
                            className="text-xs"
                          >
                            View HTML
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB CONTENT: STUDIO COMPOSER */}
      {activeTab === "compose" && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-6 sm:p-8 shadow-sm">
          <EmailComposerStudio
            mode="campaign"
            initialPreset={selectedPreset}
            initialData={
              editingCampaign
                ? {
                    id: editingCampaign.id,
                    title: editingCampaign.title,
                    subject: editingCampaign.subject,
                    contentHtml: editingCampaign.contentHtml,
                  }
                : null
            }
            onSaveDraft={handleSaveCampaign}
            onCancel={() => setActiveTab("drafts")}
          />
        </div>
      )}

      {/* MODAL 1: SCHEDULE BROADCAST MODAL */}
      <Modal
        isOpen={Boolean(schedulingCampaign)}
        onClose={() => setSchedulingCampaign(null)}
        title="Schedule Email Broadcast"
        description="Configure automated future dispatch time via Dexta SMTP"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSchedulingCampaign(null)}
              disabled={isScheduling}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmSchedule}
              isLoading={isScheduling}
              leftIcon={<Clock className="h-4 w-4" />}
              className="bg-[#ED2618] hover:bg-[#c91e12] text-xs font-bold"
            >
              Confirm &amp; Schedule Broadcast
            </Button>
          </div>
        }
      >
        {schedulingCampaign && (
          <div className="space-y-4 pt-1">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Target Campaign</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {schedulingCampaign.title}
              </p>
              <p className="text-xs text-slate-500">
                Subject: &ldquo;{schedulingCampaign.subject}&rdquo;
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Quick Schedule Presets
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyPresetTime(14)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#ED2618] hover:bg-red-50/50 dark:hover:bg-red-500/10 text-xs text-center font-semibold transition-all cursor-pointer"
                >
                  Tomorrow 9:00 AM
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTime(24)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#ED2618] hover:bg-red-50/50 dark:hover:bg-red-500/10 text-xs text-center font-semibold transition-all cursor-pointer"
                >
                  In 24 Hours
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTime(72)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#ED2618] hover:bg-red-50/50 dark:hover:bg-red-500/10 text-xs text-center font-semibold transition-all cursor-pointer"
                >
                  In 3 Days
                </button>
              </div>
            </div>

            {/* Exact Date & Time Picker */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Custom Dispatch Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#ED2618] transition-colors"
              />
            </div>

            {/* Audience Info */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
              <span>Verified Audience Delivery List:</span>
              <strong>{subscribersCount} Active Subscribers</strong>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: SEND NOW CONFIRMATION */}
      <Modal
        isOpen={Boolean(sendConfirmCampaign)}
        onClose={() => setSendConfirmCampaign(null)}
        title="Dispatch Immediate Email Broadcast?"
        description="Deliver campaign to all active subscribers via SMTP"
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSendConfirmCampaign(null)}
              disabled={Boolean(dispatchingId)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => sendConfirmCampaign && handleDispatchNow(sendConfirmCampaign.id)}
              isLoading={Boolean(dispatchingId)}
              leftIcon={<Send className="h-4 w-4" />}
              className="bg-[#ED2618] hover:bg-[#c91e12] text-xs font-bold"
            >
              Yes, Dispatch Now
            </Button>
          </div>
        }
      >
        {sendConfirmCampaign && (
          <div className="space-y-3 pt-1 text-xs text-slate-600 dark:text-slate-400">
            <p>
              Are you sure you want to send <strong>{sendConfirmCampaign.title}</strong> right now?
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05]">
              <span>Delivers to: </span>
              <strong className="text-slate-900 dark:text-white">{subscribersCount} Subscribed Contacts</strong>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: HTML PREVIEW MODAL */}
      <Modal
        isOpen={Boolean(previewCampaign)}
        onClose={() => setPreviewCampaign(null)}
        title={previewCampaign?.title || "Campaign Preview"}
        description={`Subject: ${previewCampaign?.subject || ""}`}
        maxWidth="2xl"
      >
        {previewCampaign && (
          <div className="pt-2 space-y-3">
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-black/40 p-4 max-h-[500px] overflow-y-auto">
              <div
                dangerouslySetInnerHTML={{ __html: previewCampaign.contentHtml }}
                className="prose dark:prose-invert max-w-none text-xs"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 4: DELETE CONFIRMATION */}
      <Modal
        isOpen={Boolean(deleteConfirmCampaign)}
        onClose={() => setDeleteConfirmCampaign(null)}
        title="Delete Campaign Draft?"
        description="This action cannot be undone."
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmCampaign(null)}
              disabled={isDeleting}
            >
              Keep Draft
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => deleteConfirmCampaign && handleDeleteCampaign(deleteConfirmCampaign.id)}
              isLoading={isDeleting}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Are you sure you want to delete <strong>{deleteConfirmCampaign?.title}</strong>?
        </p>
      </Modal>
    </div>
  );
}
