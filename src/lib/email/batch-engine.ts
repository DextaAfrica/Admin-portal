import { prisma } from "@/lib/prisma";
import { compileTemplate, sendEmail } from "./dispatcher";

export interface BatchConfig {
  mode: "count" | "size";
  batchCount: number;
  batchSize: number;
  delaySeconds: number;
  manualStep?: boolean;
}

export interface ResolvedRecipient {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  company: string;
  category: string;
}

export const DEFAULT_BATCH_CONFIG: BatchConfig = {
  mode: "count",
  batchCount: 3,
  batchSize: 50,
  delaySeconds: 30,
  manualStep: false,
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientSmtpError(errMsg: string): boolean {
  const lower = errMsg.toLowerCase();
  return (
    lower.includes("timeout") ||
    lower.includes("econnreset") ||
    lower.includes("etimedout") ||
    lower.includes("421") ||
    lower.includes("450") ||
    lower.includes("451") ||
    lower.includes("452") ||
    lower.includes("rate") ||
    lower.includes("too many")
  );
}

/**
 * Splits recipients evenly into N batches (when mode === "count")
 * or into chunks of max M recipients (when mode === "size").
 */
export function partitionRecipients<T>(
  recipients: T[],
  config: BatchConfig
): T[][] {
  if (recipients.length === 0) return [];

  if (config.mode === "size") {
    const size = Math.max(1, Math.min(500, Math.floor(config.batchSize || 50)));
    const chunks: T[][] = [];
    for (let i = 0; i < recipients.length; i += size) {
      chunks.push(recipients.slice(i, i + size));
    }
    return chunks;
  }

  // mode === "count": evenly distribute across N batches
  const count = Math.max(
    1,
    Math.min(recipients.length, Math.floor(config.batchCount || 1))
  );
  const chunks: T[][] = [];
  const baseSize = Math.floor(recipients.length / count);
  const remainder = recipients.length % count;
  let offset = 0;

  for (let i = 0; i < count; i++) {
    const len = baseSize + (i < remainder ? 1 : 0);
    if (len > 0) {
      chunks.push(recipients.slice(offset, offset + len));
      offset += len;
    }
  }
  return chunks;
}

export async function resolveCampaignRecipients(
  targetCategory?: string,
  customRecipients?: Array<{
    email: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    category?: string;
  }>
): Promise<ResolvedRecipient[]> {
  const recipientMap = new Map<string, ResolvedRecipient>();

  if (customRecipients && Array.isArray(customRecipients) && customRecipients.length > 0) {
    for (const item of customRecipients) {
      if (item.email && item.email.includes("@")) {
        const cleanEmail = item.email.trim().toLowerCase();
        const parts = (item.fullName || "").trim().split(/\s+/);
        recipientMap.set(cleanEmail, {
          email: cleanEmail,
          firstName: item.firstName || parts[0] || item.fullName || "Valued Partner",
          lastName: item.lastName || parts.slice(1).join(" ") || "",
          fullName:
            item.fullName ||
            [item.firstName, item.lastName].filter(Boolean).join(" ") ||
            "Valued Partner",
          company: item.company || "Partner",
          category: item.category || "Custom List",
        });
      }
    }
  } else if (targetCategory && targetCategory.startsWith("FORM:")) {
    const formSlug = targetCategory.replace("FORM:", "").trim();
    const form = await prisma.customForm.findUnique({
      where: { slug: formSlug },
      include: { submissions: true },
    });
    if (form) {
      for (const sub of form.submissions) {
        if (sub.email) {
          const cleanEmail = sub.email.trim().toLowerCase();
          const parts = (sub.fullName || "").trim().split(/\s+/);
          recipientMap.set(cleanEmail, {
            email: cleanEmail,
            firstName: parts[0] || sub.fullName || "Valued Partner",
            lastName: parts.slice(1).join(" ") || "",
            fullName: sub.fullName || "Valued Partner",
            company: sub.company || "Partner",
            category: sub.category || "Attendee",
          });
        }
      }
    }
  } else {
    const whereClause: any = { status: "SUBSCRIBED" };
    if (targetCategory && targetCategory !== "ALL") {
      whereClause.category = targetCategory;
    }

    const subscribers = await prisma.audienceSubscriber.findMany({
      where: whereClause,
    });

    for (const sub of subscribers) {
      if (sub.email) {
        const cleanEmail = sub.email.trim().toLowerCase();
        recipientMap.set(cleanEmail, {
          email: cleanEmail,
          firstName: sub.firstName || sub.company || "Valued Partner",
          lastName: sub.lastName || "",
          fullName:
            [sub.firstName, sub.lastName].filter(Boolean).join(" ") ||
            sub.company ||
            "Valued Partner",
          company: sub.company || "Partner",
          category: sub.category || "General",
        });
      }
    }

    if (!targetCategory || targetCategory === "ALL") {
      const submissions = await prisma.formSubmission.findMany({
        select: { email: true, fullName: true, company: true, category: true },
      });
      for (const sub of submissions) {
        if (sub.email && !recipientMap.has(sub.email.trim().toLowerCase())) {
          const cleanEmail = sub.email.trim().toLowerCase();
          const parts = (sub.fullName || "").trim().split(/\s+/);
          recipientMap.set(cleanEmail, {
            email: cleanEmail,
            firstName: parts[0] || sub.fullName || "Valued Partner",
            lastName: parts.slice(1).join(" ") || "",
            fullName: sub.fullName || "Valued Partner",
            company: sub.company || "Partner",
            category: sub.category || "Attendee",
          });
        }
      }
    }
  }

  return Array.from(recipientMap.values());
}

/**
 * Creates persistent batches and dispatches Batch #1 immediately.
 * Subsequent batches are scheduled at `delaySeconds` intervals (or held for manual trigger).
 */
export async function startBatchedCampaign(
  campaignId: string,
  targetCategory?: string,
  customRecipients?: Array<any>,
  rawConfig?: Partial<BatchConfig>
) {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) throw new Error("Campaign not found");

  const recipients = await resolveCampaignRecipients(targetCategory, customRecipients);
  if (recipients.length === 0) {
    throw new Error(
      "No eligible email recipients found in the selected target group."
    );
  }

  const config: BatchConfig = {
    mode: rawConfig?.mode === "size" ? "size" : "count",
    batchCount: Number(rawConfig?.batchCount) > 0 ? Number(rawConfig?.batchCount) : 1,
    batchSize: Number(rawConfig?.batchSize) > 0 ? Number(rawConfig?.batchSize) : 50,
    delaySeconds:
      typeof rawConfig?.delaySeconds === "number" && rawConfig.delaySeconds >= 0
        ? rawConfig.delaySeconds
        : 30,
    manualStep: Boolean(rawConfig?.manualStep),
  };

  const chunks = partitionRecipients(recipients, config);
  const now = Date.now();

  // Clear any prior uncompleted batch plan if re-dispatching
  await prisma.$transaction(async (tx) => {
    await tx.emailCampaignBatch.deleteMany({ where: { campaignId } });

    await tx.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: "SENDING",
        recipientCount: recipients.length,
        totalBatches: chunks.length,
        completedBatches: 0,
        sentCount: 0,
        failedCount: 0,
        batchConfig: JSON.stringify(config),
      },
    });

    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx];
      const scheduledFor =
        idx === 0
          ? new Date(now)
          : config.manualStep
          ? null
          : new Date(now + idx * config.delaySeconds * 1000);

      const batch = await tx.emailCampaignBatch.create({
        data: {
          campaignId,
          batchNumber: idx + 1,
          status: "PENDING",
          totalCount: chunk.length,
          scheduledFor,
        },
      });

      await tx.emailCampaignRecipient.createMany({
        data: chunk.map((rec) => ({
          campaignId,
          batchId: batch.id,
          email: rec.email,
          firstName: rec.firstName,
          lastName: rec.lastName,
          fullName: rec.fullName,
          company: rec.company,
          category: rec.category,
          status: "PENDING",
        })),
      });
    }
  });

  // Dispatch Batch #1 immediately
  await processNextBatch(campaignId, true);

  return getCampaignBatchStatus(campaignId);
}

