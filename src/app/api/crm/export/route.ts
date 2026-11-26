import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ensureCrmSchema } from "@/lib/crm/schema";
import { buildPdfBuffer, buildXlsxBuffer } from "@/lib/forms/export";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureCrmSchema();

    const userRole = (user.role || "").toUpperCase();
    const userDept = (user.department || "").toUpperCase();
    const isExecutiveOrSuper = userRole === "SUPER_ADMIN" || userDept === "EXECUTIVE";

    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "xlsx").toLowerCase();

    const clients = await prisma.crmClient.findMany({
      where: isExecutiveOrSuper
        ? undefined
        : {
            OR: [{ assignedToUserId: user.id }, { assignedTo: user.fullName }],
          },
      include: { deals: true },
      orderBy: { createdAt: "desc" },
    });

    const dateTag = new Date().toISOString().slice(0, 10);

    if (format === "pdf") {
      const headers = ["Client Name", "Company", "Email", "Category", "Stage", "Est. Value", "Rep"];
      const rows = clients.map((c) => [
        c.name,
        c.company || "-",
        c.email,
        c.category,
        c.stage,
        `${c.currency} ${Number(c.estimatedValue || 0).toLocaleString()}`,
        c.assignedTo || "-",
      ]);

      const pdfBuffer = buildPdfBuffer({
        title: "Dexta Africa CRM - Client & Pipeline Report",
        subtitle: `Total Accounts: ${clients.length} | Scope: ${isExecutiveOrSuper ? "All Reps" : user.fullName} | ${dateTag}`,
        headers,
        rows,
      });

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="dexta-crm-report-${dateTag}.pdf"`,
        },
      });
    }

    const clientHeaders = [
      "Client Name",
      "Company",
      "Email",
      "Phone",
      "Category",
      "Stage",
      "Estimated Value",
      "Currency",
      "Lead Source",
      "Assigned Rep",
      "Created At",
    ];
    const clientRows = clients.map((c) => [
      c.name,
      c.company || "",
      c.email,
      c.phone || "",
      c.category,
      c.stage,
      Number(c.estimatedValue || 0),
      c.currency,
      c.leadSource || "DIRECT",
      c.assignedTo || "",
      c.createdAt.toISOString().slice(0, 10),
    ]);

    const dealHeaders = ["Deal Title", "Client", "Value", "Currency", "Stage", "Probability %"];
    const dealRows: any[][] = [];
    for (const c of clients) {
      for (const d of c.deals) {
        dealRows.push([d.title, c.name, Number(d.value || 0), d.currency, d.stage, d.probability]);
      }
    }

    const xlsxBuffer = buildXlsxBuffer([
      { name: "CRM Clients", headers: clientHeaders, rows: clientRows },
      { name: "Deals Pipeline", headers: dealHeaders, rows: dealRows },
    ]);

    return new NextResponse(new Uint8Array(xlsxBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="dexta-crm-pipeline-${dateTag}.xlsx"`,
      },
    });
  } catch (err: any) {
    console.error("[CRM Export Error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to export CRM" }, { status: 500 });
  }
}
