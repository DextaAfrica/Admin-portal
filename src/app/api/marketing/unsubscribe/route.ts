import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BACKEND_API_URL } from "@/lib/backend-api";

export const dynamic = "force-dynamic";

async function processUnsubscribe(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return false;
  }

  await prisma.audienceSubscriber.updateMany({
    where: { email: cleanEmail },
    data: { status: "UNSUBSCRIBED" },
  });

  // Forward non-blocking to Go Core Backend
  fetch(`${BACKEND_API_URL}/newsletter/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: cleanEmail }),
  }).catch(() => {});

  return true;
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let email = searchParams.get("email") || "";

    if (!email) {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await req.json();
        email = String(body?.email || "");
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const form = await req.formData();
        email = String(form.get("email") || "");
      }
    }

    const ok = await processUnsubscribe(email);
    if (!ok) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    return NextResponse.json({ success: true, email: email.trim().toLowerCase() });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to unsubscribe." },
      { status: 500 }
    );
  }
}
