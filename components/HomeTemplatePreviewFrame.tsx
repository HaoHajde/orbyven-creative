"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Keep the homepage carousel card stable while sizing each real template preview
 * INSIDE the available space. Never constrain its nested DOM / iframes to 100%:
 * that previously collapsed or clipped several previews to a blank white frame.
 */
export default function HomeTemplatePreviewFrame({ children }: { children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const viewport = viewportRef.current;
    const preview = previewRef.current;
    if (!viewport || !preview) return;

    let animationFrame = 0;
    const measure = () => {
      const frameHeight = viewport.clientHeight;
      const frameWidth = viewport.clientWidth;
      const previewHeight = Math.max(preview.scrollHeight, preview.offsetHeight);
      const previewWidth = Math.max(preview.scrollWidth, preview.offsetWidth);
      if (!frameHeight || !frameWidth || !previewHeight || !previewWidth) return;
      // Slight cropping of a footer is preferable to shrinking the entire site
      // to an unreadable thumbnail. Every template remains full card width.
      const fit = Math.min(1, frameHeight / previewHeight, frameWidth / previewWidth);
      const next = Math.max(0.8, fit);
      setScale((current) => Math.abs(current - next) > 0.005 ? next : current);
    };
    const schedule = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(measure);
    };
    schedule();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", schedule);
      return () => {
        window.cancelAnimationFrame(animationFrame);
        window.removeEventListener("resize", schedule);
      };
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(viewport);
    observer.observe(preview);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div ref={viewportRef} className="orbyven-home-template-viewport relative w-full rounded-[24px] bg-[var(--surface-2)]">
      <div
        ref={previewRef}
        className="pointer-events-none absolute left-1/2 top-0 w-full origin-top select-none"
        style={{ transform: `translateX(-50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
