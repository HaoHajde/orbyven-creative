"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";
type ActivePage = "home" | "templates" | "services" | "contact";

const navItems: {
  key: ActivePage;
  href: string;
  label: string;
}[] = [
  { key: "home", href: "/", label: "Acasă" },
  { key: "templates", href: "/templates", label: "Templates" },
  { key: "services", href: "/servicii", label: "Servicii" },
  { key: "contact", href: "/contact", label: "Contact" },
];

function applyTheme(theme: Theme) {
  const root = document.getElementById("mobile-page-root");

  if (!root) return;

  const dark = theme === "dark";

  root.style.setProperty("--bg", dark ? "#000000" : "#ffffff");
  root.style.setProperty("--surface", dark ? "#0b0b0d" : "#f5f5f7");
  root.style.setProperty("--surface-2", dark ? "#121216" : "#fbfbfd");
  root.style.setProperty("--text", dark ? "#f5f5f7" : "#1d1d1f");
  root.style.setProperty("--muted", dark ? "#a1a1a6" : "#6e6e73");
  root.style.setProperty("--muted-2", dark ? "#74747a" : "#86868b");
  root.style.setProperty(
    "--border",
    dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
  );
  root.style.setProperty(
    "--border-strong",
    dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.14)"
  );
  root.style.setProperty("--button", dark ? "#f5f5f7" : "#1d1d1f");
  root.style.setProperty("--button-text", dark ? "#000000" : "#ffffff");
  root.style.setProperty(
    "--orbit-line",
    dark ? "rgba(139,135,255,0.13)" : "rgba(75,70,238,0.15)"
  );
  root.style.setProperty(
    "--orbit-line-strong",
    dark ? "rgba(139,135,255,0.20)" : "rgba(75,70,238,0.24)"
  );
  root.style.setProperty(
    "--orbit-neutral-line",
    dark ? "rgba(255,255,255,0.08)" : "rgba(29,29,31,0.08)"
  );
  root.style.setProperty(
    "--orbit-body-neutral",
    dark ? "rgba(245,245,247,0.72)" : "rgba(29,29,31,0.62)"
  );

  document.documentElement.style.colorScheme = theme;
}

function activateReveals() {
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>("[data-mobile-reveal]")
  );

  if (!elements.length) return () => {};

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        (entry.target as HTMLElement).dataset.visible = "true";
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.08,
    }
  );

  elements.forEach((element) => observer.observe(element));

  return () => observer.disconnect();
}

export default function MobilePageChrome({
  activePage,
}: {
  activePage: ActivePage;
}) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("studio-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const initialTheme: Theme =
      saved === "light" || saved === "dark"
        ? saved
        : prefersDark
          ? "dark"
          : "light";

    setTheme(initialTheme);
    applyTheme(initialTheme);

    return activateReveals();
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";

    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem("studio-theme", next);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-[clamp(12px,4vw,16px)] pt-3">
      <div className="mx-auto flex h-14 max-w-[760px] items-center justify-between rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg)] px-3 shadow-[0_10px_28px_rgba(0,0,0,0.12)]">
        <Link
          href="/"
          aria-label="ORBYVEN CREATIVE — Acasă"
          className="flex h-10 items-center gap-2"
        >
          <img
            src={
              theme === "dark"
                ? "/branding/orbyven-logo-light.png"
                : "/branding/orbyven-logo-dark.png"
            }
            alt=""
            width="40"
            height="40"
            decoding="async"
            className="h-9 w-9 object-contain"
          />

          <span className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)] min-[370px]:block">
            ORBYVEN
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Schimbă tema"
            className="mobile-press flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)] text-sm"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Închide meniul" : "Deschide meniul"}
            className="mobile-press flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)]"
          >
            <span className="text-[17px] leading-none">
              {menuOpen ? "×" : "≡"}
            </span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mx-auto mt-2 max-w-[760px] overflow-hidden rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg)] p-2 shadow-[0_14px_36px_rgba(0,0,0,0.16)]">
          {navItems.map((item) => {
            const active = activePage === item.key;

            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`mobile-press flex min-h-12 items-center justify-between rounded-[16px] px-4 text-sm ${
                  active
                    ? "bg-[var(--surface)] text-[var(--text)]"
                    : "text-[var(--muted)]"
                }`}
              >
                <span className="flex items-center gap-3">
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4b46ee]" />
                  )}

                  {item.label}
                </span>

                <span className="text-[var(--muted-2)]">↗</span>
              </Link>
            );
          })}

          <div className="mt-2 border-t border-[var(--border)] pt-2">
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="mobile-press flex h-12 items-center justify-center rounded-[16px] bg-[var(--button)] text-sm font-semibold text-[var(--button-text)]"
            >
              Începe un proiect
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
