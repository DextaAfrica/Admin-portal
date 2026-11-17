import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const db = prisma as any;

export async function POST(req: NextRequest) {
  try {
    const { email, activationKey } = await req.json();

    if (!email || !activationKey) {
      return NextResponse.json(
        { error: "Corporate email and IT activation key are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanKey = activationKey.trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No pending IT-provisioned account found for this email. Please contact Systems IT Command." },
        { status: 404 }
      );
    }

    const staffUser = user as any;

    let isKeyValid = false;
    if (staffUser.activationKey && staffUser.activationKey === cleanKey) {
      isKeyValid = true;
    } else {
      const matchTemp = await bcrypt.compare(cleanKey, staffUser.passwordHash).catch(() => false);
      if (matchTemp) {
        isKeyValid = true;
      } else {
        const ticket = await db.credentialRequest.findFirst({
          where: {
            requesterEmail: normalizedEmail,
            temporaryCode: cleanKey,
            status: { in: ["APPROVED", "FULFILLED"] },
          },
        });
        if (ticket) {
          isKeyValid = true;
        }
      }
    }

    if (!isKeyValid) {
      return NextResponse.json(
        { error: "Invalid or expired IT activation key. Please request a new key from Systems IT Command." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: staffUser.id,
        fullName: staffUser.fullName,
        email: staffUser.email,
        department: staffUser.department,
        jobTitle: staffUser.jobTitle || "Operations Manager",
        role: staffUser.role,
        seniorityLevel: staffUser.seniorityLevel,
        phone: staffUser.phone,
        status: staffUser.status,
        mustChangePassword: staffUser.mustChangePassword,
      },
    });
  } catch (err: unknown) {
    console.error("Verify provision key error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to verify activation key" },
      { status: 500 }
    );
  }
}
