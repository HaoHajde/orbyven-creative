import type { Metadata } from "next";
import Link from "next/link";

import { BeforeAfter, HaoShell, haoImages } from "@/components/pilot005/HaoCustomsExperience";

export const metadata: Metadata = {
  title: "Hao's Customs · Detailing Auto Premium",
  description: "Pilot #005 ORBYVEN pentru detailing auto premium: galerie before/after, configurator de preț și programare.",
};

const services = [
  { no: "01", title: "Interior Deep", copy: "Curățare profundă, textile, piele, plastice, geamuri și detalii greu accesibile.", meta: "de la 449 lei" },
  { no: "02", title: "Exterior Reset", copy: "Spumă activă, decontaminare, jante, finisaj și protecție pentru un exterior curat vizual.", meta: "de la 549 lei" },
  { no: "03", title: "Paint Correction", copy: "Polish controlat în trepte, corecție optică și pregătire pentru protecție ceramică.", meta: "de la 650 lei" },
  { no: "04", title: "Ceramic Guard", copy: "Protecție ceramică premium, luciu adânc și întreținere mai ușoară a suprafeței.", meta: "de la 1.200 lei" },
];

export default function HaoCustomsPage() {
  return (
    <HaoShell active="home">
      <section className="relative min-h-[92svh] overflow-hidden border-b border-white/8">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(90deg,rgba(0,0,0,.90) 0%,rgba(0,0,0,.69) 42%,rgba(0,0,0,.22) 76%,rgba(0,0,0,.38) 100%),url("${haoImages.hero}")` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(210,173,98,.14),transparent_22%),linear-gradient(180deg,transparent_55%,#050505_100%)]" />
        <div className="absolute right-[12%] top-[18%] h-24 w-24 rounded-full bg-white/8 blur-3xl animate-pulse" />
        <div className="absolute right-[25%] top-[34%] h-14 w-14 rounded-full bg-[#d2ad62]/10 blur-2xl animate-pulse" />

        <div className="relative mx-auto flex min-h-[92svh] max-w-[1600px] flex-col justify-between px-5 pb-12 pt-24 sm:px-7 md:px-12 md:pb-16 md:pt-28">
          <header className="flex items-center justify-end">
            <Link href="/templates/haos-customs/contact" className="rounded-full border border-white/16 bg-black/35 px-5 py-3 text-[11px] font-semibold text-white/76 backdrop-blur-xl transition hover:border-[#d2ad62]/50 hover:text-[#d2ad62]">Rezervă un slot</Link>
          </header>

          <div className="max-w-[920px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d2ad62]">Hao&apos;s Customs · Professional Auto Detailing</p>
            <h1 className="mt-6 text-[clamp(58px,10vw,150px)] font-semibold leading-[0.78] tracking-[-0.075em] text-white">
              Fiecare reflexie.<br /><span className="text-[#d2ad62]">Controlată.</span>
            </h1>
            <p className="mt-8 max-w-xl text-[15px] leading-7 text-white/53 md:text-[17px] md:leading-8">
              Detailing interior și exterior pentru mașini care merită mai mult decât o spălare. Proces clar, finisaj premium și atenție la detalii.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/templates/haos-customs/preturi" className="rounded-full bg-[#d2ad62] px-6 py-3.5 text-sm font-bold text-black">Configurează serviciul →</Link>
              <Link href="/templates/haos-customs/galerie" className="rounded-full border border-white/14 bg-white/[.04] px-6 py-3.5 text-sm font-semibold text-white/72 backdrop-blur">Vezi before / after</Link>
            </div>
          </div>

          <div className="grid max-w-3xl grid-cols-3 border-t border-white/10 pt-5 text-white">
            <div><p className="text-[24px] font-semibold tracking-[-.05em] text-[#d2ad62]">4</p><p className="mt-1 text-[8px] uppercase tracking-[.14em] text-white/30">zone de serviciu</p></div>
            <div><p className="text-[24px] font-semibold tracking-[-.05em]">100%</p><p className="mt-1 text-[8px] uppercase tracking-[.14em] text-white/30">configurabil</p></div>
            <div><p className="text-[24px] font-semibold tracking-[-.05em]">Live</p><p className="mt-1 text-[8px] uppercase tracking-[.14em] text-white/30">calendar demo</p></div>
          </div>
        </div>
      </section>

      <section className="bg-[#070707]">
        <div className="mx-auto max-w-[1500px] px-5 py-20 sm:px-7 md:px-10 md:py-28">
          <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
            <div className="lg:sticky lg:top-8 lg:self-start">
              <p className="text-[9px] font-semibold uppercase tracking-[.22em] text-[#d2ad62]">Servicii</p>
              <h2 className="mt-5 text-[clamp(44px,6vw,78px)] font-semibold leading-[.92] tracking-[-.06em]">Nu vindem „o spălare”. Construim rezultatul.</h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/40">Clientul vede repede ce poate cumpăra, ce include serviciul și de unde pornește prețul.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((service) => (
                <article key={service.title} className="min-h-[290px] rounded-[26px] border border-white/9 bg-white/[.032] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#d2ad62]/28 hover:bg-[#d2ad62]/[.045]">
                  <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-[#d2ad62]">{service.no}</span><span className="rounded-full border border-white/8 px-3 py-2 text-[9px] text-white/34">{service.meta}</span></div>
                  <h3 className="mt-12 text-[28px] font-semibold tracking-[-.045em]">{service.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/42">{service.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0a0a0a]">
        <div className="mx-auto max-w-[1500px] px-5 py-20 sm:px-7 md:px-10 md:py-28">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div><p className="text-[9px] font-semibold uppercase tracking-[.22em] text-[#d2ad62]">Before / After</p><h2 className="mt-5 max-w-3xl text-[clamp(46px,7vw,88px)] font-semibold leading-[.9] tracking-[-.065em]">Diferența trebuie să se vadă înainte să fie explicată.</h2></div>
            <Link href="/templates/haos-customs/galerie" className="text-sm font-semibold text-[#d2ad62]">Galeria completă →</Link>
          </div>
          <div className="mt-10">
            <BeforeAfter image={haoImages.coupe} title="Exterior correction" subtitle="Demo vizual · glisează" />
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#d2ad62] text-black">
        <div className="mx-auto grid max-w-[1500px] gap-10 px-5 py-20 sm:px-7 md:px-10 md:py-28 lg:grid-cols-[1fr_.8fr] lg:items-end">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.22em] text-black/50">Workflow</p>
            <h2 className="mt-5 max-w-4xl text-[clamp(50px,8vw,104px)] font-semibold leading-[.86] tracking-[-.07em]">Selectezi. Estimezi. Programezi.</h2>
          </div>
          <div className="grid gap-3">
            {[
              ["01", "Alegi mașina", "Dimensiunea setează baza de lucru."],
              ["02", "Construiești pachetul", "Interior, exterior și tratamente extra."],
              ["03", "Vezi prețul instant", "Estimarea se actualizează fără formular."],
              ["04", "Alegi intervalul", "Configurația merge cu tine în calendar."],
            ].map(([no, title, copy]) => <div key={no} className="grid grid-cols-[42px_1fr] gap-4 border-t border-black/14 py-4"><span className="text-[10px] font-black text-black/48">{no}</span><div><p className="font-semibold">{title}</p><p className="mt-1 text-sm leading-6 text-black/55">{copy}</p></div></div>)}
          </div>
        </div>
      </section>

      <section className="bg-[#050505] px-5 py-20 sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1380px] overflow-hidden rounded-[32px] border border-[#d2ad62]/18 bg-[radial-gradient(circle_at_78%_20%,rgba(210,173,98,.16),transparent_34%),#0a0a0a] p-7 sm:p-10 md:p-14">
          <p className="text-[9px] font-semibold uppercase tracking-[.22em] text-[#d2ad62]">Hao&apos;s Customs</p>
          <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-4xl text-[clamp(48px,7vw,92px)] font-semibold leading-[.88] tracking-[-.065em]">Mașina intră murdară. Experiența trebuie să înceapă impecabil.</h2>
            <Link href="/templates/haos-customs/preturi" className="inline-flex h-13 shrink-0 items-center rounded-full bg-[#d2ad62] px-7 text-sm font-bold text-black">Calculează un pachet →</Link>
          </div>
        </div>
      </section>
    </HaoShell>
  );
}
