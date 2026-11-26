import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ensureCustomFormsSchema, getFormPublicPath } from "@/lib/forms/schema";
import { buildPdfBuffer, buildXlsxBuffer } from "@/lib/forms/export";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureCustomFormsSchema();

    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "xlsx").toLowerCase();
    const groupSlug = searchParams.get("groupSlug") || "";
    const formId = searchParams.get("formId") || "";
    const search = (searchParams.get("search") || "").toLowerCase().trim();

    let sql = `
      SELECT
        s.id,
        s."fullName",
        s.email,
        s.phone,
        s.company,
        s."jobTitle",
        s.category,
        s."attendanceMode",
        s.status,
        s."consentAcknowledged",
        s."ipAddress",
        s.answers,
        s."createdAt",
        f.title AS "formTitle",
        f.slug AS "formSlug",
        f."routePrefix" AS "routePrefix",
        f."groupSlug" AS "groupSlug",
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
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (
        LOWER(s."fullName") LIKE $${params.length} OR
        LOWER(s.email) LIKE $${params.length} OR
        LOWER(s.company) LIKE $${params.length} OR
        LOWER(f.title) LIKE $${params.length}
      )`;
    }

    sql += ` ORDER BY s."createdAt" DESC LIMIT 5000;`;
    const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...params);

    const dateTag = new Date().toISOString().slice(0, 10);
    const filePrefix = formId && formId !== "ALL" && rows[0]?.formSlug
      ? `${rows[0].formSlug}-data-log-${dateTag}`
      : `dexta-forms-master-log-${dateTag}`;

    if (format === "pdf") {
      const headers = [
        "Date",
        "Group",
        "Form / Link",
        "Full Name",
        "Email",
        "Phone",
        "Company",
        "Status",
      ];
      const pdfRows = rows.map((r) => [
        new Date(r.createdAt).toISOString().slice(0, 10),
        r.groupName || r.groupSlug || "General",
        r.formTitle || r.formSlug,
        r.fullName,
        r.email,
        r.phone || "-",
        r.company || "-",
        String(r.status || "registered").toUpperCase(),
      ]);

      const pdfBuffer = buildPdfBuffer({
        title: "Dexta Africa - Forms & Registration Master Data Log",
        subtitle: `Total Records: ${rows.length} | Scope: ${
          groupSlug && groupSlug !== "ALL" ? groupSlug : "All Groups"
        } | Exported by ${user.email}`,
        headers,
        rows: pdfRows,
      });

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filePrefix}.pdf"`,
        },
      });
    }

    if (format === "csv") {
      const headers = [
        "Submission ID",
        "Submitted At",
        "Group",
        "Form Title",
        "Dedicated Route",
        "Full Name",
        "Email",
        "Phone",
        "Company",
        "Job Title",
        "Category",
        "Attendance Mode",
        "Status",
        "NDPR Consent",
        "IP Address",
        "Custom Answers",
      ];
      const csvLines = [
        headers.map((h) => `"${h}"`).join(","),
        ...rows.map((r) => {
          const routePath = getFormPublicPath({
            slug: r.formSlug,
            routePrefix: r.routePrefix,
            groupSlug: r.groupSlug,
          });
          return [
            r.id,
            new Date(r.createdAt).toISOString(),
            r.groupName || r.groupSlug || "General",
            r.formTitle,
            routePath,
            r.fullName,
            r.email,
            r.phone || "",
            r.company || "",
            r.jobTitle || "",
            r.category || "",
            r.attendanceMode || "",
            r.status || "",
            r.consentAcknowledged !== false ? "Verified" : "No",
            r.ipAddress || "",
            typeof r.answers === "string" ? r.answers : JSON.stringify(r.answers || {}),
          ]
            .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
            .join(",");
        }),
      ];

      return new NextResponse("\uFEFF" + csvLines.join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filePrefix}.csv"`,
        },
      });
    }

    // Default: True .xlsx Excel Workbook
    const logHeaders = [
      "Submitted At",
      "Group",
      "Form Title",
      "Dedicated Route",
      "Full Name",
      "Email",
      "Phone",
      "Company / Organization",
      "Job Title",
      "Category",
      "Mode",
      "Status",
      "NDPR Consent",
      "IP Address",
      "Custom Answers",
    ];
    const logRows = rows.map((r) => [
      new Date(r.createdAt).toISOString().replace("T", " ").slice(0, 19),
      r.groupName || r.groupSlug || "General",
      r.formTitle,
      getFormPublicPath({
        slug: r.formSlug,
        routePrefix: r.routePrefix,
        groupSlug: r.groupSlug,
      }),
      r.fullName,
      r.email,
      r.phone || "",
      r.company || "",
      r.jobTitle || "",
      r.category || "",
      r.attendanceMode || "",
      String(r.status || "registered").toUpperCase(),
      r.consentAcknowledged !== false ? "Verified" : "Pending",
      r.ipAddress || "",
      typeof r.answers === "string" ? r.answers : JSON.stringify(r.answers || {}),
    ]);

    // Build Group Summary sheet
    const groupCounts = new Map<string, number>();
    for (const r of rows) {
      const key = r.groupName || r.groupSlug || "General";
      groupCounts.set(key, (groupCounts.get(key) || 0) + 1);
    }
    const summaryRows = Array.from(groupCounts.entries()).map(([group, count]) => [group, count]);

    const xlsxBuffer = buildXlsxBuffer([
      { name: "Submissions Log", headers: logHeaders, rows: logRows },
      { name: "Group Summary", headers: ["Group Name", "Total Submissions"], rows: summaryRows },
    ]);

    return new NextResponse(new Uint8Array(xlsxBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filePrefix}.xlsx"`,
      },
    });
  } catch (err: any) {
    console.error("[Forms Export GET Error]:", err);
    return NextResponse.json({ error: err?.message || "Export failed" }, { status: 500 });
  }
}
