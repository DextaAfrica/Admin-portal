import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { generateCrmIntelligence } from "@/lib/crm/intelligence";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (user.role || "").toUpperCase();
    const dept = (user.department || "").toUpperCase();
    const title = (user.jobTitle || "").toUpperCase();
    const workspace = ((user as any).primaryWorkspace || "").toLowerCase();

    const isAllowed =
      role === "SUPER_ADMIN" ||
      role === "MD" ||
      role === "CEO" ||
      role === "GM" ||
      dept === "EXECUTIVE" ||
      dept === "OPERATIONS" ||
      workspace === "crm" ||
      title.includes("MANAGING DIRECTOR") ||
      title.includes("GENERAL MANAGER");

    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const report = await generateCrmIntelligence();
    return NextResponse.json(report);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate CRM intelligence" },
      { status: 500 }
    );
  }
}
