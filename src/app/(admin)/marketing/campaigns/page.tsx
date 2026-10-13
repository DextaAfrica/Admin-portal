"use client";

import * as React from "react";
import {
  Mail,
  Plus,
  Send,
  Eye,
  RefreshCw,
  User,
  Pencil,
  Trash2,
  Copy,
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
  DRAFT: "Editable Draft",
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
  const [editingCampaign, setEditingCampaign] = React.useState<EmailCampaign | null>(null);
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
    id?: string;
    title: string;
    subject: string;
    contentHtml: string;
    occasion: EmailOccasionId;
  }) => {
    setIsSaving(true);
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
        toastSuccess(
          isUpdating ? "Campaign Draft Updated" : "Campaign Draft Saved",
          isUpdating
            ? "Your latest design and content edits have been saved."
            : "Your custom email is saved in Drafts & Campaigns."
        );
        setEditingCampaign(null);
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

  const handleEditDraft = (camp: EmailCampaign) => {
    setPreviewCampaign(null);
    setEditingCampaign(camp);
    setActiveView("compose");
  };

  const handleDuplicateDraft = (camp: EmailCampaign) => {
    setPreviewCampaign(null);
    setEditingCampaign({
      ...camp,
      id: "", // Creates a new draft copy on save
      title: `${camp.title} (Copy)`,
      status: "DRAFT",
    });
    setActiveView("compose");
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: campaignId }),
      });
      if (res.ok) {
        toastSuccess("Campaign Removed", "The campaign draft has been deleted.");
        fetchCampaigns();
      } else {
        toastError("Delete Error", "Could not delete this campaign.");
      }
    } catch {
      toastError("Connection Error", "Please check your connection and try again.");
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
    setEditingCampaign(null);
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
            Design, customize, edit drafts, and send branded emails with full visual & HTML control.
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
              {editingCampaign?.id ? "Editing Draft" : "Visual & HTML Studio"}
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
              <span>Drafts & Sent</span>
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

      {/* Main Content Area: Visual Composer vs Saved Drafts & Campaigns */}
      {activeView === "compose" ? (
        <div className="space-y-6">
          <EmailComposerStudio
            key={editingCampaign ? `edit_${editingCampaign.id}_${editingCampaign.title}` : `preset_${selectedPreset}`}
            mode="campaign"
            initialPreset={selectedPreset}
            initialData={
              editingCampaign
                ? {
                    id: editingCampaign.id || undefined,
                    title: editingCampaign.title,
                    subject: editingCampaign.subject,
                    contentHtml: editingCampaign.contentHtml,
                  }
                : null
            }
            isSubmitting={isSaving}
            onSaveDraft={handleSaveCampaign}
            onCancel={() => {
              setEditingCampaign(null);
              setActiveView("list");
            }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Start Occasion Bar */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Create a New Customizable Email
                </h2>
                <p className="text-xs text-slate-500">
                  Start from any occasion preset or a blank canvas and customize every detail
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setEditingCampaign(null);
                  setActiveView("compose");
                }}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                New Blank / Custom Email
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
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
                      <p className="text-[10px] text-slate-500 truncate">Customize →</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Saved Drafts & Dispatched Campaigns List */}
          {isLoading ? (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] p-12 text-center text-sm text-slate-500">
              Loading your email drafts and campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-12 text-center bg-white dark:bg-[#121318]">
              <Mail className="mx-auto h-9 w-9 text-red-600/70" />
              <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                No email drafts or campaigns saved yet
              </h4>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                Open the Visual & HTML Studio to design and save your first custom email draft.
              </p>
              <div className="mt-5">
                <Button size="md" variant="primary" onClick={() => setActiveView("compose")}>
                  Open Email Studio
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
                      Saved on {formatDate(camp.createdAt)}
                      {camp.sentAt ? ` • Delivered on ${formatDate(camp.sentAt)}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-right pr-3 border-r border-slate-100 dark:border-white/10">
                      <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                        {camp.recipientCount}
                      </p>
                      <p className="text-[11px] text-slate-500">Recipients</p>
                    </div>

                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => setPreviewCampaign(camp)}
                      leftIcon={<Eye className="h-3.5 w-3.5" />}
                    >
                      Preview
                    </Button>

                    {camp.status === "DRAFT" ? (
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => handleEditDraft(camp)}
                        leftIcon={<Pencil className="h-3.5 w-3.5 text-red-600" />}
                      >
                        Edit Design
                      </Button>
                    ) : (
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => handleDuplicateDraft(camp)}
                        leftIcon={<Copy className="h-3.5 w-3.5" />}
                      >
                        Duplicate & Edit
                      </Button>
                    )}

                    {camp.status === "DRAFT" && (
                      <Button
                        size="xs"
                        variant="primary"
                        isLoading={dispatchingId === camp.id}
                        onClick={() => handleDispatch(camp.id)}
                        leftIcon={<Send className="h-3.5 w-3.5" />}
                      >
                        Send Now
                      </Button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteCampaign(camp.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete Campaign"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Email Envelope Preview Modal with Instant "Edit Design in Studio" Button */}
      <Modal
        isOpen={Boolean(previewCampaign)}
        onClose={() => setPreviewCampaign(null)}
        title={previewCampaign?.title || "Email Preview"}
        description="Preview your email or click 'Edit Design in Studio' to customize any part of it"
        maxWidth="xl"
        footer={
          previewCampaign ? (
            <div className="flex items-center justify-between w-full">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleEditDraft(previewCampaign)}
                leftIcon={<Pencil className="h-3.5 w-3.5 text-red-600" />}
              >
                Edit Design & Content in Studio
              </Button>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setPreviewCampaign(null)}>
                  Close
                </Button>
                {previewCampaign.status === "DRAFT" && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      const id = previewCampaign.id;
                      setPreviewCampaign(null);
                      handleDispatch(id);
                    }}
                    leftIcon={<Send className="h-3.5 w-3.5" />}
                  >
                    Send Campaign Now
                  </Button>
                )}
              </div>
            </div>
          ) : undefined
        }
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
              className="rounded-2xl bg-slate-100/70 dark:bg-[#0d0e12] p-4 sm:p-6 border border-slate-200/80 dark:border-white/10 max-h-[60vh] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: previewCampaign.contentHtml }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
