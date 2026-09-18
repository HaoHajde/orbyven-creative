import type { Metadata } from "next";

import { AvailabilityCalendar, HaoShell } from "@/components/pilot005/HaoCustomsExperience";

export const metadata: Metadata = {
  title: "Contact & programări · Hao's Customs",
  description: "Calendar interactiv de disponibilitate pentru Pilot #005 Hao's Customs.",
};

export default function HaoCustomsContactPage() {
  return (
    <HaoShell active="contact">
      <section className="mx-auto max-w-[1500px] px-5 pb-12 pt-24 sm:px-7 md:px-10 md:pb-16 md:pt-32">
        <p className="text-[9px] font-semibold uppercase tracking-[.22em] text-[#d2ad62]">Contact · disponibilitate</p>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_.55fr] lg:items-end">
          <h1 className="text-[clamp(56px,9vw,118px)] font-semibold leading-[.82] tracking-[-.072em]">Rezervarea trebuie să fie la fel de curată ca finisajul.</h1>
          <p className="max-w-md text-sm leading-7 text-white/42">Alege o zi și un interval disponibil. Dacă vii din configurator, pachetul și estimarea rămân atașate cererii.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 pb-24 sm:px-7 md:px-10 md:pb-32">
        <AvailabilityCalendar />
      </section>

      <section className="bg-[#d2ad62] text-black">
        <div className="mx-auto grid max-w-[1500px] gap-8 px-5 py-16 sm:px-7 md:grid-cols-3 md:px-10 md:py-20">
          <div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-black/45">Locație demo</p><p className="mt-3 text-[22px] font-semibold tracking-[-.04em]">București · hală detailing</p></div>
          <div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-black/45">Contact</p><p className="mt-3 text-[22px] font-semibold tracking-[-.04em]">07xx xxx xxx</p></div>
          <div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-black/45">Program</p><p className="mt-3 text-[22px] font-semibold tracking-[-.04em]">L–S · pe bază de programare</p></div>
        </div>
      </section>
    </HaoShell>
  );
}
