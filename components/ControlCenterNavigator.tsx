"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type NavIcon = "home" | "integrity" | "legal" | "platform" | "command";

type NavItem = {
  href: string;
  label: string;
  hint: string;
  icon: NavIcon;
  shortcut: string;
};

const ITEMS: NavItem[] = [
  { href: "/control-center", label: "Home", hint: "Tenants", icon: "home", shortcut: "1" },
  { href: "/control-center/integrity", label: "Integrity", hint: "Audit", icon: "integrity", shortcut: "2" },
  { href: "/control-center/legal", label: "Legal", hint: "Trust", icon: "legal", shortcut: "3" },
  { href: "/control-center/platform", label: "Platform", hint: "Core", icon: "platform", shortcut: "4" },
];

function Glyph({ name }: { name: NavIcon }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "home") {
    return <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true"><path {...common} d="m4 11 8-7 8 7v8H5.5A1.5 1.5 0 0 1 4 17.5V11Z"/><path {...common} d="M9 19v-6h6v6"/></svg>;
  }
  if (name === "integrity") {
    return <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true"><path {...common} d="M12 3 5.5 6v5.2c0 4.2 2.5 7.4 6.5 9.3 4-1.9 6.5-5.1 6.5-9.3V6L12 3Z"/><path {...common} d="m9 12 2 2 4-5"/></svg>;
  }
  if (name === "legal") {
    return <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true"><path {...common} d="M12 4v16M6 7h12M8 7l-3 5h6L8 7Zm8 0-3 5h6l-3-5ZM7 20h10"/></svg>;
  }
  if (name === "platform") {
    return <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true"><rect {...common} x="4" y="4" width="6" height="6" rx="1.5"/><rect {...common} x="14" y="4" width="6" height="6" rx="1.5"/><rect {...common} x="4" y="14" width="6" height="6" rx="1.5"/><rect {...common} x="14" y="14" width="6" height="6" rx="1.5"/></svg>;
  }
  return <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true"><circle {...common} cx="10.5" cy="10.5" r="5.5"/><path {...common} d="m15 15 4.5 4.5"/></svg>;
}

export default function ControlCenterNavigator() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const hidden = pathname === "/control-center/login" || pathname.includes("/demo");

  const activeHref = useMemo(() => {
    if (pathname.startsWith("/control-center/integrity")) return "/control-center/integrity";
    if (pathname.startsWith("/control-center/legal")) return "/control-center/legal";
    if (pathname.startsWith("/control-center/platform")) return "/control-center/platform";
    return "/control-center";
  }, [pathname]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return ITEMS;
    return ITEMS.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(needle));
  }, [query]);

  useEffect(() => {
    if (hidden) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement | null;
      const typing = element?.isContentEditable || element?.tagName === "INPUT" || element?.tagName === "TEXTAREA" || element?.tagName === "SELECT";

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }

      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      if (!typing && event.altKey && /^[1-4]$/.test(event.key)) {
        event.preventDefault();
        const item = ITEMS[Number(event.key) - 1];
        if (item) router.push(item.href);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hidden, router]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    setOpen(false);
    setQuery("");
  }, [pathname]);

  if (hidden) return null;

  return (
    <>
      <nav
        aria-label="Control Center"
        className="fixed bottom-4 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-1 rounded-[22px] border border-white/[0.1] bg-[#0d0d10]/88 p-1.5 shadow-[0_20px_70px_rgba(0,0,0,.5)] backdrop-blur-2xl"
      >
        {ITEMS.map((item) => {
          const active = activeHref === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={`${item.label} · Alt+${item.shortcut}`}
              className={`group relative grid h-10 w-10 place-items-center rounded-[14px] transition ${
                active
                  ? "bg-white text-black shadow-[0_6px_20px_rgba(255,255,255,.12)]"
                  : "text-[#9a9aa1] hover:bg-white/[0.07] hover:text-white"
              }`}
            >
              <Glyph name={item.icon} />
              <span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/[0.08] bg-[#17171a] px-2 py-1 text-[10px] font-medium text-white shadow-xl group-hover:block">
                {item.label}
              </span>
            </Link>
          );
        })}

        <div className="mx-0.5 h-5 w-px bg-white/[0.09]" />

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Quick switcher"
          title="Quick switcher · Ctrl/Cmd+K"
          className="group relative grid h-10 w-10 place-items-center rounded-[14px] text-[#9a9aa1] transition hover:bg-white/[0.07] hover:text-white"
        >
          <Glyph name="command" />
          <span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/[0.08] bg-[#17171a] px-2 py-1 text-[10px] font-medium text-white shadow-xl group-hover:block">
            ⌘K
          </span>
        </button>
      </nav>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/55 px-4 pt-[14vh] backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-[26px] border border-white/[0.11] bg-[#111114] shadow-[0_30px_100px_rgba(0,0,0,.6)]">
            <div className="flex items-center gap-3 border-b border-white/[0.08] px-4">
              <Glyph name="command" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && filtered[0]) {
                    router.push(filtered[0].href);
                  }
                }}
                placeholder="Go to…"
                className="h-14 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#67676d]"
              />
              <span className="rounded-md border border-white/[0.09] px-1.5 py-1 text-[9px] text-[#77777e]">ESC</span>
            </div>

            <div className="p-2">
              {filtered.map((item) => {
                const active = activeHref === item.href;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => router.push(item.href)}
                    className="flex w-full items-center gap-3 rounded-[16px] px-3 py-3 text-left transition hover:bg-white/[0.06]"
                  >
                    <span className={`grid h-9 w-9 place-items-center rounded-[12px] ${active ? "bg-white text-black" : "bg-white/[0.04] text-[#a4a4aa]"}`}>
                      <Glyph name={item.icon} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-[#ededf0]">{item.label}</span>
                      <span className="block text-[10px] text-[#6f6f75]">{item.hint}</span>
                    </span>
                    <span className="text-[10px] text-[#606066]">⌥{item.shortcut}</span>
                  </button>
                );
              })}
              {filtered.length === 0 && <div className="px-3 py-8 text-center text-xs text-[#6f6f75]">No match</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
