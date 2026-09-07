"use client";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import OrbitalSystem from "@/components/OrbitalSystem";
import ClientTemplatePreview from "@/components/ClientTemplatePreview";
import { clientTemplateList, type ClientTemplateConfig } from "@/lib/client-template-catalog";

import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

type Theme = "light" | "dark";
type Filter = "all" | "services" | "lifestyle" | "medical";

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number];

const filterMap: Record<Filter, (item: ClientTemplateConfig) => boolean> = {
  all: () => true,
  services: (item) => item.slug === "instalatii",
  lifestyle: (item) => item.slug === "evenimente" || item.slug === "beauty",
  medical: (item) => item.slug === "clinica-dentara",
};

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "Toate" },
  { key: "services", label: "Servicii locale" },
  { key: "lifestyle", label: "Lifestyle" },
  { key: "medical", label: "Medical" },
];

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export default function TemplatesPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [compactNav, setCompactNav] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [orderedTemplates, setOrderedTemplates] = useState(clientTemplateList);
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => setCompactNav(latest > 90));

  useEffect(() => {
    const saved = window.localStorage.getItem("studio-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme: Theme = saved === "dark" || saved === "light" ? saved : prefersDark ? "dark" : "light";
    setTheme(initialTheme);
    document.documentElement.style.colorScheme = initialTheme;

    const shuffled = shuffle(clientTemplateList);
    setOrderedTemplates(shuffled);
    setActiveIndex(Math.floor(Math.random() * shuffled.length));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % orderedTemplates.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [orderedTemplates.length]);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      return next;
    });
  };

  const vars = {
    "--bg": theme === "dark" ? "#000000" : "#ffffff",
    "--surface": theme === "dark" ? "#0c0c0e" : "#f5f5f7",
    "--surface-2": theme === "dark" ? "#151518" : "#fbfbfd",
    "--text": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--muted": theme === "dark" ? "#a1a1a6" : "#6e6e73",
    "--muted-2": theme === "dark" ? "#77777d" : "#86868b",
    "--border": theme === "dark" ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)",
    "--border-strong": theme === "dark" ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.14)",
    "--button": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--button-text": theme === "dark" ? "#000000" : "#ffffff",
    "--accent": "#4b46ee",
    "--accent-soft": theme === "dark" ? "rgba(75,70,238,0.18)" : "rgba(75,70,238,0.08)",
  } as CSSProperties;

  const visibleTemplates = useMemo(
    () => orderedTemplates.filter(filterMap[filter]),
    [filter, orderedTemplates]
  );
  const activeTemplate = orderedTemplates[activeIndex] ?? orderedTemplates[0];

  const previous = () => setActiveIndex((current) => (current - 1 + orderedTemplates.length) % orderedTemplates.length);
  const next = () => setActiveIndex((current) => (current + 1) % orderedTemplates.length);

  return (
    <main
      style={{ ...vars, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif" }}
      className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)] antialiased transition-colors duration-500"
    >
      <SiteHeader theme={theme} compact={compactNav} activePage="templates" onToggleTheme={toggleTheme} />

      <section className="relative overflow-hidden bg-[var(--bg)] px-6 pb-16 pt-40 md:px-10 md:pb-24 md:pt-52">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[-26%] h-[720px] w-[1100px] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] blur-[170px]" />
        <OrbitalSystem variant="accent" className="left-[76%] top-[42%] opacity-45" />
        <div className="relative mx-auto max-w-[1500px]">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-2)]">
            ORBYVEN · CLIENT TEMPLATES
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 35 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.95, delay: 0.08, ease: easeOut }} className="mt-8 max-w-[1250px] text-[clamp(55px,8vw,124px)] font-semibold leading-[0.91] tracking-[-0.068em]">
            Nu pornești de la zero.<br />Pornești de la ceva bun.
          </motion.h1>
          <div className="mt-10 grid gap-8 md:grid-cols-[1fr_0.68fr] md:items-end">
            <p className="max-w-2xl text-[16px] leading-7 text-[var(--muted)] md:text-[18px] md:leading-8">
              Alegi o direcție apropiată de business-ul tău, iar ORBYVEN o transformă în site-ul tău: identitate, conținut, module și integrări incluse.
            </p>
            <p className="text-sm leading-6 text-[var(--muted-2)] md:justify-self-end md:text-right">
              Template-ul este punctul de plecare.<br />Rezultatul final rămâne al brandului tău.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)] px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-2)]">Featured · ordine aleatorie</p>
              <h2 className="mt-5 text-[42px] font-semibold tracking-[-0.055em] sm:text-[58px]">Inspiră-te. Deschide. Explorează.</h2>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={previous} aria-label="Template anterior" className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg)] text-xl transition hover:scale-105">←</button>
              <button type="button" onClick={next} aria-label="Template următor" className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg)] text-xl transition hover:scale-105">→</button>
            </div>
          </div>

          <div className="relative mt-10 min-h-[620px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTemplate.slug}
                initial={{ opacity: 0, x: 34, scale: 0.99 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -24, scale: 0.99 }}
                transition={{ duration: 0.62, ease: easeOut }}
              >
                <ClientTemplatePreview template={activeTemplate} />
                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">{activeTemplate.category}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.035em]">{activeTemplate.title}</p>
                  </div>
                  <Link href={`/templates/${activeTemplate.slug}`} className="group inline-flex h-12 items-center justify-center gap-3 rounded-full bg-[var(--button)] px-6 text-sm font-semibold text-[var(--button-text)]">
                    Deschide demo-ul <span className="transition-transform group-hover:translate-x-1">↗</span>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex gap-2">
            {orderedTemplates.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                aria-label={`Arată ${item.title}`}
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-500 ${index === activeIndex ? "w-14 bg-[var(--text)]" : "w-7 bg-[var(--border-strong)]"}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-6 py-24 md:px-10 md:py-36">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-2)]">Template library</p>
            <h2 className="mt-6 text-[46px] font-semibold leading-[0.98] tracking-[-0.06em] sm:text-[64px] md:text-[76px]">Alege industria.<br />Noi adaptăm restul.</h2>
          </div>
          <p className="max-w-xl text-[16px] leading-7 text-[var(--muted)] lg:justify-self-end">
            Biblioteca este gândită modular: structura bună se reutilizează, dar identitatea, funcțiile și parcursul clientului se personalizează.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button key={item.key} type="button" onClick={() => setFilter(item.key)} className={`rounded-full border px-4 py-2.5 text-sm font-medium transition ${filter === item.key ? "border-[var(--button)] bg-[var(--button)] text-[var(--button-text)]" : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]"}`}>
              {item.label}
            </button>
          ))}
        </div>

        <motion.div layout className="mt-10 grid gap-7 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {visibleTemplates.map((item) => (
              <motion.article key={item.slug} layout initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.45 }} className="overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--surface)] p-3">
                <Link href={`/templates/${item.slug}`} className="group block">
                  <div className="grayscale transition duration-700 group-hover:grayscale-0">
                    <ClientTemplatePreview template={item} compact />
                  </div>
                  <div className="flex items-end justify-between gap-6 px-3 pb-5 pt-6 md:px-5">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">{item.category}</p>
                      <h3 className="mt-3 text-[31px] font-semibold tracking-[-0.05em] md:text-[38px]">{item.title}</h3>
                      <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--muted)]">{item.description}</p>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--button)] text-[var(--button-text)] transition group-hover:rotate-45">↗</span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      <section className="px-6 pb-0 md:px-10">
        <div className="mx-auto max-w-[1500px] rounded-t-[42px] bg-[var(--button)] px-7 py-20 text-[var(--button-text)] md:px-14 md:py-28">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-45">Custom by default</p>
              <h2 className="mt-5 max-w-4xl text-[46px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[62px] md:text-[78px]">Îți place direcția?<br />O facem a ta.</h2>
              <p className="mt-5 max-w-xl text-sm leading-6 opacity-50">Schimbăm identitatea, conținutul și modulele până când template-ul devine un produs construit pentru business-ul tău.</p>
            </div>
            <Link href="/contact" className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--bg)] px-6 text-sm font-semibold text-[var(--text)]">Începe un proiect ↗</Link>
          </div>
        </div>
      </section>

      <SiteFooter theme={theme} activePage="templates" />
    </main>
  );
}
