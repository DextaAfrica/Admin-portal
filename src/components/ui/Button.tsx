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
          "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/20 hover:shadow-md hover:shadow-red-600/25",
        secondary:
          "bg-white dark:bg-[#15161c] border border-slate-200/90 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.05] text-slate-800 dark:text-white shadow-xs",
        outline:
          "border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50/70 dark:hover:bg-red-500/10",
        danger:
          "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/25",
        ghost:
          "hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300",
        glass:
          "bg-white/80 dark:bg-white/[0.06] backdrop-blur-md border border-slate-200/70 dark:border-white/10 hover:bg-white dark:hover:bg-white/[0.1] text-slate-900 dark:text-white shadow-xs",
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-lg",
        sm: "h-8.5 px-3.5 text-xs rounded-lg",
        md: "h-10 px-4 text-sm rounded-xl",
        lg: "h-11 px-6 text-sm sm:text-base rounded-xl",
        icon: "h-9 w-9 p-0 rounded-xl",
        "icon-sm": "h-7.5 w-7.5 p-0 rounded-lg",
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
