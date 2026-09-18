"use client";

import Link from "next/link";

const heroImage = "/hao-customs/hero.webp";

type HaoHeroVisualProps = {
  compact?: boolean;
};

export default function HaoHeroVisual({ compact = false }: HaoHeroVisualProps) {
  const content = (
    <>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(90deg,rgba(0,0,0,.93) 0%,rgba(0,0,0,.74) 37%,rgba(0,0,0,.24) 74%,rgba(0,0,0,.48) 100%),url("${heroImage}")`,
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,.03),rgba(5,5,5,.02)_54%,rgba(5,5,5,.95)_100%)]" />
      <div
        className={`absolute inset-0 opacity-[.10] [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] ${
          compact ? "[background-size:38px_38px]" : "[background-size:72px_72px]"
        }`}
      />
    </>
  );

  if (compact) {
    return (
      <div className="relative min-h-[338px] overflow-hidden bg-[#050505] text-white">
        {content}

        <div className="relative z-10 flex min-h-[338px] flex-col justify-between px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 rounded-full border border-[#d9bc82]/24 bg-black/55 px-2.5 py-2 backdrop-blur-xl">
              <span className="grid h-6 w-6 place-items-center rounded-full border border-[#d9bc82]/28 text-[6px] font-black text-[#d9bc82]">HC</span>
              <span className="text-[5px] font-bold uppercase tracking-[.16em] text-[#d9bc82]">Meniu</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/35 p-1 backdrop-blur-xl">
              <span className="hidden px-2 text-[4px] font-semibold uppercase tracking-[.12em] text-white/35 sm:block">
                București · detailing studio
              </span>
              <span className="rounded-full bg-white px-3 py-1.5 text-[5px] font-bold text-black">Rezervă</span>
            </div>
          </div>

          <div className="max-w-[80%] pb-3">
            <div className="flex items-center gap-2">
              <span className="h-px w-7 bg-[#d9bc82]/65" />
              <p className="text-[4px] font-bold uppercase tracking-[.22em] text-[#d9bc82]">
                Hao&apos;s Customs · Professional Auto Detailing
              </p>
            </div>

            <h3 className="mt-4 text-[32px] font-semibold leading-[.78] tracking-[-.075em] sm:text-[42px]">
              Obsesie pentru
              <br />
              <span className="bg-gradient-to-r from-[#f2dfb4] via-[#caa45b] to-[#9b793d] bg-clip-text text-transparent">
                fiecare reflexie.
              </span>
            </h3>

            <p className="mt-3 max-w-[290px] text-[5px] leading-[11px] text-white/46">
              Interior și exterior tratate profesionist. Alegi nivelul, vezi estimarea și rezervi fără să ieși din experiență.
            </p>

            <div className="mt-4 flex gap-2">
              <span className="rounded-full bg-[#d9bc82] px-3 py-2 text-[5px] font-bold text-black">Configurează →</span>
              <span className="rounded-full border border-white/14 bg-black/25 px-3 py-2 text-[5px] font-semibold text-white/68">
                Before / After
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 border-t border-white/10 pt-3">
            {[
              ["4", "servicii"],
              ["Live", "estimare"],
              ["14 zile", "calendar"],
            ].map(([value, label]) => (
              <div key={label} className="border-r border-white/8 px-2 first:pl-0 last:border-r-0">
                <p className="text-[9px] font-semibold tracking-[-.04em]">{value}</p>
                <p className="mt-0.5 text-[3px] uppercase tracking-[.12em] text-white/24">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="relative min-h-[100svh] overflow-hidden border-b border-white/[.07] bg-[#050505] text-white">
      {content}

      <div className="relative mx-auto flex min-h-[100svh] max-w-[1600px] flex-col justify-between px-5 pb-10 pt-5 sm:px-7 md:px-12 md:pb-14 md:pt-7">
        <header className="flex items-start justify-between gap-3">
          <div className="h-12 sm:h-14" aria-hidden="true" />

          <div className="flex items-center gap-2 rounded-full border border-white/[.09] bg-black/35 p-1.5 backdrop-blur-xl">
            <span className="hidden px-3 text-[9px] font-semibold uppercase tracking-[.15em] text-white/34 sm:block">
              București · detailing studio
            </span>
            <Link
              href="/templates/haos-customs/contact"
              className="rounded-full bg-white px-4 py-2.5 text-[10px] font-bold text-black transition hover:bg-[#e2c991]"
            >
              Rezervă
            </Link>
          </div>
        </header>

        <div className="max-w-[980px] pb-[8vh] md:pb-[5vh]">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#d9bc82]/65" />
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#d9bc82]">
              Hao&apos;s Customs · Professional Auto Detailing
            </p>
          </div>

          <h1 className="mt-7 text-[clamp(60px,10.5vw,158px)] font-semibold leading-[0.77] tracking-[-0.078em] text-white">
            Obsesie pentru
            <br />
            <span className="bg-gradient-to-r from-[#f2dfb4] via-[#caa45b] to-[#9b793d] bg-clip-text text-transparent">
              fiecare reflexie.
            </span>
          </h1>

          <div className="mt-8 grid max-w-3xl gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <p className="max-w-xl text-[15px] leading-7 text-white/48 md:text-[17px] md:leading-8">
              Interior și exterior tratate profesionist într-o hală dedicată. Alegi nivelul de intervenție, vezi estimarea și rezervi fără să ieși din experiență.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/templates/haos-customs/preturi"
                className="rounded-full bg-[#d9bc82] px-6 py-3.5 text-[12px] font-bold text-black transition hover:bg-[#e7ca92]"
              >
                Configurează →
              </Link>
              <Link
                href="/templates/haos-customs/galerie"
                className="rounded-full border border-white/[.11] bg-black/30 px-6 py-3.5 text-[12px] font-semibold text-white/68 backdrop-blur-xl transition hover:border-white/20 hover:text-white"
              >
                Before / After
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-white/[.08] pt-5">
          {[
            ["4", "servicii principale"],
            ["Live", "estimare instant"],
            ["14 zile", "calendar vizibil"],
          ].map(([value, label]) => (
            <div key={label} className="border-r border-white/[.07] px-3 first:pl-0 last:border-r-0">
              <p className="text-[22px] font-semibold tracking-[-.05em] text-white md:text-[30px]">{value}</p>
              <p className="mt-1 text-[7px] uppercase tracking-[.14em] text-white/24 md:text-[8px]">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
