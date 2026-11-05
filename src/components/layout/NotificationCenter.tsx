"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  metadata?: string | null;
  createdAt: string;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<"ALL" | "APPROVALS" | "EMAILS" | "FINANCE">("ALL");
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // silent fail in polling/refresh
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // 15-second refresh

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const handleQuickApproval = async (approvalId: string, notifId: string, status: "APPROVED" | "REJECTED") => {
    setProcessingId(notifId);
    try {
      const res = await fetch(`/api/approvals/${approvalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          decisionNotes: `Quick-action ${status.toLowerCase()} from Notification Hub`,
        }),
      });

      if (res.ok) {
        await handleMarkAsRead(notifId);
        await fetchNotifications();
      }
    } catch {
      // silent
    } finally {
      setProcessingId(null);
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === "APPROVALS") return item.type.startsWith("APPROVAL");
    if (activeFilter === "EMAILS") return item.type.includes("EMAIL");
    if (activeFilter === "FINANCE") return item.type === "TRANSACTION";
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "APPROVAL_REQUEST":
        return <Clock className="h-4 w-4 text-[#ED2618]" />;
      case "APPROVAL_GRANTED":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "APPROVAL_REJECTED":
        return <XCircle className="h-4 w-4 text-rose-500" />;
      case "EMAIL_RECEIVED":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "TRANSACTION":
        return <DollarSign className="h-4 w-4 text-emerald-500" />;
      default:
        return <ShieldAlert className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 text-slate-600 hover:text-[#ED2618] hover:border-[#ED2618]/30 dark:text-slate-300 dark:hover:text-white dark:hover:border-white/20 transition-all cursor-pointer"
        aria-label="Notification Center"
        title="Automated Notification Hub"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ED2618] px-1 text-[9px] font-black text-white shadow-sm ring-2 ring-white dark:ring-[#0c0d12]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out / Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[420px] rounded-2xl border border-slate-200/90 dark:border-white/[0.12] bg-white dark:bg-[#12141C] p-4 shadow-2xl backdrop-blur-xl z-50 animate-fade-in text-slate-900 dark:text-white">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#ED2618]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Notification Hub
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-[#ED2618] border border-red-500/20">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-slate-500 hover:text-[#ED2618] dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 py-2 border-b border-slate-100 dark:border-white/[0.06] overflow-x-auto no-scrollbar">
            {(["ALL", "APPROVALS", "EMAILS", "FINANCE"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === filter
                    ? "bg-[#ED2618] text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto space-y-2 py-2 pr-1 divide-y divide-slate-100 dark:divide-white/[0.04]">
            {filteredNotifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <Bell className="h-6 w-6 text-slate-300 dark:text-slate-600 mx-auto mb-1.5 opacity-60" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">All notifications caught up</p>
                <p className="text-[11px] text-slate-400">Automated inter-department activities will stream here.</p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                let parsedMetadata: any = null;
                try {
                  if (item.metadata) parsedMetadata = JSON.parse(item.metadata);
                } catch {
                  // ignore
                }

                return (
                  <div
                    key={item.id}
                    className={`pt-2.5 first:pt-0 pb-1 rounded-xl transition-colors ${
                      !item.isRead ? "bg-red-500/[0.02]" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.05] shrink-0">
                        {getIcon(item.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {timeAgo(item.createdAt)}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                          {item.message}
                        </p>

                        {/* Quick 1-Click Approval Action Buttons for Approvals */}
                        {item.type === "APPROVAL_REQUEST" && parsedMetadata?.approvalId && !item.isRead && (
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              disabled={processingId === item.id}
                              onClick={() => handleQuickApproval(parsedMetadata.approvalId, item.id, "APPROVED")}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[10px] font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                            >
                              <Check className="h-3 w-3" />
                              <span>Authorize</span>
                            </button>
                            <button
                              type="button"
                              disabled={processingId === item.id}
                              onClick={() => handleQuickApproval(parsedMetadata.approvalId, item.id, "REJECTED")}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-slate-700 dark:text-slate-300 px-2.5 py-1 text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                            >
                              <X className="h-3 w-3" />
                              <span>Decline</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(item.id)}
                          className="h-2 w-2 rounded-full bg-[#ED2618] mt-1 shrink-0 hover:scale-150 transition-transform cursor-pointer"
                          title="Mark read"
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Navigation */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-white/[0.08] text-center">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ED2618] hover:underline"
            >
              <span>View Executive Operations Hub</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

