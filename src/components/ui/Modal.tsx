"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
  className,
}: ModalProps) {
  // Mobile Drag Down to Dismiss State (WhatsApp & iOS Bottom Sheet UX)
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchDiff, setTouchDiff] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }[maxWidth];

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentY = e.targetTouches[0].clientY;
    const diff = currentY - touchStart;
    if (diff > 0) {
      setTouchDiff(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (touchDiff > 85) {
      onClose();
    }
    setTouchDiff(0);
    setTouchStart(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Adaptive Modal & Mobile Bottom Sheet Box */}
      <div
        style={{
          transform: touchDiff > 0 ? `translateY(${touchDiff}px)` : undefined,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className={cn(
          "relative z-10 w-full max-h-[92vh] sm:max-h-[85vh] overflow-y-auto rounded-t-[32px] sm:rounded-2xl border-t sm:border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12141D] px-6 pt-2 pb-8 sm:p-6 shadow-2xl animate-slide-up sm:animate-fade-in transition-all",
          "pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-6",
          maxWidthClasses,
          className
        )}
      >
        {/* Mobile WhatsApp / iOS Pull Handle Bar */}
        <div
          className="sm:hidden flex flex-col items-center justify-center pt-2 pb-3.5 -mt-1 cursor-grab active:cursor-grabbing touch-none select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-white/25 active:bg-slate-400 transition-colors" />
        </div>

        {/* Modal / Sheet Header */}
        <div className="flex items-start justify-between">
          <div className="pr-4">
            {title && (
              <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.08] dark:hover:text-white transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal / Sheet Content */}
        <div className="mt-4">{children}</div>

        {/* Modal / Sheet Footer */}
        {footer && <div className="mt-6 flex justify-end gap-2.5">{footer}</div>}
      </div>
    </div>
  );
}

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: BottomSheetProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      footer={footer}
      maxWidth="md"
      className={className}
    >
      {children}
    </Modal>
  );
}

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function Drawer({ isOpen, onClose, title, description, children }: DrawerProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-slate-200 dark:border-white/10 bg-white dark:bg-[#121217] p-6 shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex-1">{children}</div>
      </div>
    </div>
  );
}
