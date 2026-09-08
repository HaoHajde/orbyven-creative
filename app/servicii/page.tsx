"use client";

import OrbitalSystem from "@/components/OrbitalSystem";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

type Theme = "light" | "dark";

type Service = {
  number: string;
  title: string;
  line: string;
  tags: string[];
};

const services: Service[] = [
  {
    number: "01",
    title: "Website",
    line: "Prezență clară pentru firmă, servicii și contact.",
    tags: ["Responsive", "SEO de bază", "Formulare"],
  },
  {
    number: "02",
    title: "Landing page",
    line: "O singură ofertă. O singură acțiune importantă.",
    tags: ["Campanii", "Conversie", "Analytics"],
  },
  {
    number: "03",
    title: "Redesign",
    line: "Păstrăm ce funcționează. Refacem ce te ține în urmă.",
    tags: ["UI", "UX", "Performanță"],
  },
  {
    number: "04",
    title: "Experiență digitală",
    line: "Proiecte speciale: invitații, microsite-uri și interacțiuni custom.",
    tags: ["RSVP", "Microsite", "Custom"],
  },
];

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function ServicesPage() {
  const [theme, setTheme] = useState<Theme>("light");

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

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      document.body.style.backgroundColor = next === "dark" ? "#000000" : "#ffffff";
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
    "--border": theme === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
    "--border-strong": theme === "dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.14)",
    "--button": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--button-text": theme === "dark" ? "#000000" : "#ffffff",
    "--accent": "#4b46ee",
    "--accent-soft": theme === "dark" ? "rgba(75,70,238,0.18)" : "rgba(75,70,238,0.08)",
  } as CSSProperties;

  return (
    <main
      style={{ ...vars, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif" }}
      className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)] antialiased"
    >
      <SiteHeader theme={theme} compact={false} activePage="services" onToggleTheme={toggleTheme} />

      <section className="relative flex min-h-[82svh] items-end overflow-hidden px-5 pb-16 pt-32 sm:px-6 md:min-h-[92vh] md:px-10 md:pb-24 md:pt-40">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[-28%] hidden h-[760px] w-[1120px] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] blur-[160px] md:block" />
        <OrbitalSystem variant="accent" className="left-[74%] top-[46%]" />
        <div className="relative mx-auto w-full max-w-[1500px]">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
            ORBYVEN · Servicii
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.95, delay: 0.08, ease: easeOut }} className="mt-6 max-w-[1250px] text-[clamp(54px,8vw,122px)] font-semibold leading-[0.91] tracking-[-0.068em]">
            Construim digital.<br />Fără balast.
          </motion.h1>
          <p className="mt-7 max-w-xl text-[16px] leading-7 text-[var(--muted)]">
            Alegi problema. Noi alegem forma potrivită.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-14 sm:px-6 md:px-10 md:py-20">
        <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {services.map((service) => (
            <article key={service.number} className="grid gap-5 py-7 md:grid-cols-[70px_0.9fr_1.1fr] md:items-center md:py-9">
              <span className="text-[10px] font-semibold text-[var(--muted-2)]">{service.number}</span>
              <div>
                <h2 className="text-[34px] font-semibold tracking-[-0.055em] sm:text-[42px]">{service.title}</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">{service.line}</p>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {service.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[11px] font-medium text-[var(--muted)]">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 pb-8 sm:px-6 md:px-10">
        <div className="mx-auto max-w-[1500px] rounded-[34px] bg-[var(--button)] px-6 py-14 text-[var(--button-text)] sm:px-8 md:px-12">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-4xl text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[58px]">Ai altceva în minte? Spune-ne direct.</h2>
            <Link href="/cerere?source=services" className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] px-6 text-sm font-semibold text-[var(--text)]">Trimite cererea →</Link>
          </div>
        </div>
      </section>

      <SiteFooter theme={theme} activePage="services" />
    </main>
  );
}
