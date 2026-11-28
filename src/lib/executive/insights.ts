export interface ExecutiveInsight {
  id: string;
  category: "TREASURY" | "OPERATIONS" | "COMMERCIAL" | "WORKFORCE" | "SECURITY";
  severity: "CRITICAL" | "WARNING" | "OPPORTUNITY" | "HEALTHY";
  title: string;
  summary: string;
  recommendation: string;
  actionLabel: string;
  actionHref: string;
}

export interface InsightsInput {
  totalInflow: number;
  totalDisbursed: number;
  grossPipelineValue: number;
  closingDealsValue: number;
  closingDealsCount: number;
  totalDealsCount: number;
  pendingApprovalsCount: number;
  bottleneckApprovalsCount: number;
  overdueTasksCount: number;
  pendingLeavesCount: number;
  totalStaff: number;
  mfaEnabledCount: number;
  openAlertsCount: number;
  activeProjectsCount: number;
  stalledProjectsCount: number;
}

/**
 * Automated Business Intelligence & Decision Engine for the MD/CEO Cockpit.
 * Evaluates live cross-departmental telemetry and produces prioritized,
 * actionable insights without manual curation.
 */
export function generateExecutiveInsights(input: InsightsInput): ExecutiveInsight[] {
  const insights: ExecutiveInsight[] = [];

  // 1. Treasury & Cashflow Burn Analysis
  const netLiquidity = input.totalInflow - input.totalDisbursed;
  if (input.totalDisbursed > input.totalInflow && input.totalDisbursed > 0) {
    const deficitPct = input.totalInflow > 0
      ? Math.round(((input.totalDisbursed - input.totalInflow) / input.totalInflow) * 100)
      : 100;
    insights.push({
      id: "insight-treasury-burn",
      category: "TREASURY",
      severity: "CRITICAL",
      title: "Treasury Outflow Exceeds Capital Inflow",
      summary: `Settled disbursements ($${input.totalDisbursed.toLocaleString()}) exceed inflows ($${input.totalInflow.toLocaleString()}) by ${deficitPct}%. Net position: -$${Math.abs(netLiquidity).toLocaleString()}.`,
      recommendation: "Issue an Executive Directive to Finance to review discretionary contractor payouts and accelerate receivables.",
      actionLabel: "Instruct Finance",
      actionHref: "#issue-directive-finance",
    });
  } else if (input.totalInflow > 0) {
    const reserveRatio = Math.round((netLiquidity / input.totalInflow) * 100);
    insights.push({
      id: "insight-treasury-surplus",
      category: "TREASURY",
      severity: "HEALTHY",
      title: `Positive Treasury Reserve (${reserveRatio}% Retained)`,
      summary: `Net liquidity stands at $${netLiquidity.toLocaleString()} from $${input.totalInflow.toLocaleString()} total capital inflows.`,
      recommendation: "Liquidity is healthy for scheduled infrastructure milestones and Q4 capital deployment.",
      actionLabel: "View Treasury",
      actionHref: "/dashboard?tab=treasury",
    });
  }

  // 2. Operational Bottlenecks & Overdue GM Tasks
  if (input.bottleneckApprovalsCount > 0 || input.overdueTasksCount > 0) {
    insights.push({
      id: "insight-ops-bottleneck",
      category: "OPERATIONS",
      severity: "WARNING",
      title: `${input.bottleneckApprovalsCount} SLA Bottlenecks & ${input.overdueTasksCount} Overdue Tasks`,
      summary: `Inter-departmental clearances pending >24h or overdue operational tasks are slowing site execution.`,
      recommendation: "Review pending approvals in the Decision Desk or inspect GM task delegation in Stealth Oversight.",
      actionLabel: "Inspect Oversight",
      actionHref: "#stealth-oversight",
    });
  } else if (input.pendingApprovalsCount > 0) {
    insights.push({
      id: "insight-ops-pending",
      category: "OPERATIONS",
      severity: "OPPORTUNITY",
      title: `${input.pendingApprovalsCount} Clearances Awaiting Authorization`,
      summary: "All pending requisitions are currently within the 24-hour SLA window.",
      recommendation: "Process inline authorizations to maintain 100% operational velocity.",
      actionLabel: "Review Queue",
      actionHref: "#decision-desk",
    });
  }

  // 3. Commercial CRM Pipeline Conversion Opportunity
  if (input.closingDealsCount > 0) {
    insights.push({
      id: "insight-crm-closing",
      category: "COMMERCIAL",
      severity: "OPPORTUNITY",
      title: `$${input.closingDealsValue.toLocaleString()} in Late-Stage Closing`,
      summary: `${input.closingDealsCount} institutional deal${input.closingDealsCount === 1 ? "" : "s"} out of ${input.totalDealsCount} total are in Closing stage.`,
      recommendation: "Coordinate with Sales & Legal to finalize contract signatures and convert pipeline into settled inflow.",
      actionLabel: "Open CRM Pipeline",
      actionHref: "/crm",
    });
  }

  // 4. Infrastructure Delivery Risk
  if (input.stalledProjectsCount > 0) {
    insights.push({
      id: "insight-prj-stalled",
      category: "OPERATIONS",
      severity: "WARNING",
      title: `${input.stalledProjectsCount} Infrastructure Site${input.stalledProjectsCount === 1 ? "" : "s"} On Hold / Low Velocity`,
      summary: `${input.stalledProjectsCount} out of ${input.activeProjectsCount} active sites require milestone intervention.`,
      recommendation: "Issue a directive to Operations / GM to submit an updated ground progress dossier.",
      actionLabel: "View Portfolios",
      actionHref: "/projects",
    });
  }

  // 5. Security & Governance Posture
  const mfaPct = input.totalStaff > 0 ? Math.round((input.mfaEnabledCount / input.totalStaff) * 100) : 100;
  if (input.openAlertsCount > 0 || mfaPct < 80) {
    insights.push({
      id: "insight-sec-posture",
      category: "SECURITY",
      severity: input.openAlertsCount > 0 ? "CRITICAL" : "WARNING",
      title: input.openAlertsCount > 0
        ? `${input.openAlertsCount} Open Security Policy Alert${input.openAlertsCount === 1 ? "" : "s"}`
        : `MFA Adoption at ${mfaPct}% Across Staff`,
      summary: input.openAlertsCount > 0
        ? "Active security or access policy alerts require Systems IT remediation and Executive sign-off."
        : `${input.totalStaff - input.mfaEnabledCount} staff accounts have not yet enrolled in 2FA.`,
      recommendation: "Instruct Systems IT to enforce mandatory 2FA enrollment and resolve open alerts.",
      actionLabel: "Instruct IT",
      actionHref: "#issue-directive-it",
    });
  }

  // 6. Workforce & HR Capacity
  if (input.pendingLeavesCount > 2) {
    insights.push({
      id: "insight-hr-leaves",
      category: "WORKFORCE",
      severity: "WARNING",
      title: `${input.pendingLeavesCount} Pending Staff Leave Requests`,
      summary: "Unreviewed leave requests may impact upcoming project shift coverage.",
      recommendation: "Direct People & Culture (HR) to clear pending leave approvals.",
      actionLabel: "HR Workspace",
      actionHref: "/hr",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "insight-all-clear",
      category: "OPERATIONS",
      severity: "HEALTHY",
      title: "All Enterprise Directorates Operating Within SLA",
      summary: "Zero critical bottlenecks, balanced treasury posture, and full compliance health across Dexta Africa.",
      recommendation: "Continue monitoring daily execution or issue proactive strategic directives.",
      actionLabel: "Issue Directive",
      actionHref: "#issue-directive",
    });
  }

  return insights.slice(0, 4);
}
