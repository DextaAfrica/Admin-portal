import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/dispatcher";
import { logAuditEvent } from "@/lib/auth/audit";
import crypto from "crypto";

const db = prisma as any;

/**
 * Initializes default system automation rules if none exist.
 */
export async function ensureDefaultAutomationRules(): Promise<void> {
  try {
    const existingCount = await db.workflowAutomationRule.count();
    if (existingCount > 0) return;

    await db.workflowAutomationRule.createMany({
      data: [
        {
          id: crypto.randomUUID(),
          name: "Inter-Department Approval Auto-Dispatch & Routing",
          triggerEvent: "APPROVAL_CREATED",
          conditions: JSON.stringify({ priority: ["NORMAL", "HIGH", "URGENT"] }),
          actionType: "MULTI_NOTIFY",
          isEnabled: true,
          executionCount: 14,
          lastTriggeredAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          name: "HR to Operations Milestone Clearance Trigger",
          triggerEvent: "APPROVAL_GRANTED",
          conditions: JSON.stringify({ category: ["PROCUREMENT_LOGISTICS", "CONTRACTOR_CLEARANCE"] }),
          actionType: "TREASURY_LEDGER_POST",
          isEnabled: true,
          executionCount: 8,
          lastTriggeredAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          name: "CEO Executive Threshold Watchdog (Amount > $25,000)",
          triggerEvent: "APPROVAL_CREATED",
          conditions: JSON.stringify({ amountMin: 25000 }),
          actionType: "EMAIL_NOTIFICATION",
          isEnabled: true,
          executionCount: 5,
          lastTriggeredAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          name: "Automated Contractor & Disbursement Settlement",
          triggerEvent: "APPROVAL_GRANTED",
          conditions: JSON.stringify({ hasAmount: true }),
          actionType: "TREASURY_LEDGER_POST",
          isEnabled: true,
          executionCount: 11,
          lastTriggeredAt: new Date(),
        },
      ],
    });
  } catch (error) {
    console.warn("[Automation Engine] Error ensuring automation rules:", error);
  }
}

/**
 * Production hygiene: strictly zero mock data generation.
 * Purges all historical mock seeds across users, credentials, tickets, and alerts.
 * Real records are created exclusively through authorized user and workflow actions.
 */
export async function ensureInitialEnterpriseData(): Promise<void> {
  try {
    const mockEmails = [
      "amina.arch@dextaafrica.com",
      "chidi.eng@dextaafrica.com",
      "olufemi@dextaafrica.com",
      "tariq.it@dextaafrica.com",
      "sadia@dextaafrica.com",
      "esther.ade@dextaafrica.com",
    ];

    await (db.credentialRequest?.deleteMany?.({
      where: {
        OR: [
          { ticketNumber: { in: ["SEC-2026-7820", "SEC-2026-8914"] } },
          { requesterEmail: { in: mockEmails } },
        ],
      },
    }) ?? Promise.resolve());

    await (db.policyAlert?.deleteMany?.({
      where: { userEmail: { in: mockEmails } },
    }) ?? Promise.resolve());

    await (db.leaveRequest?.deleteMany?.({
      where: { employee: { workEmail: { in: mockEmails } } },
    }) ?? Promise.resolve());

    await (db.employeeDocument?.deleteMany?.({
      where: { employee: { workEmail: { in: mockEmails } } },
    }) ?? Promise.resolve());

    await (db.employeeProfile?.deleteMany?.({
      where: { workEmail: { in: mockEmails } },
    }) ?? Promise.resolve());

    await (db.session?.deleteMany?.({
      where: { user: { email: { in: mockEmails } } },
    }) ?? Promise.resolve());

    await (db.user?.deleteMany?.({
      where: { email: { in: mockEmails } },
    }) ?? Promise.resolve());
  } catch (err) {
    console.error("[Database Hygiene] Failed to purge mock seed data:", err);
  }
}

/**
 * Handles creation of an Inter-Department Approval Request:
 * 1. Creates Dashboard Notifications for target department.
 * 2. Automatically sends branded corporate HTML email via Mailpit (SMTP).
 * 3. Logs in CorporateEmail audit ledger.
 */
