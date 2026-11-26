import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ensureCrmSchema } from "@/lib/crm/schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureCrmSchema();

    const body = await req.json().catch(() => ({}));
    const formId = body.formId;

    const submissions = await prisma.formSubmission.findMany({
      where: formId ? { formId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    let importedCount = 0;
    let skippedCount = 0;

    for (const sub of submissions) {
      const email = (sub.email || "").toLowerCase().trim();
      if (!email) {
        skippedCount++;
        continue;
      }

      const existing = await prisma.crmClient.findUnique({ where: { email } });
      if (existing) {
        skippedCount++;
        continue;
      }

      await prisma.crmClient.create({
        data: {
          name: sub.fullName || email,
          email,
          phone: sub.phone || "",
          company: sub.company || "",
          category: sub.category?.toUpperCase() === "PARTNER" ? "STRATEGIC_PARTNER" : "PROSPECT",
          stage: "INQUIRY",
          assignedTo: user.fullName,
          assignedToUserId: user.id,
          leadSource: "FORM",
          notes: `Imported from Form Submission (${sub.category})`,
        },
      });
      importedCount++;
    }

    return NextResponse.json({
      success: true,
      importedCount,
      skippedCount,
      message: `Imported ${importedCount} new lead(s) into your CRM (${skippedCount} already existed).`,
    });
  } catch (err: any) {
    console.error("[CRM Import Leads Error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to import leads" }, { status: 500 });
  }
}
