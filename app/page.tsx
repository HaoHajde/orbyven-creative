"use client";

import ClientTemplatePreview from "@/components/ClientTemplatePreview";
import OrbitalSystem from "@/components/OrbitalSystem";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import WarpMenu, { type WarpItem } from "@/components/WarpMenu";
import { BILLING_PLANS } from "@/lib/billing/public-config";
import { clientTemplateList } from "@/lib/client-template-catalog";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";

type Theme = "light" | "dark";

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number];

const warpItems: WarpItem[] = [
  { id: "intro", label: "Intro", number: "01" },
  { id: "templates", label: "Templates", number: "02" },
  { id: "modular", label: "Workspace", number: "03" },
  { id: "services", label: "Servicii", number: "04" },
  { id: "pricing", label: "Prețuri", number: "05" },
  { id: "start", label: "Start", number: "06" },
];

const moduleShowcase = [
  { name: "Clienți", note: "Cereri și contacte într-un singur loc." },
  { name: "Lucrări", note: "Ce este de făcut, de cine și până când." },
  { name: "Calendar", note: "Programări și vizite fără agende separate." },
  { name: "Oferte", note: "Devize legate direct de client și lucrare." },
  { name: "Documente", note: "Fișierele rămân lângă contextul lor." },
  { name: "Cheltuieli", note: "Costuri operaționale urmărite simplu." },
  { name: "Echipă", note: "Oamenii din teren și rolul lor operațional." },
  { name: "Overview", note: "Ce necesită atenție acum, nu grafice de decor." },
];

const services = ["Website", "Landing page", "Redesign", "Experiență digitală"];

