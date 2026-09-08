"use client";

import { useEffect, useRef, useState } from "react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      setVisible(window.scrollY > 520);
      frame.current = null;
    };

    const onScroll = () => {
      if (frame.current !== null) return;
      frame.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Înapoi sus"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[90] flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg)] text-lg shadow-[0_14px_38px_rgba(0,0,0,0.14)] active:scale-[0.96] md:right-6"
    >
      ↑
    </button>
  );
}
