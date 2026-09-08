"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

import OrbitalSystem from "@/components/OrbitalSystem";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { BILLING_PLANS } from "@/lib/billing/public-config";

type Theme = "light" | "dark";

const valuePoints = [
  {
    title: "Un singur sistem",
    text: "Site-ul public, cererile, clienții și instrumentele firmei rămân legate, fără aplicații împrăștiate.",
  },
  {
    title: "Doar ce folosești",
    text: "Activezi modulele relevante pentru firmă și păstrezi interfața simplă, chiar dacă produsul din spate este puternic.",
  },
  {
    title: "Crește cu business-ul",
    text: "Începi cu strictul necesar și adaugi funcții fără să reconstruiești produsul sau procesele de la zero.",
  },
];

const productPaths = [
  {
    eyebrow: "01 · Prezență digitală",
    title: "Un site care explică rapid cine ești și de ce contezi.",
    text: "Website-uri, landing pages și experiențe digitale. Detaliile, procesul și ce includ proiectele sunt în pagina Servicii.",
    href: "/servicii",
    cta: "Vezi serviciile",
  },
  {
    eyebrow: "02 · Exemple",
    title: "Vezi produsul înainte să iei o decizie.",
    text: "Template-uri, proiecte reale și demo-uri care arată cum poate arăta o experiență ORBYVEN în practică.",
    href: "/templates",
    cta: "Vezi proiectele",
  },
  {
    eyebrow: "03 · Workspace",
    title: "După lansare, business-ul continuă în Dashboard.",
    text: "Clienți, lucrări, programări, oferte, documente, cheltuieli și echipă într-un workspace modular.",
    href: "/workspace",
    cta: "Intră în Dashboard",
  },
];

export default function HomePage() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const hydrate = () => {
      const saved = window.localStorage.getItem("studio-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const nextTheme: Theme =
        saved === "dark" || saved === "light"
          ? saved
          : prefersDark
            ? "dark"
            : "light";

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
    "--accent-soft": theme === "dark" ? "rgba(75,70,238,0.17)" : "rgba(75,70,238,0.08)",
  } as CSSProperties;

  return (
    <main
      style={{
        ...vars,
        backgroundColor: "var(--bg)",
        color: "var(--text)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
      className="min-h-screen antialiased"
    >
      <SiteHeader theme={theme} compact={false} activePage="home" onToggleTheme={toggleTheme} />

      <section className="relative flex min-h-[82svh] items-center overflow-hidden px-5 pb-16 pt-32 sm:px-6 md:min-h-[88vh] md:px-10 md:pb-24 md:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-[-14rem] hidden h-[38rem] w-[60rem] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] blur-[150px] md:block" />
        <OrbitalSystem variant="hero" className="left-[78%] top-[52%] hidden opacity-65 md:block" />

        <div className="relative mx-auto w-full max-w-[1500px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.27em] text-[var(--muted-2)] sm:text-[11px]">
            ORBYVEN · Digital business platform
          </p>

          <h1 className="mt-7 max-w-[1180px] text-[clamp(48px,8vw,118px)] font-semibold leading-[0.92] tracking-[-0.066em]">
            Site-ul tău.
            <span className="block">Instrumentele firmei.</span>
            <span className="block text-[var(--muted)]">Același sistem.</span>
          </h1>

          <div className="mt-9 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <p className="max-w-2xl text-[16px] leading-7 text-[var(--muted)] md:text-[18px] md:leading-8">
              ORBYVEN leagă prezența publică a business-ului de un workspace modular pentru munca de zi cu zi. Simplu pentru utilizator, puternic în spate.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-self-end">
              <Link
                href="/cerere"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--button)] px-6 text-sm font-semibold text-[var(--button-text)]"
              >
                Începe un proiect
              </Link>
              <Link
                href="/workspace"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--border-strong)] px-6 text-sm font-semibold"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)] px-5 py-20 sm:px-6 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1500px]">
          <div className="max-w-4xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-2)]">
              De ce ORBYVEN
            </p>
            <h2 className="mt-5 text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[60px] md:text-[72px]">
              Mai puține instrumente. Mai mult control.
            </h2>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {valuePoints.map((point, index) => (
              <article key={point.title} className="rounded-[28px] border border-[var(--border)] bg-[var(--bg)] p-6 md:p-7">
                <span className="text-xs font-semibold text-[var(--muted-2)]">0{index + 1}</span>
                <h3 className="mt-10 text-[26px] font-semibold tracking-[-0.045em]">{point.title}</h3>
                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{point.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-2)]">Produsul</p>
              <h2 className="mt-5 max-w-4xl text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[60px] md:text-[72px]">
                Acasă explică. Paginile dedicate intră în detalii.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
              Am păstrat aici doar traseul de decizie. Serviciile, proiectele și brief-ul comercial au propriul lor spațiu.
            </p>
          </div>

          <div className="mt-12 divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {productPaths.map((item) => (
              <article key={item.eyebrow} className="grid gap-6 py-8 lg:grid-cols-[0.35fr_1fr_auto] lg:items-center lg:py-10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">{item.eyebrow}</p>
                <div>
                  <h3 className="max-w-3xl text-[28px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-[34px]">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">{item.text}</p>
                </div>
                <Link href={item.href} className="inline-flex h-11 items-center justify-center self-start rounded-full border border-[var(--border-strong)] px-5 text-sm font-semibold">
                  {item.cta} →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface-2)] px-5 py-20 sm:px-6 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-2)]">Workspace modular</p>
              <h2 className="mt-5 text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[60px]">
                Începi simplu. Activezi ce ai nevoie.
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {["Clienți", "Lucrări", "Calendar", "Oferte", "Documente", "Cheltuieli", "Echipă", "Overview"].map((module) => (
                <div key={module} className="rounded-[20px] border border-[var(--border)] bg-[var(--bg)] px-4 py-5 text-center text-sm font-semibold">
                  {module}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-2)]">Planuri</p>
              <h2 className="mt-5 text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[60px]">
                Alege nivelul. Configurăm restul împreună.
              </h2>
            </div>
            <Link href="/cerere" className="text-sm font-semibold">Vezi toate opțiunile comerciale →</Link>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {Object.values(BILLING_PLANS).map((plan) => (
              <article key={plan.id} className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">{plan.name}</p>
                <p className="mt-7 text-[48px] font-semibold leading-none tracking-[-0.06em]">
                  {plan.priceLei}<span className="ml-2 text-sm font-medium text-[var(--muted)]">lei/lună</span>
                </p>
                <p className="mt-5 min-h-12 text-sm leading-6 text-[var(--muted)]">{plan.description}</p>
                <p className="mt-6 text-xs text-[var(--muted-2)]">{plan.entitlements.length} module incluse</p>
                <Link
                  href={`/cerere?plan=${plan.id}&payment=subscription&source=homepage`}
                  className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-full bg-[var(--button)] px-5 text-sm font-semibold text-[var(--button-text)]"
                >
                  Alege {plan.name}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-8 sm:px-6 md:px-10">
        <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[34px] bg-[var(--button)] px-6 py-16 text-[var(--button-text)] sm:px-8 md:px-12 md:py-20">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-55">Primul pas</p>
          <div className="mt-5 flex flex-col justify-between gap-9 lg:flex-row lg:items-end">
            <h2 className="max-w-4xl text-[44px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[60px] md:text-[72px]">
              Spune-ne problema. Construim doar ce merită.
            </h2>
            <Link href="/cerere" className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] px-6 text-sm font-semibold text-[var(--text)]">
              Trimite o cerere
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter theme={theme} activePage="home" />
    </main>
  );
}
