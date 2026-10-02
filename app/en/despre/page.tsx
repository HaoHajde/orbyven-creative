import Link from "next/link";

import SeoShell from "@/components/seo/SeoShell";
import { buildEnglishSeoMetadata } from "@/lib/seo-foundation-en";

export const metadata = buildEnglishSeoMetadata({
  path: "/despre",
  title: "About ORBYVEN CREATIVE",
  description:
    "ORBYVEN builds premium public websites and a modular business workspace designed to keep digital operations simple, connected and scalable.",
});

export default function AboutPage() {
  return (
    <SeoShell locale="en">
      <section className="px-5 py-20 sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1380px]">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#4b46ee]">About ORBYVEN</p>
          <h1 className="mt-5 max-w-6xl text-[clamp(56px,8vw,108px)] font-semibold leading-[.87] tracking-[-.073em]">
            A clear public experience. A powerful system behind it.
          </h1>
          <p className="mt-8 max-w-3xl text-[17px] leading-8 text-black/55">
            ORBYVEN is a web design and software studio building websites, landing pages and a modular workspace for businesses that want fewer disconnected tools and a clearer digital system.
          </p>

          <div className="mt-14 grid gap-3 md:grid-cols-3">
            {[
              ["Public", "Websites and pages that explain the offer without unnecessary noise."],
              ["Workspace", "Connected modules for leads, tasks, scheduling, quotes, documents, expenses and teams."],
              ["Modular", "Enable only what the business needs and keep the same foundation as it grows."],
            ].map(([title, copy], index) => (
              <article key={title} className="rounded-[26px] border border-black/[.07] bg-[#f7f7f9] p-6">
                <span className="text-[9px] font-bold tracking-[.16em] text-black/28">0{index + 1}</span>
                <h2 className="mt-8 text-[28px] font-semibold tracking-[-.045em]">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-black/50">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-black/[.07] bg-[#0d0d0f] px-5 py-20 text-white sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1380px] gap-10 lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/35">Product principle</p>
            <h2 className="mt-4 text-[42px] font-semibold leading-[.95] tracking-[-.055em]">
              Keep complexity in the system, not in front of the customer.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Beginner friendly", "Important actions should be easy to find and explained in normal language."],
              ["Maximum clarity", "Use less text when visual context can explain the idea faster."],
              ["Connected modules", "Leads, scheduling, quotes and expenses should keep the same operational context."],
              ["Pilot before scale", "Validate real verticals before multiplying features."],
            ].map(([title, copy]) => (
              <article key={title} className="rounded-[22px] border border-white/[.08] p-6">
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/45">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-7 md:px-10">
        <div className="mx-auto flex max-w-[1380px] flex-wrap gap-3">
          <Link href="/studii-de-caz" className="rounded-full bg-[#171719] px-5 py-3 text-sm font-semibold text-white">Explore pilots</Link>
          <Link href="/solutii" className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold">Explore solutions</Link>
          <Link href="/contact" className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold">Contact</Link>
        </div>
      </section>
    </SeoShell>
  );
}
