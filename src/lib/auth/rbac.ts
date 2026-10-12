export type Role = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "AUDITOR";

export type Permission =
  | "users:read"
  | "users:write"
  | "users:delete"
  | "storage:read"
  | "storage:write"
  | "storage:delete"
  | "marketing:read"
  | "marketing:write"
  | "marketing:send"
  | "endpoints:read"
  | "endpoints:write"
  | "audit:read"
  | "settings:read"
  | "settings:write";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "users:read",
    "users:write",
    "users:delete",
    "storage:read",
    "storage:write",
    "storage:delete",
    "marketing:read",
    "marketing:write",
    "marketing:send",
    "endpoints:read",
    "endpoints:write",
    "audit:read",
    "settings:read",
    "settings:write",
  ],
  ADMIN: [
    "users:read",
    "users:write",
    "storage:read",
    "storage:write",
    "marketing:read",
    "marketing:write",
    "marketing:send",
    "endpoints:read",
    "endpoints:write",
    "audit:read",
    "settings:read",
  ],
  MANAGER: [
    "users:read",
    "storage:read",
    "storage:write",
    "marketing:read",
    "marketing:write",
    "endpoints:read",
    "audit:read",
  ],
  AUDITOR: [
    "users:read",
    "storage:read",
    "marketing:read",
    "endpoints:read",
    "audit:read",
    "settings:read",
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role as Role];
  if (!perms) return false;
  return perms.includes(permission);
}

export function canManageRole(actorRole: string, targetRole: string): boolean {
  if (actorRole === "SUPER_ADMIN") return true;
  if (actorRole === "ADMIN" && (targetRole === "MANAGER" || targetRole === "AUDITOR")) {
    return true;
  }
  return false;
}

