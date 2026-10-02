import type { Metadata } from "next";
import Link from "next/link";
import SeoShellEn from "@/components/seo/SeoShellEn";
import { englishSeoLandings } from "@/lib/seo-public-en";

export const metadata: Metadata = {
  title: "Website solutions for businesses | ORBYVEN",
  description: "ORBYVEN website solutions for business websites, redesign, local services and specialized service businesses.",
  alternates: { canonical: "https://www.orbyven.com/solutii" },
};

export default function SolutionsPageEn() {
  return (
    <SeoShellEn>
      <section className="px-5 py-20 sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1380px]">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#4b46ee]">ORBYVEN solutions</p>
          <h1 className="mt-5 max-w-5xl text-[clamp(54px,8vw,106px)] font-semibold leading-[.88] tracking-[-.07em]">
            Not every business needs the same website.
          </h1>
          <p className="mt-8 max-w-2xl text-[16px] leading-7 text-black/55">
            We start from the business model, customer intent and the real workflow. These directions stay separate because they solve different problems.
          </p>
          <div className="mt-14 grid gap-3 md:grid-cols-2">
            {englishSeoLandings.map((item, index) => (
              <Link key={item.path} href={item.path} className="group min-h-[220px] rounded-[28px] border border-black/[.07] bg-[#f7f7f9] p-6 transition hover:-translate-y-1 hover:border-[#4b46ee]/25 md:p-8">
                <div className="flex items-start justify-between gap-5">
                  <span className="text-[9px] font-bold tracking-[.16em] text-black/28">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-black/25 transition group-hover:rotate-45 group-hover:text-[#4b46ee]">↗</span>
                </div>
                <h2 className="mt-10 text-[30px] font-semibold tracking-[-.05em]">{item.eyebrow}</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-black/50">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SeoShellEn>
  );
}
