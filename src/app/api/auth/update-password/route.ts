import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { evaluatePasswordStrength } from "@/lib/auth/validation";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!newPassword) {
      return NextResponse.json(
        { error: "New password is required." },
        { status: 400 }
      );
    }

    const passwordAnalysis = evaluatePasswordStrength(newPassword);
    if (passwordAnalysis.errors.length > 0) {
      return NextResponse.json(
        { error: passwordAnalysis.errors[0] },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If currentPassword is provided, verify it (unless user was forced to rotate)
    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, dbUser.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Current password does not match records." },
          { status: 400 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        activationKey: null,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "USER_PREFERRED_PASSWORD_UPDATED",
      entity: "User",
      entityId: user.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { reason: "User configured preferred password" },
    });

    return NextResponse.json({
      success: true,
      message: "Your preferred password has been successfully saved.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update password" },
      { status: 500 }
    );
  }
}

