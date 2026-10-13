"use client";

import * as React from "react";
import { RefreshCw, Eye, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatActivityAction } from "@/lib/utils";

interface AuditLog {
  id: string;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: string | null;
  createdAt: string;
}

const ENTITY_LABELS: Record<string, string> = {
  User: "Team Member Account",
  StorageAsset: "Files & Media Library",
  EmailCampaign: "Email Campaign",
  ApiEndpoint: "Connected Service",
  Session: "Workspace Sign-In",
};

export default function AuditLogsPage() {
  const { error: toastError } = useToast();
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filterAction, setFilterAction] = React.useState("all");
  const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null);

  const fetchLogs = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/audit-logs?action=${filterAction}`);
      const data = await res.json();
      if (res.ok) setLogs(data.logs || []);
    } catch {
      toastError("Unable to Load", "Could not load recent activity history.");
    } finally {
      setIsLoading(false);
    }
  }, [filterAction, toastError]);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Workspace Activity History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            A clear timeline of recent team sign-ins, file uploads, and email broadcasts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121318] px-3.5 py-2 text-xs text-slate-900 dark:text-white font-semibold"
          >
            <option value="all">All Workspace Activities</option>
            <option value="AUTH_LOGIN_SUCCESS">Team Sign-Ins</option>
            <option value="MFA_ENROLLED">Security Updates</option>
            <option value="CAMPAIGN_DISPATCHED">Sent Email Campaigns</option>
            <option value="USER_CREATED">New Team Members</option>
          </select>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchLogs()}
            leftIcon={<RefreshCw className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Activity Timeline Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-slate-500 font-bold">
            <tr>
              <th className="px-5 py-3.5">Activity Description</th>
              <th className="px-5 py-3.5">Team Member</th>
              <th className="px-5 py-3.5">Workspace Area</th>
              <th className="px-5 py-3.5">Date & Time</th>
              <th className="px-5 py-3.5 text-right">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-500">
                  No activity records found for this filter.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatActivityAction(log.action)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-300">
                    {log.actorEmail || "Dexta Workspace"}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {ENTITY_LABELS[log.entity] || log.entity}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {formatDate(log.createdAt)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setSelectedLog(log)}
                      leftIcon={<Eye className="h-3.5 w-3.5" />}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Friendly Activity Summary Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Activity Summary"
        description="Recorded workspace event details"
        maxWidth="md"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] p-4 border border-slate-200/70 dark:border-white/10">
              <div>
                <p className="text-slate-400">Activity</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatActivityAction(selectedLog.action)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Workspace Section</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {ENTITY_LABELS[selectedLog.entity] || selectedLog.entity}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Performed By</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedLog.actorEmail || "Dexta Workspace"}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Recorded On</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatDate(selectedLog.createdAt)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
