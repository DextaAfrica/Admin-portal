import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { generateMfaSecret } from "@/lib/auth/mfa";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { secret, otpauth, qrCodeDataUrl, currentOtp } = await generateMfaSecret({
      email: user.email,
    });

    return NextResponse.json({
      secret,
      otpauth,
      qrCodeDataUrl,
      currentOtp,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "MFA setup failed" },
      { status: 500 }
    );
  }
}

