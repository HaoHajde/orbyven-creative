"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const priceServices = [
  { number: "01", title: "Platformă 360°", meta: "Durată · locație · setup" },
  { number: "02", title: "Oglindă Magică", meta: "Durată · locație · setup" },
  { number: "03", title: "Fum & baloane", meta: "Moment · locație · setup" },
  { number: "04", title: "Tort de shot-uri", meta: "Până la 200 pahare" },
];

export default function ObsidianMomentsPricesPage() {
  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[#070707] text-[#f5f1ef]"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif",
      }}
    >
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#070707]/84 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 md:px-9">
          <Link href="/templates/obsidian-moments" className="flex min-w-0 items-center gap-3">
            <BrandMark />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold tracking-[-0.035em] sm:text-[14px]">OBSIDIAN MOMENTS</p>
              <p className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.22em] text-white/30">360 · events</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-[10px] font-semibold text-white/45 md:flex">
            <Link href="/templates/obsidian-moments" className="transition hover:text-white">Acasă</Link>
            <Link href="/templates/obsidian-moments#experiente" className="transition hover:text-white">Experiențe</Link>
            <span className="text-white">Prețuri</span>
            <Link href="/templates/obsidian-moments#contact" className="transition hover:text-white">Contact</Link>
          </nav>

          <Link
            href="/templates/obsidian-moments#contact"
            className="rounded-full bg-[#a42131] px-4 py-2.5 text-[10px] font-bold text-white shadow-[0_10px_35px_rgba(164,33,49,.22)] sm:px-5"
          >
            Cere ofertă
          </Link>
        </div>
      </header>

      <section className="relative isolate overflow-hidden px-4 pb-16 pt-16 sm:px-6 md:px-9 md:pb-24 md:pt-24">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-20 h-[680px]"
          style={{
            background:
              "radial-gradient(circle at 72% 22%, rgba(151,30,47,.30), transparent 30%), radial-gradient(circle at 32% 15%, rgba(77,13,24,.22), transparent 34%)",
          }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute right-[-18%] top-6 -z-10 h-[560px] w-[560px] rounded-full border border-[#b72d42]/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
        />

        <div className="mx-auto max-w-[1480px]">
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#d04b5e]">Prețuri</p>
          <h1 className="mt-6 max-w-[1050px] text-[clamp(62px,10vw,138px)] font-semibold leading-[0.84] tracking-[-0.075em]">
            Simplu.
            <span className="block text-[#a42131]">De la 400 lei.</span>
          </h1>
          <p className="mt-7 max-w-xl text-[13px] leading-6 text-white/38 sm:text-[14px]">
            Prețul final se stabilește după locație, durată și serviciile alese.
          </p>
        </div>
      </section>

      <section className="border-y border-white/[0.07] bg-[#0b0a0b] px-4 py-14 sm:px-6 md:px-9 md:py-20">
        <div className="mx-auto max-w-[1480px]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {priceServices.map((service, index) => (
              <motion.article
                key={service.title}
                whileHover={{ y: -4 }}
                className="relative min-h-[190px] overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#080808] p-5"
              >
                <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#a42131]/10 blur-[50px]" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-[8px] font-semibold text-white/22">{service.number}</span>
                    <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#c94558]">Ofertă</span>
                  </div>
                  <div className="pt-12">
                    <h2 className="text-[22px] font-semibold leading-[1.02] tracking-[-0.05em]">{service.title}</h2>
                    <p className="mt-3 text-[10px] text-white/28">{service.meta}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1.15fr_.85fr]">
            <div className="rounded-[24px] border border-[#a42131]/28 bg-[#17070a] p-6 sm:p-8">
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#d04b5e]">De la</p>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-[72px] font-semibold leading-none tracking-[-0.075em] sm:text-[92px]">400</span>
                <span className="pb-2 text-[14px] font-semibold text-white/45">lei</span>
              </div>
              <p className="mt-5 max-w-lg text-[12px] leading-6 text-white/32">Tariful public de pornire. Pachetul exact se adaptează evenimentului.</p>
            </div>

            <div className="rounded-[24px] border border-white/[0.07] bg-black p-6 sm:p-8">
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/24">Ce schimbă prețul</p>
              <div className="mt-5 space-y-3 text-[12px] font-semibold text-white/52">
                <p>01 · Locația</p>
                <p>02 · Durata</p>
                <p>03 · Serviciile alese</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 md:px-9 md:py-24">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-8 rounded-[30px] border border-white/[0.08] bg-[#0b0a0b] p-6 sm:p-8 md:flex-row md:items-end md:justify-between md:p-10">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#c94558]">Oferta ta</p>
            <h2 className="mt-4 max-w-3xl text-[42px] font-semibold leading-[0.94] tracking-[-0.06em] sm:text-[58px]">Spune data și locația.</h2>
          </div>
          <Link
            href="/templates/obsidian-moments#contact"
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-white px-7 text-[11px] font-bold text-black"
          >
            Cere ofertă →
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.07] px-4 py-7 sm:px-6 md:px-9">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark small />
            <div>
              <p className="text-[12px] font-semibold">OBSIDIAN MOMENTS 360</p>
              <p className="mt-1 text-[8px] uppercase tracking-[0.16em] text-white/24">București · event experiences</p>
            </div>
          </div>
          <a
            href="https://obsidianmoments360.ro/"
            target="_blank"
            rel="noreferrer"
            className="text-[9px] font-semibold text-white/32 transition hover:text-white"
          >
            obsidianmoments360.ro ↗
          </a>
        </div>
      </footer>
    </main>
  );
}

function BrandMark({ small = false }: { small?: boolean }) {
  const size = small ? "h-8 w-8" : "h-10 w-10";
  return (
    <span className={`relative grid ${size} shrink-0 place-items-center rounded-full border border-[#a42131]/45 bg-[#19080b] shadow-[0_0_30px_rgba(164,33,49,.16)]`}>
      <span className="absolute inset-[6px] rounded-full border border-white/14" />
      <span className="absolute h-[3px] w-[62%] -rotate-[18deg] rounded-full bg-[#a42131] shadow-[0_0_12px_rgba(164,33,49,.55)]" />
      <span className="h-1.5 w-1.5 rounded-full bg-white" />
    </span>
  );
}
