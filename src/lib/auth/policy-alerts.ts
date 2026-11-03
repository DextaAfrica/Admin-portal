import { prisma } from "../prisma";
import { logAuditEvent } from "./audit";
import type { PolicyAlert } from "@prisma/client";

export interface LogPolicyAlertParams {
  severity?: "INFO" | "WARNING" | "CRITICAL" | "BREACH_ATTEMPT";
  eventType:
    | "UNAUTHORIZED_DASHBOARD_ACCESS"
    | "POLICY_VIOLATION"
    | "SUSPICIOUS_ACTIVITY"
    | "CREDENTIAL_ABUSE"
    | "ISOLATION_BOUNDARY_BREACH";
  title: string;
  description: string;
  actorEmail?: string;
  targetResource?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function logPolicyAlert(params: LogPolicyAlertParams) {
  try {
    const alert = await prisma.policyAlert.create({
      data: {
        severity: params.severity || "WARNING",
        eventType: params.eventType,
        title: params.title,
        description: params.description,
        actorEmail: params.actorEmail,
        targetResource: params.targetResource,
        ipAddress: params.ipAddress || "127.0.0.1",
        userAgent: params.userAgent || "unknown",
        status: "OPEN",
      },
    });

    // Also link into the master audit log
    await logAuditEvent({
      actorEmail: params.actorEmail || "SYSTEM_WATCHDOG",
      action: `POLICY_ALERT_${params.severity || "WARNING"}`,
      entity: "PolicyAlert",
      entityId: alert.id,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        eventType: params.eventType,
        title: params.title,
        targetResource: params.targetResource,
      },
    });

    return alert;
  } catch (err) {
    console.error("Failed to record policy alert:", err);
    return null;
  }
}

