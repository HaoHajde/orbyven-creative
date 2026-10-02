"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import WebDesignPreview from "@/components/ai/WebDesignPreview";
import WebDesignSpecialist from "@/components/ai/WebDesignSpecialist";
import { SITE_PRESETS, type EditableSite } from "@/lib/ai/site-editor";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";

type Theme = "light" | "dark";
type EntryMode = "checking" | "public" | "tool";

const DEMO_DRAFT: EditableSite = {
  ...SITE_PRESETS.studio,
  brand: "ORBYVEN AI",
  eyebrow: "WEB DESIGN INTELLIGENCE",
  headline: "Descrii afacerea. ORBYVEN construiește direcția.",
  description:
    "Un preview viu construit din componente validate, cu structură, copy și identitate vizuală coerente.",
  cta: "Pornește proiectul",
  servicesTitle: "Un site construit în jurul obiectivului",
  services: [
    {
      title: "Structură",
      description: "AI-ul alege și ordonează secțiunile potrivite pentru obiectivul paginii.",
    },
    {
      title: "Identitate",
      description: "Paleta, densitatea și ritmul vizual rămân coerente în aceeași direcție.",
    },
    {
      title: "Rafinare",
      description: "Poți cere schimbări punctuale fără să reconstruiești inutil tot designul.",
    },
  ],
  benefitsTitle: "Control fără complexitate",
  benefits: [
    { title: "Preview live", description: "Vezi imediat direcția înainte de publicare." },
    { title: "Design DNA", description: "Alternative suficient de diferite, nu doar texte schimbate." },
    { title: "Safe by design", description: "Modelul livrează date validate, nu cod arbitrar." },
  ],
  aboutTitle: "AI care lucrează în limite clare",
  aboutDescription:
    "ORBYVEN Web Design AI păstrează faptele reale, urmărește obiectivul business-ului și folosește doar componente controlate.",
  hiddenSections: ["gallery", "process", "faq"],
  accent: "#745cff",
  background: "#0b0b10",
  surface: "#14141c",
  textColor: "#f5f5f7",
  visualTone: "editorial",
  layout: "editorial",
  variants: {
    ...SITE_PRESETS.studio.variants,
    hero: "editorial",
    services: "spotlight",
    benefits: "strip",
    about: "story",
    contact: "compact",
  },
};

