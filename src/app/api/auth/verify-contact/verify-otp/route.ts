import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Both corporate email and 6-digit verification code are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanCode = String(code).trim();

    // 1. Fetch Stored Challenge
    const record = await prisma.systemSetting.findUnique({
      where: { key: `EMAIL_VERIFY_${normalizedEmail}` },
    });

    if (!record || !record.value) {
      return NextResponse.json(
        { error: "No active verification challenge found for this email. Please request a new code." },
        { status: 400 }
      );
    }

    const [storedCode, verifiedPhone, expiryStr] = record.value.split(":");
    const expiresAt = Number(expiryStr);

    if (Date.now() > expiresAt) {
      await prisma.systemSetting.delete({ where: { key: `EMAIL_VERIFY_${normalizedEmail}` } }).catch(() => {});
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new authorization code." },
        { status: 400 }
      );
    }

    if (storedCode !== cleanCode) {
      return NextResponse.json(
        { error: "Incorrect 6-digit verification code. Please check your inbox and try again." },
        { status: 400 }
      );
    }

    // 2. Consume challenge to prevent replay attacks
    await prisma.systemSetting.delete({ where: { key: `EMAIL_VERIFY_${normalizedEmail}` } }).catch(() => {});

    // 3. Issue cryptographically secure Verification Token valid for 30 minutes
    const verificationToken = `vtok_${crypto.randomBytes(32).toString("hex")}`;
    const tokenExpiresAt = Date.now() + 30 * 60 * 1000;

    await prisma.systemSetting.create({
      data: {
        key: `EMAIL_VERIFIED_TOKEN_${verificationToken}`,
        value: `${normalizedEmail}:${verifiedPhone}:${tokenExpiresAt}`,
        description: "Verified registration contact token",
      },
    });

    return NextResponse.json({
      success: true,
      verified: true,
      email: normalizedEmail,
      phone: verifiedPhone,
      verificationToken,
      message: "Contact identity successfully verified.",
    });
  } catch (err: unknown) {
    console.error("Verification confirmation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to verify authorization token." },
      { status: 500 }
    );
  }
}
