import type { Metadata } from "next";
import Link from "next/link";

import { Configurator, HaoShell } from "@/components/pilot005/HaoCustomsExperience";

export const metadata: Metadata = {
  title: "Prețuri & configurator · Hao's Customs",
  description: "Configurator demo pentru servicii de detailing Hao's Customs.",
};

export default function HaoCustomsPricingPage() {
  return (
    <HaoShell active="pricing">
      <section className="mx-auto max-w-[1500px] px-5 pb-12 pt-24 sm:px-7 md:px-10 md:pb-16 md:pt-32">
        <p className="text-[9px] font-semibold uppercase tracking-[.22em] text-[#d2ad62]">Prețuri · configurator</p>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_.55fr] lg:items-end">
          <h1 className="text-[clamp(56px,9vw,120px)] font-semibold leading-[.82] tracking-[-.072em]">Prețul devine parte din experiență.</h1>
          <div>
            <p className="max-w-md text-sm leading-7 text-white/42">Fără tabel interminabil. Clientul își descrie mașina, alege nivelul de detailing și primește o estimare instant.</p>
            <Link href="/templates/haos-customs/contact" className="mt-5 inline-flex text-sm font-semibold text-[#d2ad62]">Sau mergi direct la calendar →</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 pb-24 sm:px-7 md:px-10 md:pb-32">
        <Configurator />
      </section>

      <section className="border-y border-white/8 bg-[#0a0a0a]">
        <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-7 md:px-10 md:py-20">
          <p className="text-[9px] font-semibold uppercase tracking-[.2em] text-[#d2ad62]">Ce înseamnă estimarea</p>
          <div className="mt-7 grid gap-3 md:grid-cols-3">
            {[
              ["Transparent", "Clientul vede instant impactul fiecărei opțiuni asupra bugetului."],
              ["Portabil", "Logica poate fi conectată ulterior la catalogul real de servicii al clientului."],
              ["Seamless", "Configurația selectată este transferată automat către pagina de programare."],
            ].map(([title, copy]) => <article key={title} className="rounded-[22px] border border-white/9 bg-white/[.03] p-6"><h2 className="text-[24px] font-semibold tracking-[-.04em]">{title}</h2><p className="mt-4 text-sm leading-7 text-white/40">{copy}</p></article>)}
          </div>
        </div>
      </section>
    </HaoShell>
  );
}
