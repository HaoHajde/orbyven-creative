"use client";
import AppDownloadSection from "@/components/AppDownloadSection";

import ClientTemplatePreview from "@/components/ClientTemplatePreview";
import FeaturedTemplatePreview from "@/components/FeaturedTemplatePreview";
import HomeInvitationPreview from "@/components/HomeInvitationPreview";
import HomeTemplatePreviewFrame from "@/components/HomeTemplatePreviewFrame";
import { featuredTemplates } from "@/lib/featured-templates";
import OrbitalSystem from "@/components/OrbitalSystem";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import WarpMenu, { type WarpItem } from "@/components/WarpMenu";
import { BILLING_PLANS } from "@/lib/billing/public-config";
import { clientTemplateList } from "@/lib/client-template-catalog";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";

type Theme = "light" | "dark";

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number];

const warpItems: WarpItem[] = [
  { id: "intro", label: "Intro", number: "01" },
  { id: "modular", label: "Workspace", number: "02" },
  { id: "templates", label: "Templates", number: "03" },
  { id: "services", label: "Servicii", number: "04" },
  { id: "pricing", label: "Prețuri", number: "05" },
  { id: "start", label: "Start", number: "06" },
];

const moduleShowcase = [
  {
    name: "Clienți",
    note: "Cereri și contacte într-un singur loc.",
    eyebrow: "CRM LIGHT",
    glyph: "◎",
    chips: ["Lead-uri", "Istoric", "Follow-up"],
    glow: "radial-gradient(circle at 25% 15%, rgba(83,70,255,.30), transparent 48%)",
  },
  {
    name: "Lucrări",
    note: "Ce este de făcut, de cine și până când.",
    eyebrow: "OPERATIONS",
    glyph: "↗",
    chips: ["Task-uri", "Responsabili", "Status"],
    glow: "radial-gradient(circle at 72% 18%, rgba(82,139,255,.24), transparent 48%)",
  },
  {
    name: "Calendar",
    note: "Programări și vizite fără agende separate.",
    eyebrow: "SCHEDULE",
    glyph: "◷",
    chips: ["Vizite", "Termene", "Programări"],
    glow: "radial-gradient(circle at 35% 20%, rgba(117,83,255,.27), transparent 50%)",
  },
  {
    name: "Oferte",
    note: "Devize legate direct de client și lucrare.",
    eyebrow: "SALES",
    glyph: "≡",
    chips: ["Devize", "Valori", "Conversie"],
    glow: "radial-gradient(circle at 75% 24%, rgba(170,76,255,.23), transparent 48%)",
  },
  {
    name: "Documente",
    note: "Fișierele rămân lângă contextul lor.",
    eyebrow: "FILES",
    glyph: "□",
    chips: ["Fișiere", "Context", "Acces rapid"],
    glow: "radial-gradient(circle at 28% 20%, rgba(76,151,255,.22), transparent 50%)",
  },
  {
    name: "Cheltuieli",
    note: "Costuri operaționale urmărite simplu.",
    eyebrow: "FINANCE",
    glyph: "∑",
    chips: ["Costuri", "Categorii", "Istoric"],
    glow: "radial-gradient(circle at 70% 18%, rgba(92,82,255,.27), transparent 48%)",
  },
  {
    name: "Echipă",
    note: "Oamenii din teren și rolul lor operațional.",
    eyebrow: "PEOPLE",
    glyph: "◇",
    chips: ["Roluri", "Echipă", "Responsabilitate"],
    glow: "radial-gradient(circle at 38% 15%, rgba(132,73,255,.25), transparent 48%)",
  },
  {
    name: "Overview",
    note: "Ce necesită atenție acum, nu grafice de decor.",
    eyebrow: "CONTROL",
    glyph: "⌁",
    chips: ["Priorități", "Semnale", "Acțiuni"],
    glow: "radial-gradient(circle at 72% 22%, rgba(74,91,255,.30), transparent 48%)",
  },
];

