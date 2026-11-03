import { SignJWT } from "jose";

export const BACKEND_API_URL =
  process.env.BACKEND_API_URL || "http://localhost:8080";

const BACKEND_JWT_SECRET =
  process.env.BACKEND_JWT_SECRET ||
  process.env.JWT_SECRET ||
  "dexta-africa-enterprise-secret-key-at-least-32-chars-long";

export async function generateBackendAdminToken(
  adminId: string = "admin-system",
  email: string = "admin@dexta.africa"
): Promise<string> {
  const secret = new TextEncoder().encode(BACKEND_JWT_SECRET);
  return new SignJWT({
    admin_id: adminId,
    email: email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("dexta-backend")
    .setSubject(adminId)
    .setExpirationTime("24h")
    .sign(secret);
}

export interface PaginatedMeta {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface Development {
  id: string;
  slug: string;
  name: string;
  summary: string;
  body: Record<string, any>;
  heroImageUrl: string;
  gallery: Array<{ url: string; alt: string }>;
  location: string;
  status: "planning" | "under_construction" | "completed";
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  published: boolean;
  publishedAt?: string;
  displayOrder: number;
  updatedAt: string;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  sourcePage: string;
  status: "new" | "in_progress" | "resolved" | "archived";
  createdAt: string;
}

export interface ContentPage {
  key: string;
  title: string;
  content: Record<string, any>;
  seoTitle: string;
  seoDescription: string;
  published: boolean;
  updatedAt: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: Record<string, any>;
  coverImageUrl: string;
  author: string;
  category: string;
  seoTitle: string;
  seoDescription: string;
  published: boolean;
  publishedAt?: string;
  updatedAt: string;
}

export interface CareerListing {
  id: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  type: string;
  summary: string;
  description: Record<string, any>;
  requirements: string[];
  benefits: string[];
  status: "open" | "closed";
  published: boolean;
  updatedAt: string;
}

export interface Subscriber {
  email: string;
  status: string;
  subscribedAt: string;
}

interface FetchOptions extends RequestInit {
  adminId?: string;
  adminEmail?: string;
  timeoutMs?: number;
}

async function backendFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { adminId, adminEmail, timeoutMs = 10000, ...customInit } = options;
  const token = await generateBackendAdminToken(adminId, adminEmail);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(customInit.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && customInit.method && customInit.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }

  const url = `${BACKEND_API_URL}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const res = await fetch(url, {
      ...customInit,
      headers,
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timer);

    if (res.status === 204) {
      return {} as T;
    }

    const json = await res.json();
    if (!res.ok) {
      const errorMsg =
        json.error?.message ||
        json.message ||
        `Backend request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return json as T;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new Error(`Go Backend request timed out after ${timeoutMs}ms: ${path}`);
    }
    throw err;
  }
}

export const backendApi = {
  health: async (): Promise<{ status: "HEALTHY" | "DOWN"; latencyMs: number; details?: any }> => {
    const start = Date.now();
    try {
      const res = await fetch(`${BACKEND_API_URL}/healthz`, {
        cache: "no-store",
      });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return { status: "HEALTHY", latencyMs, details: data };
      }
      return { status: "DOWN", latencyMs };
    } catch {
      return { status: "DOWN", latencyMs: Date.now() - start };
    }
  },

  portfolio: {
    list: (params: { page?: number; perPage?: number } = {}) => {
      const sp = new URLSearchParams();
      if (params.page) sp.set("page", String(params.page));
      if (params.perPage) sp.set("perPage", String(params.perPage));
      const qs = sp.toString() ? `?${sp.toString()}` : "";
      return backendFetch<PaginatedResponse<Development>>(`/admin/portfolio${qs}`);
    },
    get: (id: string) => backendFetch<{ data: Development }>(`/admin/portfolio/${id}`),
    create: (data: Partial<Development>) =>
      backendFetch<{ data: Development }>("/admin/portfolio", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Development>) =>
      backendFetch<{ data: Development }>(`/admin/portfolio/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      backendFetch<void>(`/admin/portfolio/${id}`, {
        method: "DELETE",
      }),
  },

  enquiries: {
    list: (params: { page?: number; perPage?: number } = {}) => {
      const sp = new URLSearchParams();
      if (params.page) sp.set("page", String(params.page));
      if (params.perPage) sp.set("perPage", String(params.perPage));
      const qs = sp.toString() ? `?${sp.toString()}` : "";
      return backendFetch<PaginatedResponse<Enquiry>>(`/admin/enquiries${qs}`);
    },
    get: (id: string) => backendFetch<{ data: Enquiry }>(`/admin/enquiries/${id}`),
    updateStatus: (id: string, status: "new" | "in_progress" | "resolved" | "archived") =>
      backendFetch<void>(`/admin/enquiries/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },

  content: {
    list: () => backendFetch<{ data: ContentPage[] }>("/admin/content"),
    get: (key: string) => backendFetch<{ data: ContentPage }>(`/admin/content/${key}`),
    save: (key: string, data: {
      title: string;
      content: Record<string, any>;
      seoTitle?: string;
      seoDescription?: string;
      published?: boolean;
    }) =>
      backendFetch<{ data: ContentPage }>(`/admin/content/${key}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  journal: {
    list: (params: { page?: number; perPage?: number } = {}) => {
      const sp = new URLSearchParams();
      if (params.page) sp.set("page", String(params.page));
      if (params.perPage) sp.set("perPage", String(params.perPage));
      const qs = sp.toString() ? `?${sp.toString()}` : "";
      return backendFetch<PaginatedResponse<Article>>(`/admin/journal${qs}`);
    },
    get: (id: string) => backendFetch<{ data: Article }>(`/admin/journal/${id}`),
    create: (data: Partial<Article>) =>
      backendFetch<{ data: Article }>("/admin/journal", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Article>) =>
      backendFetch<{ data: Article }>(`/admin/journal/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      backendFetch<void>(`/admin/journal/${id}`, {
        method: "DELETE",
      }),
  },

  careers: {
    list: (params: { page?: number; perPage?: number } = {}) => {
      const sp = new URLSearchParams();
      if (params.page) sp.set("page", String(params.page));
      if (params.perPage) sp.set("perPage", String(params.perPage));
      const qs = sp.toString() ? `?${sp.toString()}` : "";
      return backendFetch<PaginatedResponse<CareerListing>>(`/admin/careers/listings${qs}`);
    },
    get: (id: string) => backendFetch<{ data: CareerListing }>(`/admin/careers/listings/${id}`),
    create: (data: Partial<CareerListing>) =>
      backendFetch<{ data: CareerListing }>("/admin/careers/listings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<CareerListing>) =>
      backendFetch<{ data: CareerListing }>(`/admin/careers/listings/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      backendFetch<void>(`/admin/careers/listings/${id}`, {
        method: "DELETE",
      }),
  },

  newsletter: {
    subscribers: (params: { page?: number; perPage?: number } = {}) => {
      const sp = new URLSearchParams();
      if (params.page) sp.set("page", String(params.page));
      if (params.perPage) sp.set("perPage", String(params.perPage));
      const qs = sp.toString() ? `?${sp.toString()}` : "";
      return backendFetch<PaginatedResponse<Subscriber>>(`/admin/newsletter/subscribers${qs}`);
    },
  },
};

