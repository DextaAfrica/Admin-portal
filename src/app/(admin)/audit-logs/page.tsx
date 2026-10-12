"use client";

import * as React from "react";
import { FileText, Search, RefreshCw, Eye, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate, timeAgo } from "@/lib/utils";

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
      toastError("Error", "Could not load audit logs");
    } finally {
      setIsLoading(false);
    }
  }, [filterAction, toastError]);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Compliance & Audit Trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable records of all administrative actions, logins, permission updates, and asset changes
          </p>
        </div>

        <Button size="sm" variant="secondary" onClick={() => fetchLogs()} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
          Refresh Log
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-medium"
        >
          <option value="all">All Event Actions</option>
          <option value="AUTH_LOGIN_SUCCESS">AUTH_LOGIN_SUCCESS</option>
          <option value="AUTH_LOGIN_FAILED">AUTH_LOGIN_FAILED</option>
          <option value="MFA_ENROLLED">MFA_ENROLLED</option>
          <option value="MFA_CHALLENGE_SUCCESS">MFA_CHALLENGE_SUCCESS</option>
          <option value="ASSET_UPLOAD_INITIATED">ASSET_UPLOAD_INITIATED</option>
          <option value="CAMPAIGN_DISPATCHED">CAMPAIGN_DISPATCHED</option>
          <option value="USER_CREATED">USER_CREATED</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] uppercase font-mono text-slate-400">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Action Event</th>
              <th className="px-4 py-3">Actor Email</th>
              <th className="px-4 py-3">Entity Target</th>
              <th className="px-4 py-3">Client IP</th>
              <th className="px-4 py-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No audit events found matching criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-slate-400">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-red-600 dark:text-rose-400">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {log.actorEmail || "System"}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {log.entity} {log.entityId && `#${log.entityId.slice(0, 8)}`}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">
                    <code>{log.ipAddress || "127.0.0.1"}</code>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setSelectedLog(log)}
                      leftIcon={<Eye className="h-3 w-3" />}
                    >
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* JSON Payload Inspector Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Event Inspector"
        description={`Event ID: ${selectedLog?.id}`}
        maxWidth="lg"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3 font-mono">
              <div><strong className="text-slate-400">Action:</strong> {selectedLog.action}</div>
              <div><strong className="text-slate-400">Entity:</strong> {selectedLog.entity}</div>
              <div><strong className="text-slate-400">Actor:</strong> {selectedLog.actorEmail || "System"}</div>
              <div><strong className="text-slate-400">IP:</strong> {selectedLog.ipAddress}</div>
            </div>

            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">User Agent:</p>
              <code className="block rounded-lg bg-slate-100 dark:bg-black/40 p-2 font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all">
                {selectedLog.userAgent || "None recorded"}
              </code>
            </div>

            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Payload Metadata (JSON):</p>
              <pre className="rounded-lg bg-slate-900 text-slate-100 p-3 font-mono text-[11px] overflow-x-auto">
                {selectedLog.metadata
                  ? JSON.stringify(JSON.parse(selectedLog.metadata), null, 2)
                  : "{}"}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

