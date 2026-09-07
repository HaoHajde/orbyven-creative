import Link from "next/link";
import type { ReactNode } from "react";

import { legalConfig, operatorLabel } from "@/lib/legal-config";

type LegalDocumentProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
};

const legalLinks = [
  ["/legal/terms", "Termeni"],
  ["/legal/subscriptions", "Abonamente"],
  ["/legal/privacy", "Confidențialitate"],
  ["/legal/cookies", "Cookies"],
  ["/legal/dpa", "DPA"],
  ["/legal/acceptable-use", "Utilizare acceptabilă"],
] as const;

export default function LegalDocument({
  eyebrow,
  title,
  intro,
  children,
}: LegalDocumentProps) {
  return (
    <main className="min-h-screen bg-white text-[#1d1d1f] dark:bg-[#09090a] dark:text-[#f5f5f7]">
      <header className="border-b border-black/[0.08] dark:border-white/[0.1]">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6 px-6 py-6 md:px-10">
          <Link href="/" className="text-sm font-semibold tracking-[0.16em]">
            ORBYVEN
          </Link>
          <Link
            href="/legal"
            className="text-xs font-medium text-[#6e6e73] transition hover:text-current dark:text-[#a1a1a6]"
          >
            Centrul juridic
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-6 py-14 md:px-10 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-20">
          <article className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6e6e73] dark:text-[#a1a1a6]">
              {eyebrow}
            </p>
            <h1 className="mt-5 max-w-4xl text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[58px] md:text-[68px]">
              {title}
            </h1>
            <p className="mt-7 max-w-3xl text-[16px] leading-7 text-[#6e6e73] dark:text-[#a1a1a6]">
              {intro}
            </p>

            {!legalConfig.isComplete && (
              <div className="mt-8 rounded-[22px] border border-amber-500/20 bg-amber-500/[0.08] px-5 py-4 text-sm leading-6">
                Document de pre-lansare. Datele juridice ale operatorului și tratamentul TVA trebuie completate înainte de activarea plăților comerciale. Sistemul de billing este blocat automat până atunci.
              </div>
            )}

            <div className="legal-copy mt-12 space-y-10 text-[15px] leading-7 text-[#3a3a3c] dark:text-[#d2d2d7]">
              {children}
            </div>
          </article>

          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-[24px] border border-black/[0.08] bg-[#f5f5f7] p-5 dark:border-white/[0.1] dark:bg-[#111113]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
                Documente
              </p>
              <nav className="mt-4 flex flex-col gap-2.5 text-sm">
                {legalLinks.map(([href, label]) => (
                  <Link key={href} href={href} className="transition hover:opacity-60">
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="mt-4 rounded-[24px] border border-black/[0.08] p-5 text-xs leading-5 text-[#6e6e73] dark:border-white/[0.1] dark:text-[#a1a1a6]">
              <p className="font-semibold text-current">{operatorLabel()}</p>
              {legalConfig.taxId && <p className="mt-2">CUI/CIF: {legalConfig.taxId}</p>}
              {legalConfig.registrationNumber && (
                <p>Registrul Comerțului: {legalConfig.registrationNumber}</p>
              )}
              {legalConfig.registeredOffice && <p>{legalConfig.registeredOffice}</p>}
              <p className="mt-2">{legalConfig.contactEmail}</p>
              <p className="mt-4">Versiune: {legalConfig.documentVersion}</p>
              <p>Actualizat: {legalConfig.lastUpdated}</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[#1d1d1f] dark:text-[#f5f5f7]">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
