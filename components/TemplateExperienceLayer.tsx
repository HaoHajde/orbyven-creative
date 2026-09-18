"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type QuickLink = {
  id: string;
  label: string;
};

const EXCLUDED_PREFIX = "/templates/haos-customs";

function cleanLabel(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return "Secțiune";
  return compact.length > 34 ? `${compact.slice(0, 34).trim()}…` : compact;
}

export default function TemplateExperienceLayer() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const frameRef = useRef<number | null>(null);

  const enabled = useMemo(() => {
    if (!pathname || pathname.startsWith(EXCLUDED_PREFIX)) return false;
    return pathname.startsWith("/templates/") || pathname.startsWith("/demo/nunta/");
  }, [pathname]);

  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;
    root.dataset.orbyvenTemplateExperience = "on";

    const rootTemplate =
      /^\/templates\/[^/]+\/?$/.test(pathname) ||
      /^\/demo\/nunta\/[^/]+\/?$/.test(pathname);
    if (rootTemplate) root.dataset.orbyvenTemplateRoot = "on";

    const discover = window.requestAnimationFrame(() => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>("main section"));
      const cards = Array.from(document.querySelectorAll<HTMLElement>("main article")).slice(0, 36);
      const revealTargets = [...sections, ...cards];

      revealTargets.forEach((element, index) => {
        element.classList.add("orbyven-reveal-target");
        element.style.setProperty("--orbyven-reveal-delay", `${Math.min(index % 6, 5) * 38}ms`);
      });

      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              (entry.target as HTMLElement).classList.add("orbyven-visible");
              observer.unobserve(entry.target);
            });
          },
          { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
        );

        revealTargets.forEach((element) => observer.observe(element));
        (window as Window & { __orbyvenTemplateObserver?: IntersectionObserver }).__orbyvenTemplateObserver = observer;
      } else {
        revealTargets.forEach((element) => element.classList.add("orbyven-visible"));
      }

      const discovered = sections
        .filter((section) => section.id)
        .map((section) => {
          const heading = section.querySelector<HTMLElement>("h1, h2, [data-orbyven-label]");
          return {
            id: section.id,
            label: cleanLabel(heading?.innerText || section.id.replace(/[-_]/g, " ")),
          };
        })
        .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index);

      const found = discovered.some((item) => item.id === "acasa")
        ? discovered.slice(0, 6)
        : [{ id: "__top", label: "Acasă" }, ...discovered].slice(0, 6);

      window.requestAnimationFrame(() => setQuickLinks(found));
    });

    const updateProgress = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        setProgress(Math.min(Math.max(window.scrollY / scrollable, 0), 1));
      });
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });

    return () => {
      window.cancelAnimationFrame(discover);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);

      const observer = (window as Window & { __orbyvenTemplateObserver?: IntersectionObserver }).__orbyvenTemplateObserver;
      observer?.disconnect();
      delete (window as Window & { __orbyvenTemplateObserver?: IntersectionObserver }).__orbyvenTemplateObserver;

      delete root.dataset.orbyvenTemplateExperience;
      delete root.dataset.orbyvenTemplateRoot;
    };
  }, [enabled, pathname]);

  if (!enabled) return null;

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/templates");
  };

  const jumpTo = (id: string) => {
    if (id === "__top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMenuOpen(false);
  };

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-[2px] bg-black/5">
        <span
          className="block h-full origin-left bg-white/90 shadow-[0_0_18px_rgba(0,0,0,.24)] mix-blend-difference"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      <button
        type="button"
        onClick={goBack}
        className="fixed left-3 top-3 z-[121] inline-flex h-11 items-center gap-2 rounded-full border border-black/10 bg-white/88 px-4 text-[11px] font-semibold text-[#111] shadow-[0_10px_35px_rgba(0,0,0,.12)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:bg-white active:translate-y-0 sm:left-4 sm:top-4"
        aria-label="Înapoi"
      >
        <span aria-hidden="true">←</span>
        <span>Reverse</span>
      </button>

      {quickLinks.length > 1 ? (
        <div className="fixed bottom-4 right-4 z-[121] flex flex-col items-end gap-2 sm:bottom-5 sm:right-5">
          {menuOpen ? (
            <div className="w-[min(320px,calc(100vw-32px))] rounded-[22px] border border-black/10 bg-white/92 p-2 shadow-[0_18px_55px_rgba(0,0,0,.16)] backdrop-blur-2xl">
              <div className="flex items-center justify-between px-3 pb-2 pt-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-black/38">Mergi direct la</span>
                <button type="button" onClick={() => setMenuOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-black/[0.05] text-sm text-black/55" aria-label="Închide meniul">×</button>
              </div>
              <div className="grid gap-1">
                {quickLinks.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => jumpTo(item.id)}
                    className="flex items-center justify-between rounded-[14px] px-3 py-3 text-left text-[12px] font-semibold text-black/72 transition hover:bg-black/[0.055] hover:text-black"
                  >
                    <span>{item.label}</span>
                    <span className="text-[9px] text-black/30">0{index + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-black/10 bg-white/88 px-4 text-[11px] font-semibold text-[#111] shadow-[0_10px_35px_rgba(0,0,0,.12)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
            aria-expanded={menuOpen}
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-black text-[9px] text-white">⌘</span>
            <span>Meniu</span>
          </button>
        </div>
      ) : null}

      <style jsx global>{`
        html[data-orbyven-template-experience="on"] {
          scroll-behavior: smooth;
        }

        html[data-orbyven-template-experience="on"] main section[id] {
          scroll-margin-top: 86px;
        }

        html[data-orbyven-template-root="on"] main > section:first-of-type {
          min-height: min(92svh, 980px);
        }

        html[data-orbyven-template-experience="on"] .orbyven-reveal-target {
          transition:
            opacity 620ms cubic-bezier(.16, 1, .3, 1) var(--orbyven-reveal-delay, 0ms),
            transform 720ms cubic-bezier(.16, 1, .3, 1) var(--orbyven-reveal-delay, 0ms),
            filter 720ms cubic-bezier(.16, 1, .3, 1) var(--orbyven-reveal-delay, 0ms);
        }

        html[data-orbyven-template-experience="on"] .orbyven-reveal-target:not(.orbyven-visible) {
          opacity: 0;
          transform: translate3d(0, 24px, 0) scale(.992);
          filter: saturate(.92);
        }

        html[data-orbyven-template-experience="on"] .orbyven-reveal-target.orbyven-visible {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
          filter: saturate(1);
        }

        html[data-orbyven-template-experience="on"] main a,
        html[data-orbyven-template-experience="on"] main button {
          -webkit-tap-highlight-color: transparent;
        }

        html[data-orbyven-template-experience="on"] main article {
          transform-origin: 50% 65%;
        }

        @media (max-width: 767px) {
          html[data-orbyven-template-experience="on"] .orbyven-reveal-target:not(.orbyven-visible) {
            transform: translate3d(0, 14px, 0) scale(.996);
          }

          html[data-orbyven-template-root="on"] main > section:first-of-type {
            min-height: 88svh;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          html[data-orbyven-template-experience="on"] {
            scroll-behavior: auto;
          }

          html[data-orbyven-template-experience="on"] .orbyven-reveal-target,
          html[data-orbyven-template-experience="on"] .orbyven-reveal-target:not(.orbyven-visible) {
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}
