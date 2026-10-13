"use client";

import * as React from "react";
import { UserPlus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate, getInitials } from "@/lib/utils";

interface Subscriber {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  status: "SUBSCRIBED" | "UNSUBSCRIBED" | "BOUNCED";
  tags: string;
  createdAt: string;
}

const SUBSCRIBER_STATUS_LABELS: Record<Subscriber["status"], string> = {
  SUBSCRIBED: "Subscribed",
  UNSUBSCRIBED: "Opted Out",
  BOUNCED: "Needs Update",
};

export default function AudiencePage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [subscribers, setSubscribers] = React.useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [tagInput, setTagInput] = React.useState("Client, Newsletter");

  const fetchAudience = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/marketing/audience");
      const data = await res.json();
      if (res.ok) setSubscribers(data.subscribers || []);
    } catch {
      toastError("Unable to Load", "Could not load your contacts list.");
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
      const tags = tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch("/api/marketing/audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, lastName, tags }),
      });
      if (res.ok) {
        toastSuccess("Contact Saved", `${email} has been added to your contacts directory.`);
        setIsAddOpen(false);
        setEmail("");
        setFirstName("");
        setLastName("");
        fetchAudience();
      } else {
        toastError("Save Error", "Could not add this contact.");
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
            Audience & Client Contacts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage clients, partners, and subscribers who receive your birthday wishes, invitations, and newsletters
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchAudience()}
            leftIcon={<RefreshCw className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddOpen(true)}
            leftIcon={<UserPlus className="h-3.5 w-3.5" />}
          >
            Add New Contact
          </Button>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-slate-500 font-bold">
            <tr>
              <th className="px-5 py-3.5">Client / Contact</th>
              <th className="px-5 py-3.5">Subscription Status</th>
              <th className="px-5 py-3.5">Groups & Interests</th>
              <th className="px-5 py-3.5">Date Joined</th>
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
              const displayName =
                sub.firstName || sub.lastName
                  ? `${sub.firstName || ""} ${sub.lastName || ""}`.trim()
                  : sub.email;

              return (
                <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 font-bold text-xs">
                        {getInitials(displayName)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{displayName}</p>
                        <p className="text-[11px] text-slate-500">{sub.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={sub.status === "SUBSCRIBED" ? "success" : "default"}>
                      {SUBSCRIBER_STATUS_LABELS[sub.status] || sub.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {parsedTags.map((t, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{formatDate(sub.createdAt)}</td>
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
        title="Add Client or Contact"
        description="Save a new recipient to receive Dexta Africa newsletters, invitations, and updates."
      >
        <form onSubmit={handleAddSubscriber} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="olamide@clientdomain.com"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Olamide"
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Adeyemi"
            />
          </div>

          <Input
            label="Contact Groups (Separated by commas)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Client, Birthday List, Newsletter"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Save Contact
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
