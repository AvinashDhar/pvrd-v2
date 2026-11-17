"use client";

import { ThemeProvider } from "next-themes";
import { AppFeedback } from "@/components/brand/app-feedback";
import { SplashScreen } from "@/components/brand/splash-screen";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
      <TooltipProvider>
        <SplashScreen />
        <AppFeedback />
        {children}
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </TooltipProvider>
    </ThemeProvider>
  );
}
