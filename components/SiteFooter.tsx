"use client";

import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import type { SitePage } from "@/components/SiteHeader";

type Theme = "light" | "dark";

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

export default function SiteFooter({
  theme,
  activePage,
}: {
  theme: Theme;
  activePage: SitePage;
}) {
  return (
    <footer className="px-6 pb-8 md:px-10">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-b-[42px] bg-[var(--button)] px-7 pb-9 text-[var(--button-text)] sm:px-10 md:px-14 lg:px-16">
        <div className="grid gap-12 border-t border-current/15 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr] md:py-12">
          <div>
            <BrandLogo
              theme={
                theme === "dark"
                  ? "light"
                  : "dark"
              }
            />

            <p className="mt-5 max-w-sm text-sm leading-6 opacity-50">
              Websites, digital experiences și produse construite pentru o prezență care rămâne în minte.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-35">
              Navigate
            </p>

            <div className="mt-5 flex flex-col items-start gap-3 text-sm">
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
                    className={`flex items-center gap-2 transition hover:translate-x-1 ${
                      active
                        ? "opacity-100"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    {active && (
                      <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
                    )}

                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-35">
              Studio
            </p>

            <div className="mt-5 space-y-3 text-sm opacity-60">
              <p>Web design</p>
              <p>Digital experiences</p>
              <p>Creative development</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-current/15 pt-7 text-[10px] uppercase tracking-[0.16em] opacity-35 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2026 ORBYVEN CREATIVE
          </p>

          <button
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="group flex items-center gap-2 self-start transition hover:opacity-100 sm:self-auto"
          >
            Back to top

            <span className="transition-transform duration-300 group-hover:-translate-y-1">
              ↑
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
