"use client";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

type Category =
  | "all"
  | "wedding"
  | "baptism"
  | "business"
  | "landing";

type TemplateItem = {
  id: string;
  title: string;
  category: Exclude<Category, "all">;
  categoryLabel: string;
  subtitle: string;
  href?: string;
  status: "live" | "soon";
  visual:
    | "wedding-gold"
    | "wedding-minimal"
    | "baptism"
    | "business"
    | "landing";
};

const easeOut = [0.16, 1, 0.3, 1] as [
  number,
  number,
  number,
  number,
];

const reveal = {
  initial: { opacity: 0, y: 42 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: {
    duration: 0.85,
    ease: easeOut,
  },
};

const templates: TemplateItem[] = [
  {
    id: "diana-florin",
    title: "Diana & Florin",
    category: "wedding",
    categoryLabel: "Wedding invitation",
    subtitle: "Elegant · Interactive · RSVP",
    href: "/demo/nunta/diana-florin",
    status: "live",
    visual: "wedding-gold",
  },
  {
    id: "wedding-minimal",
    title: "Minimal Vows",
    category: "wedding",
    categoryLabel: "Wedding invitation",
    subtitle: "Minimal · Editorial · Modern",
    status: "soon",
    visual: "wedding-minimal",
  },
  {
    id: "baptism-soft",
    title: "Little Moments",
    category: "baptism",
    categoryLabel: "Baptism invitation",
    subtitle: "Soft · Warm · Delicate",
    status: "soon",
    visual: "baptism",
  },
  {
    id: "business-studio",
    title: "Studio Business",
    category: "business",
    categoryLabel: "Business website",
    subtitle: "Professional · Clean · Premium",
    status: "soon",
    visual: "business",
  },
  {
    id: "landing-conversion",
    title: "Launch",
    category: "landing",
    categoryLabel: "Landing page",
    subtitle: "Focused · Fast · Conversion",
    status: "soon",
    visual: "landing",
  },
];

const filters: {
  key: Category;
  label: string;
}[] = [
  { key: "all", label: "Toate" },
  { key: "wedding", label: "Nuntă" },
  { key: "baptism", label: "Botez" },
  { key: "business", label: "Business" },
  { key: "landing", label: "Landing pages" },
];

export default function TemplatesPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [category, setCategory] =
    useState<Category>("all");
  const [compactNav, setCompactNav] =
    useState(false);

  const { scrollY } = useScroll();

  useMotionValueEvent(
    scrollY,
    "change",
    (latest) => {
      setCompactNav(latest > 90);
    }
  );

  useEffect(() => {
    const saved =
      window.localStorage.getItem(
        "studio-theme"
      );

    const prefersDark =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

    const initialTheme: Theme =
      saved === "dark" ||
      saved === "light"
        ? saved
        : prefersDark
          ? "dark"
          : "light";

    setTheme(initialTheme);

    document.documentElement.style.colorScheme =
      initialTheme;
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next =
        current === "light"
          ? "dark"
          : "light";

      window.localStorage.setItem(
        "studio-theme",
        next
      );

      document.documentElement.style.colorScheme =
        next;

      return next;
    });
  };

  const vars = {
    "--bg":
      theme === "dark"
        ? "#000000"
        : "#ffffff",
    "--surface":
      theme === "dark"
        ? "#0c0c0e"
        : "#f5f5f7",
    "--surface-2":
      theme === "dark"
        ? "#151518"
        : "#fbfbfd",
    "--surface-3":
      theme === "dark"
        ? "#1d1d21"
        : "#efeff3",
    "--text":
      theme === "dark"
        ? "#f5f5f7"
        : "#1d1d1f",
    "--muted":
      theme === "dark"
        ? "#a1a1a6"
        : "#6e6e73",
    "--muted-2":
      theme === "dark"
        ? "#77777d"
        : "#86868b",
    "--border":
      theme === "dark"
        ? "rgba(255,255,255,0.09)"
        : "rgba(0,0,0,0.08)",
    "--border-strong":
      theme === "dark"
        ? "rgba(255,255,255,0.16)"
        : "rgba(0,0,0,0.14)",
    "--button":
      theme === "dark"
        ? "#f5f5f7"
        : "#1d1d1f",
    "--button-text":
      theme === "dark"
        ? "#000000"
        : "#ffffff",
    "--accent": "#4b46ee",
    "--accent-soft":
      theme === "dark"
        ? "rgba(75,70,238,0.18)"
        : "rgba(75,70,238,0.08)",
    "--accent-soft-2":
      theme === "dark"
        ? "rgba(111,66,255,0.11)"
        : "rgba(111,66,255,0.05)",
  } as CSSProperties;

  const visibleTemplates = useMemo(
    () =>
      category === "all"
        ? templates
        : templates.filter(
            (item) =>
              item.category === category
          ),
    [category]
  );

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
        activePage="templates"
        onToggleTheme={toggleTheme}
      />

      {/* HERO */}
      <section className="relative flex min-h-[88svh] items-center overflow-hidden bg-[var(--bg)] pt-24 md:min-h-[94vh]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-32%] h-[780px] w-[1120px] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] blur-[170px]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[8%] top-[26%] h-56 w-56 rounded-full bg-[var(--accent-soft-2)] blur-[120px]"
        />

        <div className="relative mx-auto w-full max-w-[1500px] px-6 pb-16 pt-12 md:px-10">
          <motion.p
            initial={{
              opacity: 0,
              y: 16,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.85,
              delay: 0.08,
              ease: easeOut,
            }}
            className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-2)]"
          >
            ORBYVEN CREATIVE · PORTFOLIO
          </motion.p>

          <div className="mt-9 max-w-[1380px]">
            <div className="overflow-hidden pb-2">
              <motion.span
                initial={{
                  y: "112%",
                }}
                animate={{
                  y: "0%",
                }}
                transition={{
                  duration: 1.05,
                  delay: 0.16,
                  ease: easeOut,
                }}
                className="block text-[clamp(54px,7.6vw,122px)] font-semibold leading-[0.91] tracking-[-0.068em] orbyven-sparkle-text orbyven-sparkle-c"
              >
                Alege o bază.
              </motion.span>
            </div>

            <div className="overflow-hidden pb-4">
              <motion.span
                initial={{
                  y: "112%",
                }}
                animate={{
                  y: "0%",
                }}
                transition={{
                  duration: 1.12,
                  delay: 0.27,
                  ease: easeOut,
                }}
                className="block text-[clamp(54px,7.6vw,122px)] font-semibold leading-[0.91] tracking-[-0.068em] orbyven-sparkle-text orbyven-sparkle-a"
              >
                Fă-o a ta.
              </motion.span>
            </div>
          </div>

          <motion.div
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.9,
              delay: 0.55,
              ease: easeOut,
            }}
            className="mt-9 grid gap-8 md:grid-cols-[1fr_0.72fr] md:items-end"
          >
            <p className="max-w-2xl text-[16px] leading-7 text-[var(--muted)] md:text-[18px] md:leading-8">
              Explorează proiecte și direcții
              vizuale pe care le putem adapta
              poveștii, brandului și
              funcționalităților de care ai
              nevoie.
            </p>

            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[var(--muted-2)] md:justify-self-end">
              <span className="h-px w-10 bg-[var(--border-strong)]" />
              Selected work
            </div>
          </motion.div>
        </div>
      </section>

      {/* LIBRARY */}
      <section className="relative border-t border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto max-w-[1500px] px-6 py-24 md:px-10 md:py-36">
          <motion.div
            {...reveal}
            className="grid gap-10 lg:grid-cols-[1fr_0.75fr] lg:items-end"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
                Project library
              </p>

              <h2 className="mt-6 max-w-4xl text-[46px] font-semibold leading-[0.98] tracking-[-0.06em] sm:text-[62px] md:text-[76px]">
                Idei construite
                <br />
                pentru a fi transformate.
              </h2>
            </div>

            <p className="max-w-xl text-[16px] leading-7 text-[var(--muted)] lg:justify-self-end">
              Unele proiecte sunt live, altele
              sunt direcții pe care le
              dezvoltăm. Toate pot deveni un
              punct de plecare pentru ceva
              complet personalizat.
            </p>
          </motion.div>

          {/* FILTERS */}
          <motion.div
            {...reveal}
            className="mt-12 flex flex-wrap gap-2"
          >
            {filters.map((filter) => (
              <FilterButton
                key={filter.key}
                active={
                  category === filter.key
                }
                onClick={() =>
                  setCategory(filter.key)
                }
              >
                {filter.label}
              </FilterButton>
            ))}
          </motion.div>

          <div className="mt-14 flex items-end justify-between gap-6 border-t border-[var(--border)] pt-7">
            <div>
              <p className="text-sm font-medium">
                {visibleTemplates.length}{" "}
                {visibleTemplates.length === 1
                  ? "proiect"
                  : "proiecte"}
              </p>

              <p className="mt-1 text-sm text-[var(--muted)]">
                Colecția va crește constant.
              </p>
            </div>

            <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)] sm:block">
              Hover to reveal color
            </p>
          </div>

          <motion.div
            layout
            className="mt-8 grid gap-6 lg:grid-cols-2"
          >
            <AnimatePresence mode="popLayout">
              {visibleTemplates.map(
                (item) => (
                  <TemplateCard
                    key={item.id}
                    item={item}
                  />
                )
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* CUSTOM */}
      <section className="relative overflow-hidden border-t border-[var(--border)] bg-[var(--surface)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-12%] top-[2%] h-[520px] w-[520px] rounded-full bg-[var(--accent-soft)] blur-[170px]"
        />

        <div className="relative mx-auto max-w-[1500px] px-6 py-28 md:px-10 md:py-40">
          <motion.div
            {...reveal}
            className="grid gap-12 lg:grid-cols-[1fr_0.78fr] lg:items-end"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
                Custom project
              </p>

              <h2 className="mt-6 max-w-4xl text-[46px] font-semibold leading-[0.98] tracking-[-0.06em] sm:text-[62px] md:text-[76px]">
                Nu găsești exact
                <br />
                ce ai în minte?
              </h2>
            </div>

            <div className="lg:justify-self-end">
              <p className="max-w-xl text-[16px] leading-7 text-[var(--muted)]">
                Putem porni de la zero și
                construi o identitate digitală
                complet personalizată, fără să
                folosim un template existent.
              </p>

              <Link
                href="/contact"
                className="group mt-8 inline-flex h-12 items-center justify-center gap-3 rounded-full bg-[var(--button)] px-6 text-sm font-medium text-[var(--button-text)] transition hover:scale-[1.02]"
              >
                Discută proiectul

                <span className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRightIcon />
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA + FOOTER */}
      <section className="px-6 pb-0 pt-8 md:px-10 md:pt-12">
        <motion.div
          {...reveal}
          className="relative mx-auto max-w-[1500px] overflow-hidden rounded-t-[42px] bg-[var(--button)] px-7 py-20 text-[var(--button-text)] md:px-14 md:py-28 lg:px-16"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-6%] top-[-45%] h-[460px] w-[460px] rounded-full bg-[var(--accent)]/15 blur-[140px]"
          />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-45">
                Your turn
              </p>

              <h2 className="mt-5 max-w-4xl text-[46px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[62px] md:text-[78px]">
                Hai să construim
                următorul proiect.
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-6 opacity-50">
                Pornim de la una dintre
                direcțiile de mai sus sau de la
                o pagină complet albă.
              </p>
            </div>

            <Link
              href="/contact"
              className="group inline-flex h-12 shrink-0 items-center justify-center gap-3 self-start rounded-full bg-[var(--bg)] px-6 text-sm font-medium text-[var(--text)] transition hover:scale-[1.03] lg:self-auto"
            >
              Începe un proiect

              <span className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRightIcon />
              </span>
            </Link>
          </div>
        </motion.div>
      </section>

      <SiteFooter theme={theme} activePage="templates" />
    </main>
  );
}

