"use client";

const DEFAULT_OFFSET = 86;
const DEFAULT_ATTEMPTS = 24;
const DEFAULT_DELAY_MS = 45;

type WarpOptions = {
  offset?: number;
  attempts?: number;
  delayMs?: number;
  fallbackSelector?: string;
};

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function warpElementIntoView(target: HTMLElement, offset: number) {
  const top = Math.max(
    0,
    target.getBoundingClientRect().top + window.scrollY - offset
  );

  window.scrollTo({
    top,
    behavior: reducedMotion() ? "auto" : "smooth",
  });
}

export function scheduleWorkspaceWarp(
  selector: string,
  {
    offset = DEFAULT_OFFSET,
    attempts = DEFAULT_ATTEMPTS,
    delayMs = DEFAULT_DELAY_MS,
    fallbackSelector,
  }: WarpOptions = {}
) {
  let cancelled = false;
  let attempt = 0;
  let timer: number | null = null;
  let frame: number | null = null;

  const run = () => {
    if (cancelled) return;
    const target = document.querySelector(selector);
    if (target instanceof HTMLElement) {
      frame = window.requestAnimationFrame(() => {
        if (!cancelled) warpElementIntoView(target, offset);
      });
      return;
    }

    attempt += 1;
    if (attempt < attempts) {
      timer = window.setTimeout(run, delayMs);
      return;
    }

    if (fallbackSelector) {
      const fallback = document.querySelector(fallbackSelector);
      if (fallback instanceof HTMLElement) {
        frame = window.requestAnimationFrame(() => {
          if (!cancelled) warpElementIntoView(fallback, offset);
        });
      }
    }
  };

  frame = window.requestAnimationFrame(run);

  return () => {
    cancelled = true;
    if (timer !== null) window.clearTimeout(timer);
    if (frame !== null) window.cancelAnimationFrame(frame);
  };
}
