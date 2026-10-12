"use client";

import * as React from "react";
import { Radio, Plus, RefreshCw, Activity, Zap, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";

interface ApiEndpoint {
  id: string;
  name: string;
  baseUrl: string;
  authType: string;
  status: string;
  healthStatus: "HEALTHY" | "DEGRADED" | "DOWN" | "UNKNOWN";
  lastLatencyMs?: number | null;
  lastPingAt?: string | null;
}

export default function EndpointsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [endpoints, setEndpoints] = React.useState<ApiEndpoint[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [pingingId, setPingingId] = React.useState<string | null>(null);

  // New endpoint form
  const [name, setName] = React.useState("");
  const [baseUrl, setBaseUrl] = React.useState("");
  const [authType, setAuthType] = React.useState("BEARER");

  const fetchEndpoints = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/endpoints");
      const data = await res.json();
      if (res.ok) setEndpoints(data.endpoints || []);
    } catch {
      toastError("Error", "Could not load endpoints");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  React.useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  const handlePing = async (id: string) => {
    setPingingId(id);
    try {
      const res = await fetch("/api/endpoints/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpointId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        toastSuccess("Ping Complete", `Round-trip latency: ${data.latencyMs}ms (${data.status})`);
        fetchEndpoints();
      } else {
        toastError("Ping Failed", data.error || "Probe failed");
      }
    } catch {
      toastError("Error", "Network ping error");
    } finally {
      setPingingId(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, baseUrl, authType }),
      });
      if (res.ok) {
        toastSuccess("Endpoint Added", `${name} registered for gateway probing.`);
        setIsAddOpen(false);
        setName("");
        setBaseUrl("");
        fetchEndpoints();
      } else {
        toastError("Error", "Failed to add endpoint");
      }
    } catch {
      toastError("Error", "Network error");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            API Endpoints & Gateways
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time latency monitoring, health probing, and external microservice connectivity
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button size="sm" variant="secondary" onClick={() => fetchEndpoints()} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
          <Button size="sm" variant="primary" onClick={() => setIsAddOpen(true)} leftIcon={<Plus className="h-3.5 w-3.5" />}>
            Register Endpoint
          </Button>
        </div>
      </div>

      {/* Endpoints Table */}
      <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] uppercase font-mono text-slate-400">
            <tr>
              <th className="px-4 py-3">Service Name</th>
              <th className="px-4 py-3">Target Base URL</th>
              <th className="px-4 py-3">Auth Type</th>
              <th className="px-4 py-3">Health Status</th>
              <th className="px-4 py-3">Latency</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {endpoints.map((ep) => (
              <tr key={ep.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                  {ep.name}
                </td>
                <td className="px-4 py-3 font-mono text-slate-500">
                  <code className="text-slate-700 dark:text-slate-300">{ep.baseUrl}</code>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:text-slate-300">
                    {ep.authType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={ep.healthStatus === "HEALTHY" ? "success" : ep.healthStatus === "DOWN" ? "danger" : "warning"}
                    pulse={ep.healthStatus === "HEALTHY"}
                  >
                    {ep.healthStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                  {ep.lastLatencyMs ? `${ep.lastLatencyMs}ms` : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="xs"
                    variant="outline"
                    isLoading={pingingId === ep.id}
                    onClick={() => handlePing(ep.id)}
                    leftIcon={<Zap className="h-3 w-3" />}
                  >
                    Probe Health
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Register Endpoint Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register External API Endpoint"
        description="Add a service or webhook target for automated latency and health probing."
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="Service Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Identity Microservice"
            required
          />

          <Input
            label="Target Health / Status URL"
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.dextaafrica.com/health"
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Authentication Type
            </label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] px-3 py-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="BEARER">Bearer Token (JWT)</option>
              <option value="API_KEY">API Key Header</option>
              <option value="HMAC">HMAC Signature</option>
              <option value="NONE">Public / None</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button size="sm" variant="primary" type="submit">Save Endpoint</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

