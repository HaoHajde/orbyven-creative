import Link from "next/link";

import SeoShellEn from "@/components/seo/SeoShellEn";
import type { EnglishSeoLanding } from "@/lib/seo-public-en";

export default function EnglishSeoLandingPage({ page }: { page: EnglishSeoLanding }) {
  return (
    <SeoShellEn>
      <section className="px-5 pb-20 pt-12 sm:px-7 md:px-10 md:pb-28 md:pt-16">
        <div className="mx-auto max-w-[1380px]">
          <div className="grid gap-10 lg:grid-cols-[1.18fr_.82fr] lg:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#4b46ee]">{page.eyebrow}</p>
              <h1 className="mt-5 max-w-5xl text-[clamp(52px,8vw,108px)] font-semibold leading-[.88] tracking-[-.072em]">
                {page.h1}
              </h1>
            </div>
            <div className="lg:pb-2">
              <p className="max-w-xl text-[16px] leading-7 text-black/55">{page.intro}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/contact" className="inline-flex h-12 items-center rounded-full bg-[#171719] px-6 text-sm font-semibold text-white">
                  Start a project
                </Link>
                <Link href="/templates" className="inline-flex h-12 items-center rounded-full border border-black/12 px-6 text-sm font-semibold">
                  View examples
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
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/35">What we build</p>
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

      <section className="border-y border-black/[.07] bg-[#f7f7f9] px-5 py-20 sm:px-7 md:px-10">
        <div className="mx-auto grid max-w-[1380px] gap-10 lg:grid-cols-[.72fr_1.28fr]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-black/35">Frequently asked questions</p>
            <h2 className="mt-4 text-[38px] font-semibold tracking-[-.05em]">Short answers.</h2>
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
    </SeoShellEn>
  );
}
