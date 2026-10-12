"use client";

import * as React from "react";
import {
  Mail,
  Plus,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";

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

export default function CampaignsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [campaigns, setCampaigns] = React.useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [previewCampaign, setPreviewCampaign] = React.useState<EmailCampaign | null>(null);
  const [dispatchingId, setDispatchingId] = React.useState<string | null>(null);

  // New campaign form state
  const [title, setTitle] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [contentHtml, setContentHtml] = React.useState(
    `<h2>Hello {{firstName}},</h2>\n<p>We are excited to share our latest product updates with you.</p>\n<p><a href="{{portalUrl}}">Visit Your Dashboard</a></p>`
  );

  const fetchCampaigns = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/marketing/campaigns");
      const data = await res.json();
      if (res.ok) setCampaigns(data.campaigns || []);
    } catch {
      toastError("Error", "Could not load campaigns");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  React.useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subject, contentHtml }),
      });
      if (res.ok) {
        toastSuccess("Campaign Created", "New draft campaign ready.");
        setIsCreateOpen(false);
        setTitle("");
        setSubject("");
        fetchCampaigns();
      } else {
        toastError("Error", "Failed to save campaign");
      }
    } catch {
      toastError("Error", "Network error");
    }
  };

  const handleDispatch = async (campaignId: string) => {
    setDispatchingId(campaignId);
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}/dispatch`, {
        method: "POST",
      });
      if (res.ok) {
        toastSuccess("Campaign Dispatched", "Emails are now being delivered to subscribers.");
        fetchCampaigns();
      } else {
        toastError("Dispatch Error", "Failed to send campaign");
      }
    } catch {
      toastError("Error", "Dispatch request failed");
    } finally {
      setDispatchingId(null);
    }
  };

  const insertVariable = (variable: string) => {
    setContentHtml((prev) => `${prev} {{${variable}}}`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Email Marketing & Campaigns
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Campaign pipeline, audience dispatcher, and real-time delivery telemetry
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button size="sm" variant="secondary" onClick={() => fetchCampaigns()} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
          <Button size="sm" variant="primary" onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="h-3.5 w-3.5" />}>
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-12 text-center bg-white dark:bg-[#121217]">
          <Mail className="mx-auto h-8 w-8 text-slate-400" />
          <h4 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">No campaigns created yet</h4>
          <p className="mt-1 text-xs text-slate-500">Draft your first marketing or transactional broadcast.</p>
          <div className="mt-4">
            <Button size="sm" variant="primary" onClick={() => setIsCreateOpen(true)}>
              Draft First Campaign
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] p-5 shadow-sm hover:border-red-500/30 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{camp.title}</h3>
                  <Badge
                    variant={camp.status === "SENT" ? "success" : camp.status === "SENDING" ? "warning" : "default"}
                    pulse={camp.status === "SENDING"}
                  >
                    {camp.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Subject: <span className="font-medium text-slate-800 dark:text-slate-200">{camp.subject}</span>
                </p>
                <p className="text-[11px] font-mono text-slate-400">
                  Created {formatDate(camp.createdAt)} {camp.sentAt && `&bull; Sent ${formatDate(camp.sentAt)}`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right pr-3 border-r border-slate-100 dark:border-white/10">
                  <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {camp.recipientCount}
                  </p>
                  <p className="text-[10px] text-slate-400">Recipients</p>
                </div>

                <Button size="xs" variant="secondary" onClick={() => setPreviewCampaign(camp)} leftIcon={<Eye className="h-3.5 w-3.5" />}>
                  Preview
                </Button>

                {camp.status === "DRAFT" && (
                  <Button
                    size="xs"
                    variant="primary"
                    isLoading={dispatchingId === camp.id}
                    onClick={() => handleDispatch(camp.id)}
                    leftIcon={<Send className="h-3.5 w-3.5" />}
                  >
                    Dispatch Now
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Campaign Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Draft New Email Campaign"
        description="Craft personalized marketing broadcasts with dynamic tags."
        maxWidth="xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Campaign Internal Title"
            placeholder="e.g. Q4 Platform Launch Announcement"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Input
            label="Email Subject Line"
            placeholder="e.g. Big News from Dexta Africa!"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Email Content (HTML)
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400">Insert tag:</span>
                {["firstName", "portalUrl", "unsubscribeLink"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertVariable(tag)}
                    className="rounded bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 font-mono text-[10px] text-red-600 dark:text-rose-400 hover:bg-rose-100"
                  >
                    +{tag}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={8}
              value={contentHtml}
              onChange={(e) => setContentHtml(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#15161c] p-3 font-mono text-xs text-slate-900 dark:text-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Save Campaign Draft
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={Boolean(previewCampaign)}
        onClose={() => setPreviewCampaign(null)}
        title={previewCampaign?.title || "Campaign Preview"}
        maxWidth="lg"
      >
        {previewCampaign && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 dark:bg-white/[0.03] p-3 text-xs border border-slate-200 dark:border-white/10">
              <p><strong>Subject:</strong> {previewCampaign.subject}</p>
            </div>
            <div
              className="rounded-xl border border-slate-200 dark:border-white/10 p-5 bg-white dark:bg-[#15161c] prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: previewCampaign.contentHtml }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

