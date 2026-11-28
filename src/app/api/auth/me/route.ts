import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user } = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      department: user.department,
      role: user.role,
      mustChangePassword: Boolean((user as any).mustChangePassword),
    },
  });
}
