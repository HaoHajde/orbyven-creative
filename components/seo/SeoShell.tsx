import Image from "next/image";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Link from "next/link";
import type { ReactNode } from "react";

const navByLocale = {
  ro: [
    { href: "/solutii", label: "Soluții" },
    { href: "/studii-de-caz", label: "Studii de caz" },
    { href: "/ghid", label: "Ghid" },
    { href: "/templates", label: "Templates" },
  ],
  en: [
    { href: "/solutii", label: "Solutions" },
    { href: "/studii-de-caz", label: "Case studies" },
    { href: "/ghid", label: "Guides" },
    { href: "/templates", label: "Templates" },
  ],
} as const;

const footerByLocale = {
  ro: [
    { href: "/servicii", label: "Servicii digitale" },
    { href: "/studii-de-caz", label: "Studii de caz" },
    { href: "/ghid", label: "Ghid web design" },
    { href: "/creare-site", label: "Creare site" },
    { href: "/site-prezentare", label: "Site de prezentare" },
    { href: "/web-design-bucuresti", label: "Web design București" },
    { href: "/redesign-site", label: "Redesign site" },
    { href: "/invitatii-nunta", label: "Invitații digitale nuntă" },
    { href: "/invitatii-botez", label: "Invitații digitale botez" },
    { href: "/invitatii-majorat", label: "Invitații digitale majorat" },
    { href: "/despre", label: "Despre ORBYVEN" },
    { href: "/contact", label: "Contact" },
  ],
  en: [
    { href: "/servicii", label: "Digital services" },
    { href: "/studii-de-caz", label: "Case studies" },
    { href: "/ghid", label: "Web design guides" },
    { href: "/creare-site", label: "Website development" },
    { href: "/site-prezentare", label: "Business websites" },
    { href: "/redesign-site", label: "Website redesign" },
    { href: "/despre", label: "About ORBYVEN" },
    { href: "/contact", label: "Contact" },
  ],
} as const;

export default function SeoShell({
  children,
  locale = "ro",
}: {
  children: ReactNode;
  locale?: "ro" | "en";
}) {
  const primaryNav = navByLocale[locale];
  const footerLinks = footerByLocale[locale];
  return (
    <main className="min-h-screen bg-white text-[#161618]">
      <header className="border-b border-black/[.07] bg-white/95">
        <div className="mx-auto flex min-h-[76px] max-w-[1380px] items-center justify-between gap-6 px-5 sm:px-7 md:px-10">
          <Link href="/" aria-label={locale === "ro" ? "ORBYVEN — Acasă" : "ORBYVEN — Home"} className="flex items-center gap-3">
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

          <nav className="hidden items-center gap-6 text-[12px] font-medium text-black/55 md:flex">
            {primaryNav.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-black">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={locale === "ro" ? "/cerere" : "/contact"}
              className="hidden h-10 items-center rounded-full bg-[#171719] px-5 text-[12px] font-semibold text-white sm:inline-flex"
            >
              {locale === "ro" ? "Începe un proiect" : "Start a project"}
            </Link>
            <LanguageSwitcher locale={locale} tone="seo" />
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
                {locale === "ro" ? "Site-ul public și workspace-ul pot face parte din același sistem." : "Your public website and workspace can be part of one connected system."}
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
              <Link href="/legal/privacy">{locale === "ro" ? "Confidențialitate" : "Privacy"}</Link>
              <Link href="/legal/terms">{locale === "ro" ? "Termeni" : "Terms"}</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
