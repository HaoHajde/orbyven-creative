import type { Metadata } from "next";
import Link from "next/link";

import { BeforeAfter, HaoShell } from "@/components/pilot005/HaoCustomsExperience";
import { haoImages } from "@/components/pilot005/haoMedia";
import HaoHeroVisual from "@/components/pilot005/HaoHeroVisual";

export const metadata: Metadata = {
  title: "Hao's Customs · Premium Auto Detailing",
  description: "Pilot #005 ORBYVEN: experiență premium pentru detailing auto, galerie before/after, configurator și calendar inteligent.",
};

const services = [
  { no: "01", title: "Interior Deep", copy: "Curățare profundă pentru textile, piele, plastice, geamuri și zone greu accesibile.", meta: "449+" },
  { no: "02", title: "Exterior Reset", copy: "Prespălare, decontaminare, jante, finisaj și protecție pentru suprafețe.", meta: "549+" },
  { no: "03", title: "Paint Correction", copy: "Polish controlat pentru claritate, reflexie și corecția defectelor vizibile.", meta: "650+" },
  { no: "04", title: "Ceramic Guard", copy: "Protecție ceramică premium, luciu adânc și întreținere mai simplă în timp.", meta: "1.200+" },
];

export default function HaoCustomsPage() {
  return (
    <HaoShell active="home">
      <HaoHeroVisual />

      <section className="bg-[#050505]">
        <div className="mx-auto max-w-[1500px] px-5 py-20 sm:px-7 md:px-10 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr]">
            <div className="lg:sticky lg:top-8 lg:self-start">
              <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#caa45b]">Servicii</p>
              <h2 className="mt-5 text-[clamp(46px,6.4vw,82px)] font-semibold leading-[.89] tracking-[-.065em]">Nu vindem o spălare. Construim rezultatul.</h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/36">Fiecare serviciu are un punct de intrare clar. Fără liste kilometrice și fără jargon inutil.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((service) => (
                <article key={service.title} className="group relative min-h-[300px] overflow-hidden rounded-[28px] border border-white/[.08] bg-white/[.024] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#d9bc82]/22 hover:bg-[#d9bc82]/[.04]">
                  <div className="absolute right-[-30px] top-[-30px] h-28 w-28 rounded-full border border-[#d9bc82]/8 transition duration-500 group-hover:scale-125 group-hover:border-[#d9bc82]/16" />
                  <div className="flex items-center justify-between"><span className="text-[9px] font-bold text-[#caa45b]">{service.no}</span><span className="rounded-full border border-white/[.08] px-3 py-2 text-[8px] uppercase tracking-[.12em] text-white/28">de la {service.meta} lei</span></div>
                  <div className="mt-16">
                    <h3 className="text-[29px] font-semibold tracking-[-.05em]">{service.title}</h3>
                    <p className="mt-4 max-w-sm text-sm leading-7 text-white/38">{service.copy}</p>
                  </div>
                  <span className="absolute bottom-6 right-6 grid h-9 w-9 place-items-center rounded-full border border-white/[.08] text-sm text-white/28 transition group-hover:border-[#d9bc82]/28 group-hover:text-[#d9bc82]">↗</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/[.07] bg-[#090909]">
        <div className="mx-auto max-w-[1500px] px-5 py-20 sm:px-7 md:px-10 md:py-28">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#caa45b]">Before / After</p>
              <h2 className="mt-5 max-w-4xl text-[clamp(48px,7vw,90px)] font-semibold leading-[.88] tracking-[-.067em]">Diferența trebuie să se vadă înainte să fie explicată.</h2>
            </div>
            <Link href="/templates/haos-customs/galerie" className="shrink-0 text-sm font-semibold text-[#d9bc82]">Galeria completă →</Link>
          </div>

          <div className="mt-12">
            <BeforeAfter
              beforeImage={haoImages.exteriorBefore}
              afterImage={haoImages.exteriorAfter}
              title="Exterior Reset"
              subtitle="Spumă activă → finisaj studio"
              note="Vizualuri demonstrative pentru experiența Pilot #005; în producție sunt înlocuite cu perechile reale ale atelierului."
            />
          </div>
        </div>
      </section>

      <section className="bg-[#d4b16c] text-[#080808]">
        <div className="mx-auto max-w-[1500px] px-5 py-20 sm:px-7 md:px-10 md:py-28">
          <div className="grid gap-10 lg:grid-cols-[1fr_.78fr] lg:items-end">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.22em] text-black/42">Smart flow</p>
              <h2 className="mt-5 max-w-4xl text-[clamp(52px,8vw,108px)] font-semibold leading-[.84] tracking-[-.073em]">Alegi. Estimezi. Rezervi.</h2>
              <p className="mt-7 max-w-xl text-[15px] leading-7 text-black/55">Un singur traseu de la intenție la programare. Fără telefon obligatoriu și fără să pierzi selecțiile pe drum.</p>
            </div>

            <div className="border-t border-black/15">
              {[
                ["01", "Mașina", "dimensiunea setează baza"],
                ["02", "Nevoia", "alegi pachetul și starea"],
                ["03", "Upgrade-uri", "adaugi exact ce dorești"],
                ["04", "Slotul", "configurația merge în calendar"],
              ].map(([no, title, copy]) => (
                <div key={no} className="grid grid-cols-[44px_.8fr_1fr] gap-3 border-b border-black/15 py-4">
                  <span className="text-[9px] font-black text-black/38">{no}</span>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-[12px] text-black/48">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#050505] px-5 py-20 sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[34px] border border-[#d9bc82]/14 bg-[radial-gradient(circle_at_82%_18%,rgba(217,188,130,.13),transparent_30%),linear-gradient(145deg,#0d0d0d,#080808)] p-7 sm:p-10 md:p-14">
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.2em] text-[#caa45b]"><span className="h-1.5 w-1.5 rounded-full bg-[#caa45b]" />Hao&apos;s Customs</div>
          <div className="mt-7 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-4xl text-[clamp(50px,7vw,94px)] font-semibold leading-[.86] tracking-[-.068em]">Mașina intră murdară. Experiența începe impecabil.</h2>
            <Link href="/templates/haos-customs/preturi" className="inline-flex h-13 shrink-0 items-center rounded-full bg-[#d9bc82] px-7 text-sm font-bold text-black transition hover:bg-[#e7ca92]">Construiește pachetul →</Link>
          </div>
        </div>
      </section>
    </HaoShell>
  );
}
