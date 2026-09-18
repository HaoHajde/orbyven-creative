"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const phoneHref = "tel:0729753760";
const whatsappHref = "https://wa.me/40729753760";

const packages = [
  {
    name: "Basic",
    note: "Start simplu",
    price: "1.999",
    hero: "BASIC",
    features: ["Platformă 360", "Oglindă Foto", "Props-uri incluse"],
  },
  {
    name: "Standard",
    note: "Cel mai vândut",
    price: "2.499",
    hero: "BEST",
    featured: true,
    features: ["Platformă 360", "Oglindă Foto", "Props-uri incluse", "Fum greu · 1 moment", "Mașină baloane · 1 moment"],
  },
  {
    name: "Premium",
    note: "Experiența completă",
    price: "2.999",
    hero: "PLUS",
    features: ["Platformă 360", "Oglindă Foto", "Props-uri incluse", "Fum greu · mai multe momente", "Mașină baloane", "Tort shot-uri"],
  },
  {
    name: "VIP",
    note: "Totul inclus",
    price: "3.999",
    hero: "VIP",
    features: ["Platformă 360 · toată noaptea", "Oglindă Foto · toată noaptea", "Props-uri premium", "Fum greu nelimitat", "Mașină baloane", "Tort shot-uri complet", "Setup premium + coordonare"],
  },
];