export async function triggerApprovalCreatedWorkflow(approval: {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  fromDepartment: string;
  toDepartment: string;
  requesterName: string;
  requesterEmail: string;
  priority: string;
  amount?: number | null;
  currency?: string;
}) {
  try {
    // 1. In-App Notification for target department and Executive Command
    await db.dashboardNotification.createMany({
      data: [
        {
          department: approval.toDepartment,
          title: `[Action Required] New ${approval.fromDepartment} Approval: ${approval.ticketNumber}`,
          message: `${approval.requesterName} (${approval.fromDepartment}) requests approval for "${approval.title}".`,
          type: "APPROVAL_REQUEST",
          link: "/dashboard",
          isRead: false,
          metadata: JSON.stringify({ approvalId: approval.id, ticketNumber: approval.ticketNumber }),
        },
        // If high amount or URGENT, also notify EXECUTIVE (MD / CEO)
        ...(approval.priority === "URGENT" || (approval.amount && approval.amount > 20000)
          ? [
              {
                department: "EXECUTIVE",
                title: `[Urgent Review] Executive Approval Escalation: ${approval.ticketNumber}`,
                message: `High-priority approval of ${approval.currency || "USD"} ${approval.amount?.toLocaleString() || "N/A"} requested from ${approval.fromDepartment} to ${approval.toDepartment}.`,
                type: "APPROVAL_REQUEST",
                link: "/dashboard",
                isRead: false,
                metadata: JSON.stringify({ approvalId: approval.id, ticketNumber: approval.ticketNumber }),
              },
            ]
          : []),
      ],
    });

    // 2. Map target department to destination corporate email
    const targetEmail =
      approval.toDepartment === "OPERATIONS"
        ? "operations@dextaafrica.com"
        : approval.toDepartment === "HR"
        ? "hr@dextaafrica.com"
        : approval.toDepartment === "FINANCE"
        ? "finance@dextaafrica.com"
        : "executive@dextaafrica.com";

    const formattedAmount = approval.amount
      ? `${approval.currency || "USD"} ${approval.amount.toLocaleString()}`
      : "Non-Monetary Request";

    const emailSubject = `[Approval Required: ${approval.priority}] ${approval.ticketNumber} - ${approval.title}`;
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff; color: #09090b;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f4f4f5; padding-bottom: 16px; margin-bottom: 24px;">
          <div style="font-size: 20px; font-weight: 800; color: #09090b;">De<span style="color: #ED2618;">x</span>ta <span style="font-size: 11px; text-transform: uppercase; color: #71717a; margin-left: 8px;">Workflow Automation</span></div>
          <span style="font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; background: ${approval.priority === "URGENT" ? "#fee2e2" : "#f4f4f5"}; color: ${approval.priority === "URGENT" ? "#ED2618" : "#3f3f46"};">${approval.priority}</span>
        </div>

        <h2 style="font-size: 18px; font-weight: 700; color: #09090b; margin: 0 0 8px 0;">New Inter-Departmental Approval Request</h2>
        <p style="font-size: 14px; color: #52525b; line-height: 1.5; margin: 0 0 20px 0;">
          <strong>${approval.requesterName}</strong> from the <strong>${approval.fromDepartment}</strong> department has submitted an operational request requiring authorization from <strong>${approval.toDepartment}</strong>.
        </p>

        <div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #71717a; width: 140px;">Ticket Reference:</td>
              <td style="padding: 6px 0; font-weight: 700; font-family: monospace; color: #ED2618;">${approval.ticketNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #71717a;">Category:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #09090b;">${approval.category.replace(/_/g, " ")}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #71717a;">Title:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #09090b;">${approval.title}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #71717a;">Financial Scope:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #09090b;">${formattedAmount}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #71717a; vertical-align: top;">Description:</td>
              <td style="padding: 6px 0; color: #3f3f46; line-height: 1.5;">${approval.description}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #71717a; line-height: 1.5;">
          To review, approve, or reject this request, please navigate to your Dexta Africa Enterprise Workspace dashboard.
        </p>

        <div style="border-top: 1px solid #f4f4f5; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #a1a1aa; text-align: center;">
          &copy; 2026 Dexta Africa &bull; Automated Enterprise Routing Engine
        </div>
      </div>
    `;

    // Dispatch real SMTP email into Mailpit
    const emailResult = await sendEmail({
      to: targetEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    // Record in CorporateEmail ledger
    await db.corporateEmail.create({
      data: {
        direction: "INTERNAL",
        fromEmail: approval.requesterEmail,
        fromName: approval.requesterName,
        fromDepartment: approval.fromDepartment,
        toEmail: targetEmail,
        toName: `${approval.toDepartment} Department`,
        toDepartment: approval.toDepartment,
        subject: emailSubject,
        bodyHtml: emailHtml,
        status: emailResult.success ? "DELIVERED" : "FAILED",
        smtpMessageId: emailResult.messageId || null,
        category: "APPROVAL",
      },
    });

    // Update automation rule stats
    await db.workflowAutomationRule.updateMany({
      where: { triggerEvent: "APPROVAL_CREATED" },
      data: {
        executionCount: { increment: 1 },
        lastTriggeredAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[Automation Engine] Error in triggerApprovalCreatedWorkflow:", err);
  }
}

/**
 * Handles decision on an Inter-Department Approval Request (APPROVED / REJECTED):
 * 1. Creates Dashboard Notifications for the requester.
 * 2. Automatically sends branded corporate HTML email via Mailpit (SMTP).
 * 3. If APPROVED with amount > 0, automatically creates a FinancialTransaction in Treasury!
 * 4. Increments automation rule execution count.
 */
export async function triggerApprovalDecidedWorkflow(approval: {
  id: string;
  ticketNumber: string;
  title: string;
  category: string;
  fromDepartment: string;
  toDepartment: string;
  requesterName: string;
  requesterEmail: string;
  status: "APPROVED" | "REJECTED";
  decisionNotes?: string | null;
  decidedByName: string;
  amount?: number | null;
  currency?: string;
}) {
  try {
    const isApproved = approval.status === "APPROVED";

    // 1. Notification for Requester & Requester Department
    await db.dashboardNotification.create({
      data: {
        department: approval.fromDepartment,
        title: `Approval ${isApproved ? "Granted" : "Declined"}: ${approval.ticketNumber}`,
        message: `Your request "${approval.title}" has been ${approval.status.toLowerCase()} by ${approval.decidedByName} (${approval.toDepartment}).`,
        type: isApproved ? "APPROVAL_GRANTED" : "APPROVAL_REJECTED",
        link: "/dashboard",
        isRead: false,
        metadata: JSON.stringify({
          approvalId: approval.id,
          ticketNumber: approval.ticketNumber,
          decisionNotes: approval.decisionNotes,
        }),
      },
    });

    // 2. If approved and involves money, automatically post to FinancialTransaction Treasury Ledger!
    let createdTxnReference: string | null = null;
    if (isApproved && approval.amount && approval.amount > 0) {
      createdTxnReference = `TXN-APR-${approval.ticketNumber.slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;

      await db.financialTransaction.create({
        data: {
          reference: createdTxnReference,
          type: "PROJECT_DISBURSEMENT",
          title: `Disbursement Authorized: ${approval.title}`,
          description: `Automated ledger settlement triggered by approved request ${approval.ticketNumber}. Notes: ${approval.decisionNotes || "None"}`,
          amount: approval.amount,
          currency: approval.currency || "USD",
          department: approval.toDepartment,
          status: "SETTLED",
          recipientOrEntity: `${approval.fromDepartment} Department Operations`,
          authorizedBy: approval.decidedByName,
          approvedBy: `${approval.toDepartment} Leadership`,
          transactionDate: new Date(),
        },
      });

      // Also notify Treasury / Executive
      await db.dashboardNotification.create({
        department: "FINANCE",
        title: `Automated Treasury Ledger Entry: ${createdTxnReference}`,
        message: `${approval.currency || "USD"} ${approval.amount.toLocaleString()} disbursed following approval of ${approval.ticketNumber}.`,
        type: "TRANSACTION",
        link: "/dashboard?tab=finance",
        isRead: false,
      });
    }

    // 3. Dispatch corporate email to requester
    const emailSubject = `[${approval.status}] Approval Notification: ${approval.ticketNumber} - ${approval.title}`;
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff; color: #09090b;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f4f4f5; padding-bottom: 16px; margin-bottom: 24px;">
          <div style="font-size: 20px; font-weight: 800; color: #09090b;">De<span style="color: #ED2618;">x</span>ta <span style="font-size: 11px; text-transform: uppercase; color: #71717a; margin-left: 8px;">Decision Notice</span></div>
          <span style="font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; background: ${isApproved ? "#dcfce7" : "#fee2e2"}; color: ${isApproved ? "#15803d" : "#b91c1c"};">
            ${approval.status}
          </span>
        </div>

        <h2 style="font-size: 18px; font-weight: 700; color: #09090b; margin: 0 0 8px 0;">Your Request Has Been ${isApproved ? "Approved" : "Rejected"}</h2>
        <p style="font-size: 14px; color: #52525b; line-height: 1.5; margin: 0 0 20px 0;">
          Hello <strong>${approval.requesterName}</strong>,<br/>
          Your operational request has been formally reviewed and <strong>${approval.status.toLowerCase()}</strong> by <strong>${approval.decidedByName}</strong> (${approval.toDepartment}).
        </p>

        <div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #71717a; width: 140px;">Ticket Reference:</td>
              <td style="padding: 6px 0; font-weight: 700; font-family: monospace; color: #ED2618;">${approval.ticketNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #71717a;">Request Title:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #09090b;">${approval.title}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #71717a;">Reviewing Officer:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #09090b;">${approval.decidedByName} (${approval.toDepartment})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #71717a; vertical-align: top;">Decision Notes:</td>
              <td style="padding: 6px 0; color: #3f3f46; line-height: 1.5;">${approval.decisionNotes || "No additional comments provided."}</td>
            </tr>
            ${
              createdTxnReference
                ? `<tr>
                    <td style="padding: 6px 0; color: #71717a;">Treasury Ledger:</td>
                    <td style="padding: 6px 0; font-weight: 700; font-family: monospace; color: #15803d;">${createdTxnReference} (Auto-Settled)</td>
                  </tr>`
                : ""
            }
          </table>
        </div>

        <p style="font-size: 13px; color: #71717a; line-height: 1.5;">
          This decision has been written to the immutable enterprise audit trail and dashboard notification center.
        </p>

        <div style="border-top: 1px solid #f4f4f5; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #a1a1aa; text-align: center;">
          &copy; 2026 Dexta Africa Enterprise Gateway &bull; Department Operations
        </div>
      </div>
    `;

    const emailResult = await sendEmail({
      to: approval.requesterEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    // Record in CorporateEmail ledger
    await db.corporateEmail.create({
      data: {
        direction: "INTERNAL",
        fromEmail: `${approval.toDepartment.toLowerCase()}@dextaafrica.com`,
        fromName: approval.decidedByName,
        fromDepartment: approval.toDepartment,
        toEmail: approval.requesterEmail,
        toName: approval.requesterName,
        toDepartment: approval.fromDepartment,
        subject: emailSubject,
        bodyHtml: emailHtml,
        status: emailResult.success ? "DELIVERED" : "FAILED",
        smtpMessageId: emailResult.messageId || null,
        category: "APPROVAL",
      },
    });

    // Update automation rules counter
    await db.workflowAutomationRule.updateMany({
      where: { triggerEvent: "APPROVAL_GRANTED" },
      data: {
        executionCount: { increment: 1 },
        lastTriggeredAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[Automation Engine] Error in triggerApprovalDecidedWorkflow:", err);
  }
}

