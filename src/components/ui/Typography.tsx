import * as React from "react";
import { cn } from "@/lib/utils";

type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "lead"
  | "p"
  | "muted"
  | "micro"
  | "stat"
  | "code";

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  variant?: TypographyVariant;
  children: React.ReactNode;
}

const variantStyles: Record<TypographyVariant, string> = {
  h1: "scroll-m-20 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white",
  h2: "scroll-m-20 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white",
  h3: "scroll-m-20 text-lg font-semibold tracking-tight text-slate-900 dark:text-white",
  h4: "scroll-m-20 text-base font-semibold tracking-tight text-slate-900 dark:text-white",
  lead: "text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed",
  p: "leading-relaxed text-sm text-slate-700 dark:text-slate-300",
  muted: "text-xs text-slate-500 dark:text-slate-400 font-normal",
  micro: "text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500",
  stat: "font-mono text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums",
  code: "relative rounded bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 font-mono text-xs font-medium text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20",
};

const defaultTag: Record<TypographyVariant, React.ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  lead: "p",
  p: "p",
  muted: "p",
  micro: "span",
  stat: "div",
  code: "code",
};

export function Typography({
  as,
  variant = "p",
  className,
  children,
  ...props
}: TypographyProps) {
  const Component = as || defaultTag[variant];
  return (
    <Component
      className={cn(variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Component>
  );
}

