"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// 1. 6-MONTH TREASURY CASHFLOW & BURN CHART (INFLOW VS DISBURSEMENT)
// =============================================================================

export interface CashflowPoint {
  month: string;
  inflow: number;
  disbursed: number;
}

export function CashflowTrendChart({ data }: { data: CashflowPoint[] }) {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  const formatCompact = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val.toLocaleString()}`;
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-xs text-slate-400">
        No settled treasury transactions recorded yet.
      </div>
    );
  }

  const maxVal = Math.max(
    ...data.flatMap((d) => [d.inflow, d.disbursed]),
    1000
  );

  return (
    <div className="space-y-4 select-none">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            Capital Inflow
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#ED2618]" />
            Disbursements
          </span>
        </div>
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-white/10 text-white font-semibold animate-fade-in">
            {data[hoveredIdx].month}: +{formatCompact(data[hoveredIdx].inflow)} / -{formatCompact(data[hoveredIdx].disbursed)}
          </div>
        )}
      </div>

      <div className="relative h-52 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 border-b border-slate-200/70 dark:border-white/[0.08]">
        {/* Horizontal dashed reference lines */}
        {[0.25, 0.5, 0.75, 1].map((pct) => (
          <div
            key={pct}
            className="absolute left-0 right-0 border-t border-dashed border-slate-100 dark:border-white/[0.05] pointer-events-none"
            style={{ bottom: `${pct * 100}%` }}
          />
        ))}

        {data.map((d, idx) => {
          const inflowH = Math.max(4, Math.round((d.inflow / maxVal) * 100));
          const disbH = Math.max(4, Math.round((d.disbursed / maxVal) * 100));
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={d.month}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={cn(
                "flex-1 h-full flex flex-col items-center justify-end gap-2 group cursor-pointer rounded-xl px-1 transition-colors",
                isHovered && "bg-slate-50/80 dark:bg-white/[0.03]"
              )}
            >
              <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-40">
                <div
                  className="w-3 sm:w-5 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500 shadow-xs"
                  style={{ height: `${d.inflow === 0 ? 3 : inflowH}%`, opacity: d.inflow === 0 ? 0.25 : 1 }}
                  title={`Inflow: $${d.inflow.toLocaleString()}`}
                />
                <div
                  className="w-3 sm:w-5 rounded-t-md bg-gradient-to-t from-[#ED2618] to-rose-400 transition-all duration-500 shadow-xs"
                  style={{ height: `${d.disbursed === 0 ? 3 : disbH}%`, opacity: d.disbursed === 0 ? 0.25 : 1 }}
                  title={`Disbursed: $${d.disbursed.toLocaleString()}`}
                />
              </div>
              <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {d.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// 2. CRM COMMERCIAL PIPELINE FUNNEL CHART
// =============================================================================

export interface PipelineStageMetric {
  stage: string;
  label: string;
  count: number;
  value: number;
  colorClass: string;
}

export function PipelineFunnelChart({ stages }: { stages: PipelineStageMetric[] }) {
  const maxVal = Math.max(...stages.map((s) => s.value), 1);

  const formatMoney = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-3.5">
      {stages.map((st) => {
        const widthPct = st.value > 0 ? Math.max(12, Math.round((st.value / maxVal) * 100)) : 6;
        return (
          <div key={st.stage} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">{st.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400">
                  {st.count} {st.count === 1 ? "deal" : "deals"}
                </span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {formatMoney(st.value)}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", st.colorClass)}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// 3. CROSS-DEPARTMENTAL HEALTH & SLA SCORECARD
// =============================================================================

export interface DepartmentHealthItem {
  department: string;
  score: number; // 0 - 100
  status: "OPTIMAL" | "WATCH" | "CRITICAL";
  metricLabel: string;
  pendingCount: number;
}

export function DepartmentHealthRadar({ items }: { items: DepartmentHealthItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const barColor =
          item.status === "OPTIMAL"
            ? "bg-emerald-500"
            : item.status === "WATCH"
            ? "bg-amber-500"
            : "bg-[#ED2618]";
        const badgeStyle =
          item.status === "OPTIMAL"
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
            : item.status === "WATCH"
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            : "bg-red-500/10 text-[#ED2618] border-red-500/20";

        return (
          <div
            key={item.department}
            className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {item.department}
                </span>
                <span className={cn("text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border", badgeStyle)}>
                  {item.status}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                  {item.metricLabel}
                </span>
                <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                  {item.score}%
                </span>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", barColor)}
                style={{ width: `${Math.max(8, item.score)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
