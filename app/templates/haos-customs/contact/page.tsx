import type { Metadata } from "next";

import { AvailabilityCalendar, HaoShell } from "@/components/pilot005/HaoCustomsExperience";

export const metadata: Metadata = {
  title: "Contact & programări · Hao's Customs",
  description: "Calendar interactiv de disponibilitate pentru Pilot #005 Hao's Customs.",
};

export default function HaoCustomsContactPage() {
  return (
    <HaoShell active="contact">
      <section className="relative overflow-hidden border-b border-white/[.07]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(217,188,130,.12),transparent_28%),linear-gradient(180deg,#090909,#050505)]" />
        <div className="relative mx-auto max-w-[1500px] px-5 pb-16 pt-24 sm:px-7 md:px-10 md:pb-20 md:pt-32">
          <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#caa45b]">Contact · disponibilitate</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_.52fr] lg:items-end">
            <h1 className="text-[clamp(58px,9vw,120px)] font-semibold leading-[.80] tracking-[-.074em]">Rezervarea trebuie să fie la fel de curată ca finisajul.</h1>
            <p className="max-w-md text-sm leading-7 text-white/38">Alegi ziua și ora din sloturile disponibile. Dacă vii din configurator, pachetul, starea mașinii și estimarea rămân deja atașate.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-7 md:px-10 md:py-24">
        <AvailabilityCalendar />
      </section>

      <section className="border-t border-white/[.07] bg-[#090909]">
        <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-7 md:px-10 md:py-20">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Locație", "București · hală detailing", "Spațiu dedicat lucrărilor interior / exterior."],
              ["Contact", "07xx xxx xxx", "WhatsApp și telefon pentru confirmarea programării."],
              ["Program", "L–S · pe bază de programare", "Sloturile afișate sunt demonstrative pentru Pilot #005."],
            ].map(([eyebrow, value, copy]) => (
              <article key={eyebrow} className="rounded-[25px] border border-white/[.08] bg-white/[.024] p-6">
                <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#caa45b]">{eyebrow}</p>
                <p className="mt-6 text-[25px] font-semibold tracking-[-.045em]">{value}</p>
                <p className="mt-4 text-sm leading-7 text-white/34">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#d4b16c] text-black">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-8 px-5 py-16 sm:px-7 md:flex-row md:items-end md:justify-between md:px-10 md:py-20">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.2em] text-black/42">Hao&apos;s Customs</p>
            <h2 className="mt-4 max-w-4xl text-[clamp(44px,6vw,78px)] font-semibold leading-[.88] tracking-[-.062em]">Din configurator până în calendar, fără să pierzi nimic pe drum.</h2>
          </div>
          <div className="shrink-0 rounded-full border border-black/14 px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-black/55">ORBYVEN smart flow</div>
        </div>
      </section>
    </HaoShell>
  );
}
