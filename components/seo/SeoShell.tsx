import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const primaryNav = [
  { href: "/solutii", label: "Soluții" },
  { href: "/studii-de-caz", label: "Studii de caz" },
  { href: "/ghid", label: "Ghid" },
  { href: "/templates", label: "Templates" },
];

const footerLinks = [
  { href: "/creare-site", label: "Creare site" },
  { href: "/site-prezentare", label: "Site de prezentare" },
  { href: "/web-design-bucuresti", label: "Web design București" },
  { href: "/redesign-site", label: "Redesign site" },
  { href: "/despre", label: "Despre ORBYVEN" },
  { href: "/contact", label: "Contact" },
];

export default function SeoShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-white text-[#161618]">
      <header className="border-b border-black/[.07] bg-white/95">
        <div className="mx-auto flex min-h-[76px] max-w-[1380px] items-center justify-between gap-6 px-5 sm:px-7 md:px-10">
          <Link href="/" aria-label="ORBYVEN — Acasă" className="flex items-center gap-3">
            <Image
              src="/branding/orbyven-logo-light.png"
              alt=""
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

          <Link
            href="/cerere"
            className="inline-flex h-10 items-center rounded-full bg-[#171719] px-5 text-[12px] font-semibold text-white"
          >
            Începe un proiect
          </Link>
        </div>
      </header>

      {children}

      <footer className="border-t border-black/[.07] bg-[#f6f6f8]">
        <div className="mx-auto max-w-[1380px] px-5 py-12 sm:px-7 md:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-black/38">ORBYVEN CREATIVE</p>
              <p className="mt-4 max-w-lg text-[28px] font-semibold leading-[1.03] tracking-[-.045em]">
                Site-ul public și workspace-ul pot face parte din același sistem.
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
              <Link href="/legal/privacy">Confidențialitate</Link>
              <Link href="/legal/terms">Termeni</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
