import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, getInactivityTimeoutMinutes, setInactivityTimeoutMinutes } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// GET /api/auth/inactivity-policy -> Retrieve current inactivity policy
export async function GET() {
  try {
    const timeoutMinutes = await getInactivityTimeoutMinutes();
    return NextResponse.json({
      timeoutMinutes,
      warningSeconds: 60, // Standard 60-second countdown grace period before auto-logout
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load policy" },
      { status: 500 }
    );
  }
}

// PUT /api/auth/inactivity-policy -> Admin & IT update inactivity timeout
export async function PUT(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only ADMIN, SUPER_ADMIN, or IT roles can change enterprise session policies
    const role = (user.role || "").toUpperCase();
    const dept = (user.department || "").toUpperCase();
    const isAuthorized =
      role === "SUPER_ADMIN" ||
      role === "ADMIN" ||
      role === "IT_ADMIN" ||
      dept === "IT" ||
      dept === "EXECUTIVE";

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Only IT Governance or Executive Leadership can modify session inactivity timeouts." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const timeoutMinutes = parseInt(body.timeoutMinutes, 10);

    if (isNaN(timeoutMinutes) || timeoutMinutes < 1 || timeoutMinutes > 480) {
      return NextResponse.json(
        { error: "Invalid timeout: Must be between 1 and 480 minutes." },
        { status: 400 }
      );
    }

    await setInactivityTimeoutMinutes(timeoutMinutes, user.id);

    return NextResponse.json({
      success: true,
      timeoutMinutes,
      message: `Inactivity logout threshold successfully updated to ${timeoutMinutes} minutes across all portals.`,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update inactivity policy" },
      { status: 500 }
    );
  }
}
