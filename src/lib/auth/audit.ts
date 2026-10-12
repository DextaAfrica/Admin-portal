import { prisma } from "../prisma";

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
    return await prisma.auditLog.create({
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
  } catch (err) {
    console.error("Failed to write audit log:", err);
    return null;
  }
}

