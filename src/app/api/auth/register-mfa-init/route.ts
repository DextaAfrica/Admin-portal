import { NextRequest, NextResponse } from "next/server";
import { generateMfaSecret } from "@/lib/auth/mfa";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { secret, otpauth, qrCodeDataUrl } = await generateMfaSecret({
      email: email.toLowerCase().trim(),
    });

    return NextResponse.json({
      secret,
      otpauth,
      qrCodeDataUrl,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to initialize MFA" },
      { status: 500 }
    );
  }
}

