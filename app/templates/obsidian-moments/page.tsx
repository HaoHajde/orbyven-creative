"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const services = [
  {
    number: "01",
    title: "Platformă 360°",
    short: "Momentul devine clip.",
    copy: "O experiență construită pentru energie, mișcare și conținut care se păstrează după eveniment.",
    detail: "360°",
  },
  {
    number: "02",
    title: "Oglindă Magică",
    short: "Invitații intră în cadru.",
    copy: "Un punct de atracție simplu și interactiv, integrat natural în atmosfera evenimentului.",
    detail: "PHOTO",
  },
  {
    number: "03",
    title: "Fum & baloane",
    short: "Dansul primește atmosferă.",
    copy: "Efecte pentru dansul mirilor și alte momente-cheie ale serii, fără să încarce vizual cadrul.",
    detail: "FX",
  },
  {
    number: "04",
    title: "Tort de shot-uri",
    short: "Un moment pentru toată lumea.",
    copy: "Setup pentru până la 200 de pahare, gândit ca moment social, nu doar ca element de decor.",
    detail: "200",
  },
];

const eventTypes = ["Nuntă", "Botez", "Aniversare", "Corporate", "Alt eveniment"];

export default function ObsidianMomentsTemplatePage() {
  const [activeService, setActiveService] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState("Nuntă");

  const service = services[activeService];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#070607] text-[#f6f0ea]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif" }}>
      <div className="border-b border-white/8 bg-black/60 px-5 py-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/35 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5">
          <span>ORBYVEN · Client template · Pilot #001</span>
          <Link href="/templates" className="transition hover:text-white/70">Înapoi la template-uri ↗</Link>
        </div>
      </div>

      <header className="relative z-30 mx-auto flex max-w-[1500px] items-center justify-between px-5 py-5 sm:px-7 md:px-10">
        <a href="#acasa" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-[#8f2432]/50 bg-[#24090d] text-[12px] font-black tracking-[-0.08em] shadow-[0_0_40px_rgba(143,36,50,.18)]">O°</span>
          <div>
            <p className="text-[14px] font-semibold tracking-[-0.035em]">OBSIDIAN MOMENTS</p>
            <p className="mt-0.5 text-[7px] uppercase tracking-[0.24em] text-white/28">360 · event experiences</p>
          </div>
        </a>

        <nav className="hidden items-center gap-7 text-[10px] font-semibold text-white/45 md:flex">
          <a href="#experiente" className="transition hover:text-white">Experiențe</a>
          <a href="#cum-functioneaza" className="transition hover:text-white">Cum funcționează</a>
          <a href="#oferta" className="transition hover:text-white">Ofertă</a>
        </nav>

        <a href="#oferta" className="rounded-full border border-white/12 bg-white px-4 py-2.5 text-[10px] font-bold text-black transition hover:scale-[1.02] sm:px-5">Cere ofertă</a>
      </header>

      <section id="acasa" className="relative isolate min-h-[86svh] overflow-hidden px-5 pb-20 pt-10 sm:px-7 md:px-10 md:pb-28 md:pt-16">
        <div aria-hidden="true" className="absolute inset-0 -z-30 bg-[#070607]" />
        <div aria-hidden="true" className="absolute left-1/2 top-[-32%] -z-20 h-[780px] w-[980px] -translate-x-1/2 rounded-full bg-[#671724]/28 blur-[150px]" />
        <motion.div aria-hidden="true" className="absolute right-[-12%] top-[13%] -z-10 h-[520px] w-[520px] rounded-full border border-[#a62b3c]/18" animate={{ rotate: 360 }} transition={{ duration: 36, repeat: Infinity, ease: "linear" }} />
        <motion.div aria-hidden="true" className="absolute right-[4%] top-[27%] -z-10 h-[270px] w-[270px] rounded-full border border-white/8" animate={{ rotate: -360, scale: [1, 1.07, 1] }} transition={{ rotate: { duration: 24, repeat: Infinity, ease: "linear" }, scale: { duration: 7, repeat: Infinity, ease: "easeInOut" } }} />
        <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-[0.035] [background-image:radial-gradient(circle_at_center,#fff_0.7px,transparent_0.7px)] [background-size:8px_8px]" />

        <div className="mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-[1.08fr_.92fr] lg:items-end">
          <div className="pt-10 md:pt-16">
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }} className="text-[9px] font-bold uppercase tracking-[0.27em] text-[#c35666]">
              București · experiențe pentru evenimente
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .9, delay: .08 }} className="mt-6 max-w-[980px] text-[clamp(56px,9vw,132px)] font-semibold leading-[.86] tracking-[-.075em]">
              Nu doar poze.<br />Un moment.
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .8, delay: .25 }} className="mt-7 max-w-xl text-[15px] leading-7 text-white/48 md:text-[17px] md:leading-8">
              Platformă 360°, Oglindă Magică și efecte construite pentru momentele în care vrei ca invitații să participe, nu doar să privească.
            </motion.p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#oferta" className="rounded-full bg-[#9d2637] px-6 py-3.5 text-[12px] font-bold text-white shadow-[0_12px_50px_rgba(157,38,55,.24)] transition hover:-translate-y-0.5">Cere o ofertă →</a>
              <a href="#experiente" className="rounded-full border border-white/14 bg-white/[.035] px-6 py-3.5 text-[12px] font-bold text-white/78 backdrop-blur-xl transition hover:bg-white/[.07]">Vezi experiențele</a>
            </div>

            <div className="mt-12 grid max-w-2xl grid-cols-3 border-y border-white/9 py-5">
              <div className="border-r border-white/9 pr-4"><p className="text-[22px] font-semibold tracking-[-.04em]">4</p><p className="mt-1 text-[7px] uppercase tracking-[.15em] text-white/30">experiențe</p></div>
              <div className="border-r border-white/9 px-4"><p className="text-[22px] font-semibold tracking-[-.04em]">360°</p><p className="mt-1 text-[7px] uppercase tracking-[.15em] text-white/30">video moment</p></div>
              <div className="pl-4"><p className="text-[22px] font-semibold tracking-[-.04em]">București</p><p className="mt-1 text-[7px] uppercase tracking-[.15em] text-white/30">& deplasare</p></div>
            </div>
          </div>

          <div className="relative min-h-[430px] lg:min-h-[620px]">
            <motion.div className="absolute inset-[5%_3%_12%_10%] overflow-hidden rounded-[42px] border border-white/10 bg-[linear-gradient(155deg,#24080d,#0c0708_58%,#050505)] shadow-[0_50px_120px_rgba(0,0,0,.55)]" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: .12 }}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_48%,rgba(190,48,69,.22),transparent_28%)]" />
              <motion.div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#b42e43]/50" animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }}>
                <div className="absolute left-1/2 top-[-8px] h-4 w-4 -translate-x-1/2 rounded-full bg-[#c93d52] shadow-[0_0_24px_rgba(201,61,82,.75)]" />
              </motion.div>
              <div className="absolute left-1/2 top-1/2 grid h-40 w-40 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/65 shadow-[inset_0_0_60px_rgba(166,43,60,.13)]">
                <div className="text-center"><p className="text-[46px] font-semibold tracking-[-.07em]">360</p><p className="mt-1 text-[8px] uppercase tracking-[.22em] text-white/30">your moment</p></div>
              </div>
              <div className="absolute inset-x-6 bottom-6 flex items-center justify-between rounded-[20px] border border-white/9 bg-black/45 px-5 py-4 backdrop-blur-xl">
                <div><p className="text-[8px] uppercase tracking-[.18em] text-[#d85a6d]">Obsidian experience</p><p className="mt-1 text-[13px] font-semibold">Platformă 360°</p></div>
                <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[.06]">↗</span>
              </div>
            </motion.div>
            <motion.div className="absolute left-0 top-[20%] rounded-[20px] border border-white/10 bg-black/70 px-4 py-3 backdrop-blur-xl" animate={{ y: [0, -9, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}><p className="text-[7px] uppercase tracking-[.16em] text-white/28">event mode</p><p className="mt-1 text-[11px] font-semibold">ON · LIVE</p></motion.div>
            <motion.div className="absolute bottom-[8%] right-0 rounded-[20px] border border-[#9d2637]/25 bg-[#18070a]/85 px-4 py-3 backdrop-blur-xl" animate={{ y: [0, 8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}><p className="text-[7px] uppercase tracking-[.16em] text-[#c94b5e]">moment</p><p className="mt-1 text-[11px] font-semibold">READY</p></motion.div>
          </div>
        </div>
      </section>

      <section id="experiente" className="border-y border-white/8 bg-[#0b0a0b] px-5 py-20 sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
            <div className="lg:sticky lg:top-10 lg:self-start">
              <p className="text-[9px] font-bold uppercase tracking-[.24em] text-[#b83b4f]">Experiențe</p>
              <h2 className="mt-5 max-w-xl text-[44px] font-semibold leading-[.94] tracking-[-.06em] md:text-[68px]">Alegi momentul. Noi construim cadrul.</h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/38">Fără pachete greu de înțeles. Selectezi ce se potrivește evenimentului, iar oferta se construiește în jurul locației, duratei și experiențelor alese.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((item, index) => (
                <motion.button
                  key={item.title}
                  type="button"
                  onClick={() => setActiveService(index)}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: .985 }}
                  className={`relative min-h-[270px] overflow-hidden rounded-[28px] border p-6 text-left transition ${index === activeService ? "border-[#a92b3e]/55 bg-[#18090c]" : "border-white/8 bg-[#090909]"}`}
                >
                  <div className={`absolute -right-10 -top-12 h-48 w-48 rounded-full blur-[65px] transition ${index === activeService ? "bg-[#a92b3e]/22" : "bg-white/[.025]"}`} />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between"><span className="text-[9px] font-semibold text-white/28">{item.number}</span><span className={`text-[10px] font-bold tracking-[.08em] ${index === activeService ? "text-[#d84e62]" : "text-white/20"}`}>{item.detail}</span></div>
                    <div className="pt-20"><h3 className="text-[30px] font-semibold tracking-[-.055em]">{item.title}</h3><p className="mt-3 text-[12px] leading-5 text-white/36">{item.short}</p></div>
                  </div>
                </motion.button>
              ))}

              <div className="sm:col-span-2 mt-2 overflow-hidden rounded-[28px] border border-white/8 bg-black p-6 md:p-8">
                <AnimatePresence mode="wait">
                  <motion.div key={service.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .28 }} className="grid gap-7 md:grid-cols-[.75fr_1.25fr] md:items-end">
                    <div><p className="text-[8px] uppercase tracking-[.2em] text-[#c54357]">{service.number} · {service.detail}</p><h3 className="mt-3 text-[32px] font-semibold tracking-[-.055em] md:text-[42px]">{service.title}</h3></div>
                    <p className="max-w-2xl text-[14px] leading-7 text-white/42">{service.copy}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="cum-functioneaza" className="px-5 py-20 sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1500px]">
          <p className="text-[9px] font-bold uppercase tracking-[.24em] text-[#b83b4f]">Simplu de la început</p>
          <div className="mt-5 grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
            <h2 className="max-w-2xl text-[46px] font-semibold leading-[.94] tracking-[-.06em] md:text-[72px]">Trei pași. Apoi începe petrecerea.</h2>
            <div className="border-t border-white/9">
              {[
                ["01", "Spui ce organizezi", "Tipul evenimentului, data, locația și experiențele care te interesează."],
                ["02", "Primești oferta", "Pachetul se adaptează duratei, deplasării și combinației de servicii."],
                ["03", "Noi venim pregătiți", "Setup, experiență și desfășurare fără ca tu să gestionezi încă un furnizor în seara evenimentului."],
              ].map(([number, title, copy]) => (
                <div key={number} className="grid gap-4 border-b border-white/9 py-7 sm:grid-cols-[60px_.55fr_1fr] sm:items-start">
                  <span className="text-[9px] font-bold text-[#c04458]">{number}</span><h3 className="text-[20px] font-semibold tracking-[-.035em]">{title}</h3><p className="text-sm leading-6 text-white/38">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#10090b] px-5 py-16 sm:px-7 md:px-10 md:py-20">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <div><p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#b83b4f]">Fără prețuri ascunse în template</p><h2 className="mt-4 max-w-4xl text-[38px] font-semibold leading-[.98] tracking-[-.055em] md:text-[58px]">Oferta depinde de eveniment. Formularul întreabă doar ce contează.</h2></div>
          <a href="#oferta" className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-white px-6 text-[12px] font-bold text-black">Construiește oferta →</a>
        </div>
      </section>

      <section id="oferta" className="px-5 py-20 sm:px-7 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-[.72fr_1.28fr]">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.24em] text-[#b83b4f]">Cerere ofertă · demo</p>
            <h2 className="mt-5 max-w-xl text-[48px] font-semibold leading-[.92] tracking-[-.065em] md:text-[72px]">Spune-ne când. Restul îl clarificăm noi.</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/38">În versiunea finală, cererea poate intra direct în modulul Leads ORBYVEN și poate genera task de follow-up pentru clientul pilot.</p>
          </div>

          <div className="rounded-[32px] border border-white/9 bg-[#0c0b0c] p-5 sm:p-7 md:p-9">
            <div className="grid gap-4 sm:grid-cols-2">
              <DemoField label="Nume" value="Numele tău" />
              <DemoField label="Telefon" value="07xx xxx xxx" />
              <DemoField label="Data evenimentului" value="zz / ll / aaaa" />
              <DemoField label="Locație" value="Oraș / locație" />
            </div>

            <div className="mt-5">
              <p className="mb-3 text-[8px] font-bold uppercase tracking-[.18em] text-white/28">Tip eveniment</p>
              <div className="flex flex-wrap gap-2">
                {eventTypes.map((event) => <button key={event} type="button" onClick={() => setSelectedEvent(event)} className={`rounded-full border px-4 py-2.5 text-[10px] font-semibold transition ${selectedEvent === event ? "border-[#a92b3e]/60 bg-[#a92b3e]/18 text-white" : "border-white/9 bg-black text-white/38"}`}>{event}</button>)}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-3 text-[8px] font-bold uppercase tracking-[.18em] text-white/28">Ce te interesează</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {services.map((item, index) => <button key={item.title} type="button" onClick={() => setActiveService(index)} className={`flex items-center justify-between rounded-[16px] border px-4 py-4 text-left text-[11px] font-semibold transition ${activeService === index ? "border-[#a92b3e]/55 bg-[#18090c]" : "border-white/8 bg-black/40 text-white/55"}`}><span>{item.title}</span><span className="text-[#c7465a]">{activeService === index ? "●" : "○"}</span></button>)}
              </div>
            </div>

            <div className="mt-5 rounded-[18px] border border-white/8 bg-black/45 px-4 py-5 text-[11px] text-white/24">Mesaj / detalii opționale…</div>
            <button type="button" className="mt-5 flex h-13 w-full items-center justify-center rounded-full bg-[#a92b3e] px-6 py-4 text-[12px] font-bold text-white shadow-[0_15px_50px_rgba(169,43,62,.18)]">Trimite cererea</button>
            <p className="mt-4 text-center text-[8px] leading-4 text-white/22">Demo vizual ORBYVEN. Formularul nu trimite date în această etapă.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 px-5 py-8 sm:px-7 md:px-10">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[15px] font-semibold">OBSIDIAN MOMENTS 360</p><p className="mt-2 text-[9px] uppercase tracking-[.16em] text-white/25">București · evenimente · experiențe interactive</p></div>
          <div className="flex gap-5 text-[10px] text-white/35"><a href="#experiente">Experiențe</a><a href="#oferta">Ofertă</a><Link href="/templates">ORBYVEN ↗</Link></div>
        </div>
      </footer>
    </main>
  );
}

function DemoField({ label, value }: { label: string; value: string }) {
  return <div><p className="mb-2 text-[8px] font-bold uppercase tracking-[.18em] text-white/28">{label}</p><div className="rounded-[16px] border border-white/8 bg-black/45 px-4 py-4 text-[11px] text-white/28">{value}</div></div>;
}
