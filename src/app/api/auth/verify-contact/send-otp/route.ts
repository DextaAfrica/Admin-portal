import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { validateCorporateEmail, validatePhoneNumber } from "@/lib/validation/contact";
import { sendEmail } from "@/lib/email/dispatcher";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, phone, countryDialCode = "+234" } = await req.json();

    // 1. Strict Email Format & Security Validation
    const emailValidation = validateCorporateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // 2. Strict E.164 Phone Format Validation
    const phoneValidation = validatePhoneNumber(phone, countryDialCode);
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        { error: phoneValidation.error },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phoneValidation.formatted;

    // 3. Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this corporate email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // 4. Generate High-Entropy Cryptographic 6-Digit OTP
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // 5. Store Verification Challenge in DB
    await prisma.systemSetting.upsert({
      where: { key: `EMAIL_VERIFY_${normalizedEmail}` },
      create: {
        key: `EMAIL_VERIFY_${normalizedEmail}`,
        value: `${verificationCode}:${normalizedPhone}:${expiresAt}`,
        description: "Pending registration contact verification challenge",
      },
      update: {
        value: `${verificationCode}:${normalizedPhone}:${expiresAt}`,
      },
    });

    // 6. Real SMTP Dispatch via Mailpit
    let emailSent = false;
    try {
      const emailResult = await sendEmail({
        to: normalizedEmail,
        subject: `${verificationCode} is your Dexta Africa corporate verification code`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 36px 32px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff; color: #09090b;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid #f4f4f5; padding-bottom: 16px;">
              <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #09090b;">De<span style="color: #ED2618;">x</span>ta</span>
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #71717a; margin-left: 8px;">Zero-Trust Contact Verification</span>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #09090b; margin: 0 0 12px 0;">Corporate Identity Verification</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #52525b; margin: 0 0 20px 0;">
              You initiated enterprise profile registration for Dexta Africa infrastructure command portals. To verify your ownership of <strong>${normalizedEmail}</strong> and mobile terminal <strong>${normalizedPhone}</strong>, enter the authorization token below:
            </p>
            <div style="margin: 24px 0; padding: 20px; background: #fafafa; border-radius: 8px; text-align: center; border: 1px solid #e4e4e7;">
              <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ED2618;">${verificationCode}</div>
              <div style="font-size: 11px; color: #71717a; margin-top: 8px; font-weight: 500;">Valid for 10 minutes &bull; Single-use security token</div>
            </div>
            <p style="font-size: 13px; line-height: 1.6; color: #71717a; margin: 0 0 16px 0;">
              If you did not initiate this registration, no account has been provisioned. Please discard this notification.
            </p>
            <div style="border-top: 1px solid #f4f4f5; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #a1a1aa; text-align: center;">
              &copy; ${new Date().getFullYear()} Dexta Africa Enterprise Identity &bull; Zero-Trust Provisioning Gateway
            </div>
          </div>
        `,
      });
      emailSent = Boolean(emailResult?.success);
      console.log(`[Contact Verification OTP] Dispatched code to ${normalizedEmail} (Phone: ${normalizedPhone}): ${verificationCode}`);
    } catch (mailErr) {
      console.error("[Contact Verification SMTP Error]", mailErr);
      emailSent = false;
    }

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      phone: normalizedPhone,
      emailSent,
      message: "A 6-digit verification code has been dispatched to your corporate email.",
    });
  } catch (err: unknown) {
    console.error("Verification dispatch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to dispatch verification code." },
      { status: 500 }
    );
  }
}
