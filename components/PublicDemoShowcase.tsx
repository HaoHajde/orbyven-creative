import Image from "next/image";
import Link from "next/link";

import ClientTemplatePreview from "@/components/ClientTemplatePreview";
import type { SitePage } from "@/components/SiteHeader";
import { clientTemplateCatalog } from "@/lib/client-template-catalog";

const featuredTemplateSlugs = ["instalatii", "evenimente"] as const;

export default function PublicDemoShowcase({
  activePage,
}: {
  activePage: SitePage;
}) {
  const templates = featuredTemplateSlugs.map(
    (slug) => clientTemplateCatalog[slug]
  );

  const templatesPage = activePage === "templates";

  return (
    <section className="mx-auto w-full max-w-[1500px] px-6 pb-14 pt-20 md:px-10 md:pb-20 md:pt-28">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-2)]">
            Proiecte & demo-uri
          </p>
          <h2 className="mt-5 max-w-4xl text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[58px] md:text-[68px]">
            Nu arătăm doar ce putem construi. Arătăm cum se simte.
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-7 text-[var(--muted)] lg:justify-self-end">
          Un proiect real și direcții demo construite ca site-uri complete. Datele din template-urile de business rămân fictive până la personalizarea pentru client.
        </p>
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Link
          href="/demo/nunta/diana-florin"
          className="group relative min-h-[430px] overflow-hidden rounded-[34px] border border-[var(--border)] bg-[#eee6d8]"
        >
          <Image
            src="/demo/nunta/diana-florin/couple1.jpeg"
            alt="Preview proiect Diana și Florin"
            fill
            sizes="(min-width: 1280px) 52vw, 100vw"
            className="object-cover transition duration-700 group-hover:scale-[1.025]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 text-white md:p-8">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/60">
                Proiect live · Wedding experience
              </p>
              <h3 className="mt-3 text-[38px] font-semibold tracking-[-0.055em] md:text-[48px]">
                Diana & Florin
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
                Invitație digitală completă cu poveste, countdown, locații, RSVP demo și experiență responsive.
              </p>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-xl text-black transition group-hover:rotate-45">
              ↗
            </span>
          </div>
        </Link>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          {templates.map((template) => (
            <Link
              key={template.slug}
              href={`/templates/${template.slug}`}
              className="group overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-3"
            >
              <div className="overflow-hidden rounded-[24px]">
                <ClientTemplatePreview template={template} compact />
              </div>
              <div className="flex items-end justify-between gap-4 px-3 pb-3 pt-5">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
                    {template.category}
                  </p>
                  <h3 className="mt-2 text-[25px] font-semibold tracking-[-0.045em]">
                    {template.title}
                  </h3>
                </div>
                <span className="text-xl text-[var(--accent)] transition group-hover:translate-x-1">
                  ↗
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {!templatesPage && (
        <div className="mt-7 flex justify-end">
          <Link
            href="/templates"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--border-strong)] px-5 text-sm font-medium transition hover:bg-[var(--surface)]"
          >
            Explorează toate template-urile ↗
          </Link>
        </div>
      )}
    </section>
  );
}
