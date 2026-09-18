import type { Metadata } from "next";
import Link from "next/link";

import { Configurator, HaoShell } from "@/components/pilot005/HaoCustomsExperience";

export const metadata: Metadata = {
  title: "Prețuri & configurator · Hao's Customs",
  description: "Configurator interactiv de preț pentru serviciile de detailing Hao's Customs.",
};

export default function HaoCustomsPricingPage() {
  return (
    <HaoShell active="pricing">
      <section className="relative overflow-hidden border-b border-white/[.07]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(217,188,130,.13),transparent_28%),linear-gradient(180deg,#090909,#050505)]" />
        <div className="relative mx-auto max-w-[1500px] px-5 pb-16 pt-24 sm:px-7 md:px-10 md:pb-20 md:pt-32">
          <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#caa45b]">Prețuri · smart configurator</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_.52fr] lg:items-end">
            <h1 className="text-[clamp(58px,9vw,122px)] font-semibold leading-[.80] tracking-[-.074em]">Spune ce ai. Alegi ce vrei. Vezi cât costă.</h1>
            <div>
              <p className="max-w-md text-sm leading-7 text-white/38">Estimarea se schimbă instant în funcție de mașină, starea actuală, pachet și upgrade-uri. Nicio listă de prețuri care te obligă să ghicești.</p>
              <Link href="/templates/haos-customs/contact" className="mt-5 inline-flex text-sm font-semibold text-[#d9bc82]">Ai deja o idee? Vezi calendarul →</Link>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-px overflow-hidden rounded-[22px] border border-white/[.07] bg-white/[.07]">
            {[
              ["01", "Alegi nevoia"],
              ["02", "Primești estimarea"],
              ["03", "Rezervi slotul"],
            ].map(([no, label]) => (
              <div key={no} className="bg-[#080808] px-4 py-5">
                <p className="text-[8px] font-bold text-[#caa45b]">{no}</p>
                <p className="mt-2 text-[10px] font-semibold text-white/56 sm:text-[12px]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-7 md:px-10 md:py-24">
        <Configurator />
      </section>

      <section className="border-y border-white/[.07] bg-[#090909]">
        <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-7 md:px-10 md:py-20">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Transparent", "Fiecare selecție își arată impactul asupra estimării, instant."],
              ["Adaptiv", "Prețul ține cont de dimensiunea mașinii și de câtă muncă cere starea ei reală."],
              ["Portabil", "Configurația este păstrată automat și merge cu tine în calendarul de programări."],
            ].map(([title, copy], index) => (
              <article key={title} className="rounded-[25px] border border-white/[.08] bg-white/[.024] p-6">
                <span className="text-[9px] font-bold text-[#caa45b]">0{index + 1}</span>
                <h2 className="mt-8 text-[26px] font-semibold tracking-[-.045em]">{title}</h2>
                <p className="mt-4 text-sm leading-7 text-white/36">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </HaoShell>
  );
}
