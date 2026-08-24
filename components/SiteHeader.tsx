"use client";

import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export type SitePage =
  | "home"
  | "templates"
  | "services"
  | "contact";

type Theme = "light" | "dark";

const easeOut = [0.16, 1, 0.3, 1] as [
  number,
  number,
  number,
  number,
];

const navItems: {
  key: SitePage;
  href: string;
  label: string;
}[] = [
  {
    key: "home",
    href: "/",
    label: "Acasă",
  },
  {
    key: "templates",
    href: "/templates",
    label: "Templates",
  },
  {
    key: "services",
    href: "/servicii",
    label: "Servicii",
  },
  {
    key: "contact",
    href: "/contact",
    label: "Contact",
  },
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
  const [mobileOpen, setMobileOpen] =
    useState(false);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[100]">
      <div className="mx-auto max-w-[1500px] px-4 pt-4 sm:px-6 md:px-10">
        <motion.div
          animate={{
            height: compact ? 56 : 68,
            borderRadius: compact ? 22 : 999,
          }}
          transition={{
            duration: 0.34,
            ease: easeOut,
          }}
          style={{
            backgroundColor: "var(--bg)",
          }}
          className="pointer-events-auto flex w-full items-center justify-between border border-[var(--border-strong)] px-4 shadow-[0_14px_50px_rgba(0,0,0,0.12)] md:px-6"
        >
          <motion.div
            animate={{
              scale: compact ? 0.9 : 1,
            }}
            transition={{
              duration: 0.3,
              ease: easeOut,
            }}
            className="origin-left"
          >
            <BrandLogo
              compact
              theme={theme}
            />
          </motion.div>

          <nav className="hidden items-center gap-8 text-[13px] font-medium text-[var(--muted)] md:flex">
            {navItems.map((item) => {
              const active =
                activePage === item.key;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  className={`flex items-center gap-2 transition ${
                    active
                      ? "text-[var(--text)]"
                      : "hover:text-[var(--text)]"
                  }`}
                >
                  {active && (
                    <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
                  )}

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
              title={
                theme === "dark"
                  ? "Light mode"
                  : "Dark mode"
              }
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text)] transition hover:scale-[1.04]"
            >
              {theme === "dark" ? (
                <SunIcon />
              ) : (
                <MoonIcon />
              )}
            </button>

            <Link
              href="/contact"
              className="hidden h-10 items-center justify-center rounded-full bg-[var(--button)] px-5 text-[13px] font-medium text-[var(--button-text)] transition hover:scale-[1.02] sm:inline-flex"
            >
              Începe un proiect
            </Link>

            <button
              type="button"
              onClick={() =>
                setMobileOpen(
                  (current) => !current
                )
              }
              aria-expanded={mobileOpen}
              aria-label={
                mobileOpen
                  ? "Închide meniul"
                  : "Deschide meniul"
              }
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text)] md:hidden"
            >
              <span className="relative block h-4 w-4">
                <motion.span
                  animate={
                    mobileOpen
                      ? {
                          rotate: 45,
                          y: 5.5,
                        }
                      : {
                          rotate: 0,
                          y: 0,
                        }
                  }
                  className="absolute left-0 top-0 h-px w-4 bg-current"
                />
                <motion.span
                  animate={{
                    opacity: mobileOpen
                      ? 0
                      : 1,
                  }}
                  className="absolute left-0 top-[7px] h-px w-4 bg-current"
                />
                <motion.span
                  animate={
                    mobileOpen
                      ? {
                          rotate: -45,
                          y: -5.5,
                        }
                      : {
                          rotate: 0,
                          y: 0,
                        }
                  }
                  className="absolute bottom-0 left-0 h-px w-4 bg-current"
                />
              </span>
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{
                opacity: 0,
                y: -10,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -8,
                scale: 0.98,
              }}
              transition={{
                duration: 0.24,
                ease: easeOut,
              }}
              style={{
                backgroundColor: "var(--bg)",
              }}
              className="pointer-events-auto mt-2 overflow-hidden rounded-[26px] border border-[var(--border-strong)] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.16)] md:hidden"
            >
              <nav className="flex flex-col">
                {navItems.map((item) => {
                  const active =
                    activePage === item.key;

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      aria-current={
                        active
                          ? "page"
                          : undefined
                      }
                      onClick={() =>
                        setMobileOpen(false)
                      }
                      className={`flex min-h-12 items-center justify-between rounded-[18px] px-4 text-[14px] font-medium transition ${
                        active
                          ? "bg-[var(--surface)] text-[var(--text)]"
                          : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                        )}

                        {item.label}
                      </span>

                      <span className="text-[var(--muted-2)]">
                        ↗
                      </span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-2 border-t border-[var(--border)] px-2 pt-2">
                <Link
                  href="/contact"
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  className="flex h-12 items-center justify-center rounded-[18px] bg-[var(--button)] px-5 text-[13px] font-medium text-[var(--button-text)] transition active:scale-[0.99]"
                >
                  Începe un proiect
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
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
    >
      <circle
        cx="12"
        cy="12"
        r="4"
      />
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
