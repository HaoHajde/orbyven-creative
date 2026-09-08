"use client";

import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import type { SitePage } from "@/components/SiteHeader";

type Theme = "light" | "dark";

const navItems: { key: SitePage; href: string; label: string }[] = [
  { key: "home", href: "/", label: "Acasă" },
  { key: "templates", href: "/templates", label: "Templates" },
  { key: "services", href: "/servicii", label: "Servicii" },
  { key: "contact", href: "/contact", label: "Contact" },
];

const legalLinks = [
  ["/legal/terms", "Termeni"],
  ["/legal/privacy", "Confidențialitate"],
  ["/legal/cookies", "Cookies"],
] as const;

export default function SiteFooter({ theme, activePage }: { theme: Theme; activePage: SitePage }) {
  return (
    <footer className="px-5 pb-6 sm:px-6 md:px-10 md:pb-8">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[34px] bg-[var(--button)] px-6 py-8 text-[var(--button-text)] sm:px-8 md:px-12 md:py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <BrandLogo theme={theme === "dark" ? "light" : "dark"} />

          <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                aria-current={activePage === item.key ? "page" : undefined}
                className={activePage === item.key ? "opacity-100" : "opacity-55 transition hover:opacity-100"}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-current/15 pt-6 text-[10px] uppercase tracking-[0.14em] opacity-40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>© 2026 ORBYVEN</span>
            {legalLinks.map(([href, label]) => (
              <Link key={href} href={href} className="transition hover:opacity-100">
                {label}
              </Link>
            ))}
          </div>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="self-start sm:self-auto">
            Sus ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
