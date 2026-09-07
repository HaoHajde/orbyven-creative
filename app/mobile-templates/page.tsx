"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

import MobilePageChrome from "@/components/MobilePageChrome";
import OrbitalSystem from "@/components/OrbitalSystem";
import { clientTemplateList } from "@/lib/client-template-catalog";

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

const vars = {
  "--bg": "#000000",
  "--surface": "#0b0b0d",
  "--surface-2": "#121216",
  "--text": "#f5f5f7",
  "--muted": "#a1a1a6",
  "--muted-2": "#74747a",
  "--border": "rgba(255,255,255,0.08)",
  "--border-strong": "rgba(255,255,255,0.15)",
  "--button": "#f5f5f7",
  "--button-text": "#000000",
} as CSSProperties;

export default function MobileTemplatesPage() {
  const [templates, setTemplates] = useState(clientTemplateList);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const ordered = shuffle(clientTemplateList);
    setTemplates(ordered);
    setActive(Math.floor(Math.random() * ordered.length));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % templates.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [templates.length]);

  const featured = templates[active] ?? templates[0];

  return (
    <main id="mobile-page-root" style={vars} className="min-h-screen overflow-x-clip bg-[var(--bg)] text-[var(--text)]">
      <MobilePageChrome activePage="templates" />

      <section className="mobile-subhero mobile-shell-x relative overflow-hidden" style={{ backgroundImage: "radial-gradient(circle at 78% 18%, rgba(75,70,238,0.11), transparent 28%)" }}>
        <OrbitalSystem variant="accent" className="left-[72%] top-[52%]" />
        <div className="mx-auto max-w-[760px]">
          <p className="mobile-hero-kicker text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">ORBYVEN · CLIENT TEMPLATES</p>
          <h1 className="mobile-hero-title mobile-hero-title-size mt-9 font-semibold leading-[0.91] tracking-[-0.065em]">Alege o bază.<br />Fă-o a ta<span className="text-[#4b46ee]">.</span></h1>
          <p className="mobile-hero-copy mt-7 max-w-md text-[15px] leading-7 text-[var(--muted)]">Template-uri construite pentru business-uri reale, apoi personalizate până când nu mai arată ca un template.</p>
        </div>
      </section>

      <section className="mobile-defer border-t border-[var(--border)] mobile-shell-x py-14">
        <div className="mx-auto max-w-[760px]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">Featured · random</p>
              <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.05em]">{featured.title}</h2>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setActive((current) => (current - 1 + templates.length) % templates.length)} className="mobile-press flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)]">←</button>
              <button type="button" onClick={() => setActive((current) => (current + 1) % templates.length)} className="mobile-press flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)]">→</button>
            </div>
          </div>

          <Link href={`/templates/${featured.slug}`} className="mobile-card block overflow-hidden rounded-[27px] border border-[var(--border)] bg-[var(--surface)]" data-mobile-reveal>
            <div className="relative min-h-[300px] overflow-hidden p-5 text-[#12131a]" style={{ background: featured.surface }}>
              <div className="absolute right-[-18%] top-[-18%] h-56 w-56 rounded-full blur-3xl" style={{ background: featured.accentSoft }} />
              <div className="relative rounded-[20px] border border-black/[0.06] bg-white/90 p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-[4px]" style={{ borderColor: featured.accent }} />
                    <span className="text-[10px] font-semibold">{featured.title}</span>
                  </div>
                  <span className="rounded-full px-3 py-1.5 text-[7px] font-semibold text-white" style={{ background: featured.accent }}>{featured.primaryAction}</span>
                </div>
                <p className="mt-10 text-[7px] font-semibold uppercase tracking-[0.16em]" style={{ color: featured.accent }}>{featured.eyebrow}</p>
                <p className="mt-4 text-[30px] font-semibold leading-[0.95] tracking-[-0.055em]">{featured.heroTitle}</p>
                <div className="mt-7 grid grid-cols-2 gap-2">
                  {featured.services.slice(0, 4).map((service) => (
                    <div key={service.title} className="rounded-xl border border-black/[0.06] bg-white p-3">
                      <span className="text-xs" style={{ color: featured.accent }}>{service.icon}</span>
                      <p className="mt-3 text-[8px] font-semibold">{service.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">{featured.category}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">Tap pentru demo complet</p>
              </div>
              <span className="text-2xl text-[#4b46ee]">↗</span>
            </div>
          </Link>

          <div className="mt-4 flex gap-1.5">
            {templates.map((item, index) => (
              <button key={item.slug} onClick={() => setActive(index)} className={`h-1.5 rounded-full transition-all ${index === active ? "w-10 bg-white" : "w-5 bg-white/15"}`} aria-label={`Arată ${item.title}`} />
            ))}
          </div>

          <div className="mt-12 space-y-5">
            {templates.map((item) => (
              <Link key={item.slug} href={`/templates/${item.slug}`} className="mobile-card block overflow-hidden rounded-[25px] border border-[var(--border)] bg-[var(--surface)]" data-mobile-reveal>
                <div className="relative min-h-[210px] overflow-hidden p-5 text-[#17181d]" style={{ background: item.surface }}>
                  <div className="absolute bottom-[-20%] right-[-10%] h-40 w-40 rounded-full blur-3xl" style={{ background: item.accentSoft }} />
                  <div className="relative">
                    <p className="text-[7px] font-semibold uppercase tracking-[0.16em]" style={{ color: item.accent }}>{item.category}</p>
                    <h2 className="mt-5 max-w-[280px] text-[32px] font-semibold leading-[0.96] tracking-[-0.055em]">{item.heroTitle}</h2>
                    <div className="mt-7 flex gap-2">
                      {item.services.slice(0, 3).map((service) => <span key={service.title} className="rounded-full border border-black/[0.07] bg-white/75 px-3 py-2 text-[7px] font-medium">{service.title}</span>)}
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-end justify-between gap-5">
                    <div>
                      <h3 className="text-[30px] font-semibold tracking-[-0.05em]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.description}</p>
                    </div>
                    <span className="text-xl text-[#4b46ee]">↗</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="mobile-defer px-[clamp(12px,4vw,16px)] pt-5">
        <div className="rounded-t-[30px] bg-[var(--button)] px-5 py-8 text-[var(--button-text)]" data-mobile-reveal>
          <p className="text-[9px] uppercase tracking-[0.18em] opacity-40">Custom by default</p>
          <h2 className="mt-7 text-[43px] font-semibold leading-[0.93] tracking-[-0.06em]">Îți place direcția?<br />O facem a ta.</h2>
          <Link href="/contact" className="mobile-press mt-9 flex h-14 items-center justify-between rounded-full bg-[var(--bg)] px-6 text-sm font-semibold text-[var(--text)]"><span>Începe un proiect</span><span className="text-[#4b46ee]">↗</span></Link>
        </div>
      </footer>
    </main>
  );
}
