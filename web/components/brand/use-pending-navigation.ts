"use client";

import { useEffect, useRef } from "react";
import { beginAppNavigation, endAppNavigation } from "@/components/brand/navigation-signal";

/** Shows the top progress bar while a submit is in flight, and hides it if the page stays put. */
export function usePendingNavigation(pending: boolean) {
  const wasPending = useRef(false);

  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      beginAppNavigation();
      return;
    }
    if (wasPending.current) {
      wasPending.current = false;
      endAppNavigation();
    }
  }, [pending]);
}