/**
 * Executes a single PENDING batch with per-recipient checkpointing,
 * jitter throttling, and automatic transient retry.
 */
export async function executeBatch(batchId: string) {
  // Atomic claim: prevents duplicate execution under concurrent polling or cron workers
  const claimed = await prisma.emailCampaignBatch.updateMany({
    where: { id: batchId, status: "PENDING" },
    data: { status: "SENDING", startedAt: new Date() },
  });
  if (claimed.count === 0) {
    return null;
  }

  const batch = await prisma.emailCampaignBatch.findUnique({
    where: { id: batchId },
    include: {
      campaign: true,
      recipients: { where: { status: "PENDING" } },
    },
  });
  if (!batch || !batch.campaign) {
    throw new Error("Batch not found");
  }

  if (batch.recipients.length === 0) {
    await syncCampaignProgress(batch.campaignId);
    return batch;
  }

  const escapeVar = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const portalUrl = process.env.NEXT_PUBLIC_APP_URL || "https://admin.dextaafrica.com";
  let batchSent = 0;
  let batchFailed = 0;
  let lastError = "";

  for (let i = 0; i < batch.recipients.length; i++) {
    const rec = batch.recipients[i];
    const unsubscribeLink = `${portalUrl}/unsubscribe?email=${encodeURIComponent(rec.email)}`;
    const personalizedHtml = compileTemplate(batch.campaign.contentHtml, {
      firstName: escapeVar(rec.firstName || "Valued Partner"),
      lastName: escapeVar(rec.lastName || ""),
      fullName: escapeVar(rec.fullName || "Valued Partner"),
      company: escapeVar(rec.company || "Partner"),
      category: escapeVar(rec.category || "General"),
      portalUrl,
      unsubscribeLink,
    });

    let delivered = false;
    let messageId: string | undefined;
    let errMsg = "";
    let attempts = rec.attempts;

    // Up to 2 automatic retries on transient SMTP/network errors
    for (let attempt = 1; attempt <= 3; attempt++) {
      attempts++;
      const res = await sendEmail({
        to: rec.email,
        subject: batch.campaign.subject,
        html: personalizedHtml,
        unsubscribeUrl: unsubscribeLink,
      });
      if (res.success) {
        delivered = true;
        messageId = res.messageId;
        break;
      }
      errMsg = res.error || "SMTP delivery failed";
      if (!isTransientSmtpError(errMsg) || attempt === 3) {
        break;
      }
      await sleep(600 * attempt);
    }

    if (delivered) {
      batchSent++;
      await prisma.emailCampaignRecipient.update({
        where: { id: rec.id },
        data: {
          status: "SENT",
          messageId: messageId || null,
          error: null,
          attempts,
          sentAt: new Date(),
        },
      });
    } else {
      batchFailed++;
      lastError = errMsg;
      await prisma.emailCampaignRecipient.update({
        where: { id: rec.id },
        data: {
          status: "FAILED",
          error: errMsg,
          attempts,
        },
      });
    }

    // Small randomized micro-jitter (120–280ms) to avoid burst flagging
    if (i < batch.recipients.length - 1) {
      await sleep(120 + Math.floor(Math.random() * 160));
    }
  }

  // Recompute batch totals from DB
  const [sentTotal, failedTotal] = await Promise.all([
    prisma.emailCampaignRecipient.count({ where: { batchId: batch.id, status: "SENT" } }),
    prisma.emailCampaignRecipient.count({ where: { batchId: batch.id, status: "FAILED" } }),
  ]);

  const batchStatus =
    failedTotal === 0
      ? "COMPLETED"
      : sentTotal === 0
      ? "FAILED"
      : "PARTIAL";

  await prisma.emailCampaignBatch.update({
    where: { id: batch.id },
    data: {
      status: batchStatus,
      sentCount: sentTotal,
      failedCount: failedTotal,
      completedAt: new Date(),
      lastError: lastError || null,
    },
  });

  await syncCampaignProgress(batch.campaignId);
  return { batchSent, batchFailed, batchStatus };
}

