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

/** Warp when the user selects a different record inside the current module. */
export function useWorkspaceSelectionWarp(
  selectedRecordId: string | null,
  loading: boolean
) {
  const previousRecordId = useRef<string | null>(null);
  const ready = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (!ready.current) {
      ready.current = true;
      previousRecordId.current = selectedRecordId;
      return;
    }

    if (!selectedRecordId || selectedRecordId === previousRecordId.current) return;
    previousRecordId.current = selectedRecordId;

    return scheduleWorkspaceWarp(
      '[data-workspace-record-focus="true"]',
      {
        attempts: 20,
        delayMs: 35,
        fallbackSelector: '[data-workspace-module-focus="true"]',
      }
    );
  }, [selectedRecordId, loading]);
}
