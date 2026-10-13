"use client";

import * as React from "react";
import { Plus, RefreshCw, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

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

const HEALTH_LABELS: Record<ApiEndpoint["healthStatus"], string> = {
  HEALTHY: "Online & Active",
  DEGRADED: "Slow Response",
  DOWN: "Offline",
  UNKNOWN: "Not Checked",
};

const ACCESS_LABELS: Record<string, string> = {
  BEARER: "Protected Partner Access",
  API_KEY: "Verified Partner Key",
  HMAC: "Signed Partner Link",
  NONE: "Public Website / Service",
};

export default function EndpointsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [endpoints, setEndpoints] = React.useState<ApiEndpoint[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [pingingId, setPingingId] = React.useState<string | null>(null);

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
      toastError("Unable to Load", "Could not load connected services.");
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
        toastSuccess("Connection Verified", "The service responded normally and is online.");
        fetchEndpoints();
      } else {
        toastError("Connection Notice", data.error || "Service did not respond.");
      }
    } catch {
      toastError("Connection Error", "Could not verify service status.");
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
        toastSuccess("Service Connected", `${name} has been added to your connected services.`);
        setIsAddOpen(false);
        setName("");
        setBaseUrl("");
        fetchEndpoints();
      } else {
        toastError("Save Error", "Could not add this connected service.");
      }
    } catch {
      toastError("Connection Error", "Please check your connection and try again.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Connected Services & Websites
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Keep track of your company websites, partner platforms, and online tools in one place
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchEndpoints()}
            leftIcon={<RefreshCw className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddOpen(true)}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Add Connected Service
          </Button>
        </div>
      </div>

      {/* Connected Services List */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-slate-500 font-bold">
            <tr>
              <th className="px-5 py-3.5">Service or Website Name</th>
              <th className="px-5 py-3.5">Web Address</th>
              <th className="px-5 py-3.5">Access Type</th>
              <th className="px-5 py-3.5">Current Status</th>
              <th className="px-5 py-3.5">Response Speed</th>
              <th className="px-5 py-3.5 text-right">Check Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {endpoints.map((ep) => (
              <tr key={ep.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                <td className="px-5 py-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <Globe className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{ep.name}</span>
                </td>
                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                  {ep.baseUrl}
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-lg bg-slate-100 dark:bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    {ACCESS_LABELS[ep.authType] || "Standard Access"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <Badge
                    variant={
                      ep.healthStatus === "HEALTHY"
                        ? "success"
                        : ep.healthStatus === "DOWN"
                        ? "danger"
                        : "warning"
                    }
                    pulse={ep.healthStatus === "HEALTHY"}
                  >
                    {HEALTH_LABELS[ep.healthStatus] || ep.healthStatus}
                  </Badge>
                </td>
                <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                  {ep.lastLatencyMs ? "Fast" : "—"}
                </td>
                <td className="px-5 py-4 text-right">
                  <Button
                    size="xs"
                    variant="outline"
                    isLoading={pingingId === ep.id}
                    onClick={() => handlePing(ep.id)}
                    leftIcon={<Zap className="h-3 w-3" />}
                  >
                    Check Connection
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Service Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Connected Service or Website"
        description="Add a website or partner service to monitor its availability from your workspace."
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="Service or Website Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Dexta Africa Main Website"
            required
          />

          <Input
            label="Website Address (URL)"
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://dextaafrica.com"
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Connection Access Type
            </label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
            >
              <option value="NONE">Public Website / Service</option>
              <option value="BEARER">Protected Partner Service</option>
              <option value="API_KEY">Verified Partner Key</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Save Service
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
