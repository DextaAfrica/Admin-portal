import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { ensureEnterpriseSchema } from "@/lib/enterprise/schema";
import { recordVerifiedWorkAction } from "@/lib/telemetry/work-monitor";
import { logAuditEvent } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";

const db = prisma as any;

const DEFAULT_CHANNELS = [
  { slug: "general", name: "General Dispatch", type: "GENERAL", department: "ALL", description: "Company-wide announcements & cross-team coordination" },
  { slug: "executive", name: "Executive Command", type: "EXECUTIVE", department: "EXECUTIVE", description: "MD/CEO & Executive Directorate leadership channel" },
  { slug: "finance", name: "Finance & Treasury", type: "DEPARTMENT", department: "FINANCE", description: "Treasury inflows, disbursements & ledger coordination" },
  { slug: "operations", name: "Operations & Field", type: "DEPARTMENT", department: "OPERATIONS", description: "Site execution, logistics & GM operations" },
  { slug: "hr", name: "People & Culture (HR)", type: "DEPARTMENT", department: "HR", description: "Workforce onboarding, leaves & staff welfare" },
  { slug: "crm", name: "Commercial & CRM", type: "DEPARTMENT", department: "CRM", description: "Client follow-ups, deal closing & pipeline updates" },
  { slug: "it-support", name: "IT Infrastructure & Helpdesk", type: "DEPARTMENT", department: "IT", description: "Account recovery, MFA & systems support" },
];

async function ensureDefaultChannels() {
  await ensureEnterpriseSchema();
  for (const ch of DEFAULT_CHANNELS) {
    try {
      await db.internalChannel.upsert({
        where: { slug: ch.slug },
        update: {},
        create: ch,
      });
    } catch {}
  }
}

function canAccessChannel(
  channel: any,
  user: { id: string; role?: string | null; department?: string | null }
): boolean {
  const role = (user.role || "").toUpperCase();
  const dept = (user.department || "OPERATIONS").toUpperCase();
  const isExec = (role === "SUPER_ADMIN" && dept === "EXECUTIVE") || role === "MD" || role === "CEO" || dept === "EXECUTIVE";

  if (channel.type === "DIRECT") {
    try {
      const participants: string[] = JSON.parse(channel.participantIds || "[]");
      return participants.includes(user.id);
    } catch {
      return false;
    }
  }

  if (isExec) return true;
  if (channel.slug === "general" || channel.slug === "it-support") return true;

  // Strict privacy: IT without Executive clearance cannot access Finance, HR, Executive, or CRM channels
  if (dept === "IT") {
    return channel.department === "IT" || channel.slug === "general";
  }

  return (channel.department || "").toUpperCase() === dept;
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureDefaultChannels();

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

    const allChannels = await db.internalChannel.findMany({
      orderBy: { createdAt: "asc" },
    });

    const authorizedChannels = allChannels.filter((ch: any) => canAccessChannel(ch, user));

    // Fetch messages for requested channel (or first authorized channel)
    const activeChannel =
      authorizedChannels.find((c: any) => c.id === channelId) || authorizedChannels[0] || null;

    let messages: any[] = [];
    if (activeChannel) {
      messages = await db.internalMessage.findMany({
        where: { channelId: activeChannel.id },
        orderBy: { createdAt: "asc" },
        take: 100,
      });
    }

    // Colleagues list for Direct Messaging (privacy-safe: only id, fullName, department, jobTitle)
    const colleagues = await prisma.user.findMany({
      where: { status: "ACTIVE", id: { not: user.id } },
      select: { id: true, fullName: true, department: true, jobTitle: true },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json({
      channels: authorizedChannels,
      activeChannelId: activeChannel?.id || null,
      messages,
      colleagues,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load messages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureDefaultChannels();

    const body = await req.json();
    const { channelId, recipientUserId, messageBody, priority = "NORMAL" } = body;

    if (!messageBody?.trim()) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    let targetChannel: any = null;

    if (recipientUserId) {
      // Create or reuse Direct Message channel
      const pair = [user.id, recipientUserId].sort();
      const dmSlug = `dm-${pair[0].slice(0, 8)}-${pair[1].slice(0, 8)}`;
      const recipient = await prisma.user.findUnique({
        where: { id: recipientUserId },
        select: { id: true, fullName: true, department: true },
      });
      if (!recipient) {
        return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
      }
      targetChannel = await db.internalChannel.upsert({
        where: { slug: dmSlug },
        update: {},
        create: {
          slug: dmSlug,
          name: `${user.fullName} ↔ ${recipient.fullName}`,
          type: "DIRECT",
          department: null,
          participantIds: JSON.stringify(pair),
          description: "Encrypted Direct Message Thread",
        },
      });
    } else if (channelId) {
      targetChannel = await db.internalChannel.findUnique({ where: { id: channelId } });
    }

    if (!targetChannel || !canAccessChannel(targetChannel, user)) {
      return NextResponse.json({ error: "Forbidden: Channel access denied" }, { status: 403 });
    }

    const msg = await db.internalMessage.create({
      data: {
        channelId: targetChannel.id,
        senderId: user.id,
        senderName: user.fullName || user.email,
        senderDepartment: (user.department || "OPERATIONS").toUpperCase(),
        senderRole: (user.role || "STAFF").toUpperCase(),
        body: messageBody.trim(),
        priority: String(priority).toUpperCase(),
        readByIds: JSON.stringify([user.id]),
      },
    });

    // Notify recipients on DM or URGENT channel message
    if (targetChannel.type === "DIRECT" && recipientUserId) {
      try {
        await db.dashboardNotification.create({
          data: {
            userId: recipientUserId,
            department: "ALL",
            title: `Direct Message from ${user.fullName}`,
            message: messageBody.trim().slice(0, 120),
            type: "INTERNAL_MESSAGE",
            link: `/messages?channelId=${targetChannel.id}`,
            isRead: false,
          },
        });
      } catch {}
    } else if (String(priority).toUpperCase() === "URGENT") {
      try {
        await db.dashboardNotification.create({
          data: {
            department: targetChannel.department || "ALL",
            title: `[URGENT in #${targetChannel.name}] ${user.fullName}`,
            message: messageBody.trim().slice(0, 120),
            type: "INTERNAL_MESSAGE",
            link: `/messages?channelId=${targetChannel.id}`,
            isRead: false,
          },
        });
      } catch {}
    }

    await recordVerifiedWorkAction(user.id, "/messages");

    if (String(priority).toUpperCase() === "URGENT") {
      await logAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: "URGENT_INTERNAL_MESSAGE_SENT",
        entity: "InternalMessage",
        entityId: msg.id,
        metadata: { channel: targetChannel.slug },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, message: msg, channel: targetChannel }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send message" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureEnterpriseSchema();
    const { channelId } = await req.json();
    if (!channelId) return NextResponse.json({ error: "channelId required" }, { status: 400 });

    const msgs = await db.internalMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    for (const m of msgs) {
      let readIds: string[] = [];
      try {
        readIds = JSON.parse(m.readByIds || "[]");
      } catch {}
      if (!readIds.includes(user.id)) {
        readIds.push(user.id);
        await db.internalMessage.update({
          where: { id: m.id },
          data: { readByIds: JSON.stringify(readIds) },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to mark read" }, { status: 500 });
  }
}
