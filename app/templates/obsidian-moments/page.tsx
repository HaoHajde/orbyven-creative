"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const phoneHref = "tel:0729753760";
const whatsappHref = "https://wa.me/40729753760";

const services = [
  {
    number: "01",
    title: "Platformă 360°",
    kicker: "Video din toate unghiurile",
    points: ["Slow-motion", "Share instant", "Efecte personalizate"],
  },
  {
    number: "02",
    title: "Oglindă Foto",
    kicker: "Foto premium, pe loc",
    points: ["Print instant", "Props incluse", "Galerie digitală"],
  },
  {
    number: "03",
    title: "Efecte Speciale",
    kicker: "Momentul primește atmosferă",
    points: ["Fum greu", "Confetti", "Lumini & baloane"],
  },
];

const stats = [
  { value: "500+", label: "evenimente" },
  { value: "500+", label: "clienți" },
  { value: "2500+", label: "ore producție" },
];

export default function ObsidianMomentsTemplatePage() {
  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[#0b0b0b] text-[#f5f1e7]"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif",
      }}
    >
      <header className="sticky top-0 z-50 border-b border-[#d8b438]/10 bg-[#0b0b0b]/88 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 md:px-9">
          <a href="#acasa" className="flex min-w-0 items-center gap-3">
            <BrandMark />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold tracking-[-0.035em] sm:text-[14px]">
                ObsidianMoments360
              </p>
              <p className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.2em] text-[#d8b438]/62">
                premium event experience
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-[10px] font-semibold text-white/45 md:flex">
            <a href="#acasa" className="transition hover:text-[#e4c34f]">Acasă</a>
            <a href="#servicii" className="transition hover:text-[#e4c34f]">Servicii</a>
            <Link href="/templates/obsidian-moments/preturi" className="transition hover:text-[#e4c34f]">Prețuri</Link>
            <a href="#contact" className="transition hover:text-[#e4c34f]">Contact</a>
          </nav>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-full bg-[#d8b438] px-4 py-2.5 text-[10px] font-bold text-[#111] shadow-[0_12px_38px_rgba(216,180,56,.18)] transition hover:-translate-y-0.5 sm:px-5"
          >
            WhatsApp
          </a>
        </div>

        <nav className="mx-auto flex max-w-[1480px] gap-5 overflow-x-auto px-4 pb-3 text-[9px] font-semibold text-white/38 [scrollbar-width:none] sm:px-6 md:hidden">
          <a href="#acasa" className="whitespace-nowrap">Acasă</a>
          <a href="#servicii" className="whitespace-nowrap">Servicii</a>
          <Link href="/templates/obsidian-moments/preturi" className="whitespace-nowrap">Prețuri</Link>
          <a href="#contact" className="whitespace-nowrap">Contact</a>
        </nav>
      </header>

      <section id="acasa" className="relative isolate min-h-[90svh] overflow-hidden px-4 pb-16 pt-12 sm:px-6 md:px-9 md:pb-24 md:pt-16">
        <div aria-hidden="true" className="absolute inset-0 -z-30 bg-[#0b0b0b]" />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-20 h-[84%]"
          style={{
            background:
              "radial-gradient(circle at 72% 28%, rgba(216,180,56,.17), transparent 25%), radial-gradient(circle at 30% 18%, rgba(216,180,56,.08), transparent 30%)",
          }}
        />
        <div aria-hidden="true" className="absolute inset-0 -z-20 opacity-[0.045] [background-image:radial-gradient(circle_at_center,#d8b438_0.65px,transparent_0.65px)] [background-size:10px_10px]" />

        <div className="mx-auto grid min-h-[76svh] max-w-[1480px] items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
          <div className="relative z-10 pt-2 md:pt-6">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
              className="text-[9px] font-bold uppercase tracking-[0.27em] text-[#d8b438]"
            >
              Premium Event Experience
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 34 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.95, delay: 0.07 }}
              className="mt-6 max-w-[1050px] text-[clamp(58px,9.6vw,138px)] font-semibold leading-[0.84] tracking-[-0.078em]"
            >
              Transformăm
              <span className="block text-[#d8b438]">momentele</span>
              <span className="block">în amintiri.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.24 }}
              className="mt-7 max-w-xl text-[13px] leading-6 text-white/43 sm:text-[15px]"
            >
              Platformă 360 · Oglindă Foto Premium · Efecte Speciale
            </motion.p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={phoneHref}
                className="rounded-full bg-[#d8b438] px-6 py-3.5 text-[11px] font-bold text-[#111] transition hover:-translate-y-0.5"
              >
                Sună acum
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[#d8b438]/22 bg-[#d8b438]/[0.045] px-6 py-3.5 text-[11px] font-bold text-[#ead16f] backdrop-blur-xl transition hover:bg-[#d8b438]/[0.09]"
              >
                Rezervă pe WhatsApp
              </a>
            </div>

            <div className="mt-11 grid max-w-2xl grid-cols-3 border-y border-[#d8b438]/12 py-5">
              {stats.map((stat, index) => (
                <div key={stat.label} className={`px-3 first:pl-0 ${index < stats.length - 1 ? "border-r border-[#d8b438]/12" : ""}`}>
                  <p className="text-[22px] font-semibold tracking-[-0.05em] sm:text-[28px]">{stat.value}</p>
                  <p className="mt-1 text-[7px] uppercase tracking-[0.14em] text-white/28">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <HeroVisual />
        </div>
      </section>

      <section id="servicii" className="border-y border-[#d8b438]/10 bg-[#101010] px-4 py-16 sm:px-6 md:px-9 md:py-24">
        <div className="mx-auto max-w-[1480px]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#d8b438]">Serviciile noastre</p>
              <h2 className="mt-4 text-[42px] font-semibold leading-[0.95] tracking-[-0.06em] sm:text-[58px]">Experiențe premium.<br />Fără complicații.</h2>
            </div>
            <Link href="/templates/obsidian-moments/preturi" className="text-[11px] font-bold text-[#e1c45b] transition hover:text-[#f2dc86]">Vezi pachetele →</Link>
          </div>

          <div className="mt-9 grid gap-3 md:grid-cols-3">
            {services.map((service) => (
              <motion.article
                key={service.title}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.22 }}
                className="group relative min-h-[230px] overflow-hidden rounded-[24px] border border-[#d8b438]/10 bg-[#0b0b0b] p-5"
              >
                <div aria-hidden="true" className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-[#d8b438]/10 blur-[58px] transition duration-500 group-hover:bg-[#d8b438]/16" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-[8px] font-bold text-[#d8b438]/55">{service.number}</span>
                    <span className="h-2 w-2 rounded-full bg-[#d8b438] shadow-[0_0_18px_rgba(216,180,56,.55)]" />
                  </div>
                  <div className="pt-10">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#d8b438]/65">{service.kicker}</p>
                    <h3 className="mt-3 text-[27px] font-semibold tracking-[-0.055em]">{service.title}</h3>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {service.points.map((point) => (
                        <span key={point} className="rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[8px] font-semibold text-white/38">
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 md:px-9 md:py-24">
        <div className="mx-auto grid max-w-[1480px] gap-3 lg:grid-cols-[1.2fr_.8fr]">
          <div className="relative min-h-[420px] overflow-hidden rounded-[30px] border border-[#d8b438]/10 bg-[#111] p-7 sm:p-9 md:min-h-[520px]">
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_74%_30%,rgba(216,180,56,.16),transparent_27%),linear-gradient(145deg,#161616,#090909)]" />
            <motion.div aria-hidden="true" className="absolute right-[10%] top-[12%] h-64 w-64 rounded-full border border-[#d8b438]/22" animate={{ rotate: 360 }} transition={{ duration: 26, repeat: Infinity, ease: "linear" }} />
            <motion.div aria-hidden="true" className="absolute right-[18%] top-[25%] h-36 w-36 rounded-full border border-white/10" animate={{ rotate: -360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} />
            <div className="relative flex h-full max-w-xl flex-col justify-end">
              <p className="text-[9px] font-bold uppercase tracking-[0.23em] text-[#d8b438]">Despre noi</p>
              <h2 className="mt-4 text-[44px] font-semibold leading-[0.94] tracking-[-0.06em] sm:text-[62px]">Cream experiențe.<br />Tu trăiești momentul.</h2>
              <p className="mt-5 max-w-md text-[13px] leading-6 text-white/38">Nunți, botezuri, aniversări și evenimente corporate.</p>
            </div>
          </div>

          <div className="grid gap-3">
            <QuickCard eyebrow="Potrivit pentru" title="Nunți · Botezuri · Petreceri · Corporate" />
            <QuickCard eyebrow="Rapid" title="Conținut pregătit pentru share." />
            <QuickCard eyebrow="Simplu" title="Alegi pachetul. Confirmi data." />
          </div>
        </div>
      </section>

      <section id="contact" className="px-4 pb-8 sm:px-6 md:px-9">
        <div className="mx-auto max-w-[1480px] overflow-hidden rounded-[32px] border border-[#d8b438]/16 bg-[#d8b438] px-6 py-12 text-[#111] sm:px-8 md:px-12 md:py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-black/45">ObsidianMoments360</p>
              <h2 className="mt-4 max-w-4xl text-[46px] font-semibold leading-[0.92] tracking-[-0.065em] sm:text-[68px]">Ai data?<br />Hai să rezervăm momentul.</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={phoneHref} className="rounded-full bg-[#111] px-6 py-3.5 text-[11px] font-bold text-white">0729 753 760</a>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="rounded-full border border-black/18 bg-white/35 px-6 py-3.5 text-[11px] font-bold">WhatsApp →</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d8b438]/10 px-4 py-7 sm:px-6 md:px-9">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-4 text-[9px] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <span>ObsidianMoments360 · Premium Event Experience</span>
          <div className="flex gap-5">
            <Link href="/templates/obsidian-moments/preturi">Prețuri</Link>
            <a href={phoneHref}>Sună</a>
            <a href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a>
            <Link href="/templates">ORBYVEN ↗</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function BrandMark() {
  return (
    <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#d8b438]/38 bg-[#12110d] shadow-[0_0_32px_rgba(216,180,56,.12)]">
      <span className="absolute h-6 w-6 rounded-full border border-[#d8b438]/62" />
      <span className="absolute h-1.5 w-1.5 rounded-full bg-[#d8b438] shadow-[0_0_14px_rgba(216,180,56,.75)]" />
    </span>
  );
}

function HeroVisual() {
  return (
    <div className="relative min-h-[390px] sm:min-h-[470px] lg:min-h-[620px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.95, delay: 0.12 }}
        className="absolute inset-[3%_1%_8%_7%] overflow-hidden rounded-[42px] border border-[#d8b438]/13 bg-[linear-gradient(155deg,#17160f,#0e0e0d_52%,#070707)] shadow-[0_55px_130px_rgba(0,0,0,.58)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(216,180,56,.18),transparent_26%)]" />
        {Array.from({ length: 16 }).map((_, index) => (
          <motion.span
            key={index}
            aria-hidden="true"
            className="absolute h-[2px] w-8 rounded-full bg-[#d8b438]/45"
            style={{
              left: `${8 + ((index * 23) % 78)}%`,
              top: `${10 + ((index * 31) % 72)}%`,
              rotate: `${(index * 37) % 170}deg`,
            }}
            animate={{ y: [0, -9 - (index % 4) * 3, 0], opacity: [0.18, 0.72, 0.18] }}
            transition={{ duration: 4 + (index % 5), repeat: Infinity, delay: index * 0.13, ease: "easeInOut" }}
          />
        ))}
        <motion.div
          className="absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d8b438]/55 sm:h-[315px] sm:w-[315px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 17, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute left-1/2 top-[-7px] h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-[#d8b438] shadow-[0_0_24px_rgba(216,180,56,.8)]" />
        </motion.div>
        <div className="absolute left-1/2 top-1/2 grid h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#d8b438]/12 bg-black/65 sm:h-[190px] sm:w-[190px]">
          <div className="text-center">
            <p className="text-[42px] font-semibold tracking-[-0.075em] text-[#e3c34d] sm:text-[54px]">360°</p>
            <p className="mt-1 text-[7px] uppercase tracking-[0.22em] text-white/28">premium moment</p>
          </div>
        </div>
        <div className="absolute inset-x-5 bottom-5 flex items-center justify-between rounded-[18px] border border-[#d8b438]/10 bg-black/50 px-4 py-3 backdrop-blur-xl">
          <div>
            <p className="text-[7px] uppercase tracking-[0.18em] text-[#d8b438]/58">ObsidianMoments360</p>
            <p className="mt-1 text-[11px] font-semibold">Ready for your event.</p>
          </div>
          <span className="h-2 w-2 rounded-full bg-[#d8b438] shadow-[0_0_16px_rgba(216,180,56,.7)]" />
        </div>
      </motion.div>
    </div>
  );
}

function QuickCard({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <motion.div whileHover={{ x: 4 }} className="rounded-[24px] border border-[#d8b438]/10 bg-[#101010] p-6 transition">
      <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#d8b438]/55">{eyebrow}</p>
      <p className="mt-5 text-[23px] font-semibold leading-[1.03] tracking-[-0.045em]">{title}</p>
    </motion.div>
  );
}