export default function ObsidianPricingPage() {
  const [activePlan, setActivePlan] = useState(1);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#090909] text-[#f5f1e7]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif" }}>
      <header className="sticky top-0 z-50 border-b border-[#d8b438]/10 bg-[#090909]/88 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-3 sm:px-6 md:px-9">
          <Link href="/templates/obsidian-moments" className="flex items-center gap-3">
            <Image src="/obsidian/mark.svg" alt="Obsidian Moments" width={44} height={44} className="h-11 w-11 rounded-full" />
            <div>
              <p className="text-[13px] font-semibold tracking-[-0.035em]">Obsidian Moments 360</p>
              <p className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.2em] text-[#d8b438]/62">pachete & prețuri</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-[10px] font-semibold text-white/45 md:flex">
            <Link href="/templates/obsidian-moments" className="transition hover:text-[#e4c34f]">Acasă</Link>
            <Link href="/templates/obsidian-moments#servicii" className="transition hover:text-[#e4c34f]">Servicii</Link>
            <span className="text-[#e4c34f]">Prețuri</span>
            <Link href="/templates/obsidian-moments/contact" className="transition hover:text-[#e4c34f]">Contact</Link>
          </nav>

          <Link href="/templates/obsidian-moments/contact" className="rounded-full bg-[#d8b438] px-4 py-2.5 text-[10px] font-bold text-[#111] sm:px-5">Verifică data</Link>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 pb-12 pt-16 sm:px-6 md:px-9 md:pb-16 md:pt-24">
        <div aria-hidden="true" className="absolute inset-x-0 top-[-45%] h-[760px] bg-[radial-gradient(circle_at_center,rgba(216,180,56,.16),transparent_48%)]" />
        <div className="relative mx-auto max-w-[1480px]">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-[9px] font-bold uppercase tracking-[0.26em] text-[#d8b438]">Pachete & prețuri</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.06 }} className="mt-5 max-w-5xl text-[clamp(54px,8vw,112px)] font-semibold leading-[0.88] tracking-[-0.072em]">
            Alegi experiența.<br /><span className="text-[#d8b438]">Rezervi momentul.</span>
          </motion.h1>
          <p className="mt-6 max-w-xl text-[13px] leading-6 text-white/38">Patru variante clare. Apasă pe un pachet ca să vezi diferența.</p>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 md:px-9 md:pb-28">
        <div className="mx-auto grid max-w-[1480px] gap-3 md:grid-cols-2 xl:grid-cols-4">
          {packages.map((item, index) => {
            const active = activePlan === index;
            return (
              <motion.button
                key={item.name}
                type="button"
                onClick={() => setActivePlan(index)}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
                whileHover={{ y: -7 }}
                whileTap={{ scale: 0.985 }}
                className={`group relative flex min-h-[430px] flex-col overflow-hidden rounded-[26px] border p-6 text-left transition-all duration-300 ${active ? "border-[#d8b438]/55 bg-[#17150e] shadow-[0_26px_90px_rgba(216,180,56,.10)]" : "border-[#d8b438]/10 bg-[#101010]"}`}
              >
                {item.featured && <div className="absolute right-5 top-5 z-20 rounded-full bg-[#d8b438] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.14em] text-[#111]">Cel mai vândut</div>}
                <div aria-hidden="true" className={`absolute -right-8 bottom-[-18px] text-[76px] font-black leading-none tracking-[-0.08em] transition duration-500 ${active ? "text-[#d8b438]/[0.09]" : "text-[#d8b438]/[0.035]"}`}>{item.hero}</div>
                <motion.div aria-hidden="true" className="absolute right-[-65px] top-[-65px] h-52 w-52 rounded-full bg-[#d8b438]/12 blur-[70px]" animate={active ? { scale: [1, 1.22, 1], opacity: [0.45, 0.9, 0.45] } : { scale: 1, opacity: 0.3 }} transition={{ duration: 4.6, repeat: active ? Infinity : 0 }} />

                <div className="relative z-10">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${active ? "bg-[#d8b438] shadow-[0_0_18px_rgba(216,180,56,.7)]" : "bg-white/18"}`} />
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#d8b438]/72">{item.name}</p>
                  </div>
                  <p className="mt-2 text-[11px] text-white/34">{item.note}</p>
                  <div className="mt-7 flex items-end gap-2">
                    <span className="text-[52px] font-semibold leading-none tracking-[-0.07em]">{item.price}</span>
                    <span className="pb-1 text-[11px] font-semibold text-white/32">RON</span>
                  </div>
                </div>

                <div className="relative z-10 mt-7 flex-1 border-t border-[#d8b438]/10 pt-5">
                  <div className="space-y-2.5">
                    {item.features.map((feature, featureIndex) => (
                      <motion.div key={feature} animate={{ x: active ? 3 : 0, opacity: active ? 1 : 0.68 }} transition={{ delay: active ? featureIndex * 0.025 : 0 }} className="flex items-start gap-3 text-[10px] leading-5 text-white/52">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d8b438]" />
                        <span>{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className={`relative z-10 mt-6 flex h-11 items-center justify-center rounded-full text-[10px] font-bold transition ${active ? "bg-[#d8b438] text-[#111]" : "border border-[#d8b438]/16 bg-[#d8b438]/[0.035] text-[#e4c34f]"}`}>
                  {active ? "Pachet selectat" : "Vezi pachetul"}
                </div>
              </motion.button>
            );
          })}
        </div>

        <motion.div layout className="mx-auto mt-3 max-w-[1480px] overflow-hidden rounded-[26px] border border-[#d8b438]/12 bg-[#0d0d0d] p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.19em] text-[#d8b438]/65">Ai ales {packages[activePlan].name}</p>
              <h2 className="mt-3 text-[32px] font-semibold tracking-[-0.055em] sm:text-[42px]">{packages[activePlan].price} RON</h2>
              <p className="mt-2 text-[11px] text-white/35">Disponibilitatea se confirmă pentru data și locația evenimentului.</p>
            </div>
            <Link href="/templates/obsidian-moments/contact" className="inline-flex h-12 items-center justify-center rounded-full bg-[#d8b438] px-6 text-[11px] font-bold text-[#111]">Verifică disponibilitatea →</Link>
          </div>
        </motion.div>
      </section>

      <section className="px-4 pb-8 sm:px-6 md:px-9">
        <div className="mx-auto max-w-[1480px] rounded-[30px] border border-[#d8b438]/16 bg-[#d8b438] px-6 py-11 text-[#111] sm:px-8 md:px-12">
          <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-black/43">Rezervare rapidă</p>
              <h2 className="mt-4 text-[42px] font-semibold leading-[0.93] tracking-[-0.06em] sm:text-[58px]">Întrebi. Alegi.<br />Confirmi.</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={phoneHref} className="rounded-full bg-[#111] px-6 py-3.5 text-[11px] font-bold text-white">0729 753 760</a>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="rounded-full border border-black/16 bg-white/35 px-6 py-3.5 text-[11px] font-bold">WhatsApp →</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d8b438]/10 px-4 py-7 sm:px-6 md:px-9">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-4 text-[9px] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <span>Obsidian Moments 360 · Pachete & Prețuri</span>
          <div className="flex gap-5"><Link href="/templates/obsidian-moments">Acasă</Link><Link href="/templates/obsidian-moments/contact">Contact</Link><a href={phoneHref}>Sună</a><a href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a></div>
        </div>
      </footer>
    </main>
  );
}
