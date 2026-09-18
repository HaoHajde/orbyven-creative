"use client";

import ClientTemplatePreview from "@/components/ClientTemplatePreview";
import FeaturedTemplatePreview, { type FeaturedPreviewKind } from "@/components/FeaturedTemplatePreview";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { clientTemplateList } from "@/lib/client-template-catalog";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

type Theme = "light" | "dark";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const featured: {
  href: string;
  label: string;
  meta: string;
  title: string;
  subtitle: string;
  kind: FeaturedPreviewKind;
}[] = [
  {
    href: "/templates/obsidian-moments",
    label: "Pilot #001 · Events",
    meta: "360° · foto · efecte",
    title: "Obsidian Moments",
    subtitle: "Experiență premium pentru evenimente.",
    kind: "obsidian",
  },
  {
    href: "/templates/asfaltari-bucuresti",
    label: "Pilot #003 · Infrastructură",
    meta: "București + Ilfov",
    title: "VIAFORTE",
    subtitle: "Asfaltări, lucrări și transparență operațională.",
    kind: "asphalt",
  },
  {
    href: "/templates/florarie-bragadiru",
    label: "Pilot #004 · Florărie",
    meta: "Bragadiru",
    title: "Maison Fleur",
    subtitle: "Florărie online cu personalizare și comandă.",
    kind: "florist",
  },
  {
    href: "/templates/haos-customs",
    label: "Pilot #005 · Auto detailing",
    meta: "Luxury black & gold",
    title: "Hao's Customs",
    subtitle: "Detailing, before/after, prețuri și programare.",
    kind: "hao",
  },
  {
    href: "/demo/nunta/elegant",
    label: "Template · Nuntă",
    meta: "Invitație digitală",
    title: "Mire & Mireasă",
    subtitle: "Invitație elegantă, RSVP și detalii de eveniment.",
    kind: "wedding",
  },
  {
    href: "/templates/botez-fetita",
    label: "Template · Botez",
    meta: "Fetiță · invitație digitală",
    title: "Botezul micuței",
    subtitle: "Invitație pastel, program, galerie și RSVP pentru botez.",
    kind: "baptismGirl",
  },
  {
    href: "/templates/botez-baietel",
    label: "Template · Botez",
    meta: "Băiețel · invitație digitală",
    title: "Botezul micuțului",
    subtitle: "Invitație bleu, program, galerie și RSVP pentru botez.",
    kind: "baptismBoy",
  },
]

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.992 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.72, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function TemplatesPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem("studio-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const nextTheme: Theme = saved === "dark" || saved === "light" ? saved : prefersDark ? "dark" : "light";
      setTheme(nextTheme);
      document.documentElement.style.colorScheme = nextTheme;
      document.body.style.backgroundColor = nextTheme === "dark" ? "#000000" : "#ffffff";
    });
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
    "--bg": theme === "dark" ? "#050506" : "#f7f7f8",
    "--surface": theme === "dark" ? "#0d0d0f" : "#ffffff",
    "--surface-2": theme === "dark" ? "#151518" : "#eeeeF1",
    "--text": theme === "dark" ? "#f5f5f7" : "#111114",
    "--muted": theme === "dark" ? "#9a9aa0" : "#6b6b72",
    "--border": theme === "dark" ? "rgba(255,255,255,.09)" : "rgba(0,0,0,.08)",
    "--button": theme === "dark" ? "#f5f5f7" : "#111114",
    "--button-text": theme === "dark" ? "#050506" : "#ffffff",
  } as CSSProperties;

  return (
    <main
      style={{ ...vars, fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif" }}
      className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)] antialiased"
    >
      <SiteHeader theme={theme} compact={false} activePage="templates" onToggleTheme={toggleTheme} />

      <Link
        href="/"
        className="fixed left-4 top-[84px] z-40 hidden h-11 items-center gap-2 rounded-full border border-white/12 bg-black/35 px-4 text-[11px] font-semibold text-white shadow-[0_12px_40px_rgba(0,0,0,.2)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-black/50 md:inline-flex"
      >
        ← Reverse
      </Link>

      <section className="relative isolate flex min-h-[94svh] items-end overflow-hidden px-5 pb-10 pt-32 text-white sm:px-6 md:px-10 md:pb-16 md:pt-40">
        <div className="absolute inset-0 -z-30 bg-[#07070a]" />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_68%_25%,rgba(115,83,255,.35),transparent_26%),radial-gradient(circle_at_24%_68%,rgba(70,51,150,.24),transparent_32%),linear-gradient(180deg,#161027_0%,#09080f_68%,#07070a_100%)]" />
        <div className="absolute inset-0 -z-10 opacity-[.12] [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:44px_44px]" />

        {!reduceMotion ? (
          <>
            <motion.div
              aria-hidden="true"
              className="absolute left-[8%] top-[22%] h-52 w-52 rounded-full bg-violet-500/12 blur-[90px]"
              animate={{ x: [0, 46, -12, 0], y: [0, 22, 42, 0], scale: [1, 1.18, .96, 1] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden="true"
              className="absolute right-[11%] top-[16%] h-72 w-72 rounded-full border border-white/8"
              animate={{ rotate: 360, scale: [1, 1.08, 1] }}
              transition={{ rotate: { duration: 32, repeat: Infinity, ease: "linear" }, scale: { duration: 8, repeat: Infinity, ease: "easeInOut" } }}
            />
          </>
        ) : null}

        <div className="relative mx-auto grid w-full max-w-[1520px] gap-12 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <div>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: .6 }}
              className="text-[9px] font-semibold uppercase tracking-[.27em] text-white/46"
            >
              ORBYVEN · Template system
            </motion.p>
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 34 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: .9, delay: .06, ease }}
              className="mt-6 max-w-[1120px] text-[clamp(62px,10vw,150px)] font-semibold leading-[.78] tracking-[-.078em]"
            >
              Vezi.
              <br />
              <span className="text-white/35">Înțelegi.</span>
              <br />
              Alegi.
            </motion.h1>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: .75, delay: .18, ease }}
            className="lg:pb-2"
          >
            <p className="max-w-md text-[15px] leading-7 text-white/55">
              Fără explicații kilometrice. Intră într-un model și vezi imediat dacă ți se potrivește.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {["01 · intri", "02 · explorezi", "03 · alegi"].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[.045] px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[.13em] text-white/55 backdrop-blur">
                  {item}
                </span>
              ))}
            </div>
            <a href="#modele" className="mt-8 inline-flex h-12 items-center rounded-full bg-white px-6 text-[12px] font-semibold text-black transition hover:-translate-y-0.5">
              Vezi modelele ↓
            </a>
          </motion.div>
        </div>
      </section>

      <section id="modele" className="mx-auto max-w-[1520px] px-5 py-14 sm:px-6 md:px-10 md:py-20">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[var(--muted)]">Alege după senzație</p>
            <h2 className="mt-4 text-[clamp(42px,6vw,76px)] font-semibold leading-[.9] tracking-[-.062em]">Fiecare business.<br />Altă personalitate.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[var(--muted)]">Structura rămâne simplă. Stilul rămâne al clientului.</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {featured.map((item, index) => (
            <Reveal key={item.href} delay={index * .035}>
              <Link
                href={item.href}
                className="group block overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_20px_70px_rgba(0,0,0,.07)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_30px_100px_rgba(0,0,0,.14)]"
              >
                <div className="overflow-hidden rounded-[27px]">
                  <div className="transition duration-700 ease-out group-hover:scale-[1.018]">
                    <FeaturedTemplatePreview kind={item.kind} />
                  </div>
                </div>

                <div className="flex items-end justify-between gap-5 px-3 pb-3 pt-5 sm:px-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="text-[8px] font-bold uppercase tracking-[.18em] text-[var(--muted)]">{item.label}</p>
                      <span className="text-[8px] text-[var(--muted)]/65">· {item.meta}</span>
                    </div>
                    <h3 className="mt-2 text-[27px] font-semibold tracking-[-.045em] sm:text-[31px]">{item.title}</h3>
                    <p className="mt-1.5 max-w-lg text-[11px] leading-5 text-[var(--muted)]">{item.subtitle}</p>
                  </div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--button)] text-[var(--button-text)] transition duration-300 group-hover:rotate-45">↗</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1520px] px-5 pb-16 sm:px-6 md:px-10 md:pb-24">
        <div className="mb-8 flex items-end justify-between gap-5 border-t border-[var(--border)] pt-10">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[var(--muted)]">Alte direcții</p>
            <h2 className="mt-3 text-[36px] font-semibold tracking-[-.05em] md:text-[48px]">Aceeași logică. Altă industrie.</h2>
          </div>
          <span className="hidden text-[10px] uppercase tracking-[.16em] text-[var(--muted)] md:block">max. 3 click-uri</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {clientTemplateList.map((template, index) => (
            <Reveal key={template.slug} delay={Math.min(index * .025, .12)}>
              <Link
                href={`/templates/${template.slug}`}
                className="group grid min-h-[310px] overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-3 transition duration-400 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(0,0,0,.10)] sm:grid-cols-[1.02fr_.98fr]"
              >
                <div className="overflow-hidden rounded-[22px]">
                  <ClientTemplatePreview template={template} compact />
                </div>
                <div className="flex min-h-[210px] flex-col justify-between p-5 sm:min-h-full sm:p-6">
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-[.18em] text-[var(--muted)]">{template.category}</p>
                    <h3 className="mt-3 text-[34px] font-semibold leading-[.94] tracking-[-.055em]">{template.title}</h3>
                    <p className="mt-4 max-w-sm text-[12px] leading-6 text-[var(--muted)]">{template.description}</p>
                  </div>
                  <div className="mt-8 flex items-center justify-between border-t border-[var(--border)] pt-4">
                    <span className="text-[10px] font-semibold">Vezi modelul</span>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--button)] text-[var(--button-text)] transition group-hover:rotate-45">↗</span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-5 pb-8 sm:px-6 md:px-10">
        <div className="mx-auto max-w-[1520px] overflow-hidden rounded-[36px] bg-[var(--button)] px-7 py-14 text-[var(--button-text)] sm:px-9 md:px-12 md:py-16">
          <p className="text-[9px] font-bold uppercase tracking-[.2em] opacity-45">De aici devine al tău</p>
          <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-4xl text-[clamp(44px,6vw,74px)] font-semibold leading-[.9] tracking-[-.06em]">Îți place direcția?<br />O adaptăm business-ului tău.</h2>
            <Link href="/cerere" className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] px-6 text-[12px] font-semibold text-[var(--text)]">Începe →</Link>
          </div>
        </div>
      </section>

      <SiteFooter theme={theme} activePage="templates" />
    </main>
  );
}
