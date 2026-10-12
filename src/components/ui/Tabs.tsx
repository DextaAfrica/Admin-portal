"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 border-b border-slate-200 dark:border-white/10 overflow-x-auto",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "group relative flex items-center gap-2 px-4 py-2.5 text-xs font-semibold tracking-wide transition-all",
              isActive
                ? "text-red-600 dark:text-rose-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            {tab.icon && (
              <span
                className={cn(
                  "transition-colors",
                  isActive
                    ? "text-red-600 dark:text-rose-400"
                    : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                )}
              >
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                  isActive
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300"
                    : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400"
                )}
              >
                {tab.badge}
              </span>
            )}
            {/* Active red indicator bar */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 dark:bg-rose-500 rounded-full animate-fade-in" />
            )}
          </button>
        );
      })}
    </div>
  );
}

