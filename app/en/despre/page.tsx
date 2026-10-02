import type { Metadata } from "next";
import SeoShellEn from "@/components/seo/SeoShellEn";

export const metadata: Metadata = {
  title: "About ORBYVEN CREATIVE",
  description: "ORBYVEN builds premium public websites, AI-assisted digital experiences and modular business workspaces.",
  alternates: { canonical: "https://www.orbyven.com/despre" },
};

export default function AboutPageEn() {
  return (
    <SeoShellEn>
      <section className="px-5 py-20 sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1380px]">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#4b46ee]">About ORBYVEN</p>
          <h1 className="mt-5 max-w-6xl text-[clamp(56px,8vw,108px)] font-semibold leading-[.87] tracking-[-.073em]">
            Websites in front. A connected operating layer behind them.
          </h1>
          <p className="mt-8 max-w-3xl text-[17px] leading-8 text-black/55">
            ORBYVEN combines web design, AI-assisted creation and modular business tools in one ecosystem. A project can start as a simple public website and grow into a workspace for clients, projects, scheduling, quotes and automation.
          </p>
          <div className="mt-14 grid gap-3 md:grid-cols-3">
            {[
              ["Public experience", "Clear, fast websites designed around the business and its customers."],
              ["Modular workspace", "Operational tools that can be enabled only when they solve a real need."],
              ["AI with boundaries", "AI-assisted workflows built around controlled components, context and review."],
            ].map(([title, copy], index) => (
              <article key={title} className="rounded-[28px] border border-black/[.07] bg-[#f7f7f9] p-7">
                <span className="text-[9px] font-bold tracking-[.16em] text-black/28">0{index + 1}</span>
                <h2 className="mt-8 text-[28px] font-semibold tracking-[-.045em]">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-black/50">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SeoShellEn>
  );
}