export default function AiWebDesignEntry() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mode, setMode] = useState<EntryMode>("checking");

  useEffect(() => {
    let active = true;

    const saved = window.localStorage.getItem("studio-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme: Theme =
      saved === "dark" || saved === "light" ? saved : prefersDark ? "dark" : "light";

    const themeFrame = window.requestAnimationFrame(() => {
      setTheme(nextTheme);
      document.documentElement.style.colorScheme = nextTheme;
      document.body.style.backgroundColor = nextTheme === "dark" ? "#09090d" : "#f8f8fb";
    });

    void orbyvenSupabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setMode(data.session ? "tool" : "public");
    }).catch((error) => {
      console.warn("ORBYVEN AI Web Design session check unavailable", error);
      if (active) setMode("public");
    });

    return () => {
      active = false;
      window.cancelAnimationFrame(themeFrame);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      document.body.style.backgroundColor = next === "dark" ? "#09090d" : "#f8f8fb";
      return next;
    });
  };

  if (mode === "tool") {
    return <WebDesignSpecialist />;
  }

  const vars = {
    "--bg": theme === "dark" ? "#09090d" : "#f8f8fb",
    "--surface": theme === "dark" ? "#101014" : "#ffffff",
    "--surface-2": theme === "dark" ? "#17171d" : "#f1f1f5",
    "--text": theme === "dark" ? "#f5f5f7" : "#17171b",
    "--muted": theme === "dark" ? "#aaaab2" : "#66666f",
    "--muted-2": theme === "dark" ? "#74747e" : "#868690",
    "--border": theme === "dark" ? "rgba(255,255,255,.085)" : "rgba(18,18,24,.075)",
    "--border-strong": theme === "dark" ? "rgba(255,255,255,.15)" : "rgba(18,18,24,.14)",
    "--button": theme === "dark" ? "#f5f5f7" : "#17171b",
    "--button-text": theme === "dark" ? "#09090d" : "#ffffff",
    "--accent": "#745cff",
    "--accent-soft": theme === "dark" ? "rgba(116,92,255,.16)" : "rgba(116,92,255,.09)",
  } as CSSProperties;

  if (mode === "checking") {
    return (
      <main
        style={vars}
        className="grid min-h-screen place-items-center bg-[var(--bg)] text-[var(--text)]"
      >
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#9f8dff]">
            ORBYVEN · AI WEB DESIGN
          </p>
          <p className="mt-3 text-[12px] text-[var(--muted)]">Se pregătește experiența…</p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        ...vars,
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif",
      }}
      className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)] antialiased"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-26rem] h-[64rem] w-[78rem] max-w-[96vw] -translate-x-1/2 rounded-full bg-[rgba(116,92,255,.18)] blur-[180px]" />
        <div className="absolute right-[-20rem] top-[56rem] h-[44rem] w-[44rem] rounded-full bg-[rgba(64,108,255,.10)] blur-[180px]" />
      </div>

      <SiteHeader
        theme={theme}
        compact={false}
        activePage="webDesignAi"
        onToggleTheme={toggleTheme}
      />

      <section className="relative z-10 px-5 pb-16 pt-32 sm:px-6 md:px-10 md:pb-24 md:pt-40">
        <div className="mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-[.78fr_1.22fr] lg:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#9f8dff]">
              ORBYVEN · AI WEB DESIGN
            </p>
            <h1 className="mt-6 max-w-[760px] text-[clamp(54px,7vw,112px)] font-semibold leading-[.86] tracking-[-.074em]">
              Website-ul începe cu o <span className="text-[#9f8dff]">conversație.</span>
            </h1>
            <p className="mt-7 max-w-xl text-[14px] leading-7 text-[var(--muted)] sm:text-[15px]">
              Descrii business-ul, obiectivul și direcția dorită. ORBYVEN Web Design AI construiește,
              rafinează și propune alternative într-un sistem vizual controlat.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/workspace/login?next=ai-web-design"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--button)] px-6 text-[12px] font-semibold text-[var(--button-text)] transition hover:-translate-y-0.5"
              >
                Deschide AI Web Design →
              </Link>
              <Link
                href="/templates"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-6 text-[12px] font-semibold"
              >
                Vezi Templates
              </Link>
            </div>

            <div className="mt-9 grid max-w-xl grid-cols-3 gap-2">
              {[
                ["01", "Brief"],
                ["02", "Preview"],
                ["03", "Rafinare"],
              ].map(([number, label]) => (
                <div
                  key={number}
                  className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)]/80 px-4 py-4"
                >
                  <p className="text-[8px] font-bold text-[#9f8dff]">{number}</p>
                  <p className="mt-2 text-[11px] font-semibold">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-[var(--border-strong)] bg-[#0e1018] p-2 shadow-[0_35px_120px_rgba(0,0,0,.28)] sm:p-3">
            <div className="mb-2 flex items-center justify-between px-3 py-2">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[.18em] text-white/40">
                  LIVE DESIGN ENGINE
                </p>
                <p className="mt-1 text-[11px] font-semibold text-white/80">Preview controlat</p>
              </div>
              <span className="rounded-full border border-[#9f8dff]/25 bg-[#9f8dff]/10 px-3 py-2 text-[8px] font-bold text-[#c9beff]">
                AI
              </span>
            </div>
            <div className="max-h-[690px] overflow-hidden rounded-[24px]">
              <WebDesignPreview draft={DEMO_DRAFT} device="desktop" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1500px] px-5 py-16 sm:px-6 md:px-10 md:py-24">
        <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[var(--muted-2)]">
          CUM LUCREAZĂ
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Înțelege intenția",
              copy: "Separă obiectivul paginii de preferințele vizuale și păstrează faptele reale.",
            },
            {
              title: "Construiește coerent",
              copy: "Alege structură, componente, densitate, paletă și ierarhie în aceeași direcție.",
            },
            {
              title: "Rafinează fără haos",
              copy: "Schimbările punctuale păstrează elementele care nu trebuie reconstruite.",
            },
          ].map((item, index) => (
            <article
              key={item.title}
              className="min-h-[220px] rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <p className="text-[9px] font-bold text-[#9f8dff]">0{index + 1}</p>
              <h2 className="mt-10 text-[24px] font-semibold tracking-[-.045em]">{item.title}</h2>
              <p className="mt-3 text-[11px] leading-5 text-[var(--muted)]">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-5 pb-10 pt-6 sm:px-6 md:px-10">
        <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[34px] bg-[var(--button)] px-6 py-14 text-[var(--button-text)] sm:px-8 md:px-12">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[.18em] opacity-45">
                ORBYVEN WEB DESIGN INTELLIGENCE
              </p>
              <h2 className="mt-4 max-w-4xl text-[clamp(38px,5vw,64px)] font-semibold leading-[.94] tracking-[-.06em]">
                Spune ce vrei să construiești.
              </h2>
            </div>
            <Link
              href="/workspace/login?next=ai-web-design"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] px-6 text-[11px] font-semibold text-[var(--text)]"
            >
              Intră în AI Web Design →
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter theme={theme} activePage="services" />
    </main>
  );
}
