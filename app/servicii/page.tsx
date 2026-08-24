"use client";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";


import Link from "next/link";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

type Theme = "light" | "dark";

type Service = {
  index: string;
  title: string;
  eyebrow: string;
  description: string;
  features: string[];
  href: string;
  visual: "wedding" | "baptism" | "business" | "landing";
};

const services: Service[] = [
  {
    index: "01",
    title: "Websites",
    eyebrow: "Digital presence",
    description:
      "Site-uri de prezentare moderne pentru firme, servicii și branduri care vor să inspire încredere din prima secundă.",
    features: [
      "Design personalizat",
      "Responsive",
      "Structură clară",
      "Formulare",
      "SEO de bază",
      "Performanță",
    ],
    href: "/templates/business",
    visual: "business",
  },
  {
    index: "02",
    title: "Landing Pages",
    eyebrow: "Focused conversion",
    description:
      "Pagini construite în jurul unui singur obiectiv: campanii, produse, servicii sau lansări care trebuie să ducă utilizatorul spre o acțiune clară.",
    features: [
      "CTA-uri clare",
      "Structură de conversie",
      "Analytics",
      "Formulare",
      "Responsive",
      "Lansare rapidă",
    ],
    href: "/templates",
    visual: "landing",
  },
  {
    index: "03",
    title: "Redesign",
    eyebrow: "Rebuild & evolve",
    description:
      "Refacem experiențe digitale care au rămas în urmă și le aducem la nivelul actual al brandului, al pieței și al utilizatorilor.",
    features: [
      "Audit vizual",
      "Restructurare",
      "UI modern",
      "UX îmbunătățit",
      "Responsive",
      "Optimizare",
    ],
    href: "/contact",
    visual: "baptism",
  },
  {
    index: "04",
    title: "Digital Experiences",
    eyebrow: "Beyond websites",
    description:
      "Invitații digitale, microsite-uri și proiecte interactive în care designul, povestea și tehnologia funcționează împreună.",
    features: [
      "Invitații digitale",
      "RSVP",
      "Countdown",
      "Galerii",
      "Locații",
      "Interacțiuni custom",
    ],
    href: "/templates/nunta",
    visual: "wedding",
  },
];

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number];

const reveal = {
  initial: { opacity: 0, y: 42 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.85, ease: easeOut },
};

