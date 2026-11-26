export const ROUTE_PREFIX_OPTIONS = [
  { value: "/visit", label: "/visit/<slug>", desc: "Visitor Check-In & Reception Tap-In" },
  { value: "/events", label: "/events/<slug>", desc: "Events, Open Houses & Masterclasses" },
  { value: "/academy", label: "/academy/<slug>", desc: "Dexta Clan Cohorts & Training" },
  { value: "/onboarding", label: "/onboarding/<slug>", desc: "Client & Partner Onboarding" },
  { value: "/f", label: "/f/<group>/<slug>", desc: "Custom Group-Scoped Route" },
  { value: "/register", label: "/register/<slug>", desc: "Legacy Registration Route" },
] as const;

export function getFormPublicPath(form: {
  slug: string;
  routePrefix?: string | null;
  groupSlug?: string | null;
}): string {
  const prefix = (form.routePrefix || "/events").replace(/\/$/, "");
  if (prefix === "/f") {
    const grp = (form.groupSlug || "general").replace(/^\/+|\/+$/g, "");
    return `/f/${grp}/${form.slug}`;
  }
  return `${prefix}/${form.slug}`;
}
