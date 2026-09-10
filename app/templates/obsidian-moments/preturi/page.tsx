"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const phoneHref = "tel:0729753760";
const whatsappHref = "https://wa.me/40729753760";

const packages = [
  {
    name: "Basic",
    note: "Pentru clienți sensibili la preț",
    price: "2.000",
    features: ["Platformă 360", "Oglindă Foto", "Props-uri incluse"],
  },
  {
    name: "Standard",
    note: "Cel mai vândut",
    price: "2.500",
    featured: true,
    features: ["Platformă 360", "Oglindă Foto", "Props-uri incluse", "Fum greu · 1 moment", "Mașină baloane · 1 moment"],
  },
  {
    name: "Premium",
    note: "Experiența completă",
    price: "3.000",
    features: ["Platformă 360", "Oglindă Foto", "Props-uri incluse", "Fum greu · mai multe momente", "Mașină baloane", "Tort shot-uri"],
  },
  {
    name: "VIP",
    note: "Totul inclus",
    price: "4.000",
    features: ["Platformă 360 · toată noaptea", "Oglindă Foto · toată noaptea", "Props-uri premium", "Fum greu nelimitat", "Mașină baloane", "Tort shot-uri complet", "Setup premium + coordonare"],
  },
];

export default function ObsidianPricingPage() {
  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[#0b0b0b] text-[#f5f1e7]"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif" }}
    >
      <header className="sticky top-0 z-50 border-b border-[#d8b438]/10 bg-[#0b0b0b]/88 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 md:px-9">
          <Link href="/templates/obsidian-moments" className="flex items-center gap-3">
            <span className="relative grid h-10 w-10 place-items-center rounded-full border border-[#d8b438]/38 bg-[#12110d]">
              <span className="absolute h-6 w-6 rounded-full border border-[#d8b438]/62" />
              <span className="absolute h-1.5 w-1.5 rounded-full bg-[#d8b438] shadow-[0_0_14px_rgba(216,180,56,.75)]" />
            </span>
            <div>
              <p className="text-[13px] font-semibold tracking-[-0.035em]">ObsidianMoments360</p>
              <p className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.2em] text-[#d8b438]/62">pachete & prețuri</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-[10px] font-semibold text-white/45 md:flex">
            <Link href="/templates/obsidian-moments" className="transition hover:text-[#e4c34f]">Acasă</Link>
            <Link href="/templates/obsidian-moments#servicii" className="transition hover:text-[#e4c34f]">Servicii</Link>
            <span className="text-[#e4c34f]">Prețuri</span>
            <Link href="/templates/obsidian-moments#contact" className="transition hover:text-[#e4c34f]">Contact</Link>
          </nav>

          <a href={phoneHref} className="rounded-full bg-[#d8b438] px-4 py-2.5 text-[10px] font-bold text-[#111] sm:px-5">Sună</a>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 pb-14 pt-16 sm:px-6 md:px-9 md:pb-20 md:pt-24">
        <div aria-hidden="true" className="absolute inset-x-0 top-[-40%] h-[720px] bg-[radial-gradient(circle_at_center,rgba(216,180,56,.15),transparent_48%)]" />
        <div className="relative mx-auto max-w-[1480px]">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-[9px] font-bold uppercase tracking-[0.26em] text-[#d8b438]">Pachete & prețuri</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.06 }} className="mt-5 max-w-5xl text-[clamp(54px,8vw,112px)] font-semibold leading-[0.88] tracking-[-0.072em]">
            Alegi pachetul.<br /><span className="text-[#d8b438]">Rezervi data.</span>
          </motion.h1>
          <p className="mt-6 max-w-xl text-[13px] leading-6 text-white/38">Prețuri transparente, fără costuri ascunse.</p>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 md:px-9 md:pb-28">
        <div className="mx-auto grid max-w-[1480px] gap-3 md:grid-cols-2 xl:grid-cols-4">
          {packages.map((item, index) => (
            <motion.article
              key={item.name}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              whileHover={{ y: -5 }}
              className={`relative flex min-h-[470px] flex-col overflow-hidden rounded-[26px] border p-6 ${item.featured ? "border-[#d8b438]/45 bg-[#15130d]" : "border-[#d8b438]/10 bg-[#101010]"}`}
            >
              {item.featured && <div className="absolute right-5 top-5 rounded-full bg-[#d8b438] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.14em] text-[#111]">Cel mai vândut</div>}
              <div aria-hidden="true" className={`absolute -right-16 -top-16 h-48 w-48 rounded-full blur-[70px] ${item.featured ? "bg-[#d8b438]/18" : "bg-[#d8b438]/7"}`} />
              <div className="relative">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#d8b438]/68">{item.name}</p>
                <p className="mt-2 text-[11px] text-white/33">{item.note}</p>
                <div className="mt-8 flex items-end gap-2">
                  <span className="text-[52px] font-semibold leading-none tracking-[-0.07em]">{item.price}</span>
                  <span className="pb-1 text-[11px] font-semibold text-white/32">RON</span>
                </div>
              </div>

              <div className="relative mt-8 flex-1 border-t border-[#d8b438]/10 pt-6">
                <div className="space-y-3">
                  {item.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 text-[11px] leading-5 text-white/48">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d8b438]" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <a href={phoneHref} className={`relative mt-8 inline-flex h-12 items-center justify-center rounded-full text-[11px] font-bold transition hover:-translate-y-0.5 ${item.featured ? "bg-[#d8b438] text-[#111]" : "border border-[#d8b438]/18 bg-[#d8b438]/[0.04] text-[#e4c34f]"}`}>
                Sună pentru rezervare
              </a>
            </motion.article>
          ))}
        </div>
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
          <span>ObsidianMoments360 · Pachete & Prețuri</span>
          <div className="flex gap-5"><Link href="/templates/obsidian-moments">Acasă</Link><a href={phoneHref}>Sună</a><a href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a></div>
        </div>
      </footer>
    </main>
  );
}
