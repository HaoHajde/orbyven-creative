"use client";

import ClientTemplatePreview from "@/components/ClientTemplatePreview";
import OrbitalSystem from "@/components/OrbitalSystem";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { clientTemplateList } from "@/lib/client-template-catalog";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState, type CSSProperties } from "react";

type Theme = "light" | "dark";

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function TemplatesPage() {
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
    "--border": theme === "dark" ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)",
    "--border-strong": theme === "dark" ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.14)",
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
      <SiteHeader theme={theme} compact={false} activePage="templates" onToggleTheme={toggleTheme} />

      <section className="relative flex min-h-[78svh] items-end overflow-hidden px-5 pb-16 pt-32 sm:px-6 md:min-h-[86vh] md:px-10 md:pb-24 md:pt-40">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[-28%] hidden h-[720px] w-[1100px] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] blur-[160px] md:block" />
        <OrbitalSystem variant="accent" className="left-[76%] top-[46%] opacity-45" />
        <div className="relative mx-auto w-full max-w-[1500px]">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
            ORBYVEN · Templates
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.08, ease: easeOut }} className="mt-6 max-w-[1200px] text-[clamp(54px,8vw,118px)] font-semibold leading-[0.91] tracking-[-0.068em]">
            Deschizi. Vezi. Alegi.
          </motion.h1>
          <p className="mt-7 max-w-xl text-[16px] leading-7 text-[var(--muted)]">
            Fiecare template este și demo. Nu există două liste diferite.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-6 md:px-10 md:py-24">
        <div className="grid gap-5 lg:grid-cols-2">
          <Link href="/demo/nunta/diana-florin" className="group relative min-h-[430px] overflow-hidden rounded-[30px] border border-[var(--border)] bg-[#eee6d8] lg:min-h-[520px]">
            <Image src="/demo/nunta/diana-florin/couple1.jpeg" alt="Preview Diana și Florin" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.025]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-6 text-white md:p-8">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/55">Wedding · proiect live</p>
                <h2 className="mt-2 text-[38px] font-semibold tracking-[-0.055em] md:text-[48px]">Diana & Florin</h2>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black">↗</span>
            </div>
          </Link>

          {clientTemplateList.map((template) => (
            <Link key={template.slug} href={`/templates/${template.slug}`} className="group overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-3">
              <ClientTemplatePreview template={template} compact />
              <div className="flex items-end justify-between gap-4 px-3 pb-3 pt-5">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">{template.category}</p>
                  <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.05em]">{template.title}</h2>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--button)] text-[var(--button-text)] transition group-hover:rotate-45">↗</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-5 pb-8 sm:px-6 md:px-10">
        <div className="mx-auto max-w-[1500px] rounded-[34px] bg-[var(--button)] px-6 py-14 text-[var(--button-text)] sm:px-8 md:px-12">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-4xl text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[58px]">Îți place direcția? O facem a ta.</h2>
            <Link href="/cerere" className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] px-6 text-sm font-semibold text-[var(--text)]">Începe →</Link>
          </div>
        </div>
      </section>

      <SiteFooter theme={theme} activePage="templates" />
    </main>
  );
}