const services = [
  {
    number: "01",
    title: "Website",
    note: "Prezență clară, rapidă și construită în jurul afacerii tale.",
    glow: "radial-gradient(circle at 18% 12%, rgba(92,73,255,.28), transparent 48%)",
  },
  {
    number: "02",
    title: "Landing page",
    note: "O ofertă, o direcție și un traseu simplu către conversie.",
    glow: "radial-gradient(circle at 82% 16%, rgba(65,126,255,.24), transparent 48%)",
  },
  {
    number: "03",
    title: "Redesign",
    note: "Păstrăm ce funcționează și reconstruim experiența care te ține în urmă.",
    glow: "radial-gradient(circle at 28% 78%, rgba(137,72,255,.25), transparent 52%)",
  },
  {
    number: "04",
    title: "Experiență digitală",
    note: "Microsite-uri, invitații și interacțiuni făcute special pentru context.",
    glow: "radial-gradient(circle at 80% 78%, rgba(88,71,255,.28), transparent 52%)",
  },
];

const planMeta = {
  start: {
    eyebrow: "ESSENTIAL",
    audience: "Pentru firme care vor fundația digitală și primele instrumente.",
    badge: "Start simplu",
  },
  business: {
    eyebrow: "MOST BALANCED",
    audience: "Pentru firme care lucrează zilnic cu clienți, lucrări și programări.",
    badge: "Recomandat",
  },
  pro: {
    eyebrow: "FULL SYSTEM",
    audience: "Pentru echipe care vor întregul workspace ORBYVEN disponibil.",
    badge: "Tot ecosistemul",
  },
} as const;

// Featured previews are shared with /templates; no duplicate manually maintained list.
const homepageTemplates = [
  ...featuredTemplates.map((item) => ({ ...item, source: "featured" as const })),
  ...clientTemplateList.map((item) => ({ ...item, source: "catalog" as const })),
];

