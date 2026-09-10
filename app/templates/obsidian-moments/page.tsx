"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const services = [
  {
    id: "360",
    title: "Platformă 360°",
    label: "VIDEO",
    note: "Clipuri în mișcare, direct din mijlocul petrecerii.",
  },
  {
    id: "mirror",
    title: "Oglindă Magică",
    label: "PHOTO",
    note: "Un punct foto simplu, elegant și ușor de folosit.",
  },
  {
    id: "fx",
    title: "Fum & baloane",
    label: "FX",
    note: "Atmosferă pentru dans și momentele care merită accentuate.",
  },
  {
    id: "shots",
    title: "Tort de shot-uri",
    label: "200",
    note: "Moment social pentru până la 200 de pahare.",
  },
];

const eventTypes = ["Nuntă", "Botez", "Aniversare", "Corporate", "Altul"];

export default function ObsidianMomentsTemplatePage() {
  const [activeService, setActiveService] = useState(0);
  const [eventType, setEventType] = useState("Nuntă");
  const service = services[activeService];

  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[#070707] text-[#f5f1ef]"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif",
      }}
    >
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#070707]/82 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 md:px-9">
          <Link href="/templates/obsidian-moments" className="flex min-w-0 items-center gap-3">
            <BrandMark />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold tracking-[-0.035em] sm:text-[14px]">
                OBSIDIAN MOMENTS
              </p>
              <p className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.22em] text-white/30">
                360 · events
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-[10px] font-semibold text-white/45 md:flex">
            <a href="#experiente" className="transition hover:text-white">Experiențe</a>
            <a href="#momente" className="transition hover:text-white">Momente</a>
            <Link href="/templates/obsidian-moments/preturi" className="transition hover:text-white">Prețuri</Link>
            <a href="#contact" className="transition hover:text-white">Contact</a>
          </nav>

          <a
            href="#contact"
            className="shrink-0 rounded-full bg-[#a42131] px-4 py-2.5 text-[10px] font-bold text-white shadow-[0_10px_35px_rgba(164,33,49,.22)] transition hover:-translate-y-0.5 sm:px-5"
          >
            Cere ofertă
          </a>
        </div>

        <nav className="mx-auto flex max-w-[1480px] gap-5 overflow-x-auto px-4 pb-3 text-[9px] font-semibold text-white/38 [scrollbar-width:none] sm:px-6 md:hidden">
          <a href="#experiente" className="whitespace-nowrap">Experiențe</a>
          <a href="#momente" className="whitespace-nowrap">Momente</a>
          <Link href="/templates/obsidian-moments/preturi" className="whitespace-nowrap">Prețuri</Link>
          <a href="#contact" className="whitespace-nowrap">Contact</a>
        </nav>
      </header>

      <section className="relative isolate min-h-[88svh] overflow-hidden px-4 pb-16 pt-12 sm:px-6 md:px-9 md:pb-24 md:pt-16">
        <div aria-hidden="true" className="absolute inset-0 -z-30 bg-[#070707]" />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-20 h-[72%]"
          style={{
            background:
              "radial-gradient(circle at 68% 28%, rgba(133,24,39,.34), transparent 27%), radial-gradient(circle at 34% 22%, rgba(73,12,22,.26), transparent 32%)",
          }}
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-[0.035] [background-image:radial-gradient(circle_at_center,#fff_0.7px,transparent_0.7px)] [background-size:8px_8px]" />

        <motion.div
          aria-hidden="true"
          className="absolute right-[-20%] top-[9%] -z-10 h-[620px] w-[620px] rounded-full border border-[#b52d40]/20 sm:right-[-8%]"
          animate={{ rotate: 360 }}
          transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute right-[4%] top-[21%] -z-10 h-[330px] w-[330px] rounded-full border border-white/[0.08]"
          animate={{ rotate: -360, scale: [1, 1.05, 1] }}
          transition={{
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            scale: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          }}
        />

        <div className="mx-auto grid min-h-[72svh] max-w-[1480px] items-center gap-12 lg:grid-cols-[1.12fr_.88fr]">
          <div className="relative z-10 pt-4 md:pt-8">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
              className="text-[9px] font-bold uppercase tracking-[0.26em] text-[#d34f61]"
            >
              București · experiențe pentru evenimente
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.08 }}
              className="mt-6 max-w-[1050px] text-[clamp(64px,10.5vw,150px)] font-semibold leading-[0.82] tracking-[-0.078em]"
            >
              Your moment.
              <span className="block text-[#a42131]">All around.</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.24 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <a
                href="#experiente"
                className="rounded-full bg-white px-6 py-3.5 text-[11px] font-bold text-black transition hover:-translate-y-0.5"
              >
                Vezi experiențele
              </a>
              <Link
                href="/templates/obsidian-moments/preturi"
                className="rounded-full border border-white/12 bg-white/[0.035] px-6 py-3.5 text-[11px] font-bold text-white/72 backdrop-blur-xl transition hover:bg-white/[0.07]"
              >
                Prețuri →
              </Link>
            </motion.div>
          </div>

          <div className="relative min-h-[390px] sm:min-h-[470px] lg:min-h-[610px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.95, delay: 0.12 }}
              className="absolute inset-[4%_1%_8%_7%] overflow-hidden rounded-[46px] border border-white/[0.09] bg-[linear-gradient(155deg,#26080d,#0b0809_56%,#030303)] shadow-[0_55px_130px_rgba(0,0,0,.58)]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_44%,rgba(183,42,61,.22),transparent_29%)]" />
              <motion.div
                className="absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#b72d42]/55 sm:h-[310px] sm:w-[310px]"
                animate={{ rotate: 360 }}
                transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute left-1/2 top-[-7px] h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-[#d43f55] shadow-[0_0_24px_rgba(212,63,85,.8)]" />
              </motion.div>
              <div className="absolute left-1/2 top-1/2 grid h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/65 shadow-[inset_0_0_55px_rgba(166,43,60,.14)] sm:h-[185px] sm:w-[185px]">
                <div className="text-center">
                  <p className="text-[42px] font-semibold tracking-[-0.075em] sm:text-[52px]">360</p>
                  <p className="mt-1 text-[7px] uppercase tracking-[0.22em] text-white/28">moments</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute left-0 top-[18%] rounded-[18px] border border-white/10 bg-black/70 px-4 py-3 backdrop-blur-xl"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="text-[7px] uppercase tracking-[0.17em] text-white/27">experience</p>
              <p className="mt-1 text-[11px] font-semibold">LIVE</p>
            </motion.div>

            <motion.div
              className="absolute bottom-[5%] right-0 rounded-[18px] border border-[#a42131]/28 bg-[#170609]/88 px-4 py-3 backdrop-blur-xl"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="text-[7px] uppercase tracking-[0.17em] text-[#d44e61]">ready</p>
              <p className="mt-1 text-[11px] font-semibold">OBSIDIAN</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="experiente" className="border-y border-white/[0.07] bg-[#0b0a0b] px-4 py-16 sm:px-6 md:px-9 md:py-24">
        <div className="mx-auto max-w-[1480px]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.23em] text-[#c94558]">Experiențe</p>
              <h2 className="mt-4 text-[42px] font-semibold tracking-[-0.06em] sm:text-[58px]">Alegi. Atât.</h2>
            </div>
            <p className="max-w-sm text-[12px] leading-6 text-white/34">Patru servicii. Fără meniuri complicate.</p>
          </div>

          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((item, index) => (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => setActiveService(index)}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.985 }}
                className={`group relative min-h-[176px] overflow-hidden rounded-[22px] border p-5 text-left transition ${
                  activeService === index
                    ? "border-[#a42131]/60 bg-[#19080b]"
                    : "border-white/[0.07] bg-[#080808]"
                }`}
              >
                <div
                  className={`absolute -right-10 -top-10 h-36 w-36 rounded-full blur-[55px] transition ${
                    activeService === index ? "bg-[#b72d42]/25" : "bg-white/[0.025]"
                  }`}
                />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-[8px] font-semibold text-white/24">0{index + 1}</span>
                    <span className={`text-[8px] font-black tracking-[0.13em] ${activeService === index ? "text-[#d75265]" : "text-white/22"}`}>{item.label}</span>
                  </div>
                  <h3 className="pt-12 text-[22px] font-semibold leading-[1.02] tracking-[-0.05em]">{item.title}</h3>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="mt-3 overflow-hidden rounded-[22px] border border-white/[0.07] bg-black px-5 py-5 sm:px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24 }}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#c94558]">{service.label}</p>
                  <p className="mt-2 text-[17px] font-semibold tracking-[-0.035em]">{service.note}</p>
                </div>
                <a href="#contact" className="text-[10px] font-bold text-white/48 transition hover:text-white">Întreabă despre serviciu →</a>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      <section id="momente" className="px-4 py-16 sm:px-6 md:px-9 md:py-24">
        <div className="mx-auto max-w-[1480px]">
          <div className="grid gap-3 md:grid-cols-[1.15fr_.85fr]">
            <VisualMoment className="min-h-[420px] md:min-h-[560px]" label="360°" title="Mișcare." variant="primary" />
            <div className="grid gap-3">
              <VisualMoment className="min-h-[205px] md:min-h-0" label="PHOTO" title="Cadru." variant="mirror" />
              <VisualMoment className="min-h-[205px] md:min-h-0" label="FX" title="Atmosferă." variant="fx" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.07] bg-[#10090b] px-4 py-14 sm:px-6 md:px-9 md:py-16">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#c94558]">Prețuri</p>
            <h2 className="mt-3 text-[36px] font-semibold tracking-[-0.055em] sm:text-[48px]">Separat. Clar.</h2>
          </div>
          <Link
            href="/templates/obsidian-moments/preturi"
            className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-[11px] font-bold text-black"
          >
            Vezi prețurile →
          </Link>
        </div>
      </section>

      <section id="contact" className="px-4 py-16 sm:px-6 md:px-9 md:py-24">
        <div className="mx-auto grid max-w-[1480px] gap-8 lg:grid-cols-[.78fr_1.22fr]">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.23em] text-[#c94558]">Contact</p>
            <h2 className="mt-4 max-w-xl text-[46px] font-semibold leading-[0.9] tracking-[-0.065em] sm:text-[68px]">Ai data. Ai locul. Hai.</h2>
            <div className="mt-7 flex flex-wrap gap-2">
              <ContactChip label="București" />
              <a
                href="https://obsidianmoments360.ro/"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/[0.09] bg-white/[0.035] px-4 py-2.5 text-[10px] font-semibold text-white/55 transition hover:text-white"
              >
                obsidianmoments360.ro ↗
              </a>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/[0.08] bg-[#0b0a0b] p-5 sm:p-7">
            <div className="grid gap-3 sm:grid-cols-2">
              <DemoField label="Nume" value="Numele tău" />
              <DemoField label="Telefon" value="07xx xxx xxx" />
              <DemoField label="Data" value="zz / ll / aaaa" />
              <DemoField label="Locație" value="Oraș / locație" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {eventTypes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setEventType(item)}
                  className={`rounded-full border px-4 py-2.5 text-[9px] font-semibold transition ${
                    eventType === item
                      ? "border-[#a42131]/60 bg-[#a42131]/18 text-white"
                      : "border-white/[0.08] bg-black text-white/35"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="mt-5 flex h-[50px] w-full items-center justify-center rounded-full bg-[#a42131] px-6 text-[11px] font-bold text-white shadow-[0_14px_45px_rgba(164,33,49,.2)]"
            >
              Cere ofertă
            </button>
            <p className="mt-3 text-center text-[8px] text-white/20">Demo ORBYVEN · formularul rămâne vizual deocamdată.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.07] px-4 py-7 sm:px-6 md:px-9">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark small />
            <div>
              <p className="text-[12px] font-semibold">OBSIDIAN MOMENTS 360</p>
              <p className="mt-1 text-[8px] uppercase tracking-[0.16em] text-white/24">București · event experiences</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-5 text-[9px] font-semibold text-white/32">
            <a href="#experiente">Experiențe</a>
            <Link href="/templates/obsidian-moments/preturi">Prețuri</Link>
            <a href="#contact">Contact</a>
            <Link href="/templates">ORBYVEN ↗</Link>
          </div>
        </div>
      </footer>

      <div className="pointer-events-none fixed bottom-3 left-3 z-40 rounded-full border border-white/[0.08] bg-black/55 px-3 py-2 text-[7px] font-semibold uppercase tracking-[0.16em] text-white/22 backdrop-blur-xl">
        Pilot #001 · ORBYVEN
      </div>
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

function VisualMoment({
  className,
  label,
  title,
  variant,
}: {
  className: string;
  label: string;
  title: string;
  variant: "primary" | "mirror" | "fx";
}) {
  const background =
    variant === "primary"
      ? "radial-gradient(circle at 60% 38%, rgba(183,45,66,.28), transparent 26%), linear-gradient(145deg,#24080d,#060606 68%)"
      : variant === "mirror"
        ? "radial-gradient(circle at 40% 42%, rgba(255,255,255,.11), transparent 18%), linear-gradient(145deg,#151215,#060606)"
        : "radial-gradient(circle at 68% 50%, rgba(164,33,49,.24), transparent 30%), linear-gradient(145deg,#180a0d,#050505)";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`group relative overflow-hidden rounded-[28px] border border-white/[0.07] ${className}`}
      style={{ background }}
    >
      <motion.div
        aria-hidden="true"
        className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/[0.08]"
        animate={{ rotate: 360 }}
        transition={{ duration: variant === "primary" ? 30 : 22, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
        <p className="text-[8px] font-bold uppercase tracking-[0.19em] text-[#d14d60]">{label}</p>
        <p className="mt-2 text-[38px] font-semibold tracking-[-0.06em] sm:text-[48px]">{title}</p>
      </div>
    </motion.div>
  );
}

function ContactChip({ label }: { label: string }) {
  return <span className="rounded-full border border-white/[0.09] bg-white/[0.035] px-4 py-2.5 text-[10px] font-semibold text-white/55">{label}</span>;
}

function DemoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-2 text-[7px] font-bold uppercase tracking-[0.18em] text-white/25">{label}</p>
      <div className="rounded-[14px] border border-white/[0.07] bg-black/45 px-4 py-3.5 text-[10px] text-white/27">{value}</div>
    </div>
  );
}
