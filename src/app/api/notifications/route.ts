import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const db = prisma as any;

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userDept = user.department || "OPERATIONS";

    // Graceful fallback if dashboardNotification model is not initialized in active client
    if (!db.dashboardNotification || typeof db.dashboardNotification.findMany !== "function") {
      return NextResponse.json({
        notifications: [],
        unreadCount: 0,
      });
    }

    // Query notifications directed to this user, their department, or ALL
    const notifications = await db.dashboardNotification.findMany({
      where: {
        OR: [
          { userId: user.id },
          { department: userDept },
          { department: "ALL" },
          // Super admin / executive can see all notifications
          ...(user.role === "SUPER_ADMIN" || user.department === "EXECUTIVE"
            ? [{ department: "EXECUTIVE" }, { department: "FINANCE" }, { department: "OPERATIONS" }, { department: "HR" }]
            : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, markAllAsRead } = body;

    if (!db.dashboardNotification || typeof db.dashboardNotification.updateMany !== "function") {
      return NextResponse.json({ success: true });
    }

    if (markAllAsRead) {
      const userDept = user.department || "OPERATIONS";
      await db.dashboardNotification.updateMany({
        where: {
          isRead: false,
          OR: [
            { userId: user.id },
            { department: userDept },
            { department: "ALL" },
          ],
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (id) {
      await db.dashboardNotification.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, message: "Notification marked as read" });
    }

    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

