import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:via-rose-700 hover:to-red-700 text-white shadow-md shadow-red-500/20 hover:shadow-red-500/30",
        secondary:
          "bg-white dark:bg-[#15161c] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.05] text-slate-900 dark:text-white shadow-sm",
        outline:
          "border border-red-200 dark:border-red-500/30 text-red-600 dark:text-rose-400 hover:bg-red-50/60 dark:hover:bg-red-500/10",
        danger:
          "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/30",
        ghost:
          "hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300",
        glass:
          "bg-white/70 dark:bg-white/[0.05] backdrop-blur-md border border-white/40 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/[0.08] text-slate-900 dark:text-white shadow-sm",
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-md",
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-6 text-base font-semibold",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-7 w-7 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          leftIcon && <span className="mr-2 inline-flex items-center">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="ml-2 inline-flex items-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

