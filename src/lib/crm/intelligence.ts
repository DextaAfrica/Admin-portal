import { prisma } from "@/lib/prisma";

export interface SalesRepIntelligence {
  userId: string;
  fullName: string;
  department: string;
  assignedClientsCount: number;
  followUpsLogged: number;
  responsesRecorded: number;
  responseRatePct: number;
  staleClientsCount: number;
  pipelineValue: number;
  accountabilityScore: number;
  status: "TOP_PERFORMER" | "ACTIVE" | "NEEDS_FOLLOWUP";
}

export interface StaleClientAlert {
  clientId: string;
  clientName: string;
  company: string | null;
  stage: string;
  estimatedValue: number;
  assignedTo: string;
  hoursSinceLastTouch: number;
}

export interface CrmIntelligenceReport {
  totalClients: number;
  totalFollowUps: number;
  totalResponsesRecorded: number;
  overallResponseRatePct: number;
  staleClientsCount: number;
  repScorecards: SalesRepIntelligence[];
  staleClients: StaleClientAlert[];
}

/**
 * Backend-collated Sales & CRM Follow-Up Intelligence Engine.
 * Correlates CrmClient, CrmDeal, and CrmActivity to measure whether the sales team
 * is genuinely following up on clients and recording client responses.
 */
export async function generateCrmIntelligence(): Promise<CrmIntelligenceReport> {
  const [clients, activities, deals, staffUsers] = await Promise.all([
    prisma.crmClient.findMany({
      select: {
        id: true,
        name: true,
        company: true,
        stage: true,
        estimatedValue: true,
        assignedTo: true,
        assignedToUserId: true,
        createdAt: true,
        updatedAt: true,
      },
    }).catch(() => []),
    prisma.crmActivity.findMany({
      select: {
        id: true,
        clientId: true,
        userId: true,
        type: true,
        outcome: true,
        activityDate: true,
      },
      orderBy: { activityDate: "desc" },
    }).catch(() => []),
    prisma.crmDeal.findMany({
      select: {
        id: true,
        clientId: true,
        ownerUserId: true,
        value: true,
        stage: true,
      },
    }).catch(() => []),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, fullName: true, department: true, primaryWorkspace: true },
    }).catch(() => []),
  ]);

  const now = Date.now();
  const staleThresholdHours = 48;

  // Map last activity per client
  const lastActivityByClient = new Map<string, number>();
  for (const act of activities) {
    if (!act.clientId) continue;
    const ts = new Date(act.activityDate).getTime();
    const prev = lastActivityByClient.get(act.clientId) || 0;
    if (ts > prev) lastActivityByClient.set(act.clientId, ts);
  }

  // Identify stale clients (>48h without follow-up, excluding already ACTIVE_ACCOUNT)
  const staleClients: StaleClientAlert[] = [];
  for (const cl of clients) {
    if (cl.stage === "ACTIVE_ACCOUNT") continue;
    const lastTouch = lastActivityByClient.get(cl.id) || new Date(cl.createdAt).getTime();
    const hoursSince = Math.max(1, Math.round((now - lastTouch) / (1000 * 60 * 60)));
    if (hoursSince >= staleThresholdHours) {
      staleClients.push({
        clientId: cl.id,
        clientName: cl.name,
        company: cl.company,
        stage: cl.stage,
        estimatedValue: Number(cl.estimatedValue || 0),
        assignedTo: cl.assignedTo || "Unassigned",
        hoursSinceLastTouch: hoursSince,
      });
    }
  }
  staleClients.sort((a, b) => b.estimatedValue - a.estimatedValue);

  // Per-Rep Scorecard (include anyone who owns clients/deals/activities or has CRM workspace)
  const repIds = new Set<string>();
  clients.forEach((c: any) => c.assignedToUserId && repIds.add(c.assignedToUserId));
  activities.forEach((a: any) => a.userId && repIds.add(a.userId));
  deals.forEach((d: any) => d.ownerUserId && repIds.add(d.ownerUserId));
  staffUsers.forEach((u: any) => {
    if ((u.primaryWorkspace || "").toLowerCase() === "crm") repIds.add(u.id);
  });

  const userMap = new Map<string, any>();
  staffUsers.forEach((u) => userMap.set(u.id, u));

  const repScorecards: SalesRepIntelligence[] = Array.from(repIds)
    .map((uid) => {
      const repUser = userMap.get(uid);
      if (!repUser) return null;

      const repClients = clients.filter((c: any) => c.assignedToUserId === uid);
      const repActivities = activities.filter((a: any) => a.userId === uid);
      const repDeals = deals.filter((d: any) => d.ownerUserId === uid);

      const followUpsLogged = repActivities.filter((a: any) =>
        ["CALL", "EMAIL", "MEETING", "TASK"].includes((a.type || "").toUpperCase())
      ).length;
      const responsesRecorded = repActivities.filter(
        (a: any) => a.outcome && a.outcome.trim().length > 0
      ).length;

      const responseRatePct =
        followUpsLogged > 0 ? Math.round((responsesRecorded / followUpsLogged) * 100) : 0;

      const repStale = repClients.filter((cl: any) => {
        if (cl.stage === "ACTIVE_ACCOUNT") return false;
        const lastTouch = lastActivityByClient.get(cl.id) || new Date(cl.createdAt).getTime();
        return (now - lastTouch) / (1000 * 60 * 60) >= staleThresholdHours;
      }).length;

      const pipelineValue =
        repDeals.reduce((acc: number, d: any) => acc + Number(d.value || 0), 0) ||
        repClients.reduce((acc: number, c: any) => acc + Number(c.estimatedValue || 0), 0);

      let accountabilityScore = 100;
      if (repClients.length > 0 && followUpsLogged === 0) accountabilityScore -= 45;
      accountabilityScore -= Math.min(40, repStale * 10);
      if (followUpsLogged > 0 && responseRatePct < 30) accountabilityScore -= 15;
      accountabilityScore = Math.max(15, Math.min(100, accountabilityScore));

      const status: SalesRepIntelligence["status"] =
        accountabilityScore >= 85 && followUpsLogged >= 2
          ? "TOP_PERFORMER"
          : accountabilityScore >= 65
          ? "ACTIVE"
          : "NEEDS_FOLLOWUP";

      return {
        userId: uid,
        fullName: repUser.fullName,
        department: repUser.department,
        assignedClientsCount: repClients.length,
        followUpsLogged,
        responsesRecorded,
        responseRatePct,
        staleClientsCount: repStale,
        pipelineValue,
        accountabilityScore,
        status,
      };
    })
    .filter(Boolean) as SalesRepIntelligence[];

  const totalFollowUps = activities.length;
  const totalResponsesRecorded = activities.filter(
    (a: any) => a.outcome && a.outcome.trim().length > 0
  ).length;
  const overallResponseRatePct =
    totalFollowUps > 0 ? Math.round((totalResponsesRecorded / totalFollowUps) * 100) : 0;

  return {
    totalClients: clients.length,
    totalFollowUps,
    totalResponsesRecorded,
    overallResponseRatePct,
    staleClientsCount: staleClients.length,
    repScorecards: repScorecards.sort((a, b) => b.accountabilityScore - a.accountabilityScore),
    staleClients: staleClients.slice(0, 8),
  };
}