export default function HomePage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [desktopMotion, setDesktopMotion] = useState(false);
  const [activeTemplateIndex, setActiveTemplateIndex] = useState(0);

  // Randomize after hydration without a synchronous effect state update.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (homepageTemplates.length > 1) {
        setActiveTemplateIndex(Math.floor(Math.random() * homepageTemplates.length));
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
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
      document.body.style.backgroundColor = nextTheme === "dark" ? "#000000" : "#e7e8f3";
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
      document.body.style.backgroundColor = next === "dark" ? "#000000" : "#e7e8f3";
      return next;
    });
  };

  const activeTemplate = homepageTemplates[activeTemplateIndex] ?? homepageTemplates[0];
  const activeModule = moduleShowcase[activeModuleIndex] ?? moduleShowcase[0];

  const previousTemplate = () =>
    setActiveTemplateIndex((current) => (current - 1 + homepageTemplates.length) % homepageTemplates.length);
  const nextTemplate = () =>
    setActiveTemplateIndex((current) => (current + 1) % homepageTemplates.length);

  const vars = {
    "--bg": theme === "dark" ? "#000000" : "#e7e8f3",
    "--surface": theme === "dark" ? "#090a10" : "#f8f7fc",
    "--surface-2": theme === "dark" ? "#101119" : "#efedf8",
    "--text": theme === "dark" ? "#f7f6fb" : "#17182a",
    "--muted": theme === "dark" ? "#aaa9b5" : "#62647a",
    "--muted-2": theme === "dark" ? "#777784" : "#797b91",
    "--border": theme === "dark" ? "rgba(214,204,255,0.095)" : "rgba(96,76,168,0.15)",
    "--border-strong": theme === "dark" ? "rgba(214,204,255,0.18)" : "rgba(91,72,172,0.27)",
    "--button": theme === "dark" ? "#f7f6fb" : "#5d55cf",
    "--button-text": theme === "dark" ? "#05060a" : "#ffffff",
    "--accent": "#6558ff",
    "--home-violet": theme === "dark" ? "#b59dff" : "#7458d7",
    "--home-flow-start": theme === "dark" ? "#05060a" : "#eeedf7",
    "--home-flow": theme === "dark"
      ? "radial-gradient(ellipse 78% 34% at 52% -4%, rgba(124,88,255,.16), transparent 64%), radial-gradient(ellipse 56% 28% at 88% 28%, rgba(68,92,215,.08), transparent 70%), radial-gradient(ellipse 64% 36% at 8% 62%, rgba(119,73,205,.055), transparent 72%), linear-gradient(180deg, #05060a 0%, #090a10 30%, #07080d 67%, #05060a 100%)"
      : "radial-gradient(ellipse 72% 34% at 54% -4%, rgba(116,88,215,.14), transparent 66%), radial-gradient(ellipse 54% 30% at 88% 32%, rgba(112,97,204,.08), transparent 72%), linear-gradient(180deg, #f0eff8 0%, #e8e8f2 44%, #efedf7 100%)",
    "--accent-soft": theme === "dark" ? "rgba(108,82,255,0.18)" : "rgba(116,88,215,0.13)",
    "--accent-soft-2": theme === "dark" ? "rgba(136,93,255,0.10)" : "rgba(116,88,215,0.08)",
  } as CSSProperties;

  return (
    <main
      data-orbyven-public-theme={theme}
      style={{
        ...vars,
        backgroundColor: "var(--bg)",
        color: "var(--text)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
      className="orbyven-public-shell orbyven-home-main relative min-h-screen overflow-x-clip antialiased [&_input]:text-[16px] [&_select]:text-[16px] [&_textarea]:text-[16px]"
    >
      <SiteHeader theme={theme} compact={false} activePage="home" onToggleTheme={toggleTheme} />
      <WarpMenu items={warpItems} activeSection={activeSection} />

      <section
        id="intro"
        ref={heroRef}
        className="orbyven-home-hero relative flex min-h-[100svh] scroll-mt-24 items-center justify-center overflow-hidden bg-[var(--bg)] md:min-h-screen"
      >
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[-29%] hidden h-[760px] w-[1100px] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] blur-[150px] md:block" />
        <div aria-hidden="true" className="orbyven-home-starfield absolute inset-0" />
        <div aria-hidden="true" className="orbyven-home-hero-aurora absolute inset-0" />
        <OrbitalSystem variant="hero" className="top-[48%]" />

        <motion.div
          style={{ y: desktopMotion ? heroY : 0, opacity: desktopMotion ? heroOpacity : 1, scale: desktopMotion ? heroScale : 1 }}
          className="relative mx-auto flex w-full max-w-[1500px] -translate-y-[1vh] flex-col items-center px-5 text-center sm:px-6 md:-translate-y-[3vh] md:px-10"
        >
          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.08, ease: easeOut }} className="mb-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-2)] sm:mb-9 sm:text-[11px]">
            ORBYVEN CREATIVE
          </motion.p>
          <h1 className="contents">
            <span className="block overflow-hidden pb-2">
              <motion.span initial={{ y: "115%" }} animate={{ y: "0%" }} transition={{ duration: 1.05, delay: 0.16, ease: easeOut }} className="orbyven-home-hero-title block text-[clamp(46px,13vw,56px)] font-semibold leading-[0.94] tracking-[-0.06em] sm:text-[80px] md:text-[104px] lg:text-[124px] xl:text-[132px]">
                Construim
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-4">
              <motion.span initial={{ y: "115%" }} animate={{ y: "0%" }} transition={{ duration: 1.12, delay: 0.27, ease: easeOut }} className="orbyven-home-hero-title orbyven-home-hero-title--accent block text-[clamp(46px,13vw,56px)] font-semibold leading-[0.94] tracking-[-0.06em] sm:text-[80px] md:text-[104px] lg:text-[124px] xl:text-[132px]">
                ce rămâne în minte.
              </motion.span>
            </span>
          </h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.65, ease: easeOut }} className="mt-7 max-w-2xl text-balance text-sm leading-6 text-[var(--muted)] sm:mt-9 sm:text-base">
            ORBYVEN CREATIVE creează website-uri pentru afaceri și invitații digitale personalizate de nuntă, botez și majorat. Web design, modele interactive și instrumente simple, în același studio.
          </motion.p>
        </motion.div>
      </section>

      <section id="modular" className="orbyven-home-soft orbyven-home-flow-section orbyven-home-flow-section--workspace relative scroll-mt-24 overflow-hidden px-5 py-16 sm:px-6 md:px-10 md:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[65%] bg-[radial-gradient(circle_at_60%_15%,rgba(75,70,238,0.10),transparent_56%)]" />
        <div className="relative mx-auto max-w-[1500px]">
          <div className="grid gap-9 lg:grid-cols-[0.68fr_1.32fr] lg:items-center xl:gap-16">
            <div>
              <p className="orbyven-home-kicker"><span aria-hidden="true" className="orbyven-home-kicker-icon">✦</span><span>Un singur spațiu. Totul conectat.</span><span aria-hidden="true" className="orbyven-home-kicker-line" /></p>
              <h2 className="mt-4 max-w-xl text-[44px] font-semibold leading-[0.96] tracking-[-0.06em] sm:text-[62px]">Activezi <span className="relative z-10 -mx-[0.03em] text-[var(--home-violet)]">doar</span> ce folosești.</h2>
              <p className="mt-5 max-w-md text-[15px] font-medium leading-7 text-[var(--home-violet)]">Modulele nu sunt pagini lipite una lângă alta. Își păstrează contextul și lucrează împreună.</p>
              <Link href="/workspace" className="mt-7 inline-flex h-12 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-6 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-[var(--accent)]/60">Dashboard →</Link>
            </div>

            <div className="orbyven-home-workspace-shell relative overflow-hidden rounded-[38px] border border-[var(--border-strong)] bg-[var(--surface-2)] p-3 shadow-[0_28px_90px_rgba(0,0,0,.12)] sm:p-5">
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-28 h-[330px] w-[330px] rounded-full bg-[var(--accent-soft)] blur-[95px]"
                animate={{ x: [0, -32, 8, 0], y: [0, 28, -8, 0], scale: [1, 1.12, 0.96, 1] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-32 -left-20 h-[300px] w-[300px] rounded-full bg-[rgba(73,120,255,.12)] blur-[110px]"
                animate={{ x: [0, 34, -12, 0], y: [0, -18, 20, 0] }}
                transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                {moduleShowcase.map((module, index) => {
                  const active = index === activeModuleIndex;
                  return (
                    <motion.button
                      key={module.name}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setActiveModuleIndex(index)}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.97 }}
                      animate={{ scale: active ? 1.015 : 1 }}
                      transition={{ type: "spring", stiffness: 320, damping: 24 }}
                      style={active ? { backgroundImage: module.glow } : undefined}
                      className={`group relative min-h-[112px] overflow-hidden rounded-[22px] border p-4 text-left transition-colors sm:min-h-[126px] ${active ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_14px_38px_rgba(75,70,238,.12)]" : "border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)]"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm ${active ? "border-[rgba(112,104,255,.55)] bg-[rgba(75,70,238,.18)] text-[var(--text)]" : "border-[var(--border)] text-[var(--muted-2)]"}`}>{module.glyph}</span>
                        <span className="text-[9px] font-semibold tracking-[0.12em] text-[var(--muted-2)]">{String(index + 1).padStart(2, "0")}</span>
                      </div>
                      <div className="mt-5 flex items-center gap-2">
                        <motion.span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: active ? "var(--accent)" : "var(--muted-2)" }}
                          animate={active ? { boxShadow: ["0 0 0 rgba(75,70,238,0)", "0 0 18px rgba(75,70,238,.9)", "0 0 0 rgba(75,70,238,0)"] } : {}}
                          transition={{ duration: 2.1, repeat: Infinity }}
                        />
                        <span className="text-[13px] font-semibold sm:text-sm">{module.name}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="relative mt-3 min-h-[235px] overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg)] p-6 sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-90" style={{ backgroundImage: activeModule.glow }} />
                <div aria-hidden="true" className="pointer-events-none absolute right-[-8%] top-[-24%] text-[clamp(88px,14vw,190px)] font-semibold leading-none tracking-[-0.09em] text-[var(--text)] opacity-[0.025]">{activeModule.name}</div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeModule.name}
                    initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                    transition={{ duration: 0.34, ease: easeOut }}
                    className="relative flex min-h-[185px] flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-2)]">{activeModule.eyebrow}</span>
                        <span className="h-px w-8 bg-[var(--border-strong)]" />
                        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Activ</span>
                      </div>
                      <h3 className="mt-5 max-w-2xl text-[28px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-[38px]">{activeModule.note}</h3>
                    </div>
                    <div className="mt-7 flex flex-wrap gap-2">
                      {activeModule.chips.map((chip, chipIndex) => (
                        <motion.span
                          key={chip}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.08 + chipIndex * 0.06 }}
                          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-[10px] font-semibold text-[var(--muted)]"
                        >
                          {chip}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="templates" className="orbyven-home-soft orbyven-home-flow-section orbyven-home-flow-section--templates scroll-mt-24 px-5 py-16 sm:px-6 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="orbyven-home-kicker"><span aria-hidden="true" className="orbyven-home-kicker-icon">✦</span><span>Colecția ORBYVEN</span><span aria-hidden="true" className="orbyven-home-kicker-line" /></p>
              <h2 className="mt-3 text-[38px] font-semibold tracking-[-0.055em] sm:text-[52px]">Vezi. <span className="relative z-10 -mx-[0.045em] inline-block text-[var(--home-violet)]">Glisează.</span> Alege.</h2>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={previousTemplate} aria-label="Template anterior" className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg)]">←</button>
              <button type="button" onClick={nextTemplate} aria-label="Template următor" className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg)]">→</button>
            </div>
          </div>

          <div className="orbyven-home-template-shell mt-8 overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--bg)] p-3 sm:p-4">
            <HomeTemplatePreviewFrame key={activeTemplate.source === "featured" ? activeTemplate.href : activeTemplate.slug}>
              {activeTemplate.source === "featured" ? (
                <FeaturedTemplatePreview kind={activeTemplate.kind} eagerDemo />
              ) : (
                <ClientTemplatePreview template={activeTemplate} compact />
              )}
            </HomeTemplatePreviewFrame>
            <div className="flex flex-col gap-4 px-2 pb-2 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted-2)]">{activeTemplate.source === "featured" ? activeTemplate.label : activeTemplate.category}</p>
                <p className="mt-1 text-xl font-semibold">{activeTemplate.title}</p>
              </div>
              <Link href={activeTemplate.source === "featured" ? activeTemplate.href : `/templates/${activeTemplate.slug}`} className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--button)] px-5 text-sm font-semibold text-[var(--button-text)]">
                Deschide ↗
              </Link>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="flex gap-2">
              {homepageTemplates.map((template, index) => (
                <button key={template.source === "featured" ? template.href : template.slug} type="button" onClick={() => setActiveTemplateIndex(index)} aria-label={`Arată ${template.title}`} className={`h-1.5 rounded-full transition-all ${index === activeTemplateIndex ? "w-10 bg-[var(--text)]" : "w-5 bg-[var(--border-strong)]"}`} />
              ))}
            </div>
            <Link href="/templates" className="text-xs font-semibold">Toate →</Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="invitatii-orbyven" className="orbyven-home-soft orbyven-home-flow-section orbyven-home-flow-section--invites px-5 py-16 sm:px-6 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1500px]">
          <p className="orbyven-home-kicker"><span aria-hidden="true" className="orbyven-home-kicker-icon">✦</span><span>Momente care rămân</span><span aria-hidden="true" className="orbyven-home-kicker-line" /></p>
          <h2 id="invitatii-orbyven" className="mt-4 max-w-3xl text-[38px] font-semibold leading-[1.05] tracking-[-0.055em] sm:text-[52px]">Momente <span className="relative z-10 -mx-[0.035em] text-[var(--home-violet)]">personale.</span> Un link memorabil.</h2>
          <div className="orbyven-home-invite-grid mt-10">
            {[
              { href: "/invitatii-nunta", title: "Invitații de nuntă", label: "O poveste în doi", kind: "wedding" as const },
              { href: "/invitatii-botez", title: "Invitații de botez", label: "Un nou început", kind: "baptism" as const },
              { href: "/invitatii-majorat", title: "Invitații de majorat", label: "Un nou capitol", kind: "birthday" as const },
            ].map((item, index) => (
              <Link key={item.href} href={item.href} className="orbyven-home-invite-card group relative isolate block overflow-hidden rounded-[30px] border border-[var(--border-strong)] bg-[var(--surface-2)] hover:border-[var(--home-violet)] focus-visible:border-[var(--home-violet)]">
                <HomeInvitationPreview kind={item.kind} />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080710]/85 via-transparent to-transparent" />
                <span className="absolute left-6 top-6 rounded-full border border-white/30 bg-black/20 px-3 py-2 text-[9px] font-semibold tracking-[.17em] text-white shadow-sm backdrop-blur-sm">ORBYVEN / 0{index + 1}</span>
                <span aria-hidden="true" className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-sm transition duration-300 group-hover:rotate-45 group-hover:bg-[var(--accent)]">↗</span>
                <div className="absolute inset-x-7 bottom-8">
                  <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#d8c7ff]">{item.label}</p>
                  <h3 className="mt-3 text-[clamp(27px,3vw,44px)] font-semibold leading-[1.02] tracking-[-.06em] text-white">{item.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="orbyven-home-soft orbyven-home-flow-section orbyven-home-flow-section--services scroll-mt-24 px-5 py-16 sm:px-6 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="orbyven-home-kicker"><span aria-hidden="true" className="orbyven-home-kicker-icon">✦</span><span>Ideile tale, în formă digitală</span><span aria-hidden="true" className="orbyven-home-kicker-line" /></p>
              <h2 className="mt-4 text-[42px] font-semibold tracking-[-0.055em] sm:text-[58px]">Construim <span className="relative z-10 -mx-[0.02em] text-[var(--home-violet)]">ce ai nevoie.</span></h2>
            </div>
            <Link href="/servicii" className="text-sm font-semibold">Detalii →</Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => (
              <motion.div key={service.title} whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 280, damping: 24 }}>
                <Link href="/servicii" className="orbyven-home-service-card group relative flex min-h-[280px] h-full flex-col justify-between overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg)] p-6 transition hover:border-[var(--border-strong)]">
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-80"
                    style={{ backgroundImage: service.glow }}
                    animate={{ scale: [1, 1.08, 1], opacity: [0.58, 0.92, 0.58] }}
                    transition={{ duration: 7 + index * 1.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div aria-hidden="true" className="pointer-events-none absolute -bottom-4 -left-1 text-[68px] font-semibold leading-none tracking-[-0.07em] text-[var(--text)] opacity-[0.035] sm:text-[76px]">{service.title}</div>
                  <div className="relative flex items-start justify-between gap-4">
                    <span className="text-[10px] font-semibold tracking-[0.14em] text-[var(--muted-2)]">{service.number}</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--muted)] transition duration-300 group-hover:rotate-45 group-hover:border-[var(--accent)]/50 group-hover:text-[var(--text)]">↗</span>
                  </div>
                  <div className="relative mt-12">
                    <h3 className="text-[27px] font-semibold leading-[1.02] tracking-[-0.05em]">{service.title}</h3>
                    <p className="mt-4 text-[13px] leading-6 text-[var(--muted)]">{service.note}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="orbyven-home-soft orbyven-home-flow-section orbyven-home-flow-section--pricing relative scroll-mt-24 overflow-hidden px-5 py-16 sm:px-6 md:px-10 md:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[30%] h-[460px] w-[900px] -translate-x-1/2 rounded-full bg-[var(--accent-soft-2)] blur-[160px]" />
        <div className="relative mx-auto max-w-[1500px]">
          <p className="orbyven-home-kicker"><span aria-hidden="true" className="orbyven-home-kicker-icon">✦</span><span>Alegi ritmul în care crești</span><span aria-hidden="true" className="orbyven-home-kicker-line" /></p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="text-[42px] font-semibold tracking-[-0.055em] sm:text-[58px]">Simplu <span className="relative z-10 -mx-[0.02em] text-[var(--home-violet)]">de ales.</span></h2>
            <p className="max-w-md text-sm leading-6 text-[var(--muted)]">Trei niveluri clare. Începi cu cât ai nevoie și păstrezi aceeași experiență ORBYVEN.</p>
          </div>

          <div className="orbyven-home-price-grid mt-10 grid gap-4 lg:grid-cols-3">
            {Object.values(BILLING_PLANS).map((plan, index) => {
              const meta = planMeta[plan.id];
              const featured = plan.id === "business";
              return (
                <motion.article
                  key={plan.id}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 270, damping: 24 }}
                  className={`orbyven-home-price group relative overflow-hidden rounded-[32px] border p-6 sm:p-7 ${featured ? "border-[rgba(93,83,255,.55)] bg-[var(--surface-2)] shadow-[0_26px_70px_rgba(75,70,238,.12)]" : "border-[var(--border)] bg-[var(--surface)]"}`}
                >
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-20 -top-24 h-[280px] w-[280px] rounded-full bg-[var(--accent-soft)] blur-[95px]"
                    animate={{ x: [0, -18, 8, 0], y: [0, 18, -5, 0], scale: [1, 1.08, 0.98, 1] }}
                    transition={{ duration: 11 + index * 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div aria-hidden="true" className="pointer-events-none absolute -bottom-7 right-3 text-[112px] font-semibold leading-none tracking-[-0.08em] text-[var(--text)] opacity-[0.025]">{plan.name}</div>

                  <div className="relative flex min-h-[430px] flex-col">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-2)]">{meta.eyebrow}</p>
                        <p className="mt-2 text-[13px] font-semibold tracking-[0.06em]">{plan.name}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] ${featured ? "border-[rgba(93,83,255,.45)] bg-[var(--accent-soft)] text-[var(--text)]" : "border-[var(--border)] bg-[var(--bg)] text-[var(--muted)]"}`}>{meta.badge}</span>
                    </div>

                    <div className="mt-10 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-[58px] font-semibold leading-none tracking-[-0.07em] sm:text-[66px]">{plan.priceLei}</span>
                      <span className="whitespace-nowrap text-sm font-medium text-[var(--muted)]">lei / lună</span>
                    </div>
                    <p className="mt-5 max-w-sm text-[13px] leading-6 text-[var(--muted)]">{meta.audience}</p>

                    <div className="mt-7 border-t border-[var(--border)] pt-5">
                      <div className="flex items-center justify-between gap-4 text-xs">
                        <span className="text-[var(--muted-2)]">Module incluse</span>
                        <span className="font-semibold">{plan.entitlements.length}</span>
                      </div>
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--bg)]">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${Math.max(24, (plan.entitlements.length / 8) * 100)}%` }}
                          viewport={{ once: true, amount: 0.7 }}
                          transition={{ duration: 0.8, delay: index * 0.1, ease: easeOut }}
                          className="h-full rounded-full bg-[var(--accent)]"
                        />
                      </div>
                    </div>

                    <div className="mt-auto pt-8">
                      <Link href={`/contact?plan=${plan.id}&source=homepage`} className={`inline-flex h-12 w-full items-center justify-between rounded-full border px-5 text-sm font-semibold transition duration-300 group-hover:translate-y-[-1px] ${featured ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--border-strong)] bg-[var(--bg)] text-[var(--text)]"}`}>
                        <span>Alege {plan.name}</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="start" className="orbyven-home-flow-section orbyven-home-flow-section--start scroll-mt-24 px-5 pb-8 sm:px-6 md:px-10">
        <div className="orbyven-home-start-card mx-auto max-w-[1500px] rounded-[34px] bg-[var(--button)] px-6 py-14 text-[var(--button-text)] sm:px-8 md:px-12 md:py-18">
          <p className="text-[10px] uppercase tracking-[0.18em] opacity-50">Start</p>
          <div className="mt-4 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-4xl text-[44px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[62px]">Spune-ne ce vrei să rezolvi.</h2>
            <Link href="/cerere" className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] px-6 text-sm font-semibold text-[var(--text)]">Începe →</Link>
          </div>
        </div>
      </section>

      <AppDownloadSection locale="ro" />

      <SiteFooter theme={theme} activePage="home" />
    </main>
  );
}
