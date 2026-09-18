import Link from "next/link";

import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import SeoShell from "@/components/seo/SeoShell";
import type { SeoLandingPage as SeoLandingPageData } from "@/lib/seo-foundation";

export default function SeoLandingPage({ page }: { page: SeoLandingPageData }) {
  const breadcrumbs = [
    { href: "/solutii", label: "Soluții" },
    { href: page.path, label: page.title },
  ];

  return (
    <SeoShell>
      <SeoJsonLd kind="landing" page={page} breadcrumbs={breadcrumbs} />

      <section className="px-5 pb-20 pt-10 sm:px-7 md:px-10 md:pb-28 md:pt-14">
        <div className="mx-auto max-w-[1380px]">
          <Breadcrumbs items={breadcrumbs} />
          <div className="mt-12 grid gap-10 lg:grid-cols-[1.18fr_.82fr] lg:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#4b46ee]">{page.eyebrow}</p>
              <h1 className="mt-5 max-w-5xl text-[clamp(52px,8vw,108px)] font-semibold leading-[.88] tracking-[-.072em]">
                {page.h1}
              </h1>
            </div>
            <div className="lg:pb-2">
              <p className="max-w-xl text-[16px] leading-7 text-black/55">{page.intro}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/cerere" className="inline-flex h-12 items-center rounded-full bg-[#171719] px-6 text-sm font-semibold text-white">
                  Discută proiectul
                </Link>
                <Link href="/templates" className="inline-flex h-12 items-center rounded-full border border-black/12 px-6 text-sm font-semibold">
                  Vezi exemple
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-16 grid gap-3 md:grid-cols-3">
            {page.proof.map((item, index) => (
              <article key={item.title} className="rounded-[26px] border border-black/[.07] bg-[#f7f7f9] p-6">
                <span className="text-[9px] font-bold tracking-[.16em] text-black/30">0{index + 1}</span>
                <h2 className="mt-8 text-[26px] font-semibold tracking-[-.045em]">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-black/50">{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-black/[.07] bg-[#0d0d0f] px-5 py-20 text-white sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1380px]">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/35">Ce construim</p>
          <div className="mt-8 grid gap-px overflow-hidden rounded-[30px] border border-white/[.08] bg-white/[.08] sm:grid-cols-2">
            {page.deliverables.map((item) => (
              <article key={item.title} className="bg-[#0d0d0f] p-7 md:p-9">
                <h2 className="text-[28px] font-semibold tracking-[-.045em]">{item.title}</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/45">{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1380px]">
          <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#4b46ee]">Proces</p>
              <h2 className="mt-4 text-[42px] font-semibold leading-[.95] tracking-[-.055em]">Trei pași. Fără teatru de agenție.</h2>
            </div>
            <div className="border-t border-black/10">
              {page.steps.map((step) => (
                <div key={step.number} className="grid gap-3 border-b border-black/10 py-6 sm:grid-cols-[64px_.7fr_1.3fr]">
                  <span className="text-[10px] font-bold text-[#4b46ee]">{step.number}</span>
                  <h3 className="text-lg font-semibold tracking-[-.03em]">{step.title}</h3>
                  <p className="text-sm leading-6 text-black/50">{step.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/[.07] bg-[#f7f7f9] px-5 py-20 sm:px-7 md:px-10">
        <div className="mx-auto grid max-w-[1380px] gap-10 lg:grid-cols-[.72fr_1.28fr]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-black/35">Întrebări frecvente</p>
            <h2 className="mt-4 text-[38px] font-semibold tracking-[-.05em]">Pe scurt.</h2>
          </div>
          <div className="space-y-3">
            {page.faq.map((item) => (
              <details key={item.question} className="group rounded-[22px] border border-black/[.07] bg-white p-5">
                <summary className="cursor-pointer list-none text-[17px] font-semibold tracking-[-.025em]">{item.question}</summary>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-black/50">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-7 md:px-10">
        <div className="mx-auto max-w-[1380px]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="mr-2 text-[10px] font-bold uppercase tracking-[.18em] text-black/35">Continuă cu</span>
            {page.related.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold transition hover:border-black/25">
                {item.label} →
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SeoShell>
  );
}
