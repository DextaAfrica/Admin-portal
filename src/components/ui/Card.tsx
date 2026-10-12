import * as React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  hoverGlow = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hoverGlow?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121217] p-5 shadow-sm transition-all",
        hoverGlow &&
          "hover:border-red-500/30 hover:shadow-md hover:shadow-red-500/5 dark:hover:border-rose-500/30",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5 pb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold leading-none tracking-tight text-slate-900 dark:text-white", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-slate-500 dark:text-slate-400", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("pt-0", className)} {...props}>
      {children}
    </div>
  );
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  description?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  description,
  className,
}: StatCardProps) {
  return (
    <Card hoverGlow className={cn("relative overflow-hidden", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-red-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white tabular-nums">
          {value}
        </span>
      </div>

      {(trend || description) && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center font-medium font-mono text-[11px] px-1.5 py-0.5 rounded",
                trend.isPositive !== false
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
              )}
            >
              {trend.isPositive !== false ? (
                <ArrowUpRight className="mr-0.5 h-3 w-3" />
              ) : (
                <ArrowDownRight className="mr-0.5 h-3 w-3" />
              )}
              {trend.value}
            </span>
          )}
          {trend?.label && (
            <span className="text-slate-500 dark:text-slate-400">{trend.label}</span>
          )}
          {!trend && description && (
            <span className="text-slate-500 dark:text-slate-400">{description}</span>
          )}
        </div>
      )}
    </Card>
  );
}

