import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import LanguageSwitch from "@/components/LanguageSwitch";

const primaryNav = [
  { href: "/solutii", label: "Solutions" },
  { href: "/studii-de-caz", label: "Case studies" },
  { href: "/ghid", label: "Guide" },
  { href: "/templates", label: "Templates" },
];

const footerLinks = [
  { href: "/servicii", label: "Digital services" },
  { href: "/studii-de-caz", label: "Case studies" },
  { href: "/ghid", label: "Web design guide" },
  { href: "/creare-site", label: "Website development" },
  { href: "/site-prezentare", label: "Business websites" },
  { href: "/web-design-bucuresti", label: "Web design Bucharest" },
  { href: "/redesign-site", label: "Website redesign" },
  { href: "/invitatii-nunta", label: "Digital wedding invitations" },
  { href: "/invitatii-botez", label: "Digital christening invitations" },
  { href: "/invitatii-majorat", label: "Digital event invitations" },
  { href: "/despre", label: "About ORBYVEN" },
  { href: "/contact", label: "Contact" },
];

export default function SeoShellEn({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-white text-[#161618]">
      <header className="border-b border-black/[.07] bg-white/95">
        <div className="mx-auto flex min-h-[76px] max-w-[1380px] items-center justify-between gap-5 px-5 sm:px-7 md:px-10">
          <Link href="/" aria-label="ORBYVEN — Home" className="flex items-center gap-3">
            <Image
              src="/branding/orbyven-logo-light.png"
              alt="ORBYVEN CREATIVE"
              width={52}
              height={52}
              priority
              className="h-11 w-11 object-contain"
            />
            <span className="hidden sm:block">
              <span className="block text-[13px] font-semibold tracking-[.18em]">ORBYVEN</span>
              <span className="mt-1 block text-[8px] font-semibold tracking-[.26em] text-[#4b46ee]">CREATIVE</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-[12px] font-medium text-black/55 lg:flex">
            {primaryNav.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-black">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/contact"
              className="hidden h-10 items-center rounded-full bg-[#171719] px-5 text-[12px] font-semibold text-white sm:inline-flex"
            >
              Start a project
            </Link>
            <LanguageSwitch variant="light" />
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-black/[.07] bg-[#f6f6f8]">
        <div className="mx-auto max-w-[1380px] px-5 py-12 sm:px-7 md:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-black/38">ORBYVEN CREATIVE</p>
              <p className="mt-4 max-w-lg text-[28px] font-semibold leading-[1.03] tracking-[-.045em]">
                Your public website and business workspace can be part of the same system.
              </p>
            </div>
            <nav className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-black/55 sm:grid-cols-3">
              {footerLinks.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-black">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-black/[.07] pt-6 text-[10px] uppercase tracking-[.14em] text-black/35 sm:flex-row sm:justify-between">
            <span>© 2026 ORBYVEN</span>
            <div className="flex gap-4">
              <Link href="/legal/privacy">Privacy</Link>
              <Link href="/legal/terms">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
