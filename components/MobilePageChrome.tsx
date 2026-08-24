"use client";

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
  root.style.setProperty("--surface", dark ? "#0c0c0e" : "#f5f5f7");
  root.style.setProperty("--surface-2", dark ? "#151518" : "#fbfbfd");
  root.style.setProperty("--text", dark ? "#f5f5f7" : "#1d1d1f");
  root.style.setProperty("--muted", dark ? "#a1a1a6" : "#6e6e73");
  root.style.setProperty("--muted-2", dark ? "#77777d" : "#86868b");
  root.style.setProperty(
    "--border",
    dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)"
  );
  root.style.setProperty(
    "--border-strong",
    dark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.14)"
  );
  root.style.setProperty("--button", dark ? "#f5f5f7" : "#1d1d1f");
  root.style.setProperty("--button-text", dark ? "#000000" : "#ffffff");

  document.documentElement.style.colorScheme = theme;
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
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";

    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem("studio-theme", next);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3">
      <div className="mx-auto flex h-14 max-w-[760px] items-center justify-between rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg)] px-3 shadow-[0_8px_28px_rgba(0,0,0,0.10)]">
        <a
          href="/"
          aria-label="ORBYVEN CREATIVE — Acasă"
          className="flex h-10 w-12 items-center justify-center"
        >
          <img
            src={
              theme === "dark"
                ? "/branding/orbyven-logo-light.png"
                : "/branding/orbyven-logo-dark.png"
            }
            alt=""
            width="44"
            height="44"
            decoding="async"
            className="h-10 w-10 object-contain"
          />
        </a>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Schimbă tema"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)] text-sm"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Închide meniul" : "Deschide meniul"}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)]"
          >
            <span className="text-[17px] leading-none">
              {menuOpen ? "×" : "≡"}
            </span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mx-auto mt-2 max-w-[760px] rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg)] p-2 shadow-[0_12px_35px_rgba(0,0,0,0.12)]">
          {navItems.map((item) => {
            const active = activePage === item.key;

            return (
              <a
                key={item.key}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex min-h-12 items-center justify-between rounded-[16px] px-4 text-sm ${
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
                <span>↗</span>
              </a>
            );
          })}

          <a
            href="/contact"
            onClick={() => setMenuOpen(false)}
            className="mt-2 flex h-12 items-center justify-center rounded-[16px] bg-[var(--button)] text-sm font-medium text-[var(--button-text)]"
          >
            Începe un proiect
          </a>
        </div>
      )}
    </header>
  );
}
