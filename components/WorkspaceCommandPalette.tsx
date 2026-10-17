"use client";

import type { OrbyvenModuleId } from "@/lib/orbyven-modules";
import {
  buildWorkspaceCommandPaletteItems,
  filterWorkspaceCommandPaletteItems,
  type WorkspaceCommandPaletteItem,
  type WorkspaceCommandRole,
} from "@/lib/workspace-command-palette";
import type { WorkspaceUiLanguage } from "@/lib/workspace-i18n";
import type { WorkspaceOpenOptions } from "@/lib/workspace-navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Props = {
  enabledModules: readonly OrbyvenModuleId[];
  role: WorkspaceCommandRole;
  language: WorkspaceUiLanguage;
  onOpenModule: (id: OrbyvenModuleId, options?: WorkspaceOpenOptions) => void;
  className?: string;
};

export default function WorkspaceCommandPalette({
  enabledModules,
  role,
  language,
  onOpenModule,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const items = useMemo(
    () => buildWorkspaceCommandPaletteItems({ enabledModules, role, language }),
    [enabledModules, role, language],
  );
  const visibleItems = useMemo(
    () => filterWorkspaceCommandPaletteItems(items, query),
    [items, query],
  );
  const safeActiveIndex = visibleItems.length
    ? Math.min(activeIndex, visibleItems.length - 1)
    : 0;

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    window.setTimeout(() => restoreFocusRef.current?.focus(), 0);
  }, []);

  const openPalette = useCallback(() => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    setOpen(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) close();
        else openPalette();
        return;
      }

      if (open && event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open, openPalette]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const execute = (item: WorkspaceCommandPaletteItem) => {
    close();
    onOpenModule(item.moduleId, item.kind === "create" ? { create: true } : undefined);
  };

  const copy = language === "en"
    ? {
        trigger: "Commands",
        title: "Quick actions",
        subtitle: "Open a module or start something new.",
        placeholder: "Search commands...",
        empty: "No command matches this search.",
        create: "Create",
        navigate: "Open",
        hint: "↑↓ navigate · Enter open · Esc close",
        close: "Close command palette",
      }
    : {
        trigger: "Comenzi",
        title: "Acțiuni rapide",
        subtitle: "Deschide un modul sau pornește ceva nou.",
        placeholder: "Caută o comandă...",
        empty: "Nicio comandă nu corespunde căutării.",
        create: "Creează",
        navigate: "Deschide",
        hint: "↑↓ navigare · Enter deschide · Esc închide",
        close: "Închide paleta de comenzi",
      };

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openPalette}
        className={`inline-flex h-10 items-center gap-2 rounded-[11px] border border-[var(--border-strong)] bg-[var(--surface-2)]/75 px-3 text-[11px] font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)] ${className}`}
      >
        <span>{copy.trigger}</span>
        <kbd className="rounded-md border border-[var(--border)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--muted-2)]">Ctrl K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-start justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(4rem,env(safe-area-inset-top))] sm:items-center sm:px-6 sm:pt-6"
          role="presentation"
        >
          <button
            type="button"
            aria-label={copy.close}
            onClick={close}
            className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="workspace-command-palette-title"
            className="relative z-10 flex max-h-[min(680px,calc(100dvh-6rem))] w-full max-w-[680px] flex-col overflow-hidden rounded-[22px] border border-[var(--border-strong)] bg-[var(--surface)] shadow-[0_34px_100px_rgba(0,0,0,0.48)]"
          >
            <div className="border-b border-[var(--border)] px-4 pb-4 pt-5 sm:px-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">ORBYVEN</p>
                  <h2 id="workspace-command-palette-title" className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[var(--text)]">{copy.title}</h2>
                  <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">{copy.subtitle}</p>
                </div>
                <button type="button" onClick={close} aria-label={copy.close} className="h-9 w-9 shrink-0 rounded-full border border-[var(--border)] text-lg text-[var(--muted)] transition hover:text-[var(--text)]">×</button>
              </div>

              <label className="mt-4 flex h-12 items-center gap-3 rounded-[13px] border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 focus-within:border-[var(--accent)]">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-[var(--muted)]"><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 4.4 4.4" /></svg>
                <span className="sr-only">{copy.placeholder}</span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setActiveIndex((current) => visibleItems.length ? (current + 1) % visibleItems.length : 0);
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setActiveIndex((current) => visibleItems.length ? (current - 1 + visibleItems.length) % visibleItems.length : 0);
                    } else if (event.key === "Enter" && visibleItems[safeActiveIndex]) {
                      event.preventDefault();
                      execute(visibleItems[safeActiveIndex]);
                    }
                  }}
                  autoComplete="off"
                  placeholder={copy.placeholder}
                  className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted-2)]"
                />
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
              {visibleItems.length ? visibleItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onClick={() => execute(item)}
                  className={`flex w-full items-center justify-between gap-4 rounded-[13px] px-3 py-3 text-left transition sm:px-4 ${index === safeActiveIndex ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--surface-2)]"}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-[var(--text)]">{item.label}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-[var(--muted)]">{item.description}</span>
                  </span>
                  <span className="shrink-0 rounded-full border border-[var(--border)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-2)]">
                    {item.kind === "create" ? copy.create : copy.navigate}
                  </span>
                </button>
              )) : (
                <p className="px-4 py-10 text-center text-xs text-[var(--muted)]">{copy.empty}</p>
              )}
            </div>

            <div className="border-t border-[var(--border)] px-4 py-3 text-[9px] text-[var(--muted-2)] sm:px-5">
              {copy.hint}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