export default function ServicesPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [compactNav, setCompactNav] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setCompactNav(latest > 90);
  });

  useEffect(() => {
    const saved = window.localStorage.getItem("studio-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const initialTheme: Theme =
      saved === "dark" || saved === "light"
        ? saved
        : prefersDark
          ? "dark"
          : "light";

    setTheme(initialTheme);
    document.documentElement.style.colorScheme = initialTheme;
  }, []);

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
    "--border":
      theme === "dark"
        ? "rgba(255,255,255,0.10)"
        : "rgba(0,0,0,0.08)",
    "--border-strong":
      theme === "dark"
        ? "rgba(255,255,255,0.18)"
        : "rgba(0,0,0,0.14)",
    "--button": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--button-text": theme === "dark" ? "#000000" : "#ffffff",
    "--accent": "#4b46ee",
    "--accent-soft":
      theme === "dark"
        ? "rgba(75,70,238,0.18)"
        : "rgba(75,70,238,0.08)",
    "--hero-glow":
      theme === "dark"
        ? "rgba(75,70,238,0.13)"
        : "rgba(75,70,238,0.08)",
  } as CSSProperties;

  return (
    <main
      style={{
        ...vars,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
      className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)] antialiased transition-colors duration-500"
    >
      <SiteHeader
        theme={theme}
        compact={compactNav}
        activePage="services"
        onToggleTheme={toggleTheme}
      />

      {/* HERO */}
      <section className="relative flex min-h-[92svh] items-center overflow-hidden bg-[var(--bg)] pt-24 md:min-h-screen">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-30%] h-[780px] w-[1120px] -translate-x-1/2 rounded-full bg-[var(--hero-glow)] blur-[170px]"
        />

        <div className="relative mx-auto w-full max-w-[1500px] px-6 pb-16 pt-12 md:px-10">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.08, ease: easeOut }}
            className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-2)]"
          >
            ORBYVEN CREATIVE · SERVICES
          </motion.p>

          <div className="mt-9 max-w-[1380px]">
            <div className="overflow-hidden pb-2">
              <motion.span
                initial={{ y: "112%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1.05, delay: 0.16, ease: easeOut }}
                className="block text-[clamp(54px,7.6vw,122px)] font-semibold leading-[0.91] tracking-[-0.068em] orbyven-sparkle-text orbyven-sparkle-b"
              >
                Construim digital.
              </motion.span>
            </div>

            <div className="overflow-hidden pb-4">
              <motion.span
                initial={{ y: "112%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1.12, delay: 0.27, ease: easeOut }}
                className="block text-[clamp(54px,7.6vw,122px)] font-semibold leading-[0.91] tracking-[-0.068em] orbyven-sparkle-text orbyven-sparkle-c"
              >
                Cu un motiv.
              </motion.span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55, ease: easeOut }}
            className="mt-9 grid gap-8 md:grid-cols-[1fr_0.72fr] md:items-end"
          >
            <p className="max-w-2xl text-[16px] leading-7 text-[var(--muted)] md:text-[18px] md:leading-8">
              Site-uri, landing pages, redesign și experiențe digitale
              construite pentru claritate, încredere și impact.
            </p>

            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[var(--muted-2)] md:justify-self-end">
              <span className="h-px w-10 bg-[var(--border-strong)]" />
              Explore services
            </div>
          </motion.div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-[1500px] px-6 py-28 md:px-10 md:py-40">
        <div className="mb-12 grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-end">
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
              What we build
            </p>

            <motion.h2
              {...reveal}
              className="text-[46px] font-semibold leading-[0.98] tracking-[-0.06em] sm:text-[62px] md:text-[78px]"
            >
              Patru direcții.
              <br />
              Aceeași atenție la detalii.
            </motion.h2>
          </div>

          <p className="max-w-xl text-[16px] leading-7 text-[var(--muted)] lg:justify-self-end">
            Fiecare proiect poate porni de la un template sau
            poate fi construit complet de la zero, în funcție
            de nevoi și identitate.
          </p>
        </div>

        <div className="mt-16 border-t border-[var(--border)]">
          {services.map((service) => (
            <ServiceCard key={service.index} service={service} />
          ))}
        </div>
      </section>

      {/* CUSTOM */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-[1500px] px-6 py-24 md:px-10 md:py-32">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="mb-5 text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted-2)]">
                Custom
              </p>

              <h2 className="max-w-4xl text-[46px] font-semibold leading-[1] tracking-[-0.055em] sm:text-[62px] md:text-[76px]">
                Template-ul este un punct de plecare.
              </h2>

              <p className="mt-7 max-w-xl text-[16px] leading-7 text-[var(--muted)]">
                Dacă proiectul tău are nevoie de ceva unic,
                putem construi experiența de la zero — structură,
                identitate vizuală și funcționalități.
              </p>
            </div>

            <div className="rounded-[34px] border border-[var(--border)] bg-[var(--bg)] p-6 md:p-8">
              <div className="grid gap-px overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
                <CustomPoint
                  number="01"
                  title="Structură"
                  text="Stabilim ce trebuie să comunice site-ul și cum ajunge utilizatorul la informația importantă."
                />
                <CustomPoint
                  number="02"
                  title="Design"
                  text="Construim o identitate vizuală coerentă, adaptată proiectului și publicului."
                />
                <CustomPoint
                  number="03"
                  title="Development"
                  text="Transformăm designul într-o experiență rapidă, responsive și ușor de folosit."
                />
                <CustomPoint
                  number="04"
                  title="Launch"
                  text="Testăm, optimizăm și pregătim proiectul pentru publicare."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="mx-auto max-w-[1500px] px-6 py-24 md:px-10 md:py-32">
        <div className="mb-12">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted-2)]">
            Process
          </p>

          <h2 className="max-w-4xl text-[44px] font-semibold leading-[1] tracking-[-0.055em] sm:text-[60px] md:text-[72px]">
            Fără complicații inutile.
          </h2>
        </div>

        <div className="grid gap-px overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--border)] lg:grid-cols-4">
          <ProcessStep
            number="01"
            title="Brief"
            text="Discutăm proiectul, scopul și direcția pe care vrei să mergem."
          />
          <ProcessStep
            number="02"
            title="Concept"
            text="Alegem template-ul sau construim direcția vizuală potrivită."
          />
          <ProcessStep
            number="03"
            title="Build"
            text="Personalizăm, dezvoltăm și testăm experiența pe toate ecranele."
          />
          <ProcessStep
            number="04"
            title="Launch"
            text="Facem ultimele ajustări și publicăm proiectul."
          />
        </div>
      </section>

      {/* INCLUDED */}
      <section className="border-y border-[var(--border)]">
        <div className="mx-auto max-w-[1500px] px-6 py-24 md:px-10 md:py-32">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted-2)]">
                Standard
              </p>

              <h2 className="text-[42px] font-semibold leading-[1] tracking-[-0.05em] sm:text-[56px]">
                Ce primești în fiecare proiect.
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Design responsive",
                "Experiență optimizată pentru mobil",
                "Structură clară și intuitivă",
                "Animații discrete",
                "Optimizare de bază pentru performanță",
                "Publicare și configurare",
                "Revizii înainte de lansare",
                "Suport pentru conținutul proiectului",
              ].map((item) => (
                <div
                  key={item}
                  className="flex min-h-[76px] items-center gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-5"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--button)] text-[10px] text-[var(--button-text)]">
                    ✓
                  </span>
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-8 md:px-10">
        <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[36px] bg-[var(--button)] px-6 py-20 text-[var(--button-text)] md:px-12 md:py-28">
          <p className="text-sm font-medium opacity-60">
            READY WHEN YOU ARE.
          </p>

          <div className="mt-5 flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
            <h2 className="max-w-4xl text-[48px] font-semibold leading-[1] tracking-[-0.055em] sm:text-[64px] md:text-[78px] orbyven-sparkle-text orbyven-sparkle-c">
              Spune-ne ce vrei să construim.
            </h2>

            <Link
              href="/contact"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-[var(--bg)] px-6 text-sm font-medium text-[var(--text)] transition hover:scale-[1.02]"
            >
              Începe un proiect
              <ArrowUpRightIcon />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter theme={theme} activePage="services" />
    </main>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const ref = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 0.36, 0.72, 1],
    [55, 0, 0, -34]
  );

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.82, 1],
    [0.25, 1, 1, 0.55]
  );

  const visualScale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [0.96, 1, 0.98]
  );

  return (
    <article
      ref={ref}
      className="relative min-h-[82vh] border-b border-[var(--border)] py-16 last:border-b-0 md:min-h-[92vh] md:py-20"
    >
      <motion.div
        style={{ y, opacity }}
        className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-center"
      >
        <div>
          <div className="flex items-center gap-4">
            <span className="flex h-10 min-w-10 items-center justify-center rounded-full border border-[var(--border-strong)] px-3 text-xs font-medium text-[var(--muted-2)]">
              {service.index}
            </span>

            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-2)]">
              {service.eyebrow}
            </span>
          </div>

          <h3 className="mt-10 text-[52px] font-semibold leading-[0.96] tracking-[-0.06em] sm:text-[68px] md:text-[82px]">
            {service.title}
          </h3>

          <p className="mt-7 max-w-xl text-[15px] leading-7 text-[var(--muted)]">
            {service.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {service.features.map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-medium text-[var(--muted)]"
              >
                {feature}
              </span>
            ))}
          </div>

          <Link
            href={service.href}
            className="group mt-9 inline-flex items-center gap-3 text-sm font-medium"
          >
            Explorează
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        <motion.div
          style={{ scale: visualScale }}
          className="overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--bg)] shadow-[0_28px_90px_rgba(0,0,0,0.08)]"
        >
          <ServiceVisual type={service.visual} />
        </motion.div>
      </motion.div>
    </article>
  );
}

