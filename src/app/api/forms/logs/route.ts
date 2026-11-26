import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ensureCustomFormsSchema, getFormPublicPath } from "@/lib/forms/schema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureCustomFormsSchema();

    const { searchParams } = new URL(req.url);
    const groupSlug = searchParams.get("groupSlug") || "";
    const formId = searchParams.get("formId") || "";
    const status = searchParams.get("status") || "";
    const search = (searchParams.get("search") || "").toLowerCase().trim();
    const limit = Math.min(1000, Math.max(10, Number(searchParams.get("limit")) || 250));

    let sql = `
      SELECT
        s.id,
        s."formId",
        s."fullName",
        s.email,
        s.phone,
        s.company,
        s."jobTitle",
        s.category,
        s."attendanceMode",
        s.answers,
        s.notes,
        s.status,
        s."consentAcknowledged",
        s."consentTimestamp",
        s."ipAddress",
        s."createdAt",
        f.title AS "formTitle",
        f.slug AS "formSlug",
        f."routePrefix" AS "routePrefix",
        f."groupSlug" AS "groupSlug",
        f."groupId" AS "groupId",
        g.name AS "groupName"
      FROM "FormSubmission" s
      INNER JOIN "CustomForm" f ON f.id = s."formId"
      LEFT JOIN "CustomFormGroup" g ON g.id = f."groupId" OR g.slug = f."groupSlug"
      WHERE 1=1
    `;
    const params: any[] = [];

    if (groupSlug && groupSlug !== "ALL") {
      params.push(groupSlug);
      sql += ` AND (f."groupSlug" = $${params.length} OR g.slug = $${params.length})`;
    }
    if (formId && formId !== "ALL") {
      params.push(formId);
      sql += ` AND s."formId" = $${params.length}`;
    }
    if (status && status !== "ALL") {
      params.push(status);
      sql += ` AND s.status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (
        LOWER(s."fullName") LIKE $${params.length} OR
        LOWER(s.email) LIKE $${params.length} OR
        LOWER(s.company) LIKE $${params.length} OR
        LOWER(s.phone) LIKE $${params.length} OR
        LOWER(f.title) LIKE $${params.length}
      )`;
    }

    params.push(limit);
    sql += ` ORDER BY s."createdAt" DESC LIMIT $${params.length};`;

    const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...params);

    const logs = rows.map((r) => {
      let parsedAnswers: Record<string, any> = {};
      try {
        parsedAnswers = typeof r.answers === "string" ? JSON.parse(r.answers || "{}") : r.answers || {};
      } catch {
        parsedAnswers = {};
      }
      return {
        id: r.id,
        formId: r.formId,
        formTitle: r.formTitle,
        formSlug: r.formSlug,
        routePath: getFormPublicPath({
          slug: r.formSlug,
          routePrefix: r.routePrefix,
          groupSlug: r.groupSlug,
        }),
        groupName: r.groupName || r.groupSlug || "General",
        groupSlug: r.groupSlug || "general",
        fullName: r.fullName,
        email: r.email,
        phone: r.phone || "",
        company: r.company || "",
        jobTitle: r.jobTitle || "",
        category: r.category || "Attendee",
        attendanceMode: r.attendanceMode || "in-person",
        status: r.status || "registered",
        consentAcknowledged: r.consentAcknowledged !== false,
        consentTimestamp: r.consentTimestamp,
        ipAddress: r.ipAddress || "",
        notes: r.notes || "",
        answers: parsedAnswers,
        createdAt: r.createdAt,
      };
    });

    return NextResponse.json({ success: true, total: logs.length, logs });
  } catch (err: any) {
    console.error("[Forms Logs GET Error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to load data logs" }, { status: 500 });
  }
}
