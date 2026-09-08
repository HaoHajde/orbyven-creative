"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const PLAN_BY_NAME = {
  START: "start",
  BUSINESS: "business",
  PRO: "pro",
} as const;

export default function PublicCommerceLinkRouter() {
  const router = useRouter();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!anchor.closest("#pricing")) return;
      if (anchor.getAttribute("href") !== "/contact") return;

      const label = (anchor.textContent ?? "").trim().toUpperCase();
      const planMatch = label.match(/^ALEGE\s+(START|BUSINESS|PRO)$/);

      if (planMatch) {
        const planName = planMatch[1] as keyof typeof PLAN_BY_NAME;
        event.preventDefault();
        router.push(
          `/cerere?plan=${PLAN_BY_NAME[planName]}&payment=subscription&source=pricing`
        );
        return;
      }

      if (label.includes("CERE O OFERTĂ")) {
        event.preventDefault();
        router.push("/cerere?payment=full_payment&source=pricing");
      }
    };

    // Capture phase runs before Next.js' delegated Link handler. That lets us
    // preserve the selected pricing context instead of letting the legacy
    // `/contact` href win first.
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [router]);

  return null;
}
