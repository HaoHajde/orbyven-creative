"use client";

import { useEffect, useRef } from "react";

/** Focus the exact record opened from Overview/search after the module data loads. */
export function useWorkspaceRecordFocus(
  initialRecordId: string | undefined,
  selectedRecordId: string | null,
  loading: boolean
) {
  const hasFocused = useRef(false);

  useEffect(() => {
    if (!initialRecordId || initialRecordId !== selectedRecordId || loading || hasFocused.current) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.querySelector('[data-workspace-record-focus="true"]');
      if (!(target instanceof HTMLElement)) return;
      hasFocused.current = true;
      target.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [initialRecordId, selectedRecordId, loading]);
}
