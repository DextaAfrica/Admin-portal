"use client";

import * as React from "react";
import { Users, UserPlus, Mail, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";

interface Subscriber {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  status: "SUBSCRIBED" | "UNSUBSCRIBED" | "BOUNCED";
  tags: string;
  createdAt: string;
}

export default function AudiencePage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [subscribers, setSubscribers] = React.useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  // New subscriber fields
  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [tagInput, setTagInput] = React.useState("newsletter, beta");

  const fetchAudience = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/marketing/audience");
      const data = await res.json();
      if (res.ok) setSubscribers(data.subscribers || []);
    } catch {
      toastError("Error", "Could not load audience");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  React.useEffect(() => {
    fetchAudience();
  }, [fetchAudience]);

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
      const res = await fetch("/api/marketing/audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, lastName, tags }),
      });
      if (res.ok) {
        toastSuccess("Subscriber Added", `${email} registered in audience directory.`);
        setIsAddOpen(false);
        setEmail("");
        setFirstName("");
        setLastName("");
        fetchAudience();
      } else {
        toastError("Error", "Failed to add subscriber");
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
            Audience & Subscriber Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real subscriber contacts for broadcast campaigns and operational notices
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button size="sm" variant="secondary" onClick={() => fetchAudience()} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
          <Button size="sm" variant="primary" onClick={() => setIsAddOpen(true)} leftIcon={<UserPlus className="h-3.5 w-3.5" />}>
            Add Contact
          </Button>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] uppercase font-mono text-slate-400">
            <tr>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Joined Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {subscribers.map((sub) => {
              let parsedTags: string[] = [];
              try {
                parsedTags = JSON.parse(sub.tags || "[]");
              } catch {
                parsedTags = [];
              }
              return (
                <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {sub.firstName || sub.lastName ? `${sub.firstName || ""} ${sub.lastName || ""}` : sub.email}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400">{sub.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={sub.status === "SUBSCRIBED" ? "success" : "default"}>
                      {sub.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {parsedTags.map((t, idx) => (
                        <span key={idx} className="rounded bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">
                    {formatDate(sub.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Contact Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Marketing Contact"
        description="Add a new verified subscriber to the audience pool."
      >
        <form onSubmit={handleAddSubscriber} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@domain.com"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Amara"
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Diallo"
            />
          </div>

          <Input
            label="Tags (Comma-separated)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="investors, VIP, partner"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button size="sm" variant="primary" type="submit">Save Subscriber</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

