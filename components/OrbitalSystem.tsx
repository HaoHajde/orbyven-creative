"use client";

import { useEffect, useRef } from "react";

type OrbitalSystemProps = {
  variant?: "hero" | "accent";
  className?: string;
};

export default function OrbitalSystem({
  variant = "accent",
  className = "",
}: OrbitalSystemProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let inView = false;
    const sync = () => {
      host.dataset.animating = String(inView && !document.hidden);
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    observer.observe(host);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const rings =
    variant === "hero"
      ? ["01", "02", "03", "04", "05", "06"]
      : ["02", "04", "06"];

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={`orbyven-orbit-system orbyven-orbit-system--${variant} ${className}`}
    >
      <div className="orbyven-orbit-core" />

      {rings.map((ring) => (
        <span
          key={ring}
          className={`orbyven-orbit-ring orbyven-orbit-ring--${ring}`}
        />
      ))}

      <span className="orbyven-orbit-track orbyven-orbit-track--one">
        <span className="orbyven-orbit-body orbyven-orbit-body--star">✦</span>
      </span>

      <span className="orbyven-orbit-track orbyven-orbit-track--two">
        <span className="orbyven-orbit-body orbyven-orbit-body--violet" />
      </span>

      {variant === "hero" && (
        <>
          <span className="orbyven-orbit-track orbyven-orbit-track--three">
            <span className="orbyven-orbit-body orbyven-orbit-body--small" />
          </span>

          <span className="orbyven-orbit-track orbyven-orbit-track--four">
            <span className="orbyven-orbit-body orbyven-orbit-body--ring">
              <span />
            </span>
          </span>
        </>
      )}
    </div>
  );
}
