import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { backendApi } from "@/lib/backend-api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "20", 10);

    const res = await backendApi.visitors.listReportDeliveries({ page, perPage });
    return NextResponse.json({
      deliveries: res?.data || [],
      meta: res?.meta || { page, perPage, totalItems: 0, totalPages: 1 },
    });
  } catch (err: any) {
    console.error("List visitor report deliveries error:", err);
    return NextResponse.json({ deliveries: [], meta: { page: 1, perPage: 20, totalItems: 0, totalPages: 1 } });
  }
}
