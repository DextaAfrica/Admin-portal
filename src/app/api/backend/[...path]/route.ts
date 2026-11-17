import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { generateBackendAdminToken, BACKEND_API_URL } from "@/lib/backend-api";
import { logAuditEvent } from "@/lib/auth/audit";
import {
  SaveDevelopmentSchema,
  SaveArticleSchema,
  SaveCareerListingSchema,
  SaveContentPageSchema,
  formatZodError,
} from "@/lib/validation/schemas";

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(req, params.path, "GET");
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(req, params.path, "POST");
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(req, params.path, "PUT");
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(req, params.path, "PATCH");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(req, params.path, "DELETE");
}

async function handleProxy(
  req: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to access workspace backend." },
        { status: 401 }
      );
    }

    // Role-based access control: AUDITOR role is read-only
    if (user.role === "AUDITOR" && method !== "GET") {
      return NextResponse.json(
        { error: "Reviewer (AUDITOR) role has read-only permissions." },
        { status: 403 }
      );
    }

    const subPath = pathSegments.join("/");
    const search = req.nextUrl.search;
    const targetUrl = `${BACKEND_API_URL}/admin/${subPath}${search}`;

    const token = await generateBackendAdminToken(user.id, user.email);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "X-Admin-ID": user.id,
      "X-Admin-Email": user.email,
      "X-Forwarded-For": req.headers.get("x-forwarded-for") || "127.0.0.1",
    };

    let body: string | undefined = undefined;
    if (method !== "GET" && method !== "HEAD") {
      headers["Content-Type"] = "application/json";
      body = await req.text();

      // Pre-flight enterprise input validation before dispatching to Go core backend
      if (body) {
        try {
          const jsonBody = JSON.parse(body);
          const rootEntity = pathSegments[0]?.toLowerCase();
          const subEntity = pathSegments[1]?.toLowerCase();

          if (rootEntity === "portfolio" && (method === "POST" || method === "PUT")) {
            const parsed = SaveDevelopmentSchema.safeParse(jsonBody);
            if (!parsed.success) {
              return NextResponse.json(formatZodError(parsed.error), { status: 400 });
            }
          } else if (rootEntity === "journal" && (method === "POST" || method === "PUT")) {
            const parsed = SaveArticleSchema.safeParse(jsonBody);
            if (!parsed.success) {
              return NextResponse.json(formatZodError(parsed.error), { status: 400 });
            }
          } else if (
            rootEntity === "careers" &&
            (subEntity === "listings" || pathSegments.length === 3) &&
            (method === "POST" || method === "PUT")
          ) {
            const parsed = SaveCareerListingSchema.safeParse(jsonBody);
            if (!parsed.success) {
              return NextResponse.json(formatZodError(parsed.error), { status: 400 });
            }
          } else if (rootEntity === "content" && method === "PUT") {
            const parsed = SaveContentPageSchema.safeParse(jsonBody);
            if (!parsed.success) {
              return NextResponse.json(formatZodError(parsed.error), { status: 400 });
            }
          }
        } catch (jsonErr) {
          return NextResponse.json(
            { error: "Invalid JSON payload structure" },
            { status: 400 }
          );
        }
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(targetUrl, {
      method,
      headers,
      body,
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    // Audit log state-modifying actions
    if (method !== "GET") {
      await logAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: `BACKEND_${method}_${pathSegments[0].toUpperCase()}`,
        entity: pathSegments[0] || "BackendService",
        entityId: pathSegments[1] || undefined,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
        metadata: { path: subPath, statusCode: res.status },
      });
    }

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error("Backend proxy error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Internal communication error with core backend service",
      },
      { status: 502 }
    );
  }
}