export async function syncCampaignProgress(campaignId: string) {
  const batches = await prisma.emailCampaignBatch.findMany({
    where: { campaignId },
    orderBy: { batchNumber: "asc" },
  });

  const totalBatches = batches.length;
  const completedBatches = batches.filter((b) =>
    ["COMPLETED", "PARTIAL", "FAILED"].includes(b.status)
  ).length;
  const sentCount = batches.reduce((acc, b) => acc + b.sentCount, 0);
  const failedCount = batches.reduce((acc, b) => acc + b.failedCount, 0);
  const hasPending = batches.some((b) => b.status === "PENDING" || b.status === "SENDING");
  const hasPaused = batches.some((b) => b.status === "PAUSED");

  let status = "SENDING";
  if (hasPaused && !hasPending) {
    status = "PAUSED";
  } else if (!hasPending) {
    if (failedCount === 0) status = "SENT";
    else if (sentCount === 0) status = "FAILED";
    else status = "PARTIAL";
  }

  return prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status,
      totalBatches,
      completedBatches,
      sentCount,
      failedCount,
      recipientCount: sentCount > 0 ? sentCount : undefined,
      sentAt: status === "SENT" || status === "PARTIAL" ? new Date() : undefined,
    },
  });
}

export async function processNextBatch(campaignId: string, forceImmediate = false) {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign || campaign.status === "PAUSED") return null;

  const now = new Date();
  const nextBatch = await prisma.emailCampaignBatch.findFirst({
    where: {
      campaignId,
      status: "PENDING",
      ...(forceImmediate
        ? {}
        : {
            scheduledFor: { lte: now },
          }),
    },
    orderBy: { batchNumber: "asc" },
  });

  if (!nextBatch) return null;
  return executeBatch(nextBatch.id);
}

