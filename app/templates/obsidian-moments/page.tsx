"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

const phoneHref = "tel:0729753760";
const whatsappHref = "https://wa.me/40729753760";

const services = [
  {
    number: "01",
    title: "Platformă 360°",
    hero: "360°",
    kicker: "Video din toate unghiurile",
    points: ["Slow-motion", "Share instant", "Efecte personalizate"],
  },
  {
    number: "02",
    title: "Oglindă Foto",
    hero: "FOTO",
    kicker: "Foto premium, pe loc",
    points: ["Print instant", "Props premium", "Galerie digitală"],
  },
  {
    number: "03",
    title: "Efecte Speciale",
    hero: "WOW",
    kicker: "Atmosferă pentru moment",
    points: ["Fum greu", "Confetti", "Lumini & baloane"],
  },
];

const stats = [
  { value: "500+", label: "evenimente" },
  { value: "500+", label: "clienți" },
  { value: "2500+", label: "ore producție" },
];

const flashes = [
  [12, 18, 0.2, 4.8], [29, 13, 0.1, 6.1], [71, 17, 0.4, 5.4], [88, 29, 0.7, 6.6],
  [19, 48, 0.5, 5.9], [77, 52, 0.15, 4.5], [91, 68, 0.9, 5.1], [9, 73, 0.65, 6.4],
  [42, 25, 0.85, 7.1], [57, 68, 0.3, 5.7], [34, 82, 0.6, 4.9], [68, 87, 0.95, 6.2],
];

