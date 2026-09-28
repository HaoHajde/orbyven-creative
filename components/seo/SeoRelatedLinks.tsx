import Link from "next/link";

import type { SeoLink } from "@/lib/seo-foundation";
import { getSeoClusterLinks } from "@/lib/seo-clusters";

export default function SeoRelatedLinks({
  currentPath,
  links,
  eyebrow,
  title,
}: {
  currentPath: string;
  links: SeoLink[];
  eyebrow: string;
  title: string;
}) {
  const resolved = getSeoClusterLinks(currentPath, links);

  return (
    <section className="border-t border-black/[.07] px-5 py-16 sm:px-7 md:px-10 md:py-20">
      <div className="mx-auto max-w-[1380px]">
        <div className="grid gap-7 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#4b46ee]">{eyebrow}</p>
            <h2 className="mt-4 max-w-xl text-[34px] font-semibold leading-[1.02] tracking-[-.05em]">{title}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {resolved.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group min-h-[170px] rounded-[22px] border border-black/[.07] bg-[#f7f7f9] p-5 transition hover:-translate-y-0.5 hover:border-[#4b46ee]/25"
              >
                <span className="flex items-start justify-between gap-4">
                  <span className="text-[15px] font-semibold leading-5 tracking-[-.025em]">{item.label}</span>
                  <span aria-hidden="true" className="text-black/25 transition group-hover:translate-x-0.5 group-hover:text-[#4b46ee]">→</span>
                </span>
                <span className="mt-4 block text-[12px] leading-5 text-black/48">{item.copy}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-black/[.07] pt-6">
          <p className="max-w-2xl text-sm leading-6 text-black/48">Ai deja contextul? Trimite direct nevoia proiectului, fără un brief complicat.</p>
          <Link href="/cerere" className="inline-flex h-11 items-center rounded-full bg-[#171719] px-5 text-xs font-semibold text-white">
            Începe un proiect →
          </Link>
        </div>
      </div>
    </section>
  );
}
