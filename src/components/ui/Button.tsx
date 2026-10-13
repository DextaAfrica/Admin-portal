import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[#ED2618] hover:bg-red-700 text-white shadow-md shadow-red-600/20 hover:shadow-lg hover:shadow-red-600/30 border border-transparent",
        secondary:
          "bg-white dark:bg-[#161821] border border-slate-200 dark:border-white/15 hover:border-slate-300 dark:hover:border-white/25 hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-800 dark:text-white shadow-sm",
        outline:
          "border-2 border-red-200 dark:border-red-500/30 bg-white/80 dark:bg-transparent text-[#ED2618] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-[#ED2618]",
        danger:
          "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/25 border border-transparent",
        ghost:
          "hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300",
        glass:
          "bg-white/85 dark:bg-white/[0.08] backdrop-blur-md border border-slate-200/80 dark:border-white/15 hover:bg-white dark:hover:bg-white/[0.14] text-slate-900 dark:text-white shadow-sm",
      },
      size: {
        xs: "h-8 px-3 text-xs rounded-lg",
        sm: "h-9 px-4 text-xs sm:text-sm rounded-xl",
        md: "h-10 px-5 text-sm rounded-xl",
        lg: "h-12 px-7 text-sm sm:text-base font-bold rounded-xl",
        icon: "h-9 w-9 p-0 rounded-xl",
        "icon-sm": "h-8 w-8 p-0 rounded-lg",
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
          leftIcon && <span className="mr-2 inline-flex items-center shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="ml-2 inline-flex items-center shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