export default function ObsidianMomentsTemplatePage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end end"] });

  const leftCurtain = useTransform(scrollYProgress, [0.025, 0.48], ["0%", "-97%"]);
  const rightCurtain = useTransform(scrollYProgress, [0.025, 0.48], ["0%", "97%"]);
  const logoScale = useTransform(scrollYProgress, [0, 0.46], [1, 0.78]);
  const logoY = useTransform(scrollYProgress, [0, 0.46], [0, -82]);
  const contentY = useTransform(scrollYProgress, [0, 0.18, 0.5], [0, 24, 58]);
  const actionsOpacity = useTransform(scrollYProgress, [0.03, 0.09, 0.18], [0, 0.88, 1]);
  const actionsY = useTransform(scrollYProgress, [0.03, 0.18], [54, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.09], [1, 0]);

  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[#090909] text-[#f5f1e7]"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif" }}
    >
      <header className="sticky top-0 z-50 border-b border-[#d8b438]/10 bg-[#090909]/86 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-3 sm:px-6 md:px-9">
          <a href="#acasa" className="flex min-w-0 items-center gap-3">
            <Image src="/obsidian/mark.svg" alt="Obsidian Moments" width={44} height={44} className="h-11 w-11 rounded-full" priority />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold tracking-[-0.035em] sm:text-[14px]">Obsidian Moments 360</p>
              <p className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.2em] text-[#d8b438]/62">premium event experience</p>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-[10px] font-semibold text-white/45 md:flex">
            <a href="#acasa" className="transition hover:text-[#e4c34f]">Acasă</a>
            <a href="#servicii" className="transition hover:text-[#e4c34f]">Servicii</a>
            <a href="#despre" className="transition hover:text-[#e4c34f]">Despre noi</a>
            <Link href="/templates/obsidian-moments/preturi" className="transition hover:text-[#e4c34f]">Prețuri</Link>
            <Link href="/templates/obsidian-moments/contact" className="transition hover:text-[#e4c34f]">Contact</Link>
          </nav>

          <Link href="/templates/obsidian-moments/contact" className="shrink-0 rounded-full bg-[#d8b438] px-4 py-2.5 text-[10px] font-bold text-[#111] shadow-[0_12px_38px_rgba(216,180,56,.18)] transition hover:-translate-y-0.5 sm:px-5">
            Verifică data
          </Link>
        </div>

        <nav className="mx-auto flex max-w-[1480px] gap-5 overflow-x-auto px-4 pb-3 text-[9px] font-semibold text-white/38 [scrollbar-width:none] sm:px-6 md:hidden">
          <a href="#servicii" className="whitespace-nowrap">Servicii</a>
          <a href="#despre" className="whitespace-nowrap">Despre</a>
          <Link href="/templates/obsidian-moments/preturi" className="whitespace-nowrap">Prețuri</Link>
          <Link href="/templates/obsidian-moments/contact" className="whitespace-nowrap">Contact</Link>
        </nav>
      </header>

      <section ref={heroRef} id="acasa" className="relative h-[178svh]">
        <div className="sticky top-0 isolate flex min-h-[100svh] overflow-hidden px-4 pb-8 pt-8 sm:px-6 md:px-9">
          <div aria-hidden="true" className="absolute inset-0 -z-30 bg-[#090909]" />
          <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_36%,rgba(216,180,56,.15),transparent_31%),radial-gradient(circle_at_14%_72%,rgba(216,180,56,.06),transparent_25%),radial-gradient(circle_at_88%_63%,rgba(216,180,56,.07),transparent_23%)]" />
          <div aria-hidden="true" className="absolute inset-0 -z-20 opacity-[0.035] [background-image:radial-gradient(circle_at_center,#d8b438_0.65px,transparent_0.65px)] [background-size:11px_11px]" />

          {flashes.map(([left, top, delay, duration], index) => (
            <motion.span
              key={index}
              aria-hidden="true"
              className="absolute z-0 h-1.5 w-1.5 rounded-full bg-[#f8e8a7] shadow-[0_0_18px_6px_rgba(246,218,126,.22)]"
              style={{ left: `${left}%`, top: `${top}%` }}
              animate={{ opacity: [0.05, 0.16, 0.92, 0.12, 0.05], scale: [0.7, 1, 2.8, 1, 0.7] }}
              transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}

          <motion.div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-1/2 border-r border-[#d8b438]/10 bg-[linear-gradient(90deg,#090909_20%,#11100c_100%)]" style={{ x: leftCurtain }} />
          <motion.div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-1/2 border-l border-[#d8b438]/10 bg-[linear-gradient(270deg,#090909_20%,#11100c_100%)]" style={{ x: rightCurtain }} />
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 z-[2] h-full w-px -translate-x-1/2 bg-[linear-gradient(180deg,transparent,rgba(216,180,56,.42),transparent)]" />

          <div className="relative z-20 mx-auto flex w-full max-w-[1480px] flex-col items-center justify-center text-center">
            <motion.div style={{ scale: logoScale, y: logoY }} className="relative">
              <div aria-hidden="true" className="absolute inset-0 rounded-full bg-[#d8b438]/11 blur-[72px]" />
              <Image src="/obsidian/mark.svg" alt="Logo Obsidian Moments" width={330} height={330} className="relative h-[175px] w-[175px] rounded-full sm:h-[230px] sm:w-[230px] md:h-[300px] md:w-[300px]" priority />
            </motion.div>

            <motion.div style={{ y: contentY }} className="mt-5 w-full">
              <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-[#d8b438]/82 sm:text-[9px]">Premium Event Experience</p>
              <h1 className="mx-auto mt-4 max-w-[1120px] text-[clamp(52px,9vw,132px)] font-semibold leading-[0.84] tracking-[-0.076em]">
                Capturăm momente.<br /><span className="text-[#d8b438]">Creăm amintiri.</span>
              </h1>

              <motion.div style={{ opacity: actionsOpacity, y: actionsY }} className="mx-auto mt-8 w-full max-w-4xl rounded-[26px] border border-[#d8b438]/10 bg-black/38 p-4 shadow-[0_24px_80px_rgba(0,0,0,.30)] backdrop-blur-md sm:p-6">
                <p className="mx-auto max-w-xl text-[12px] font-medium leading-6 text-white/72 sm:text-[14px]">Platformă 360° · Oglindă Foto Premium · Efecte Speciale</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link href="/templates/obsidian-moments/contact" className="rounded-full bg-[#d8b438] px-6 py-3.5 text-[11px] font-bold text-[#111] shadow-[0_12px_30px_rgba(216,180,56,.18)] transition hover:-translate-y-0.5">Verifică disponibilitatea live</Link>
                  <Link href="/templates/obsidian-moments/preturi" className="rounded-full border border-[#d8b438]/36 bg-black/35 px-6 py-3.5 text-[11px] font-bold text-[#f0d777] transition hover:border-[#d8b438]/60 hover:bg-[#d8b438]/[0.07]">Vezi prețurile</Link>
                </div>
                <div className="mx-auto mt-7 grid max-w-2xl grid-cols-3 border-y border-[#d8b438]/16 py-4">
                  {stats.map((stat, index) => (
                    <div key={stat.label} className={`px-3 ${index < stats.length - 1 ? "border-r border-[#d8b438]/16" : ""}`}>
                      <p className="text-[23px] font-semibold tracking-[-0.05em] text-white sm:text-[29px]">{stat.value}</p>
                      <p className="mt-1 text-[7px] font-semibold uppercase tracking-[0.14em] text-white/52">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            <motion.div style={{ opacity: cueOpacity }} className="absolute bottom-7 left-1/2 -translate-x-1/2 text-center">
              <p className="text-[7px] font-bold uppercase tracking-[0.24em] text-white/42">scroll</p>
              <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.8, repeat: Infinity }} className="mx-auto mt-2 h-8 w-px bg-[linear-gradient(#d8b438,transparent)]" />
            </motion.div>
          </div>
        </div>
      </section>

      <section id="servicii" className="border-y border-[#d8b438]/10 bg-[#0f0f0f] px-4 py-16 sm:px-6 md:px-9 md:py-24">
        <div className="mx-auto max-w-[1480px]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#d8b438]">Servicii</p>
              <h2 className="mt-4 text-[44px] font-semibold leading-[0.93] tracking-[-0.062em] sm:text-[62px]">Alegi experiența.<br />Noi facem restul.</h2>
            </div>
            <Link href="/templates/obsidian-moments/preturi" className="text-[11px] font-bold text-[#e1c45b] transition hover:text-[#f2dc86]">Vezi pachetele →</Link>
          </div>

          <div className="mt-9 grid gap-3 md:grid-cols-3">
            {services.map((service, index) => (
              <motion.article
                key={service.title}
                whileHover={{ y: -6, scale: 1.008 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.22 }}
                className="group relative min-h-[205px] overflow-hidden rounded-[23px] border border-[#d8b438]/10 bg-[#090909] p-5"
              >
                <motion.div aria-hidden="true" className="absolute -right-2 bottom-[-18px] text-[86px] font-black leading-none tracking-[-0.09em] text-[#d8b438]/[0.055] sm:text-[102px]" whileHover={{ y: -5 }}>
                  {service.hero}
                </motion.div>
                <div aria-hidden="true" className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#d8b438]/8 blur-[58px] transition duration-500 group-hover:bg-[#d8b438]/15" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-[8px] font-bold text-[#d8b438]/48">{service.number}</span>
                    <motion.span animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1.2, 0.9] }} transition={{ duration: 3.2 + index * 0.4, repeat: Infinity }} className="h-2 w-2 rounded-full bg-[#d8b438] shadow-[0_0_18px_rgba(216,180,56,.55)]" />
                  </div>
                  <div className="pt-9">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#d8b438]/62">{service.kicker}</p>
                    <h3 className="mt-2 text-[25px] font-semibold tracking-[-0.055em]">{service.title}</h3>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {service.points.map((point) => <span key={point} className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1.5 text-[7px] font-semibold text-white/35">{point}</span>)}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="despre" className="px-4 py-16 sm:px-6 md:px-9 md:py-24">
        <div className="mx-auto grid max-w-[1480px] gap-3 lg:grid-cols-[1.25fr_.75fr]">
          <motion.div whileHover={{ y: -4 }} className="group relative min-h-[390px] overflow-hidden rounded-[30px] border border-[#d8b438]/10 bg-[#101010] p-7 sm:p-9 md:min-h-[480px]">
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(216,180,56,.15),transparent_28%),linear-gradient(145deg,#151515,#090909)]" />
            <div aria-hidden="true" className="absolute -right-6 top-8 text-[clamp(92px,16vw,230px)] font-black leading-none tracking-[-0.1em] text-[#d8b438]/[0.045] transition duration-700 group-hover:-translate-y-3 group-hover:text-[#d8b438]/[0.07]">CREĂM</div>
            <motion.div aria-hidden="true" className="absolute right-[10%] top-[24%] h-48 w-48 rounded-full border border-[#d8b438]/18" animate={{ rotate: 360 }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }} />
            <div className="relative flex h-full max-w-xl flex-col justify-end">
              <p className="text-[9px] font-bold uppercase tracking-[0.23em] text-[#d8b438]">Despre noi</p>
              <h2 className="mt-4 text-[46px] font-semibold leading-[0.92] tracking-[-0.062em] sm:text-[66px]">Creăm experiențe.<br />Tu trăiești momentul.</h2>
              <p className="mt-5 max-w-md text-[12px] leading-6 text-white/35">Nunți · botezuri · aniversări · corporate.</p>
            </div>
          </motion.div>

          <div className="grid gap-3">
            <MiniFeature hero="360" eyebrow="Mișcare" title="Clipuri care rămân după eveniment." delay={0} />
            <MiniFeature hero="PRINT" eyebrow="Pe loc" title="Fotografii pregătite pentru invitați." delay={0.3} />
            <MiniFeature hero="WOW" eyebrow="Atmosferă" title="Efecte pentru momentele importante." delay={0.6} />
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-6 md:px-9">
        <div className="mx-auto max-w-[1480px] overflow-hidden rounded-[32px] border border-[#d8b438]/16 bg-[#d8b438] px-6 py-12 text-[#111] sm:px-8 md:px-12 md:py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-black/45">Rezervare</p>
              <h2 className="mt-4 max-w-4xl text-[46px] font-semibold leading-[0.92] tracking-[-0.065em] sm:text-[68px]">Ai data?<br />Vezi disponibilitatea live.</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/templates/obsidian-moments/contact" className="rounded-full bg-[#111] px-6 py-3.5 text-[11px] font-bold text-white">Deschide calendarul</Link>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="rounded-full border border-black/18 bg-white/35 px-6 py-3.5 text-[11px] font-bold">WhatsApp →</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d8b438]/10 px-4 py-7 sm:px-6 md:px-9">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-4 text-[9px] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <span>Obsidian Moments 360 · Premium Event Experience</span>
          <div className="flex flex-wrap gap-5">
            <Link href="/templates/obsidian-moments/preturi">Prețuri</Link>
            <Link href="/templates/obsidian-moments/contact">Contact</Link>
            <a href={phoneHref}>0729 753 760</a>
            <a href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a>
            <Link href="/templates">ORBYVEN ↗</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function MiniFeature({ hero, eyebrow, title, delay }: { hero: string; eyebrow: string; title: string; delay: number }) {
  return (
    <motion.div whileHover={{ x: 5 }} className="group relative min-h-[126px] overflow-hidden rounded-[23px] border border-[#d8b438]/10 bg-[#101010] p-5">
      <div aria-hidden="true" className="absolute -right-1 bottom-[-10px] text-[58px] font-black leading-none tracking-[-0.08em] text-[#d8b438]/[0.05] transition group-hover:text-[#d8b438]/[0.09]">{hero}</div>
      <motion.span aria-hidden="true" className="absolute right-5 top-5 h-1.5 w-1.5 rounded-full bg-[#d8b438]" animate={{ opacity: [0.25, 1, 0.25] }} transition={{ duration: 3.2, delay, repeat: Infinity }} />
      <div className="relative">
        <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#d8b438]/55">{eyebrow}</p>
        <p className="mt-5 max-w-[300px] text-[20px] font-semibold leading-[1.03] tracking-[-0.045em]">{title}</p>
      </div>
    </motion.div>
  );
}
