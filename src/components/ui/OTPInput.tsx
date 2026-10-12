"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  autoFocus = true,
}: OTPInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Array of digits from value
  const digits = React.useMemo(() => {
    const arr = value.split("").slice(0, length);
    while (arr.length < length) {
      arr.push("");
    }
    return arr;
  }, [value, length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const rawVal = e.target.value;
    const char = rawVal.slice(-1); // Take last entered character

    if (!/^\d*$/.test(char)) return; // Only allow digits

    const newDigits = [...digits];
    newDigits[index] = char;
    const newCombined = newDigits.join("");
    onChange(newCombined);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCombined.length === length && !newCombined.includes("") && onComplete) {
      onComplete(newCombined);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    const cleanNumbers = pastedData.replace(/\D/g, "").slice(0, length);

    if (cleanNumbers.length > 0) {
      onChange(cleanNumbers);
      const targetIndex = Math.min(cleanNumbers.length, length - 1);
      inputRefs.current[targetIndex]?.focus();

      if (cleanNumbers.length === length && onComplete) {
        onComplete(cleanNumbers);
      }
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className={cn(
            "h-12 w-10 sm:h-14 sm:w-12 rounded-xl text-center font-mono text-xl sm:text-2xl font-bold transition-all",
            "border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] text-slate-900 dark:text-white shadow-sm",
            "focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:scale-105",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/30 text-red-500",
            disabled && "cursor-not-allowed opacity-50"
          )}
        />
      ))}
    </div>
  );
}