export default function HomePage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [desktopMotion, setDesktopMotion] = useState(false);
  const [activeTemplateIndex, setActiveTemplateIndex] = useState(0);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeSection, setActiveSection] = useState<string | null>("intro");
  const heroRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroProgress, [0, 1], [0, -170]);
  const heroOpacity = useTransform(heroProgress, [0, 0.68], [1, 0]);
  const heroScale = useTransform(heroProgress, [0, 1], [1, 0.955]);

  useEffect(() => {
    const hydrate = () => {
      const saved = window.localStorage.getItem("studio-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const nextTheme: Theme = saved === "dark" || saved === "light" ? saved : prefersDark ? "dark" : "light";
      setTheme(nextTheme);
      document.documentElement.style.colorScheme = nextTheme;
      document.body.style.backgroundColor = nextTheme === "dark" ? "#000000" : "#ffffff";
    };
    const frame = window.requestAnimationFrame(hydrate);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const frame = window.requestAnimationFrame(() => setDesktopMotion(media.matches));
    const sync = (event: MediaQueryListEvent) => setDesktopMotion(event.matches);
    media.addEventListener("change", sync);
    return () => {
      window.cancelAnimationFrame(frame);
      media.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const sections = warpItems
      .map((item) => document.getElementById(item.id))
      .filter((item): item is HTMLElement => Boolean(item));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-28% 0px -55% 0px", threshold: [0.05, 0.2, 0.45] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      document.body.style.backgroundColor = next === "dark" ? "#000000" : "#ffffff";
      return next;
    });
  };

  const activeTemplate = clientTemplateList[activeTemplateIndex] ?? clientTemplateList[0];
  const activeModule = moduleShowcase[activeModuleIndex] ?? moduleShowcase[0];

  const previousTemplate = () =>
    setActiveTemplateIndex((current) => (current - 1 + clientTemplateList.length) % clientTemplateList.length);
  const nextTemplate = () =>
    setActiveTemplateIndex((current) => (current + 1) % clientTemplateList.length);

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
    "--accent-soft-2": theme === "dark" ? "rgba(111,66,255,0.11)" : "rgba(111,66,255,0.05)",
  } as CSSProperties;

  return (
    <main
      style={{
        ...vars,
        backgroundColor: "var(--bg)",
        color: "var(--text)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
      className="relative min-h-screen overflow-x-clip antialiased"
    >
      <SiteHeader theme={theme} compact={false} activePage="home" onToggleTheme={toggleTheme} />
      <WarpMenu items={warpItems} activeSection={activeSection} />

      <section
        id="intro"
        ref={heroRef}
        className="relative flex min-h-[100svh] scroll-mt-24 items-center justify-center overflow-hidden bg-[var(--bg)] md:min-h-screen"
      >
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[-29%] hidden h-[760px] w-[1100px] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] blur-[150px] md:block" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(circle_at_center,currentColor_0.7px,transparent_0.7px)] [background-size:7px_7px]" />
        <OrbitalSystem variant="hero" className="top-[48%]" />

        <motion.div
          style={{ y: desktopMotion ? heroY : 0, opacity: desktopMotion ? heroOpacity : 1, scale: desktopMotion ? heroScale : 1 }}
          className="relative mx-auto flex w-full max-w-[1500px] -translate-y-[1vh] flex-col items-center px-5 text-center sm:px-6 md:-translate-y-[3vh] md:px-10"
        >
          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.08, ease: easeOut }} className="mb-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-2)] sm:mb-9 sm:text-[11px]">
            ORBYVEN CREATIVE
          </motion.p>
          <div className="overflow-hidden pb-2">
            <motion.span initial={{ y: "115%" }} animate={{ y: "0%" }} transition={{ duration: 1.05, delay: 0.16, ease: easeOut }} className="block text-[clamp(46px,13vw,56px)] font-semibold leading-[0.94] tracking-[-0.06em] sm:text-[80px] md:text-[104px] lg:text-[124px] xl:text-[132px]">
              We build
            </motion.span>
          </div>
          <div className="overflow-hidden pb-4">
            <motion.span initial={{ y: "115%" }} animate={{ y: "0%" }} transition={{ duration: 1.12, delay: 0.27, ease: easeOut }} className="block text-[clamp(46px,13vw,56px)] font-semibold leading-[0.94] tracking-[-0.06em] sm:text-[80px] md:text-[104px] lg:text-[124px] xl:text-[132px]">
              what gets remembered.
            </motion.span>
          </div>
        </motion.div>
      </section>

      <section id="templates" className="scroll-mt-24 border-y border-[var(--border)] bg-[var(--surface)] px-5 py-16 sm:px-6 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-2)]">Templates</p>
              <h2 className="mt-3 text-[38px] font-semibold tracking-[-0.055em] sm:text-[52px]">Vezi. Glisează. Alege.</h2>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={previousTemplate} aria-label="Template anterior" className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg)]">←</button>
              <button type="button" onClick={nextTemplate} aria-label="Template următor" className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg)]">→</button>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--bg)] p-3 sm:p-4">
            <ClientTemplatePreview template={activeTemplate} compact />
            <div className="flex flex-col gap-4 px-2 pb-2 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted-2)]">{activeTemplate.category}</p>
                <p className="mt-1 text-xl font-semibold">{activeTemplate.title}</p>
              </div>
              <Link href={`/templates/${activeTemplate.slug}`} className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--button)] px-5 text-sm font-semibold text-[var(--button-text)]">
                Deschide ↗
              </Link>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="flex gap-2">
              {clientTemplateList.map((template, index) => (
                <button key={template.slug} type="button" onClick={() => setActiveTemplateIndex(index)} aria-label={`Arată ${template.title}`} className={`h-1.5 rounded-full transition-all ${index === activeTemplateIndex ? "w-10 bg-[var(--text)]" : "w-5 bg-[var(--border-strong)]"}`} />
              ))}
            </div>
            <Link href="/templates" className="text-xs font-semibold">Toate →</Link>
          </div>
        </div>
      </section>

      <section id="modular" className="scroll-mt-24 px-5 py-16 sm:px-6 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-2)]">Workspace modular</p>
              <h2 className="mt-4 text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[60px]">Activezi doar ce folosești.</h2>
              <Link href="/workspace" className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-[var(--border-strong)] px-5 text-sm font-semibold">Dashboard →</Link>
            </div>

            <div className="rounded-[34px] border border-[var(--border)] bg-[var(--surface-2)] p-4 sm:p-6">
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {moduleShowcase.map((module, index) => (
                  <button key={module.name} type="button" onClick={() => setActiveModuleIndex(index)} className={`min-h-20 rounded-[18px] border px-2 py-3 text-center text-[11px] font-semibold sm:min-h-24 sm:text-sm ${index === activeModuleIndex ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--bg)]"}`}>
                    <span className="mx-auto mb-2 block h-2 w-2 rounded-full" style={{ backgroundColor: index === activeModuleIndex ? "var(--accent)" : "var(--muted-2)" }} />
                    {module.name}
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-[22px] bg-[var(--bg)] p-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted-2)]">{activeModule.name}</p>
                <p className="mt-2 text-lg font-semibold">{activeModule.note}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-24 border-y border-[var(--border)] bg-[var(--surface)] px-5 py-16 sm:px-6 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-2)]">Servicii</p>
              <h2 className="mt-4 text-[42px] font-semibold tracking-[-0.055em] sm:text-[58px]">Construim ce ai nevoie.</h2>
            </div>
            <Link href="/servicii" className="text-sm font-semibold">Detalii →</Link>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => (
              <Link key={service} href="/servicii" className="group rounded-[24px] border border-[var(--border)] bg-[var(--bg)] p-5">
                <span className="text-[10px] text-[var(--muted-2)]">0{index + 1}</span>
                <p className="mt-8 text-[26px] font-semibold tracking-[-0.045em]">{service}</p>
                <span className="mt-5 inline-block text-sm text-[var(--muted)] transition group-hover:translate-x-1">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-24 px-5 py-16 sm:px-6 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1500px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-2)]">Prețuri</p>
          <h2 className="mt-4 text-[42px] font-semibold tracking-[-0.055em] sm:text-[58px]">Simplu de ales.</h2>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {Object.values(BILLING_PLANS).map((plan) => (
              <article key={plan.id} className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">{plan.name}</p>
                <div className="mt-7 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-[48px] font-semibold leading-none tracking-[-0.06em]">{plan.priceLei}</span>
                  <span className="whitespace-nowrap text-sm font-medium text-[var(--muted)]">lei / lună</span>
                </div>
                <p className="mt-5 text-xs text-[var(--muted-2)]">{plan.entitlements.length} module incluse</p>
                <Link href={`/cerere?plan=${plan.id}&payment=subscription&source=homepage`} className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-full bg-[var(--button)] px-5 text-sm font-semibold text-[var(--button-text)]">
                  Alege {plan.name}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="start" className="scroll-mt-24 px-5 pb-8 sm:px-6 md:px-10">
        <div className="mx-auto max-w-[1500px] rounded-[34px] bg-[var(--button)] px-6 py-14 text-[var(--button-text)] sm:px-8 md:px-12 md:py-18">
          <p className="text-[10px] uppercase tracking-[0.18em] opacity-50">Start</p>
          <div className="mt-4 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-4xl text-[44px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[62px]">Spune-ne ce vrei să rezolvi.</h2>
            <Link href="/cerere" className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] px-6 text-sm font-semibold text-[var(--text)]">Începe →</Link>
          </div>
        </div>
      </section>

      <SiteFooter theme={theme} activePage="home" />
    </main>
  );
}
