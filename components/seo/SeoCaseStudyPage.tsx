import Link from "next/link";

import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import SeoShell from "@/components/seo/SeoShell";
import type { SeoCaseStudy } from "@/lib/seo-foundation";

export default function SeoCaseStudyPage({ page }: { page: SeoCaseStudy }) {
  const breadcrumbs = [
    { href: "/studii-de-caz", label: "Studii de caz" },
    { href: page.path, label: page.title },
  ];

  return (
    <SeoShell>
      <SeoJsonLd kind="case-study" page={page} breadcrumbs={breadcrumbs} />
      <section className="px-5 pb-20 pt-10 sm:px-7 md:px-10 md:pb-28 md:pt-14">
        <div className="mx-auto max-w-[1380px]">
          <Breadcrumbs items={breadcrumbs} />
          <p className="mt-12 text-[10px] font-bold uppercase tracking-[.22em] text-[#4b46ee]">{page.eyebrow}</p>
          <h1 className="mt-5 max-w-6xl text-[clamp(50px,7.7vw,104px)] font-semibold leading-[.88] tracking-[-.07em]">{page.h1}</h1>
          <div className="mt-9 flex flex-col gap-6 border-t border-black/10 pt-7 lg:flex-row lg:items-start lg:justify-between">
            <p className="max-w-3xl text-[16px] leading-7 text-black/55">{page.intro}</p>
            <Link href={page.demoHref} className="inline-flex h-11 shrink-0 items-center rounded-full bg-[#171719] px-5 text-sm font-semibold text-white">
              {page.demoLabel} ↗
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-black/[.07] bg-[#f7f7f9] px-5 py-20 sm:px-7 md:px-10">
        <div className="mx-auto grid max-w-[1380px] gap-10 lg:grid-cols-[.68fr_1.32fr]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-black/35">Context</p>
            <h2 className="mt-4 text-[40px] font-semibold tracking-[-.05em]">Ce trebuia rezolvat.</h2>
          </div>
          <div className="grid gap-3">
            {page.context.map((item, index) => (
              <div key={item} className="grid grid-cols-[44px_1fr] gap-3 rounded-[22px] border border-black/[.07] bg-white p-5">
                <span className="text-[10px] font-bold text-[#4b46ee]">0{index + 1}</span>
                <p className="text-sm leading-7 text-black/55">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0d0d0f] px-5 py-20 text-white sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1380px]">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/35">Ce am construit</p>
          <div className="mt-8 grid gap-px overflow-hidden rounded-[30px] border border-white/[.08] bg-white/[.08] sm:grid-cols-2">
            {page.built.map((item) => (
              <article key={item.title} className="bg-[#0d0d0f] p-7 md:p-9">
                <h2 className="text-[28px] font-semibold tracking-[-.045em]">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-white/45">{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1380px]">
          <div className="grid gap-12 lg:grid-cols-[.65fr_1.35fr]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#4b46ee]">Flux</p>
              <h2 className="mt-4 text-[42px] font-semibold leading-[.95] tracking-[-.055em]">Cum continuă după site.</h2>
            </div>
            <div className="border-t border-black/10">
              {page.flow.map((step) => (
                <div key={step.number} className="grid gap-3 border-b border-black/10 py-6 sm:grid-cols-[64px_.72fr_1.28fr]">
                  <span className="text-[10px] font-bold text-[#4b46ee]">{step.number}</span>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm leading-6 text-black/50">{step.copy}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-10 max-w-4xl rounded-[24px] border border-[#4b46ee]/15 bg-[#4b46ee]/[.045] p-6 text-sm leading-7 text-black/60">{page.note}</p>
        </div>
      </section>

      <section className="border-t border-black/[.07] px-5 py-16 sm:px-7 md:px-10">
        <div className="mx-auto flex max-w-[1380px] flex-wrap gap-3">
          {page.related.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold">{item.label} →</Link>
          ))}
        </div>
      </section>
    </SeoShell>
  );
}
