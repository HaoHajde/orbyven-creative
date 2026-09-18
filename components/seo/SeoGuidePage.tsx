import Link from "next/link";

import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import SeoShell from "@/components/seo/SeoShell";
import type { SeoGuide } from "@/lib/seo-foundation";

export default function SeoGuidePage({ page }: { page: SeoGuide }) {
  const breadcrumbs = [
    { href: "/ghid", label: "Ghid" },
    { href: page.path, label: page.title },
  ];

  return (
    <SeoShell>
      <SeoJsonLd kind="guide" page={page} breadcrumbs={breadcrumbs} />
      <article>
        <header className="px-5 pb-16 pt-10 sm:px-7 md:px-10 md:pb-24 md:pt-14">
          <div className="mx-auto max-w-[1120px]">
            <Breadcrumbs items={breadcrumbs} />
            <p className="mt-12 text-[10px] font-bold uppercase tracking-[.22em] text-[#4b46ee]">{page.eyebrow}</p>
            <h1 className="mt-5 text-[clamp(48px,7vw,88px)] font-semibold leading-[.9] tracking-[-.066em]">{page.h1}</h1>
            <p className="mt-8 max-w-3xl text-[17px] leading-8 text-black/55">{page.intro}</p>
          </div>
        </header>

        <div className="border-y border-black/[.07] bg-[#f7f7f9] px-5 py-16 sm:px-7 md:px-10 md:py-20">
          <div className="mx-auto max-w-[920px] space-y-5">
            {page.sections.map((section, index) => (
              <section key={section.title} className="rounded-[28px] border border-black/[.07] bg-white p-6 md:p-8">
                <span className="text-[9px] font-bold tracking-[.16em] text-black/28">0{index + 1}</span>
                <h2 className="mt-4 text-[30px] font-semibold tracking-[-.045em]">{section.title}</h2>
                <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/55">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                {section.bullets?.length ? (
                  <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                    {section.bullets.map((item) => (
                      <li key={item} className="rounded-[16px] bg-[#f7f7f9] px-4 py-3 text-sm text-black/58">✓ {item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </div>

        <footer className="px-5 py-16 sm:px-7 md:px-10">
          <div className="mx-auto max-w-[920px]">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-black/35">Continuă cu</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {page.related.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold">{item.label} →</Link>
              ))}
            </div>
          </div>
        </footer>
      </article>
    </SeoShell>
  );
}
