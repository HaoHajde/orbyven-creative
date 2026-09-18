import type { Metadata } from "next";
import Link from "next/link";

import { BeforeAfter, HaoShell, haoImages } from "@/components/pilot005/HaoCustomsExperience";

export const metadata: Metadata = {
  title: "Galerie · Hao's Customs",
  description: "Galerie interactivă before/after pentru Pilot #005 Hao's Customs.",
};

export default function HaoCustomsGalleryPage() {
  return (
    <HaoShell active="gallery">
      <section className="mx-auto max-w-[1500px] px-5 pb-10 pt-24 sm:px-7 md:px-10 md:pb-16 md:pt-32">
        <p className="text-[9px] font-semibold uppercase tracking-[.22em] text-[#d2ad62]">Galerie · Before / After</p>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_.55fr] lg:items-end">
          <h1 className="text-[clamp(58px,9vw,124px)] font-semibold leading-[.82] tracking-[-.072em]">Rezultatul nu are nevoie de filtru.</h1>
          <p className="max-w-md text-sm leading-7 text-white/42">Slider-ele folosesc aceeași fotografie cu tratament vizual diferit pentru demonstrarea interacțiunii. În site-ul clientului se înlocuiesc cu perechi reale înainte/după.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 pb-24 sm:px-7 md:px-10 md:pb-32">
        <div className="grid gap-5">
          <BeforeAfter image={haoImages.coupe} title="Corecție exterior" subtitle="Paint correction · coupe" />
          <div className="grid gap-5 lg:grid-cols-2">
            <BeforeAfter image={haoImages.interior} title="Interior premium" subtitle="Deep clean · cabină" />
            <BeforeAfter image={haoImages.suv} title="SUV reset" subtitle="Exterior · protecție" />
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#0a0a0a]">
        <div className="mx-auto grid max-w-[1500px] gap-4 px-5 py-16 sm:px-7 md:grid-cols-3 md:px-10 md:py-20">
          {[
            ["01", "Documentare clară", "Fotografiile reale pot fi încărcate în perechi și organizate pe tipul lucrării."],
            ["02", "Mobile first", "Slider-ul rămâne tactil și ușor de folosit fără biblioteci grele sau canvas."],
            ["03", "Conversie directă", "Fiecare rezultat poate trimite utilizatorul direct spre pachetul relevant."],
          ].map(([no, title, copy]) => <article key={no} className="rounded-[24px] border border-white/9 bg-white/[.03] p-6"><span className="text-[10px] font-bold text-[#d2ad62]">{no}</span><h2 className="mt-8 text-[25px] font-semibold tracking-[-.04em]">{title}</h2><p className="mt-4 text-sm leading-7 text-white/40">{copy}</p></article>)}
        </div>
      </section>

      <section className="px-5 py-20 sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto flex max-w-[1380px] flex-col gap-7 rounded-[30px] bg-[#d2ad62] p-7 text-black sm:p-10 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-4xl text-[clamp(42px,6vw,76px)] font-semibold leading-[.9] tracking-[-.06em]">Ai văzut diferența. Acum construiește pachetul.</h2>
          <Link href="/templates/haos-customs/preturi" className="shrink-0 rounded-full bg-black px-6 py-4 text-sm font-bold text-white">Vezi prețurile →</Link>
        </div>
      </section>
    </HaoShell>
  );
}
