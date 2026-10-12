"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ToastProvider } from "@/components/ui/Toast";
import { GlobalPreloader } from "@/components/ui/GlobalPreloader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
      <ToastProvider>
        <GlobalPreloader />
        {children}
      </ToastProvider>
    </NextThemesProvider>
  );
}