function ServiceVisual({
  type,
}: {
  type: Service["visual"];
}) {
  if (type === "wedding") {
    return (
      <div className="relative flex min-h-[430px] items-center justify-center overflow-hidden bg-[#f1ede4] p-8 md:p-12">
        <div className="absolute inset-0 [background-image:radial-gradient(circle_at_25%_20%,rgba(255,255,255,.95),transparent_30%),radial-gradient(circle_at_80%_75%,rgba(194,158,68,.18),transparent_34%)]" />
        <div className="relative w-full max-w-[420px] rounded-[30px] border border-[#d4af37]/25 bg-white/90 px-8 py-10 text-center shadow-[0_30px_90px_rgba(120,90,20,0.15)]">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#967225]">
            Wedding invitation
          </p>
          <p className="mt-10 text-[54px] font-light leading-none tracking-[-0.06em] text-[#312c24]">
            D <span className="text-[#b8860b]">&</span> F
          </p>
          <div className="mx-auto mt-8 h-px w-16 bg-[#d4af37]/50" />
          <p className="mt-6 text-xs text-[#7c725f]">
            Story · RSVP · Location · Countdown
          </p>
        </div>
      </div>
    );
  }

  if (type === "baptism") {
    return (
      <div className="relative flex min-h-[430px] items-center justify-center overflow-hidden bg-[#eef3f7] p-8 md:p-12">
        <div className="absolute left-10 top-10 h-48 w-48 rounded-full bg-white/80 blur-3xl" />
        <div className="absolute bottom-6 right-8 h-56 w-56 rounded-full bg-[#dbe8f2]/80 blur-3xl" />
        <div className="relative w-full max-w-[420px] rounded-[30px] bg-white/85 p-10 text-center shadow-[0_30px_80px_rgba(70,90,120,0.12)] backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8b99a7]">
            A beautiful beginning
          </p>
          <div className="mx-auto mt-10 flex h-20 w-20 items-center justify-center rounded-full bg-[#edf3f7] text-3xl">
            ✦
          </div>
          <p className="mt-8 text-[38px] font-medium tracking-[-0.045em] text-[#2e3740]">
            Little Moments
          </p>
          <p className="mt-4 text-xs text-[#7c8894]">
            Digital baptism invitation
          </p>
        </div>
      </div>
    );
  }

  if (type === "business") {
    return (
      <div className="flex min-h-[430px] items-center justify-center bg-[#111113] p-8 md:p-12">
        <div className="w-full max-w-[520px] overflow-hidden rounded-[28px] border border-white/10 bg-[#1c1c1e] shadow-[0_35px_100px_rgba(0,0,0,0.45)]">
          <div className="flex h-11 items-center gap-1.5 border-b border-white/10 px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          </div>
          <div className="p-8">
            <p className="text-xs text-white/40">
              Your business, elevated.
            </p>
            <p className="mt-5 text-[42px] font-semibold leading-[1] tracking-[-0.05em] text-white">
              A stronger
              <br />
              digital presence.
            </p>
            <div className="mt-9 grid grid-cols-3 gap-3">
              <div className="h-20 rounded-2xl bg-white/[0.06]" />
              <div className="h-20 rounded-2xl bg-white/[0.10]" />
              <div className="h-20 rounded-2xl bg-white/[0.06]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[430px] items-center justify-center bg-[#f0f0f2] p-8 md:p-12">
      <div className="w-full max-w-[470px] rounded-[28px] bg-white p-9 shadow-[0_28px_70px_rgba(0,0,0,0.10)]">
        <span className="inline-flex rounded-full bg-black px-3 py-1.5 text-[10px] font-medium text-white">
          LAUNCH
        </span>
        <p className="mt-8 text-[44px] font-semibold leading-[0.98] tracking-[-0.055em] text-[#1d1d1f]">
          One page.
          <br />
          One goal.
        </p>
        <p className="mt-5 text-xs leading-5 text-[#747474]">
          Focused, fast and designed around a clear action.
        </p>
        <div className="mt-8 h-10 w-32 rounded-full bg-[#1d1d1f]" />
      </div>
    </div>
  );
}

function CustomPoint({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="min-h-[230px] bg-[var(--bg)] p-6 md:p-7">
      <p className="text-xs font-medium text-[var(--muted-2)]">
        {number}
      </p>
      <h3 className="mt-12 text-2xl font-semibold tracking-[-0.04em]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        {text}
      </p>
    </div>
  );
}

function ProcessStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="min-h-[280px] bg-[var(--bg)] p-8">
      <p className="text-xs font-medium text-[var(--muted-2)]">
        {number}
      </p>
      <div className="mt-20">
        <h3 className="text-2xl font-semibold tracking-[-0.035em]">
          {title}
        </h3>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          {text}
        </p>
      </div>
    </div>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-[17px] w-[17px]"
    >
      <path d="M20.2 15.7A8.5 8.5 0 0 1 8.3 3.8 8.5 8.5 0 1 0 20.2 15.7Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-[17px] w-[17px]"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.42 1.42" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}
