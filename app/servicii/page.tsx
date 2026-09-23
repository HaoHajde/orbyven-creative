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
  gradient: string;
};

const services: Service[] = [
  {
    number: "01",
    title: "Website",
    line: "Prezență clară pentru firmă, servicii și contact.",
    tags: ["Responsive", "SEO de bază", "Formulare"],
    gradient: "radial-gradient(circle at 18% 20%, rgba(116,86,255,.34), transparent 32%), radial-gradient(circle at 82% 72%, rgba(61,39,122,.34), transparent 36%), linear-gradient(135deg, #0d0917, #160e28 58%, #08070d)",
  },
  {
    number: "02",
    title: "Landing page",
    line: "O singură ofertă. O singură acțiune importantă.",
    tags: ["Campanii", "Conversie", "Analytics"],
    gradient: "radial-gradient(circle at 76% 18%, rgba(86,124,255,.30), transparent 30%), radial-gradient(circle at 18% 76%, rgba(82,55,170,.28), transparent 34%), linear-gradient(135deg, #090b17, #101630 58%, #07080d)",
  },
  {
    number: "03",
    title: "Redesign",
    line: "Păstrăm ce funcționează. Refacem ce te ține în urmă.",
    tags: ["UI", "UX", "Performanță"],
    gradient: "radial-gradient(circle at 22% 26%, rgba(189,86,255,.25), transparent 31%), radial-gradient(circle at 82% 72%, rgba(91,46,141,.30), transparent 35%), linear-gradient(135deg, #110914, #211027 58%, #09070b)",
  },
  {
    number: "04",
    title: "Experiență digitală",
    line: "Proiecte speciale: invitații, microsite-uri și interacțiuni custom.",
    tags: ["RSVP", "Microsite", "Custom"],
    gradient: "radial-gradient(circle at 76% 24%, rgba(75,70,238,.34), transparent 34%), radial-gradient(circle at 22% 76%, rgba(161,91,255,.18), transparent 36%), linear-gradient(135deg, #0a0914, #171326 55%, #07070b)",
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
  } as CSSProperties;

  return (
    <main
      style={{ ...vars, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', sans-serif" }}
      className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)] antialiased"
    >
      <SiteHeader theme={theme} compact={false} activePage="services" onToggleTheme={toggleTheme} />

      <section className="relative flex min-h-[82svh] items-end overflow-hidden px-5 pb-16 pt-32 text-white sm:px-6 md:min-h-[92vh] md:px-10 md:pb-24 md:pt-40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 76% 20%, rgba(108,78,255,.34), transparent 31%), radial-gradient(circle at 26% 40%, rgba(79,49,153,.25), transparent 36%), linear-gradient(180deg, rgba(30,19,54,.99) 0%, rgba(18,10,34,.98) 45%, rgba(7,5,13,.98) 78%, var(--bg) 100%)",
          }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-[12%] top-[24%] h-56 w-56 rounded-full bg-violet-500/10 blur-[90px]"
          animate={{ x: [0, 52, -8, 0], y: [0, 20, 46, 0], scale: [1, 1.12, 0.95, 1] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
        />
        <OrbitalSystem variant="accent" className="left-[74%] top-[46%] opacity-70" />
        <div className="relative mx-auto w-full max-w-[1500px]">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
            ORBYVEN · Servicii
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.95, delay: 0.08, ease: easeOut }} className="mt-6 max-w-[1250px] text-[clamp(54px,8vw,122px)] font-semibold leading-[0.91] tracking-[-0.068em]">
            Construim digital.<br />Fără balast.
          </motion.h1>
          <p className="mt-7 max-w-xl text-[16px] leading-7 text-white/58">
            Alegi problema. Noi alegem forma potrivită.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-14 sm:px-6 md:px-10 md:py-24">
        <div className="grid gap-5">
          {services.map((service, index) => (
            <motion.article
              key={service.number}
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ duration: 0.75, delay: index * 0.05, ease: easeOut }}
              className="group relative min-h-[350px] overflow-hidden rounded-[32px] border border-white/10 px-6 py-7 text-white shadow-[0_24px_80px_rgba(0,0,0,.16)] sm:px-8 sm:py-9 md:min-h-[430px] md:px-10 md:py-10"
              style={{ background: service.gradient }}
            >
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/8 blur-[70px]"
                animate={{ x: [0, -50, 18, 0], y: [0, 30, 74, 0], scale: [1, 1.18, 0.92, 1] }}
                transition={{ duration: 13 + index * 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 left-[12%] h-72 w-72 rounded-full bg-violet-400/10 blur-[80px]"
                animate={{ x: [0, 60, -24, 0], y: [0, -42, 10, 0] }}
                transition={{ duration: 16 + index * 1.5, repeat: Infinity, ease: "easeInOut" }}
              />

              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 overflow-hidden px-4">
                <div className="whitespace-nowrap text-center text-[clamp(82px,14vw,200px)] font-semibold leading-none tracking-[-0.08em] text-white/[0.045] transition duration-700 group-hover:text-white/[0.075]">
                  {service.title}
                </div>
              </div>

              <div className="relative z-10 flex min-h-[294px] flex-col justify-between md:min-h-[350px]">
                <div className="flex items-start justify-between gap-5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{service.number}</span>
                  <div className="flex flex-wrap justify-end gap-2">
                    {service.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/12 bg-white/7 px-3 py-2 text-[10px] font-medium text-white/58 backdrop-blur-xl">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="max-w-4xl">
                  <h2 className="text-[clamp(42px,6vw,82px)] font-semibold leading-[0.95] tracking-[-0.06em]">{service.title}</h2>
                  <p className="mt-5 max-w-2xl text-[15px] leading-7 text-white/58 md:text-[17px]">{service.line}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section aria-labelledby="web-design-orbyven" className="mx-auto max-w-[1500px] px-5 pb-16 sm:px-6 md:px-10 md:pb-24">
        <div className="grid gap-9 rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-7 md:grid-cols-[.88fr_1.12fr] md:p-12">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[var(--muted-2)]">Web design · România</p>
            <h2 id="web-design-orbyven" className="mt-5 text-[38px] font-semibold leading-[1.04] tracking-[-.06em] sm:text-[52px]">Un website construit pentru ce face firma ta.</h2>
          </div>
          <div className="flex flex-col justify-between gap-7">
            <div className="space-y-4 text-[14px] leading-7 text-[var(--muted)]">
              <p>Un site de prezentare poate reuni serviciile, lucrările și contactul într-un traseu clar, inclusiv pe telefon. Pentru o campanie sau o ofertă punctuală, o pagină de destinație poate avea un singur obiectiv și un formular scurt.</p>
              <p>Începem cu informațiile pe care un client trebuie să le găsească: ce oferi, cui te adresezi, unde lucrezi și cum primești o cerere. Alegem apoi designul, paginile și funcțiile potrivite. Un proiect poate porni simplu și se poate extinde când apare nevoia.</p>
            </div>
            <nav aria-label="Află mai mult despre web design" className="flex flex-wrap gap-2">
              {[
                { href: "/creare-site", label: "Creare site pentru firme" },
                { href: "/site-prezentare", label: "Site de prezentare" },
                { href: "/web-design-bucuresti", label: "Web design București" },
                { href: "/redesign-site", label: "Redesign website" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="rounded-full border border-[var(--border-strong)] bg-[var(--bg)] px-5 py-3 text-xs font-semibold transition hover:border-[var(--accent)]">{item.label} ↗</Link>
              ))}
            </nav>
          </div>
        </div>
      </section>

      <section aria-labelledby="servicii-invitatii" className="px-5 py-14 sm:px-6 md:px-10">
        <div className="mx-auto max-w-[1500px]">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[var(--muted)]">Evenimente · invitații digitale</p>
          <h2 id="servicii-invitatii" className="mt-4 text-[40px] font-semibold tracking-[-.055em] sm:text-[54px]">Invitații online create pentru moment.</h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--muted)]">Personalizăm invitații digitale cu datele evenimentului, modele interactive și opțiune de confirmare RSVP.</p>
          <nav aria-label="Servicii de invitații" className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { href: "/invitatii-nunta", label: "Invitații de nuntă", description: "Model elegant, program și locații." },
              { href: "/invitatii-botez", label: "Invitații de botez", description: "Modele pentru fetiță și băiețel." },
              { href: "/invitatii-majorat", label: "Invitații de majorat", description: "Experiență digitală pentru 18 ani." },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-7 transition hover:border-[var(--border-strong)]">
                <h3 className="text-xl font-semibold">{item.label} ↗</h3>
                <p className="mt-4 text-sm text-[var(--muted)]">{item.description}</p>
              </Link>
            ))}
          </nav>
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
