"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export default function RouteScrollManager() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const onPopState = () => {
      window.requestAnimationFrame(() => {
        scrollToTop();
        window.setTimeout(scrollToTop, 0);
      });
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      window.requestAnimationFrame(scrollToTop);
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;

    const frame = window.requestAnimationFrame(() => {
      scrollToTop();
      window.setTimeout(scrollToTop, 0);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
