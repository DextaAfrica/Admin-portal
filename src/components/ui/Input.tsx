import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              "flex h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] px-3 py-1 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/30",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface PasswordInputProps extends Omit<InputProps, "type" | "rightIcon"> {
  showStrength?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showStrength, value, onChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [pwdVal, setPwdVal] = React.useState(String(value || ""));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPwdVal(e.target.value);
      if (onChange) onChange(e);
    };

    // Simple strength calculation (0 to 4)
    const calculateStrength = (pwd: string) => {
      let score = 0;
      if (!pwd) return 0;
      if (pwd.length >= 8) score++;
      if (/[A-Z]/.test(pwd)) score++;
      if (/[0-9]/.test(pwd)) score++;
      if (/[^A-Za-z0-9]/.test(pwd)) score++;
      return score;
    };

    const strength = calculateStrength(pwdVal);
    const strengthLabels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
    const strengthColors = ["bg-slate-300", "bg-red-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"];

    return (
      <div className="space-y-1.5 w-full">
        <Input
          {...props}
          type={showPassword ? "text" : "password"}
          ref={ref}
          value={value}
          onChange={handleChange}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        {showStrength && pwdVal.length > 0 && (
          <div className="space-y-1 pt-1">
            <div className="flex gap-1 h-1.5 w-full">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "h-full flex-1 rounded-full transition-all duration-300",
                    strength >= step ? strengthColors[strength] : "bg-slate-200 dark:bg-white/10"
                  )}
                />
              ))}
            </div>
            <p className="text-[10px] text-right text-slate-500 font-mono">
              Strength: {strengthLabels[strength]}
            </p>
          </div>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

