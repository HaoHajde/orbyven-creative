import type { Metadata } from "next";
import Link from "next/link";

import { BeforeAfter, HaoShell, haoImages } from "@/components/pilot005/HaoCustomsExperience";

export const metadata: Metadata = {
  title: "Galerie · Hao's Customs",
  description: "Galerie demonstrativă before/after cu 3 comparații interactive: exterior, interior și corecție lac.",
};

export default function HaoCustomsGalleryPage() {
  return (
    <HaoShell active="gallery">
      <section className="relative overflow-hidden border-b border-white/[.07]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(217,188,130,.12),transparent_30%),linear-gradient(180deg,#090909,#050505)]" />
        <div className="relative mx-auto max-w-[1500px] px-5 pb-16 pt-24 sm:px-7 md:px-10 md:pb-20 md:pt-32">
          <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#caa45b]">Galerie · Before / After</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_.52fr] lg:items-end">
            <h1 className="text-[clamp(60px,9.2vw,126px)] font-semibold leading-[.80] tracking-[-.074em]">Rezultatul nu are nevoie de filtru.</h1>
            <div>
              <p className="max-w-md text-sm leading-7 text-white/38">Trei comparații dedicate: exterior, interior și corecție lac. Tragi separatorul sau apeși Înainte / După, inclusiv pe mobil.</p>
              <div className="mt-5 flex items-center gap-3 text-[9px] font-bold uppercase tracking-[.13em] text-white/24"><span className="h-px w-8 bg-[#caa45b]/45" />drag to compare</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-7 md:px-10 md:py-24">
        <div className="grid gap-5">
          <div className="mx-auto w-full max-w-[1120px]">
            <BeforeAfter
            beforeImage={haoImages.exteriorBefore}
            afterImage={haoImages.exteriorAfter}
            title="Exterior Reset"
            subtitle="Wash · decontaminare · finisaj"
            note="De la praf și urme de utilizare la un finisaj curat, cu reflexii mai clare."
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <BeforeAfter
              beforeImage={haoImages.interiorBefore}
              afterImage={haoImages.interiorAfter}
              title="Interior Deep"
              subtitle="Cabină · piele · textile"
              note="Comparație demonstrativă între un interior neîntreținut și unul curat, ordonat și finisat premium."
            />
            <BeforeAfter
              beforeImage={haoImages.paintBefore}
              afterImage={haoImages.paintAfter}
              title="Paint Correction"
              subtitle="Corecție lac · gloss recovery"
              note="Diferența este concentrată pe claritatea lacului, reflexie și profunzimea finisajului după corecție."
            />
          </div>
          <p className="pt-2 text-center text-[11px] leading-5 text-white/30">Imagini ilustrative generate pentru prezentarea template-ului; nu sunt fotografii ale unor lucrări reale ale atelierului.</p>
        </div>
      </section>

      <section className="border-y border-white/[.07] bg-[#090909]">
        <div className="mx-auto grid max-w-[1500px] gap-3 px-5 py-16 sm:px-7 md:grid-cols-3 md:px-10 md:py-20">
          {[
            ["01", "Perechi dedicate", "Fiecare slider folosește propriul set before/after, pregătit special pentru experiența demo Hao's Customs."],
            ["02", "Gest natural", "Slider tactil, fără canvas și fără o bibliotecă grea doar pentru un efect."],
            ["03", "Conversie contextuală", "Din orice lucrare, clientul poate continua direct spre pachetul relevant și programare."],
          ].map(([no, title, copy]) => (
            <article key={no} className="rounded-[26px] border border-white/[.08] bg-white/[.024] p-6">
              <span className="text-[9px] font-bold text-[#caa45b]">{no}</span>
              <h2 className="mt-8 text-[26px] font-semibold tracking-[-.045em]">{title}</h2>
              <p className="mt-4 text-sm leading-7 text-white/36">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 py-20 sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto flex max-w-[1380px] flex-col gap-7 rounded-[32px] bg-[#d4b16c] p-7 text-black sm:p-10 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-4xl text-[clamp(44px,6vw,78px)] font-semibold leading-[.88] tracking-[-.062em]">Ai văzut diferența. Construiește exact nivelul de detailing de care ai nevoie.</h2>
          <Link href="/templates/haos-customs/preturi" className="shrink-0 rounded-full bg-black px-6 py-4 text-sm font-bold text-white">Configurează →</Link>
        </div>
      </section>
    </HaoShell>
  );
}
