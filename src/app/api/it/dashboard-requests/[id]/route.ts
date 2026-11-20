import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (user.role || "").toUpperCase();
    const dept = (user.department || "").toUpperCase();
    const isItOrSuperAdmin = role === "SUPER_ADMIN" || dept === "IT" || role === "ADMIN";

    if (!isItOrSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only IT Department Officers and Super Admins can authorize dashboard provisioning" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { action, approvedModules, itNotes } = body;

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Expected APPROVE or REJECT." },
        { status: 400 }
      );
    }

    const request = await prisma.dashboardAccessRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Dashboard access request not found" }, { status: 404 });
    }

    if (request.status !== "PENDING_IT_APPROVAL") {
      return NextResponse.json(
        { error: `This request has already been ${request.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    if (action === "APPROVE") {
      const finalModules =
        Array.isArray(approvedModules) && approvedModules.length > 0
          ? approvedModules
          : JSON.parse(request.requestedModules || "[]");

      const updatedRequest = await prisma.$transaction(async (tx) => {
        // 1. Update request status
        const reqResult = await tx.dashboardAccessRequest.update({
          where: { id },
          data: {
            status: "APPROVED",
            reviewedById: user.id,
            resolvedAt: new Date(),
            approvedModules: JSON.stringify(finalModules),
            itNotes: itNotes?.trim() || "Approved by IT Security",
          },
        });

        // 2. Provision modules onto User profile and save digital signature
        await tx.user.update({
          where: { id: request.userId },
          data: {
            assignedModules: JSON.stringify(finalModules),
            signatureUrl: request.signatureData || undefined,
          },
        });

        // 3. Dispatch confirmation notification to requester
        await tx.dashboardNotification.create({
          data: {
            userId: request.userId,
            title: `Dashboard Access Approved: ${request.ticketNumber}`,
            message: `Your IT department request has been approved. Your custom dashboard modules (${finalModules.join(
              ", "
            )}) are now active.`,
            type: "IT_REQUEST_APPROVED",
            link: "/dashboard",
          },
        });

        // 4. Audit log entry
        await tx.auditLog.create({
          data: {
            action: "DASHBOARD_MODULES_PROVISIONED",
            entity: "User",
            entityId: request.userId,
            actorId: user.id,
            actorEmail: user.email,
            ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
            userAgent: req.headers.get("user-agent") || "Internal-Console",
            metadata: JSON.stringify({
              ticketNumber: request.ticketNumber,
              assignedModules: finalModules,
              requester: request.requesterEmail,
              signatureType: request.signatureType,
              approver: user.email,
            }),
          },
        });

        return reqResult;
      });

      return NextResponse.json({
        success: true,
        request: updatedRequest,
        message: `Ticket #${request.ticketNumber} successfully approved. Dashboard modules have been provisioned for ${request.requesterName}.`,
      });
    } else {
      // REJECT
      const updatedRequest = await prisma.$transaction(async (tx) => {
        const reqResult = await tx.dashboardAccessRequest.update({
          where: { id },
          data: {
            status: "REJECTED",
            reviewedById: user.id,
            itNotes: itNotes?.trim() || "Rejected by IT Department",
          },
        });

        await tx.dashboardNotification.create({
          data: {
            userId: request.userId,
            title: `Dashboard Access Request Rejected: ${request.ticketNumber}`,
            message: `Your IT dashboard request was declined by IT Administration. Note: ${
              itNotes?.trim() || "Contact IT for security policy requirements."
            }`,
            type: "IT_REQUEST_REJECTED",
            link: "/dashboard",
          },
        });

        await tx.auditLog.create({
          data: {
            action: "DASHBOARD_REQUEST_REJECTED",
            entity: "User",
            entityId: request.userId,
            actorId: user.id,
            actorEmail: user.email,
            ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
            userAgent: req.headers.get("user-agent") || "Internal-Console",
            metadata: JSON.stringify({
              ticketNumber: request.ticketNumber,
              reason: itNotes?.trim() || "Rejected",
              approver: user.email,
            }),
          },
        });

        return reqResult;
      });

      return NextResponse.json({
        success: true,
        request: updatedRequest,
        message: `Ticket #${request.ticketNumber} marked as rejected.`,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to process dashboard access request" },
      { status: 500 }
    );
  }
}
