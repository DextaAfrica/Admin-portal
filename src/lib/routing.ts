/**
 * Dexta Africa Enterprise Subdomain Routing Utilities
 * Dynamically resolves URLs across root gateway, ops, and admin subdomains
 * with full support for environment configuration, dynamic domains, and localhost.
 */

export type PortalSubdomain = "ops" | "admin" | "root";

/**
 * Returns the effective base domain (e.g. dextaafrica.com, dextaafrica.org, or custom)
 */
export function getBaseDomain(hostHeader?: string | null): string {
  if (process.env.NEXT_PUBLIC_BASE_DOMAIN) {
    return process.env.NEXT_PUBLIC_BASE_DOMAIN;
  }

  let host = hostHeader;
  if (!host && typeof window !== "undefined") {
    host = window.location.host;
  }

  if (host) {
    const hostname = host.split(":")[0].toLowerCase();
    const parts = hostname.split(".");
    if (parts.length >= 2 && !hostname.endsWith("localhost") && hostname !== "127.0.0.1") {
      return parts.slice(-2).join(".");
    }
  }

  return "dextaafrica.com";
}

/**
 * Dynamically builds a subdomain URL with port and protocol awareness.
 */
export function getSubdomainUrl(
  subdomain: PortalSubdomain,
  path = "/",
  hostHeader?: string | null
): string {
  let hostname = "";
  let port = "";
  let protocol = "https:";

  if (typeof window !== "undefined") {
    hostname = window.location.hostname.toLowerCase();
    port = window.location.port;
    protocol = window.location.protocol;
  } else if (hostHeader) {
    const parts = hostHeader.toLowerCase().split(":");
    hostname = parts[0];
    port = parts[1] || "";
    protocol = hostname.includes("localhost") || hostname === "127.0.0.1" ? "http:" : "https:";
  }

  const isLocal =
    hostname.includes("localhost") ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost");

  const portSuffix = port ? `:${port}` : "";

  // 1. Localhost development environment
  if (isLocal) {
    if (subdomain === "ops") {
      return `${protocol}//ops.localhost${portSuffix}${path}`;
    }
    if (subdomain === "admin") {
      return `${protocol}//admin.localhost${portSuffix}${path}`;
    }
    return `${protocol}//localhost${portSuffix}${path}`;
  }

  // 2. Production / Custom domain environment
  const baseDomain = getBaseDomain(hostHeader);
  const opsHost = process.env.NEXT_PUBLIC_OPS_DOMAIN || `ops.${baseDomain}`;
  const adminHost = process.env.NEXT_PUBLIC_ADMIN_DOMAIN || `admin.${baseDomain}`;

  if (subdomain === "ops") {
    return `https://${opsHost}${path}`;
  }
  if (subdomain === "admin") {
    return `https://${adminHost}${path}`;
  }
  return `https://${baseDomain}${path}`;
}

export function navigateToSubdomain(subdomain: PortalSubdomain, path = "/"): void {
  if (typeof window === "undefined") return;
  const targetUrl = getSubdomainUrl(subdomain, path);
  window.location.href = targetUrl;
}

/**
 * Enterprise Single Sign-On (SSO) Cross-Subdomain Transition
 * Securely transfers authentication tickets across ops, admin, and root hosts.
 */
export function navigateToSubdomainWithSso(subdomain: PortalSubdomain, next = "/dashboard"): void {
  if (typeof window === "undefined") return;
  const targetSubdomainBase = getSubdomainUrl(subdomain, next);
  try {
    const targetParsed = new URL(targetSubdomainBase);
    if (window.location.hostname.toLowerCase() === targetParsed.hostname.toLowerCase()) {
      window.location.href = next;
      return;
    }
    const targetSsoLanding = getSubdomainUrl(subdomain, "/api/auth/sso");
    window.location.href = `/api/auth/sso?target=${encodeURIComponent(targetSsoLanding)}&next=${encodeURIComponent(next)}`;
  } catch {
    navigateToSubdomain(subdomain, next);
  }
}
