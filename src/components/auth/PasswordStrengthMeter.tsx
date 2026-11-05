"use client";

import * as React from "react";
import { Check, X, Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { evaluatePasswordStrength, PasswordAnalysis } from "@/lib/auth/validation";

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

export function PasswordStrengthMeter({
  password,
  showRequirements = true,
  className = "",
}: PasswordStrengthMeterProps) {
  const analysis: PasswordAnalysis = React.useMemo(() => {
    return evaluatePasswordStrength(password);
  }, [password]);

  if (!password) {
    if (!showRequirements) return null;
    return (
      <div className={`mt-2 text-[11px] text-slate-500 space-y-1.5 ${className}`}>
        <p className="font-semibold text-slate-600 dark:text-slate-400">
          Executive Password Requirements:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
            At least 8 characters
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
            Uppercase letter (A-Z)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
            Lowercase letter (a-z)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
            Number (0-9)
          </span>
          <span className="flex items-center gap-1.5 sm:col-span-2">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
            Special character (!@#$%^&*...)
          </span>
        </div>
      </div>
    );
  }

  const { score, label, checks } = analysis;

  const scoreColors = [
    "bg-red-500 text-red-500", // 0
    "bg-red-500 text-red-500", // 1
    "bg-amber-500 text-amber-500", // 2
    "bg-sky-500 text-sky-500", // 3
    "bg-emerald-500 text-emerald-500", // 4
  ];

  return (
    <div className={`mt-2 space-y-2 ${className}`}>
      {/* 4-Segment Strength Bar */}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((seg) => (
          <div
            key={seg}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              score >= seg
                ? seg <= 1
                  ? "bg-red-500"
                  : seg <= 2
                  ? "bg-amber-500"
                  : seg <= 3
                  ? "bg-sky-500"
                  : "bg-emerald-500"
                : "bg-slate-200 dark:bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* Label and Badge */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
          Password Strength:
        </span>
        <span
          className={`font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 ${
            score === 0 || score === 1
              ? "text-red-600 dark:text-red-400"
              : score === 2
              ? "text-amber-600 dark:text-amber-400"
              : score === 3
              ? "text-sky-600 dark:text-sky-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {score >= 4 ? (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          ) : score >= 2 ? (
            <Shield className="h-3.5 w-3.5 text-amber-500" />
          ) : (
            <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
          )}
          <span>{label}</span>
        </span>
      </div>

      {/* Live Requirements Checklist */}
      {showRequirements && (
        <div className="pt-1.5 border-t border-slate-100 dark:border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
          <RequirementItem
            met={checks.minLength}
            label="8+ characters"
          />
          <RequirementItem
            met={checks.hasUppercase}
            label="Uppercase letter (A-Z)"
          />
          <RequirementItem
            met={checks.hasLowercase}
            label="Lowercase letter (a-z)"
          />
          <RequirementItem
            met={checks.hasNumber}
            label="Number (0-9)"
          />
          <RequirementItem
            met={checks.hasSpecial}
            label="Special symbol (!@#$%...)"
            className="sm:col-span-2"
          />
        </div>
      )}
    </div>
  );
}

function RequirementItem({
  met,
  label,
  className = "",
}: {
  met: boolean;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 transition-colors ${
        met
          ? "text-emerald-600 dark:text-emerald-400 font-medium"
          : "text-slate-400 dark:text-slate-500"
      } ${className}`}
    >
      {met ? (
        <Check className="h-3 w-3 shrink-0 text-emerald-500" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-white/20 shrink-0" />
      )}
      <span>{label}</span>
    </div>
  );
}

