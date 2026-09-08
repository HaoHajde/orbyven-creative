"use client";

import { useState } from "react";

export type WarpItem = {
  id: string;
  label: string;
  number: string;
};

export default function WarpMenu({ items, activeSection }: { items: WarpItem[]; activeSection: string | null }) {
  const [open, setOpen] = useState(false);
  const activeItem = items.find((item) => item.id === activeSection) ?? null;

  const goTo = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    setOpen(false);
    window.history.replaceState(null, "", `${window.location.pathname}#${id}`);
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const backToTop = () => {
    setOpen(false);
    window.history.replaceState(null, "", window.location.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {activeItem ? (
        <div className="pointer-events-none fixed left-1/2 top-[92px] z-[70] max-w-[calc(100vw-32px)] -translate-x-1/2 md:top-[96px]">
          <div style={{ backgroundColor: "var(--bg)" }} className="flex max-w-full items-center gap-2.5 rounded-full border border-[var(--border)] px-3 py-2 shadow-[0_10px_35px_rgba(0,0,0,0.07)] sm:gap-3 sm:px-4">
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-2)]">WARP</span>
            <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
            <span className="text-[10px] font-semibold tracking-[0.14em] text-[var(--muted-2)]">{activeItem.number}</span>
            <span className="truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text)] sm:text-[10px]">{activeItem.label}</span>
          </div>
        </div>
      ) : null}

      <div
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-[90] md:bottom-auto md:left-5 md:top-1/2 md:-translate-y-1/2"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div
          style={{ width: open ? 236 : 64, backgroundColor: "var(--bg)" }}
          className="max-w-[calc(100vw-32px)] overflow-hidden rounded-[22px] border border-[var(--border-strong)] shadow-[0_18px_60px_rgba(0,0,0,0.14)] transition-[width] duration-300 md:rounded-[24px]"
        >
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-label="Deschide navigarea rapidă"
            className="flex h-[68px] w-full flex-col items-center justify-center gap-1 px-2 text-center md:h-[76px] md:gap-1.5 md:px-3"
          >
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center md:h-8 md:w-8">
              <span className="absolute h-6 w-6 rounded-full border border-[var(--text)]/20 md:h-7 md:w-7" />
              <span className="absolute h-[11px] w-[11px] rounded-full border border-[var(--accent)]" />
              <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            </span>
            <span className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--text)]">WARP</span>
          </button>

          <div className={`overflow-hidden border-t border-[var(--border)] transition-all duration-300 ${open ? "max-h-[68svh] opacity-100" : "max-h-0 border-t-0 opacity-0"}`}>
            <div className="max-h-[68svh] overflow-y-auto px-2.5 pb-3 pt-2 md:max-h-none md:overflow-visible md:px-3">
              {items.map((item) => {
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(item.id)}
                    aria-current={active ? "location" : undefined}
                    className={`group flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm transition ${active ? "bg-[var(--surface)] text-[var(--text)]" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"}`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? "bg-[var(--accent)]" : "bg-[var(--text)] opacity-20"}`} />
                    <span className="min-w-0 flex-1 whitespace-nowrap">{item.label}</span>
                    <span className="text-[9px] font-semibold tracking-[0.14em] text-[var(--muted-2)]">{item.number}</span>
                  </button>
                );
              })}

              <div className="mt-2 border-t border-[var(--border)] pt-2">
                <button type="button" onClick={backToTop} className="group flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text)]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] text-[10px]">↑</span>
                  <span className="min-w-0 flex-1 whitespace-nowrap">Înapoi sus</span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">Top</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
