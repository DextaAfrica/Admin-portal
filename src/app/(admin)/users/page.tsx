"use client";

import * as React from "react";
import { UserPlus, Shield, ShieldCheck, ShieldAlert, Lock, RefreshCw, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, PasswordInput } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";

interface UserItem {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  twoFactorEnabled: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  _count: { sessions: number };
}

export default function UsersPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  // New user form state
  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [password, setPassword] = React.useState("DextaAdminPass2026!");
  const [role, setRole] = React.useState("ADMIN");

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch {
      toastError("Error", "Could not load users");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, password, role }),
      });
      const data = await res.json();
      if (res.ok) {
        toastSuccess("Team Member Created", `${fullName} added with role ${role}`);
        setIsAddOpen(false);
        setEmail("");
        setFullName("");
        fetchUsers();
      } else {
        toastError("Error", data.error || "Failed to create user");
      }
    } catch {
      toastError("Error", "Network error");
    }
  };

  const handleToggleStatus = async (user: UserItem) => {
    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, status: nextStatus }),
      });
      if (res.ok) {
        toastSuccess("Status Updated", `User marked as ${nextStatus}`);
        fetchUsers();
      } else {
        toastError("Error", "Failed to update status");
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
            Team & Role-Based Access Control
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage administrative identities, assign permission tiers, and enforce 2FA compliance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button size="sm" variant="secondary" onClick={() => fetchUsers()} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
          <Button size="sm" variant="primary" onClick={() => setIsAddOpen(true)} leftIcon={<UserPlus className="h-3.5 w-3.5" />}>
            Add Member
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121217] overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] uppercase font-mono text-slate-400">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role Tier</th>
              <th className="px-4 py-3">2FA Status</th>
              <th className="px-4 py-3">Account Status</th>
              <th className="px-4 py-3">Sessions</th>
              <th className="px-4 py-3">Last Login</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-500/15 text-red-700 dark:text-rose-400 font-bold text-xs">
                      {u.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{u.fullName}</p>
                      <p className="text-[11px] font-mono text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono">
                  <span className="rounded bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.twoFactorEnabled ? (
                    <Badge variant="success" pulse className="gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Enforced
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="gap-1">
                      <ShieldAlert className="h-3 w-3" />
                      Disabled
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.status === "ACTIVE" ? "default" : "danger"}>
                    {u.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                  {u._count.sessions} active
                </td>
                <td className="px-4 py-3 font-mono text-slate-400">
                  {formatDate(u.lastLoginAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="xs"
                    variant={u.status === "ACTIVE" ? "ghost" : "primary"}
                    onClick={() => handleToggleStatus(u)}
                  >
                    {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Provision Administrative Member"
        description="Create a team member identity and assign granular access permissions."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Okoro"
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@dextaafrica.com"
            required
          />

          <PasswordInput
            label="Temporary Initial Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            showStrength
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Role Permission Tier
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] px-3 py-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="ADMIN">ADMIN (Full Operations & Asset Control)</option>
              <option value="MANAGER">MANAGER (Storage & Marketing Management)</option>
              <option value="AUDITOR">AUDITOR (Read-only Compliance Review)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button size="sm" variant="primary" type="submit">Create Member</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

