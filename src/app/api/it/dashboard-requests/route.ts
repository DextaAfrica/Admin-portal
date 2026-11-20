import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (user.role || "").toUpperCase();
    const dept = (user.department || "").toUpperCase();
    const isItOrSuperAdmin = role === "SUPER_ADMIN" || dept === "IT" || role === "ADMIN";

    // Non-IT users only see their own requests; IT/Super Admin see all requests
    const whereClause = isItOrSuperAdmin ? {} : { userId: user.id };

    const [requests, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.dashboardAccessRequest.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              department: true,
              jobTitle: true,
              role: true,
              assignedModules: true,
            },
          },
          reviewedBy: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.dashboardAccessRequest.count({ where: { status: "PENDING_IT_APPROVAL" } }),
      prisma.dashboardAccessRequest.count({ where: { status: "APPROVED" } }),
      prisma.dashboardAccessRequest.count({ where: { status: "REJECTED" } }),
    ]);

    return NextResponse.json({
      requests,
      stats: {
        pendingCount,
        approvedCount,
        rejectedCount,
        totalCount: requests.length,
      },
      isItAdmin: isItOrSuperAdmin,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch dashboard access requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { requestedModules, justification, signatureData, signatureType } = body;

    if (!requestedModules || !Array.isArray(requestedModules) || requestedModules.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one dashboard module or feature structure" },
        { status: 400 }
      );
    }

    if (!justification || justification.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a valid business justification (minimum 10 characters)" },
        { status: 400 }
      );
    }

    if (!signatureData || !signatureData.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "A valid drawn or verified digital signature is required" },
        { status: 400 }
      );
    }

    // Generate Ticket Number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `DSH-${new Date().getFullYear()}-${randomSuffix}`;

    const request = await prisma.dashboardAccessRequest.create({
      data: {
        ticketNumber,
        userId: user.id,
        requesterName: user.fullName || "Staff Member",
        requesterEmail: user.email,
        department: user.department || "Operations",
        jobTitle: user.jobTitle || "Operations Specialist",
        requestedModules: JSON.stringify(requestedModules),
        justification: justification.trim(),
        signatureData,
        signatureType: signatureType || "DRAWN",
        status: "PENDING_IT_APPROVAL",
      },
    });

    // Notify IT Administrators
    try {
      const itUsers = await prisma.user.findMany({
        where: {
          OR: [{ department: "IT" }, { role: "SUPER_ADMIN" }],
        },
        select: { id: true },
      });

      for (const it of itUsers) {
        await prisma.dashboardNotification.create({
          data: {
            userId: it.id,
            title: `New Dashboard Access Request: ${ticketNumber}`,
            message: `${user.fullName} (${user.department}) requested tailored access to ${requestedModules.join(", ")}. Digital signature verified.`,
            type: "IT_REQUEST_PENDING",
            link: "/it?tab=dashboards",
          },
        });
      }
    } catch {
      // Non-blocking notification dispatch
    }

    return NextResponse.json({
      success: true,
      request,
      message: `Dashboard configuration ticket #${ticketNumber} submitted to IT Department with verified digital signature.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to submit dashboard access request" },
      { status: 500 }
    );
  }
}
