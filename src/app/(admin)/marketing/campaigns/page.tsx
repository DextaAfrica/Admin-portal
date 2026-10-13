"use client";

import * as React from "react";
import {
  Mail,
  Plus,
  Send,
  Eye,
  Cake,
  CalendarHeart,
  Newspaper,
  Building2,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
  User,
  ArrowLeft,
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
}

const STATUS_LABELS: Record<EmailCampaign["status"], string> = {
  DRAFT: "Ready to Send",
  SCHEDULED: "Scheduled",
  SENDING: "Sending Now",
  SENT: "Delivered",
  FAILED: "Needs Attention",
};

export default function CampaignsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [campaigns, setCampaigns] = React.useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeView, setActiveView] = React.useState<"list" | "compose">("compose");
  const [selectedPreset, setSelectedPreset] = React.useState<EmailOccasionId>("birthday");
  const [isSaving, setIsSaving] = React.useState(false);
  const [previewCampaign, setPreviewCampaign] = React.useState<EmailCampaign | null>(null);
  const [dispatchingId, setDispatchingId] = React.useState<string | null>(null);

  const fetchCampaigns = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/marketing/campaigns");
      const data = await res.json();
      if (res.ok) setCampaigns(data.campaigns || []);
    } catch {
      toastError("Unable to Load", "Could not load your email campaigns.");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  React.useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleSaveCampaign = async (payload: {
    title: string;
    subject: string;
    contentHtml: string;
    occasion: EmailOccasionId;
  }) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          subject: payload.subject,
          contentHtml: payload.contentHtml,
        }),
      });
      if (res.ok) {
        toastSuccess(
          "Email Campaign Saved",
          "Your formatted email is ready to preview or send to your audience."
        );
        await fetchCampaigns();
        setActiveView("list");
      } else {
        toastError("Save Error", "Could not save your email campaign.");
      }
    } catch {
      toastError("Connection Error", "Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDispatch = async (campaignId: string) => {
    setDispatchingId(campaignId);
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}/dispatch`, {
        method: "POST",
      });
      if (res.ok) {
        toastSuccess(
          "Email Broadcast Sent",
          "Your email has been delivered to your active subscribers."
        );
        fetchCampaigns();
      } else {
        toastError("Delivery Notice", "Could not send this campaign right now.");
      }
    } catch {
      toastError("Connection Error", "Could not reach the delivery service.");
    } finally {
      setDispatchingId(null);
    }
  };

  const openStudioWithPreset = (presetId: EmailOccasionId) => {
    setSelectedPreset(presetId);
    setActiveView("compose");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-1">
            <Mail className="h-3.5 w-3.5" />
            <span>Client & Team Communications</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Email Studio & Campaigns
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Design branded birthday wishes, invitations, newsletters, and project updates visually — no technical skills needed.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#14151b] p-1">
            <button
              type="button"
              onClick={() => setActiveView("compose")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeView === "compose"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              Visual Composer
            </button>
            <button
              type="button"
              onClick={() => setActiveView("list")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === "list"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              <span>Saved & Sent</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  activeView === "list"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                }`}
              >
                {campaigns.length}
              </span>
            </button>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchCampaigns()}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content Area: Visual Composer vs Saved Campaigns */}
      {activeView === "compose" ? (
        <div className="space-y-6">
          <EmailComposerStudio
            key={selectedPreset}
            mode="campaign"
            initialPreset={selectedPreset}
            isSubmitting={isSaving}
            onSaveDraft={handleSaveCampaign}
            onCancel={campaigns.length > 0 ? () => setActiveView("list") : undefined}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Start Occasion Bar */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Start a New Email Broadcast
                </h2>
                <p className="text-xs text-slate-500">
                  Pick an occasion below to open the visual designer with pre-filled Dexta Africa branding
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setActiveView("compose")}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Open Visual Composer
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {EMAIL_OCCASION_PRESETS.map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => openStudioWithPreset(preset.id)}
                    className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] p-3 text-left hover:border-red-600/40 hover:bg-red-50/40 transition-all cursor-pointer"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {preset.label}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">Use template →</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Saved & Dispatched Campaigns List */}
          {isLoading ? (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-12 text-center text-sm text-slate-500">
              Loading your email campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-12 text-center bg-white dark:bg-[#121318]">
              <Mail className="mx-auto h-9 w-9 text-red-600/70" />
              <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                No email campaigns saved yet
              </h4>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                Use the Visual Composer to create birthday messages, invitations, or monthly newsletters with your official logo and photography.
              </p>
              <div className="mt-5">
                <Button size="md" variant="primary" onClick={() => setActiveView("compose")}>
                  Compose Your First Email
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#121318] p-5 shadow-xs hover:border-red-500/30 transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {camp.title}
                      </h3>
                      <Badge
                        variant={
                          camp.status === "SENT"
                            ? "success"
                            : camp.status === "SENDING"
                            ? "warning"
                            : "default"
                        }
                        pulse={camp.status === "SENDING"}
                      >
                        {STATUS_LABELS[camp.status] || camp.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Subject Line:{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {camp.subject}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Prepared on {formatDate(camp.createdAt)}
                      {camp.sentAt ? ` • Delivered on ${formatDate(camp.sentAt)}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right pr-4 border-r border-slate-100 dark:border-white/10">
                      <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                        {camp.recipientCount}
                      </p>
                      <p className="text-[11px] text-slate-500">Recipients</p>
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPreviewCampaign(camp)}
                      leftIcon={<Eye className="h-3.5 w-3.5" />}
                    >
                      Preview Email
                    </Button>

                    {camp.status === "DRAFT" && (
                      <Button
                        size="sm"
                        variant="primary"
                        isLoading={dispatchingId === camp.id}
                        onClick={() => handleDispatch(camp.id)}
                        leftIcon={<Send className="h-3.5 w-3.5" />}
                      >
                        Send Now
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Email Envelope Preview Modal */}
      <Modal
        isOpen={Boolean(previewCampaign)}
        onClose={() => setPreviewCampaign(null)}
        title={previewCampaign?.title || "Email Preview"}
        description="Formatted email preview as seen by your recipients"
        maxWidth="xl"
      >
        {previewCampaign && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-4 border border-slate-200/80 dark:border-white/10 space-y-1.5">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {previewCampaign.subject}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white">
                  <User className="h-3 w-3" />
                </span>
                <span>
                  From <strong className="text-slate-800 dark:text-slate-200">Dexta Africa</strong>{" "}
                  on {formatDate(previewCampaign.sentAt || previewCampaign.createdAt)}
                </span>
              </div>
            </div>

            <div
              className="rounded-2xl bg-slate-100/70 dark:bg-[#0d0e12] p-4 sm:p-6 border border-slate-200/80 dark:border-white/10 max-h-[65vh] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: previewCampaign.contentHtml }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
