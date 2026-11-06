/**
 * Dexta Africa Enterprise Subdomain Routing Utilities
 * Handles seamless switching between the root gateway, ops.dextaafrica.org, and admin.dextaafrica.org.
 */

export type PortalSubdomain = "ops" | "admin" | "root";

export function getSubdomainUrl(subdomain: PortalSubdomain, path = "/"): string {
  if (typeof window === "undefined") {
    if (subdomain === "ops") return `https://ops.dextaafrica.org${path}`;
    if (subdomain === "admin") return `https://admin.dextaafrica.org${path}`;
    return `https://dextaafrica.org${path}`;
  }

  const { protocol, hostname, port } = window.location;
  const isLocal = hostname.includes("localhost") || hostname === "127.0.0.1";
  const portSuffix = port ? `:${port}` : "";

  if (isLocal) {
    if (subdomain === "ops") {
      return `${protocol}//ops.localhost${portSuffix}${path}`;
    }
    if (subdomain === "admin") {
      return `${protocol}//admin.localhost${portSuffix}${path}`;
    }
    // Root localhost
    return `${protocol}//localhost${portSuffix}${path}`;
  }

  // Production or Staging domains
  if (subdomain === "ops") {
    return `https://ops.dextaafrica.org${path}`;
  }
  if (subdomain === "admin") {
    return `https://admin.dextaafrica.org${path}`;
  }
  return `https://dextaafrica.org${path}`;
}

export function navigateToSubdomain(subdomain: PortalSubdomain, path = "/"): void {
  if (typeof window === "undefined") return;
  const targetUrl = getSubdomainUrl(subdomain, path);
  window.location.href = targetUrl;
}

/**
 * Enterprise Single Sign-On (SSO) Cross-Subdomain Transition
 * Securely transfers authentication tickets across ops, admin, and root hosts so users never get logged out.
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

