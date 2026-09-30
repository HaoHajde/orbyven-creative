"use client";

import { useEffect, useRef } from "react";
import { scheduleWorkspaceWarp } from "@/lib/workspace-warp";

/** Warp to the exact record opened from Overview/search/AI after async module data loads. */
export function useWorkspaceRecordFocus(
  initialRecordId: string | undefined,
  selectedRecordId: string | null,
  loading: boolean
) {
  const hasFocused = useRef(false);

  useEffect(() => {
    if (!initialRecordId || initialRecordId !== selectedRecordId || loading || hasFocused.current) return;

    const cancel = scheduleWorkspaceWarp(
      '[data-workspace-record-focus="true"]',
      {
        attempts: 32,
        delayMs: 45,
        fallbackSelector: '[data-workspace-module-focus="true"]',
      }
    );

    hasFocused.current = true;
    return cancel;
  }, [initialRecordId, selectedRecordId, loading]);
}

/** Warp to a newly opened create/upload form, including forms opened inside the active module. */
export function useWorkspaceCreateFocus(open: boolean) {
  const wasOpen = useRef(open);

  useEffect(() => {
    const justOpened = open && !wasOpen.current;
    const initiallyOpen = open && wasOpen.current;
    wasOpen.current = open;

    if (!justOpened && !initiallyOpen) return;

    return scheduleWorkspaceWarp(
      '[data-workspace-create-focus="true"]',
      {
        attempts: 24,
        delayMs: 40,
        fallbackSelector: '[data-workspace-module-focus="true"]',
      }
    );
  }, [open]);
}
