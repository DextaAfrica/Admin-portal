import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { sendEmail, compileTemplate } from "@/lib/email/dispatcher";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { to, subject, contentHtml } = body;
    const recipient = to?.trim() || user.email;

    if (!recipient) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
    }

    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || "https://admin.dextaafrica.com";
    const personalizedHtml = compileTemplate(contentHtml || "<p>Email campaign test preview.</p>", {
      firstName: user.fullName?.split(" ")[0] || "Team Member",
      lastName: user.fullName?.split(" ").slice(1).join(" ") || "",
      fullName: user.fullName || "Team Member",
      company: "Dexta Africa",
      category: "Internal Test",
      portalUrl,
      unsubscribeLink: `${portalUrl}/unsubscribe?email=${encodeURIComponent(recipient)}`,
    });

    const result = await sendEmail({
      to: recipient,
      subject: `[TEST PREVIEW] ${subject || "Email Campaign Preview"}`,
      html: personalizedHtml,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "SMTP dispatch failed. Please verify SMTP environment configuration." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email dispatched to ${recipient}`,
      messageId: result.messageId,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to dispatch test email" },
      { status: 500 }
    );
  }
}
