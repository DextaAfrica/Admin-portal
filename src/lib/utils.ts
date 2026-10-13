import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes safely without style conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats raw byte counts into human-friendly file size labels.
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return "0 KB";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Formats a date/time into a readable business timestamp (e.g., "Oct 13, 2026 • 09:30 AM").
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Formats a date without time (e.g., "October 13, 2026").
 */
export function formatDateLong(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/**
 * Formats relative time elapsed in natural language.
 */
export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const target = new Date(date).getTime();
  if (isNaN(target)) return "—";
  const seconds = Math.floor((Date.now() - target) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

/**
 * Extracts up to 2 uppercase initials from a person's full name.
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "DA";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Translates internal activity codes into clear, non-technical business descriptions.
 */
export function formatActivityAction(action: string | null | undefined): string {
  if (!action) return "Workspace Activity";
  const map: Record<string, string> = {
    AUTH_LOGIN_SUCCESS: "Signed in to workspace",
    AUTH_LOGIN_FAILED: "Unsuccessful sign-in attempt",
    AUTH_LOGOUT: "Signed out of workspace",
    AUTH_REGISTER: "Joined the team workspace",
    MFA_ENROLLED: "Enabled two-step verification",
    MFA_VERIFIED: "Completed security verification",
    FILE_UPLOAD_PRESIGNED: "Uploaded a new document",
    FILE_UPLOADED: "Uploaded a new document",
    FILE_DELETED: "Removed a document from library",
    CAMPAIGN_CREATED: "Created an email campaign",
    CAMPAIGN_DISPATCHED: "Sent an email campaign",
    ENDPOINT_TESTED: "Checked partner service connection",
    ENDPOINT_CREATED: "Added a connected service",
    USER_CREATED: "Invited a new team member",
    USER_UPDATED: "Updated team member profile",
  };
  if (map[action]) return map[action];
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Converts system role codes into clear business titles.
 */
export function formatRoleLabel(role: string | null | undefined): string {
  if (!role) return "Team Member";
  const normalized = role.toUpperCase();
  if (normalized.includes("SUPER")) return "Executive Director";
  if (normalized.includes("ADMIN")) return "Operations Manager";
  if (normalized.includes("MARKETING")) return "Communications Lead";
  if (normalized.includes("EDITOR")) return "Content Coordinator";
  return "Team Specialist";
}

/**
 * Returns a human-friendly file category label from a MIME type or filename.
 */
export function formatFileCategory(mimeType?: string, fileName?: string): string {
  const mime = (mimeType || "").toLowerCase();
  const name = (fileName || "").toLowerCase();
  if (mime.includes("image") || /\.(png|jpg|jpeg|webp|gif|svg)$/.test(name)) {
    return "Image & Media";
  }
  if (mime.includes("pdf") || name.endsWith(".pdf")) {
    return "PDF Document";
  }
  if (
    mime.includes("spreadsheet") ||
    mime.includes("csv") ||
    mime.includes("excel") ||
    /\.(csv|xlsx|xls)$/.test(name)
  ) {
    return "Spreadsheet";
  }
  if (mime.includes("video") || /\.(mp4|mov|webm)$/.test(name)) {
    return "Video Clip";
  }
  return "Office Document";
}
