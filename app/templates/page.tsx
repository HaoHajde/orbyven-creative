"use client";

import ClientTemplatePreview from "@/components/ClientTemplatePreview";
import OrbitalSystem from "@/components/OrbitalSystem";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { clientTemplateList } from "@/lib/client-template-catalog";
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
  } as CSSProperties;

  return (
    <main
      style={{ ...vars, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif" }}
      className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)] antialiased"
    >
      <SiteHeader theme={theme} compact={false} activePage="templates" onToggleTheme={toggleTheme} />

      <section className="relative flex min-h-[78svh] items-end overflow-hidden px-5 pb-16 pt-32 text-white sm:px-6 md:min-h-[86vh] md:px-10 md:pb-24 md:pt-40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 72% 22%, rgba(116,86,255,.32), transparent 31%), radial-gradient(circle at 30% 34%, rgba(77,54,150,.24), transparent 35%), linear-gradient(180deg, rgba(31,20,55,.99) 0%, rgba(19,11,37,.98) 44%, rgba(8,5,15,.98) 78%, var(--bg) 100%)",
          }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-[8%] top-[22%] h-52 w-52 rounded-full bg-violet-500/10 blur-[80px]"
          animate={{ x: [0, 42, -8, 0], y: [0, 16, 42, 0], scale: [1, 1.12, 0.96, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <OrbitalSystem variant="accent" className="left-[76%] top-[46%] opacity-45" />
        <div className="relative mx-auto w-full max-w-[1500px]">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
            ORBYVEN · Templates
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.08, ease: easeOut }} className="mt-6 max-w-[1200px] text-[clamp(54px,8vw,118px)] font-semibold leading-[0.91] tracking-[-0.068em]">
            Deschizi. Vezi. Alegi.
          </motion.h1>
          <p className="mt-7 max-w-xl text-[16px] leading-7 text-white/58">
            Fiecare template este și demo. Nu există două liste diferite.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-6 md:px-10 md:py-24">
        <div className="grid gap-5 lg:grid-cols-2">

          <Link href="/templates/obsidian-moments" className="group relative min-h-[430px] overflow-hidden rounded-[30px] border border-[#d7b66b]/20 bg-[#080808] text-white lg:min-h-[520px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(209,170,88,.18),transparent_30%),radial-gradient(circle_at_18%_78%,rgba(255,255,255,.06),transparent_34%),linear-gradient(135deg,#070707,#111_58%,#050505)]" />
            <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,.24)_0.7px,transparent_0.7px)] [background-size:8px_8px]" />
            <div className="relative flex min-h-[430px] flex-col justify-between p-7 lg:min-h-[520px] md:p-9">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#d7b66b]">Pilot #001 · Events</p>
                <span className="rounded-full border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[0.14em] text-white/50">Live demo</span>
              </div>
              <div>
                <div className="text-[clamp(54px,7vw,94px)] font-semibold leading-[0.82] tracking-[-0.075em]">OBSIDIAN</div>
                <p className="mt-5 max-w-md text-sm leading-6 text-white/55">360° · oglindă foto · efecte speciale · disponibilitate live.</p>
              </div>
              <div className="flex items-end justify-between gap-5 border-t border-white/10 pt-5">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">Experiențe pentru evenimente</p>
                  <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.05em]">Obsidian Moments</h2>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d7b66b] text-black transition group-hover:rotate-45">↗</span>
              </div>
            </div>
          </Link>

          <Link href="/templates/asfaltari-bucuresti" className="group relative min-h-[430px] overflow-hidden rounded-[30px] border border-[var(--border)] bg-[#17191b] text-white lg:min-h-[520px]">
            <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(247,184,50,.18),transparent_34%),linear-gradient(180deg,#1d2023,#0f1113)]" />
            <div className="absolute right-[-12%] top-[12%] h-64 w-64 rounded-full border-[34px] border-[#f1b52f]/15" />
            <div className="relative flex min-h-[430px] flex-col justify-between p-7 lg:min-h-[520px] md:p-9">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#f1b52f]">Pilot #003 · Infrastructură</p>
                <span className="rounded-full border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[0.14em] text-white/50">București + Ilfov</span>
              </div>
              <div>
                <div className="text-[clamp(58px,8vw,102px)] font-semibold leading-[0.82] tracking-[-0.075em]">VIAFORTE</div>
                <p className="mt-5 max-w-md text-sm leading-6 text-white/55">Asfaltări, utilaje grele, lucrări și transparență operațională.</p>
              </div>
              <div className="flex items-end justify-between gap-5 border-t border-white/10 pt-5">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">Asfaltări · lucrări demo</p>
                  <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.05em]">Asfaltări București</h2>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f1b52f] text-[#111] transition group-hover:rotate-45">↗</span>
              </div>
            </div>
          </Link>

          <Link href="/templates/florarie-bragadiru" className="group relative min-h-[430px] overflow-hidden rounded-[30px] border border-[#7b3445]/10 bg-[#f3e8e7] text-[#26372e] lg:min-h-[520px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(123,52,69,.18),transparent_28%),radial-gradient(circle_at_18%_78%,rgba(55,95,70,.13),transparent_33%),linear-gradient(135deg,#f7efed,#ead8d5)]" />
            <div className="absolute -right-10 top-10 h-52 w-52 rounded-full border border-[#7b3445]/10" />
            <div className="absolute right-10 top-28 h-32 w-32 rounded-full border border-[#486d55]/10" />
            <div className="relative flex min-h-[430px] flex-col justify-between p-7 lg:min-h-[520px] md:p-9">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#7b3445]">Pilot #004 · Florărie</p>
                <span className="rounded-full border border-[#26372e]/10 bg-white/30 px-3 py-2 text-[9px] uppercase tracking-[0.14em] text-[#26372e]/55">Bragadiru</span>
              </div>
              <div>
                <div className="font-serif text-[clamp(54px,7vw,96px)] leading-[0.82] tracking-[-0.065em]">Maison Fleur</div>
                <p className="mt-5 max-w-md text-sm leading-6 text-[#26372e]/60">Buchete, aranjamente, personalizare, coș și comandă online demo.</p>
              </div>
              <div className="flex items-end justify-between gap-5 border-t border-[#26372e]/10 pt-5">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-[#26372e]/40">Flori · livrare locală</p>
                  <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.05em]">Florărie Bragadiru</h2>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#26372e] text-white transition group-hover:rotate-45">↗</span>
              </div>
            </div>
          </Link>

          <Link href="/demo/nunta/elegant" className="group relative min-h-[430px] overflow-hidden rounded-[30px] border border-[var(--border)] bg-[#e9dfcf] lg:min-h-[520px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(255,255,255,.92),transparent_28%),radial-gradient(circle_at_82%_68%,rgba(178,135,58,.18),transparent_34%),linear-gradient(135deg,#f3ecdf,#ded0ba)]" />
            <motion.div
              aria-hidden="true"
              className="absolute -right-24 top-10 h-72 w-72 rounded-full border border-[#9f7730]/20"
              animate={{ rotate: 360, scale: [1, 1.06, 1] }}
              transition={{ rotate: { duration: 28, repeat: Infinity, ease: "linear" }, scale: { duration: 7, repeat: Infinity, ease: "easeInOut" } }}
            />
            <motion.div
              aria-hidden="true"
              className="absolute -left-20 bottom-14 h-64 w-64 rounded-full bg-white/38 blur-3xl"
              animate={{ x: [0, 36, 0], y: [0, -18, 0] }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute inset-0 flex items-center justify-center px-8 pb-24 text-center text-[#261f17]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8f6d33]">Template invitație</p>
                <div className="mt-7 font-serif text-[clamp(56px,7vw,94px)] leading-[0.78] tracking-[-0.07em]">
                  Mire <span className="italic text-[#ad843c]">&amp;</span> Mireasă
                </div>
                <p className="mx-auto mt-7 max-w-sm text-sm leading-6 text-[#655b4f]">Un demo complet, fără date reale, pregătit să fie personalizat pentru fiecare cuplu.</p>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 border-t border-black/8 bg-white/35 p-6 backdrop-blur-xl md:p-8">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-black/45">Wedding · template</p>
                <h2 className="mt-2 text-[34px] font-semibold tracking-[-0.055em] text-[#231d17] md:text-[42px]">Invitație elegantă</h2>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#211a14] text-white transition group-hover:rotate-45">↗</span>
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
