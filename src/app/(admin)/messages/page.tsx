"use client";

import * as React from "react";
import {
  MessageSquare,
  Send,
  Hash,
  UserCheck,
  AlertTriangle,
  CheckCheck,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface Channel {
  id: string;
  slug: string;
  name: string;
  type: string;
  department: string | null;
  description: string | null;
}

interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderDepartment: string;
  senderRole: string;
  body: string;
  priority: string;
  readByIds: string;
  createdAt: string;
}

interface Colleague {
  id: string;
  fullName: string;
  department: string;
  jobTitle: string | null;
}

export default function InternalMessagesPage() {
  const { error: toastError } = useToast();
  const [channels, setChannels] = React.useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [colleagues, setColleagues] = React.useState<Colleague[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [messageText, setMessageText] = React.useState("");
  const [priority, setPriority] = React.useState<"NORMAL" | "URGENT">("NORMAL");
  const [isSending, setIsSending] = React.useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = React.useState("");

  const loadMessages = React.useCallback(async (targetChannelId?: string | null) => {
    try {
      const q = targetChannelId ? `?channelId=${encodeURIComponent(targetChannelId)}` : "";
      const res = await fetch(`/api/messages${q}`);
      if (!res.ok) return;
      const data = await res.json();
      setChannels(data.channels || []);
      setActiveChannelId(data.activeChannelId || null);
      setMessages(data.messages || []);
      setColleagues(data.colleagues || []);
    } catch {
      // silent polling fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadMessages(activeChannelId);
    const interval = setInterval(() => loadMessages(activeChannelId), 8000);
    return () => clearInterval(interval);
  }, [activeChannelId, loadMessages]);

  const handleSelectChannel = async (id: string) => {
    setActiveChannelId(id);
    await loadMessages(id);
    fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId: id }),
    }).catch(() => {});
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    if (!activeChannelId && !selectedRecipientId) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: selectedRecipientId ? undefined : activeChannelId,
          recipientUserId: selectedRecipientId || undefined,
          messageBody: messageText.trim(),
          priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");

      setMessageText("");
      setPriority("NORMAL");
      setSelectedRecipientId("");
      await loadMessages(data.channel?.id || activeChannelId);
    } catch (err: any) {
      toastError(err.message || "Could not send message");
    } finally {
      setIsSending(false);
    }
  };

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#ED2618]" />
            <span>Dexta Internal Communications</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Role-isolated corporate channels &amp; direct messaging with read receipts and priority escalation.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => loadMessages(activeChannelId)}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Sync Feed
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[580px]">
        {/* Left Sidebar: Channels & Direct Message Starter */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] p-4 space-y-5">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
              Authorized Channels
            </h2>
            <div className="space-y-1">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    setSelectedRecipientId("");
                    handleSelectChannel(ch.id);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    activeChannelId === ch.id && !selectedRecipientId
                      ? "bg-red-50 dark:bg-red-500/10 text-[#ED2618]"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <Hash className="w-4 h-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{ch.name}</div>
                    {ch.type === "DIRECT" && (
                      <div className="text-[10px] text-slate-400 font-normal">Direct Thread</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] space-y-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Start Direct Message</span>
            </h2>
            <select
              value={selectedRecipientId}
              onChange={(e) => setSelectedRecipientId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121622] px-3 py-2 text-xs"
            >
              <option value="">Select staff member...</option>
              {colleagues.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.fullName} ({col.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Pane: Message Stream & Composer */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D1017] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedRecipientId
                  ? `New Direct Message to ${colleagues.find((c) => c.id === selectedRecipientId)?.fullName || "Staff"}`
                  : activeChannel?.name || "Select a Channel"}
              </h3>
              <p className="text-[11px] text-slate-400">
                {activeChannel?.description || "Encrypted enterprise correspondence"}
              </p>
            </div>
          </div>

          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[420px]">
            {isLoading ? (
              <div className="py-16 text-center text-xs text-slate-400">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                No messages in this channel yet. Start the conversation below.
              </div>
            ) : (
              messages.map((m) => {
                let readCount = 1;
                try {
                  readCount = JSON.parse(m.readByIds || "[]").length;
                } catch {}

                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl border ${
                      m.priority === "URGENT"
                        ? "bg-red-500/[0.04] border-red-500/25"
                        : "bg-slate-50/80 dark:bg-white/[0.02] border-slate-100 dark:border-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {m.senderName}
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                          {m.senderDepartment}
                        </span>
                        {m.priority === "URGENT" && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-[#ED2618] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> URGENT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="flex items-center gap-0.5 text-emerald-500" title="Read receipts">
                          <CheckCheck className="w-3 h-3" /> {readCount}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {m.body}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row gap-2.5"
          >
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "NORMAL" | "URGENT")}
              className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121622] px-3 py-2 text-xs font-bold"
            >
              <option value="NORMAL">Normal</option>
              <option value="URGENT">Urgent</option>
            </select>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Write a message to your team..."
              className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121622] px-3.5 py-2 text-xs"
            />
            <Button
              type="submit"
              disabled={isSending || !messageText.trim()}
              className="bg-[#ED2618] hover:bg-[#d01f12] text-white text-xs font-bold px-4"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {isSending ? "Sending..." : "Send"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
