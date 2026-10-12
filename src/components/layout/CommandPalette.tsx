"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  LayoutDashboard,
  HardDrive,
  Mail,
  ShieldCheck,
  UserCheck,
  FileText,
  Moon,
  Sun,
  Radio,
  PlusCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Quick Actions";
  icon: React.ElementType;
  action: () => void;
  shortcut?: string;
}

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const items: CommandItem[] = React.useMemo(
    () => [
      {
        id: "nav-dashboard",
        title: "Go to Dashboard",
        category: "Navigation",
        icon: LayoutDashboard,
        action: () => {
          router.push("/dashboard");
          onClose();
        },
      },
      {
        id: "nav-storage",
        title: "Go to S3 Cloud Storage",
        category: "Navigation",
        icon: HardDrive,
        action: () => {
          router.push("/storage");
          onClose();
        },
      },
      {
        id: "nav-campaigns",
        title: "Go to Email Campaigns",
        category: "Navigation",
        icon: Mail,
        action: () => {
          router.push("/marketing/campaigns");
          onClose();
        },
      },
      {
        id: "nav-endpoints",
        title: "Go to API Endpoints & Health",
        category: "Navigation",
        icon: Radio,
        action: () => {
          router.push("/endpoints");
          onClose();
        },
      },
      {
        id: "nav-security",
        title: "Go to 2FA / MFA Security Center",
        category: "Navigation",
        icon: ShieldCheck,
        action: () => {
          router.push("/security");
          onClose();
        },
      },
      {
        id: "nav-users",
        title: "Go to Team & Access Control",
        category: "Navigation",
        icon: UserCheck,
        action: () => {
          router.push("/users");
          onClose();
        },
      },
      {
        id: "nav-audit",
        title: "Go to Compliance Audit Trail",
        category: "Navigation",
        icon: FileText,
        action: () => {
          router.push("/audit-logs");
          onClose();
        },
      },
      {
        id: "act-theme",
        title: `Toggle Theme (Current: ${theme})`,
        category: "Quick Actions",
        icon: theme === "dark" ? Sun : Moon,
        action: () => {
          setTheme(theme === "dark" ? "light" : "dark");
          onClose();
        },
      },
    ],
    [router, onClose, theme, setTheme]
  );

  const filtered = React.useMemo(() => {
    if (!query) return items;
    return items.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );
  }, [items, query]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] shadow-2xl animate-fade-in">
        {/* Search Input */}
        <div className="flex items-center border-b border-slate-200 dark:border-white/10 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400 mr-3 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search destination..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="rounded border border-slate-200 dark:border-white/10 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No matching commands or destinations found.
            </p>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors cursor-pointer",
                    isSelected
                      ? "bg-rose-50 dark:bg-rose-500/10 text-red-600 dark:text-rose-400 font-medium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-white/[0.04]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isSelected
                          ? "text-red-600 dark:text-rose-400"
                          : "text-slate-400"
                      )}
                    />
                    <span>{item.title}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono text-slate-400">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 px-4 py-2 text-[11px] text-slate-400 bg-slate-50/50 dark:bg-white/[0.02]">
          <span>Navigation: <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd></span>
          <span>Execute: <kbd className="font-mono">↵ Enter</kbd></span>
        </div>
      </div>
    </div>
  );
}