/* HEADER */

/* FILTER */

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2.5 text-sm font-medium transition duration-300 ${
        active
          ? "border-[var(--button)] bg-[var(--button)] text-[var(--button-text)]"
          : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]"
      }`}
    >
      {children}
    </button>
  );
}

/* PROJECT CARD */

function TemplateCard({
  item,
}: {
  item: TemplateItem;
}) {
  const card = (
    <motion.article
      layout
      initial={{
        opacity: 0,
        y: 30,
        scale: 0.985,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: 18,
        scale: 0.985,
      }}
      transition={{
        duration: 0.55,
        ease: easeOut,
      }}
      className="group overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--surface)] transition-shadow duration-500 hover:shadow-[0_30px_90px_rgba(0,0,0,0.09)]"
    >
      <div className="relative overflow-hidden">
        <div className="grayscale transition-[filter,transform] duration-1000 ease-out group-hover:scale-[1.015] group-hover:grayscale-0">
          <TemplateVisual
            type={item.visual}
          />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.035] via-transparent to-black/[0.045] opacity-100 transition-opacity duration-1000 group-hover:opacity-30"
        />

        <div className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-xl">
          {item.status === "live"
            ? "Live"
            : "Concept"}
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
              {item.categoryLabel}
            </p>

            <h2 className="mt-3 text-[34px] font-semibold tracking-[-0.05em] md:text-[42px]">
              {item.title}
            </h2>

            <p className="mt-3 text-sm text-[var(--muted)]">
              {item.subtitle}
            </p>
          </div>

          {item.status ===
          "live" ? (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--button)] text-[var(--button-text)] transition duration-300 group-hover:rotate-45 group-hover:scale-105">
              ↗
            </span>
          ) : (
            <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--muted)]">
              În curând
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );

  if (
    item.status === "live" &&
    item.href
  ) {
    return (
      <Link
        href={item.href}
        aria-label={`Deschide proiectul ${item.title}`}
      >
        {card}
      </Link>
    );
  }

  return card;
}

/* VISUALS */

function TemplateVisual({
  type,
}: {
  type: TemplateItem["visual"];
}) {
  if (type === "wedding-gold") {
    return (
      <div className="relative flex min-h-[430px] items-center justify-center overflow-hidden bg-[#f3efe6] p-8">
        <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,.95),transparent_30%),radial-gradient(circle_at_80%_75%,rgba(194,158,68,.18),transparent_34%)]" />

        <div className="relative w-full max-w-[420px] rounded-[30px] border border-[#d4af37]/25 bg-white/90 px-8 py-10 text-center shadow-[0_30px_90px_rgba(120,90,20,0.15)]">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#9b7a22]">
            Save the date
          </p>

          <p className="mt-8 text-[58px] font-light leading-none tracking-[-0.06em] text-[#312c24]">
            D
            <span className="mx-3 text-[#b8860b]">
              &
            </span>
            F
          </p>

          <p className="mt-6 text-xs text-[#796d58]">
            10 · 10 · 2026
          </p>

          <div className="mx-auto mt-8 h-px w-16 bg-[#d4af37]/50" />

          <p className="mt-6 text-[11px] leading-5 text-[#8b806d]">
            Diana & Florin
            <br />
            Digital Wedding Invitation
          </p>
        </div>
      </div>
    );
  }

  if (type === "wedding-minimal") {
    return (
      <div className="flex min-h-[430px] items-center justify-center bg-[#ecebe8] p-8">
        <div className="w-full max-w-[430px] rounded-[28px] bg-[#f9f9f7] p-10 shadow-[0_28px_70px_rgba(0,0,0,0.10)]">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-[#7c7c78]">
            <span>Wedding</span>
            <span>2026</span>
          </div>

          <p className="mt-20 text-[48px] font-medium leading-[0.95] tracking-[-0.06em] text-[#202020]">
            Two people.
            <br />
            One story.
          </p>

          <p className="mt-8 text-xs leading-5 text-[#777]">
            A quiet, editorial approach to a modern wedding invitation.
          </p>
        </div>
      </div>
    );
  }

  if (type === "baptism") {
    return (
      <div className="relative flex min-h-[430px] items-center justify-center overflow-hidden bg-[#eef2f6] p-8">
        <div className="absolute left-10 top-10 h-44 w-44 rounded-full bg-white/70 blur-2xl" />

        <div className="absolute bottom-8 right-10 h-48 w-48 rounded-full bg-[#d8e5f2]/70 blur-2xl" />

        <div className="relative w-full max-w-[420px] rounded-[30px] bg-white/85 p-10 text-center shadow-[0_30px_80px_rgba(70,90,120,0.12)] backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#8b99a7]">
            A beautiful beginning
          </p>

          <div className="mx-auto mt-10 flex h-20 w-20 items-center justify-center rounded-full bg-[#eef3f7] text-3xl">
            ✦
          </div>

          <p className="mt-8 text-[38px] font-medium tracking-[-0.045em] text-[#2e3740]">
            Little Moments
          </p>

          <p className="mt-4 text-xs leading-5 text-[#7c8894]">
            Baptism invitation
          </p>
        </div>
      </div>
    );
  }

  if (type === "business") {
    return (
      <div className="flex min-h-[430px] items-center justify-center bg-[#111113] p-8">
        <div className="w-full max-w-[500px] overflow-hidden rounded-[26px] border border-white/10 bg-[#1c1c1e] shadow-[0_35px_90px_rgba(0,0,0,0.4)]">
          <div className="flex h-10 items-center gap-1.5 border-b border-white/10 px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          </div>

          <div className="p-7">
            <p className="text-xs text-white/40">
              Your business, elevated.
            </p>

            <p className="mt-5 text-[38px] font-semibold leading-[1] tracking-[-0.05em] text-white">
              Clear.
              <br />
              Professional.
              <br />
              Memorable.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-2">
              <div className="h-16 rounded-xl bg-white/[0.06]" />
              <div className="h-16 rounded-xl bg-white/[0.10]" />
              <div className="h-16 rounded-xl bg-white/[0.06]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[430px] items-center justify-center bg-[#f0f0f2] p-8">
      <div className="w-full max-w-[470px] rounded-[28px] bg-white p-8 shadow-[0_28px_70px_rgba(0,0,0,0.10)]">
        <div className="inline-flex rounded-full bg-black px-3 py-1.5 text-[10px] font-medium text-white">
          NEW
        </div>

        <p className="mt-8 text-[44px] font-semibold leading-[0.98] tracking-[-0.055em] text-[#1d1d1f]">
          One page.
          <br />
          One goal.
        </p>

        <p className="mt-5 max-w-xs text-xs leading-5 text-[#747474]">
          A focused landing page built to present, convince and convert.
        </p>

        <div className="mt-8 h-10 w-32 rounded-full bg-[#1d1d1f]" />
      </div>
    </div>
  );
}

/* FOOTER */

/* ICONS */

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
      <circle
        cx="12"
        cy="12"
        r="4"
      />
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
