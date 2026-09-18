import Link from "next/link";

import SeoShell from "@/components/seo/SeoShell";

type Item = { href: string; label: string; copy: string };

export default function SeoIndexPage({
  eyebrow,
  title,
  intro,
  items,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  items: Item[];
}) {
  return (
    <SeoShell>
      <section className="px-5 py-20 sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1380px]">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#4b46ee]">{eyebrow}</p>
          <h1 className="mt-5 max-w-5xl text-[clamp(54px,8vw,106px)] font-semibold leading-[.88] tracking-[-.07em]">{title}</h1>
          <p className="mt-8 max-w-2xl text-[16px] leading-7 text-black/55">{intro}</p>

          <div className="mt-14 grid gap-3 md:grid-cols-2">
            {items.map((item, index) => (
              <Link key={item.href} href={item.href} className="group min-h-[220px] rounded-[28px] border border-black/[.07] bg-[#f7f7f9] p-6 transition hover:-translate-y-1 hover:border-[#4b46ee]/25 md:p-8">
                <div className="flex items-start justify-between gap-5">
                  <span className="text-[9px] font-bold tracking-[.16em] text-black/28">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-black/25 transition group-hover:rotate-45 group-hover:text-[#4b46ee]">↗</span>
                </div>
                <h2 className="mt-10 text-[30px] font-semibold tracking-[-.05em]">{item.label}</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-black/50">{item.copy}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SeoShell>
  );
}
