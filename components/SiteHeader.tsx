"use client";

import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import { useState } from "react";

export type SitePage = "home" | "templates" | "services" | "contact";

type Theme = "light" | "dark";

const navItems: {
  key: SitePage;
  href: string;
  label: string;
}[] = [
  { key: "home", href: "/", label: "Acasă" },
  { key: "templates", href: "/templates", label: "Templates" },
  { key: "services", href: "/servicii", label: "Servicii" },
  { key: "contact", href: "/contact", label: "Contact" },
];

export default function SiteHeader({
  theme,
  compact,
  activePage,
  onToggleTheme,
}: {
  theme: Theme;
  compact: boolean;
  activePage: SitePage;
  onToggleTheme: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          html { scroll-behavior: auto !important; }
          a, button { touch-action: manipulation; }
          .orbyven-orbit-track {
            animation: none !important;
            will-change: auto !important;
          }
          .orbyven-orbit-system {
            display: none !important;
          }
          main [aria-hidden="true"] {
            filter: none !important;
            -webkit-filter: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          .mobile-defer {
            content-visibility: visible !important;
            contain-intrinsic-size: auto !important;
          }
        }
      `}</style>

      <header className="pointer-events-none fixed inset-x-0 top-0 z-[100]">
        <div className="mx-auto max-w-[1500px] px-4 pt-4 sm:px-6 md:px-10">
          <div
            style={{ backgroundColor: "var(--bg)" }}
            className={`pointer-events-auto flex h-[68px] w-full touch-manipulation items-center justify-between rounded-full border border-[var(--border-strong)] px-4 shadow-[0_8px_28px_rgba(0,0,0,0.10)] md:px-6 md:transition-[height,border-radius] md:duration-300 ${
              compact ? "md:h-14 md:rounded-[22px]" : "md:h-[68px] md:rounded-full"
            }`}
          >
            <div
              className={`origin-left md:transition-transform md:duration-300 ${
                compact ? "md:scale-90" : "md:scale-100"
              }`}
            >
              <BrandLogo compact theme={theme} />
            </div>

            <nav className="hidden items-center gap-8 text-[13px] font-medium text-[var(--muted)] md:flex">
              {navItems.map((item) => {
                const active = activePage === item.key;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex touch-manipulation items-center gap-2 transition-colors ${
                      active ? "text-[var(--text)]" : "hover:text-[var(--text)]"
                    }`}
                  >
                    {active && <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />}
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={
                  theme === "dark"
                    ? "Activează tema luminoasă"
                    : "Activează tema întunecată"
                }
                title={theme === "dark" ? "Light mode" : "Dark mode"}
                className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text)] active:scale-[0.96] md:transition-transform md:hover:scale-[1.04]"
              >
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              </button>

              <Link
                href="/workspace"
                className="hidden h-10 touch-manipulation items-center justify-center rounded-full border border-[var(--border-strong)] px-4 text-[13px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface)] lg:inline-flex"
              >
                Dashboard
              </Link>

              <Link
                href="/cerere"
                className="hidden h-10 touch-manipulation items-center justify-center rounded-full bg-[var(--button)] px-5 text-[13px] font-medium text-[var(--button-text)] active:scale-[0.99] md:transition-transform md:hover:scale-[1.02] sm:inline-flex"
              >
                Începe un proiect
              </Link>

              <button
                type="button"
                onClick={() => setMobileOpen((current) => !current)}
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? "Închide meniul" : "Deschide meniul"}
                className="relative flex h-10 w-10 touch-manipulation items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text)] active:scale-[0.96] md:hidden"
              >
                <span className="relative block h-4 w-4">
                  <span
                    className={`absolute left-0 top-0 h-px w-4 bg-current transition-transform duration-150 ${
                      mobileOpen ? "translate-y-[5.5px] rotate-45" : ""
                    }`}
                  />
                  <span
                    className={`absolute left-0 top-[7px] h-px w-4 bg-current transition-opacity duration-150 ${
                      mobileOpen ? "opacity-0" : "opacity-100"
                    }`}
                  />
                  <span
                    className={`absolute bottom-0 left-0 h-px w-4 bg-current transition-transform duration-150 ${
                      mobileOpen ? "-translate-y-[5.5px] -rotate-45" : ""
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div
              style={{ backgroundColor: "var(--bg)" }}
              className="pointer-events-auto mt-2 overflow-hidden rounded-[26px] border border-[var(--border-strong)] p-2 shadow-[0_12px_36px_rgba(0,0,0,0.14)] md:hidden"
            >
              <nav className="flex flex-col">
                {navItems.map((item) => {
                  const active = activePage === item.key;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={closeMobile}
                      className={`flex min-h-12 touch-manipulation items-center justify-between rounded-[18px] px-4 text-[14px] font-medium active:bg-[var(--surface)] ${
                        active
                          ? "bg-[var(--surface)] text-[var(--text)]"
                          : "text-[var(--muted)]"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                        )}
                        {item.label}
                      </span>
                      <span className="text-[var(--muted-2)]">↗</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-2 grid gap-2 border-t border-[var(--border)] px-2 pt-2">
                <Link
                  href="/workspace"
                  onClick={closeMobile}
                  className="flex h-12 touch-manipulation items-center justify-between rounded-[18px] border border-[var(--border-strong)] px-5 text-[13px] font-semibold active:bg-[var(--surface)]"
                >
                  <span>Dashboard</span>
                  <span className="text-[var(--muted-2)]">↗</span>
                </Link>

                <Link
                  href="/cerere"
                  onClick={closeMobile}
                  className="flex h-12 touch-manipulation items-center justify-center rounded-[18px] bg-[var(--button)] px-5 text-[13px] font-medium text-[var(--button-text)] active:scale-[0.99]"
                >
                  Începe un proiect
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-[17px] w-[17px]"
      aria-hidden="true"
    >
      <path d="M20.2 15.7A8.5 8.5 0 0 1 8.3 3.8 8.5 8.5 0 1 0 20.2 15.7Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-[17px] w-[17px]"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.42 1.42" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}
