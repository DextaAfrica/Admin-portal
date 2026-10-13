import * as React from "react";
import { cn } from "@/lib/utils";

export type TypographyVariant =
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

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  variant?: TypographyVariant;
  children: React.ReactNode;
}

const variantStyles: Record<TypographyVariant, string> = {
  h1: "scroll-m-20 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight",
  h2: "scroll-m-20 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug",
  h3: "scroll-m-20 text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white",
  h4: "scroll-m-20 text-sm sm:text-base font-semibold tracking-tight text-slate-900 dark:text-white",
  lead: "text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed",
  p: "leading-relaxed text-sm text-slate-700 dark:text-slate-300",
  muted: "text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal leading-relaxed",
  micro: "text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500",
  stat: "text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums",
  code: "relative rounded-md bg-red-50 dark:bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400 border border-red-200/70 dark:border-red-500/20",
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
  code: "span",
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
    <Component className={cn(variantStyles[variant], className)} {...props}>
      {children}
    </Component>
  );
}
