import { prisma } from "../prisma";
import { backendApi } from "../backend-api";

export interface LogAuditEventParams {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logAuditEvent({
  actorId,
  actorEmail,
  action,
  entity,
  entityId,
  ipAddress,
  userAgent,
  metadata,
}: LogAuditEventParams) {
  try {
    const localLog = await prisma.auditLog.create({
      data: {
        actorId,
        actorEmail,
        action,
        entity,
        entityId,
        ipAddress: ipAddress || "127.0.0.1",
        userAgent: userAgent || "internal",
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Forward event to Go Core Backend in real-time
    backendApi.audit
      .record({
        actorId,
        actorEmail,
        action,
        entity,
        entityId,
        ipAddress,
        userAgent,
        metadata,
      })
      .catch(() => {
        // Handled silently if backend server is offline or warming up
      });

    return localLog;
  } catch (err) {
    console.error("Failed to write audit log:", err);
    return null;
  }
}