export async function processAllDueCampaignBatches() {
  const now = new Date();
  const dueBatches = await prisma.emailCampaignBatch.findMany({
    where: {
      status: "PENDING",
      scheduledFor: { lte: now },
      campaign: { status: "SENDING" },
    },
    orderBy: { scheduledFor: "asc" },
    take: 5,
  });

  const results = [];
  for (const batch of dueBatches) {
    results.push(await executeBatch(batch.id));
  }
  return results;
}

export async function pauseCampaignBatches(campaignId: string) {
  await prisma.emailCampaignBatch.updateMany({
    where: { campaignId, status: "PENDING" },
    data: { status: "PAUSED" },
  });
  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { status: "PAUSED" },
  });
  return getCampaignBatchStatus(campaignId);
}

export async function resumeCampaignBatches(campaignId: string) {
  const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });
  const config: BatchConfig = campaign?.batchConfig
    ? JSON.parse(campaign.batchConfig)
    : DEFAULT_BATCH_CONFIG;

  const pausedBatches = await prisma.emailCampaignBatch.findMany({
    where: { campaignId, status: "PAUSED" },
    orderBy: { batchNumber: "asc" },
  });

  const now = Date.now();
  for (let i = 0; i < pausedBatches.length; i++) {
    await prisma.emailCampaignBatch.update({
      where: { id: pausedBatches[i].id },
      data: {
        status: "PENDING",
        scheduledFor: config.manualStep
          ? null
          : new Date(now + i * config.delaySeconds * 1000),
      },
    });
  }

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { status: "SENDING" },
  });

  if (pausedBatches.length > 0 && !config.manualStep) {
    await processNextBatch(campaignId, true);
  }

  return getCampaignBatchStatus(campaignId);
}

export async function retryFailedCampaignRecipients(campaignId: string) {
  const failedRecipients = await prisma.emailCampaignRecipient.findMany({
    where: { campaignId, status: "FAILED" },
  });
  if (failedRecipients.length === 0) {
    return getCampaignBatchStatus(campaignId);
  }

  const batchIds = Array.from(new Set(failedRecipients.map((r) => r.batchId)));
  await prisma.emailCampaignRecipient.updateMany({
    where: { campaignId, status: "FAILED" },
    data: { status: "PENDING", error: null },
  });

  await prisma.emailCampaignBatch.updateMany({
    where: { id: { in: batchIds } },
    data: { status: "PENDING", scheduledFor: new Date(), lastError: null },
  });

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { status: "SENDING" },
  });

  await processNextBatch(campaignId, true);
  return getCampaignBatchStatus(campaignId);
}

export async function getCampaignBatchStatus(campaignId: string) {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
    include: {
      batches: {
        orderBy: { batchNumber: "asc" },
      },
    },
  });
  if (!campaign) throw new Error("Campaign not found");

  return {
    campaign,
    batches: campaign.batches,
    batchConfig: campaign.batchConfig
      ? (JSON.parse(campaign.batchConfig) as BatchConfig)
      : null,
  };
}
