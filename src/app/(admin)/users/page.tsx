"use client";

import * as React from "react";
import { UserPlus, ShieldCheck, ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, PasswordInput } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatRoleLabel, getInitials } from "@/lib/utils";

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
  const [statusConfirmUser, setStatusConfirmUser] =
    React.useState<UserItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

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
      toastError("Unable to Load", "Could not load team directory.");
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
        toastSuccess("Team Member Invited", `${fullName} has been added to the Dexta Africa team.`);
        setIsAddOpen(false);
        setEmail("");
        setFullName("");
        fetchUsers();
      } else {
        toastError("Could Not Add Member", data.error || "Failed to add team member");
      }
    } catch {
      toastError("Connection Error", "Please check your connection and try again.");
    }
  };

  const handleToggleStatus = async (user: UserItem) => {
    setIsUpdatingStatus(true);
    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, status: nextStatus }),
      });
      if (res.ok) {
        toastSuccess(
          "Member Status Updated",
          `${user.fullName}'s access is now ${nextStatus === "ACTIVE" ? "Active" : "Paused"}.`
        );
        setStatusConfirmUser(null);
        fetchUsers();
      } else {
        toastError("Update Failed", "Could not update member access.");
      }
    } catch {
      toastError("Connection Error", "Please check your connection and try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Team Members & Responsibilities
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your Dexta Africa colleagues, their workspace responsibilities, and account access
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchUsers()}
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
            Invite Team Member
          </Button>
        </div>
      </div>

      {/* Team Directory Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121318] overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-slate-500 font-bold">
            <tr>
              <th className="px-5 py-3.5">Team Member</th>
              <th className="px-5 py-3.5">Role & Responsibility</th>
              <th className="px-5 py-3.5">Two-Step Protection</th>
              <th className="px-5 py-3.5">Access Status</th>
              <th className="px-5 py-3.5">Last Sign-In</th>
              <th className="px-5 py-3.5 text-right">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 font-bold text-xs">
                      {getInitials(u.fullName)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{u.fullName}</p>
                      <p className="text-[11px] text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-lg bg-slate-100 dark:bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {formatRoleLabel(u.role)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {u.twoFactorEnabled ? (
                    <Badge variant="success" pulse className="gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Protected
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="gap-1">
                      <ShieldAlert className="h-3 w-3" />
                      Standard Sign-In
                    </Badge>
                  )}
                </td>
                <td className="px-5 py-4">
                  <Badge variant={u.status === "ACTIVE" ? "success" : "danger"}>
                    {u.status === "ACTIVE" ? "Active" : "Paused"}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-slate-500">{formatDate(u.lastLoginAt)}</td>
                <td className="px-5 py-4 text-right">
                  <Button
                    size="xs"
                    variant={u.status === "ACTIVE" ? "ghost" : "primary"}
                    onClick={() => setStatusConfirmUser(u)}
                  >
                    {u.status === "ACTIVE" ? "Pause Access" : "Restore Access"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Team Member Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Invite a Team Member"
        description="Add a colleague to the Dexta Africa workspace and choose their responsibility level."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Colleague's Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g., Chinedu Okafor"
            required
          />

          <Input
            label="Work Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="chinedu@dextaafrica.com"
            required
          />

          <PasswordInput
            label="Temporary Welcome Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            showStrength
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Team Responsibility
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
            >
              <option value="ADMIN">Operations Manager (Full Workspace Access)</option>
              <option value="MANAGER">Communications & Media Coordinator</option>
              <option value="AUDITOR">Team Reviewer (View-Only Access)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Add Team Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pause / Restore Member Access Confirmation Modal */}
      <Modal
        isOpen={Boolean(statusConfirmUser)}
        onClose={() => setStatusConfirmUser(null)}
        title={
          statusConfirmUser?.status === "ACTIVE"
            ? "Pause Team Member Access?"
            : "Restore Team Member Access?"
        }
        description={
          statusConfirmUser?.status === "ACTIVE"
            ? "Please confirm before temporarily pausing this colleague's workspace sign-in access."
            : "Please confirm before restoring this colleague's workspace sign-in access."
        }
        maxWidth="sm"
        footer={
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStatusConfirmUser(null)}
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant={
                statusConfirmUser?.status === "ACTIVE" ? "danger" : "primary"
              }
              isLoading={isUpdatingStatus}
              onClick={() =>
                statusConfirmUser && handleToggleStatus(statusConfirmUser)
              }
            >
              {statusConfirmUser?.status === "ACTIVE"
                ? "Yes, Pause Access"
                : "Yes, Restore Access"}
            </Button>
          </>
        }
      >
        {statusConfirmUser && (
          <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3.5 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300">
            Team Member:{" "}
            <strong className="text-slate-900 dark:text-white">
              {statusConfirmUser.fullName}
            </strong>{" "}
            ({statusConfirmUser.email})
          </div>
        )}
      </Modal>
    </div>
  );
}
