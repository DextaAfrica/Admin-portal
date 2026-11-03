import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { logPolicyAlert } from "@/lib/auth/policy-alerts";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();

    const alert = await logPolicyAlert({
      severity: "CRITICAL",
      eventType: "UNAUTHORIZED_DASHBOARD_ACCESS",
      title: "Zero-Access Boundary Violation Detected",
      description: `Watchdog intercepted attempted access to confidential employee payroll and private documents. Originating account: ${user?.email || "unknown@dextaafrica.com"}`,
      actorEmail: user?.email || "it.operator@dextaafrica.com",
      targetResource: "ConfidentialStaffVault",
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "Mozilla/5.0",
    });

    return NextResponse.json({ success: true, alert });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to trigger watchdog test" },
      { status: 500 }
    );
  }
}
