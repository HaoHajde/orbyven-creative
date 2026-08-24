import Link from "next/link";
import type { CSSProperties } from "react";

import MobileControls from "@/components/MobileControls";
import OrbitalSystem from "@/components/OrbitalSystem";

const services = [
  {
    number: "01",
    title: "Websites",
    text: "Prezențe digitale clare, rapide și construite să inspire încredere.",
  },
  {
    number: "02",
    title: "Landing Pages",
    text: "Pagini concentrate pe un obiectiv clar: atenție, acțiune, conversie.",
  },
  {
    number: "03",
    title: "Redesign",
    text: "Refacem produse digitale care nu mai reprezintă nivelul actual al brandului.",
  },
  {
    number: "04",
    title: "Digital Experiences",
    text: "Microsite-uri și experiențe interactive în care designul și tehnologia lucrează împreună.",
  },
];

const process = [
  {
    number: "01",
    label: "Discover",
    title: "Înțelegem.",
    text: "Obiectivul, publicul și ce trebuie să facă produsul pentru business.",
  },
  {
    number: "02",
    label: "Design & Build",
    title: "Construim.",
    text: "Structură, design, dezvoltare și responsive într-un singur sistem coerent.",
  },
  {
    number: "03",
    label: "Launch & Care",
    title: "Lansăm.",
    text: "Testăm, publicăm și rămânem aproape pentru mentenanță și evoluție.",
  },
];

const plans = [
  {
    number: "01",
    name: "START",
    price: "149",
    text: "O prezență online simplă și profesionistă.",
  },
  {
    number: "02",
    name: "BUSINESS",
    price: "249",
    text: "Website complet pentru firme care vor să crească.",
    featured: true,
  },
  {
    number: "03",
    name: "PRO",
    price: "399",
    text: "Pentru proiecte mai ample, integrări și suport extins.",
  },
];

const vars = {
  "--bg": "#000000",
  "--surface": "#0b0b0d",
  "--surface-2": "#121216",
  "--text": "#f5f5f7",
  "--muted": "#a1a1a6",
  "--muted-2": "#74747a",
  "--border": "rgba(255,255,255,0.08)",
  "--border-strong": "rgba(255,255,255,0.15)",
  "--button": "#f5f5f7",
  "--button-text": "#000000",
} as CSSProperties;

export default function MobileHomePage() {
  return (
    <main
      id="mobile-home-root"
      style={vars}
      className="min-h-screen overflow-x-clip bg-[var(--bg)] text-[var(--text)]"
    >
      <MobileControls />

      <section
        className="mobile-shell-x relative flex min-h-[100svh] items-center justify-center overflow-hidden pb-20 pt-28 text-center"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 46%, rgba(75,70,238,0.10), transparent 34%)",
        }}
      >
        <OrbitalSystem variant="hero" className="top-[48%]" />

        <div className="relative z-10 mx-auto w-full max-w-[760px]">
          <p className="mobile-hero-kicker text-[9px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-2)]">
            ORBYVEN CREATIVE
          </p>

          <h1 className="mobile-hero-title mobile-hero-title-size mt-8 font-semibold leading-[0.89] tracking-[-0.07em]">
            We build
            <br />
            what gets
            <br />
            remembered<span className="text-[#4b46ee]">.</span>
          </h1>

          <p className="mobile-hero-copy mx-auto mt-8 max-w-[330px] text-[14px] leading-6 text-[var(--muted)]">
            Website-uri și experiențe digitale construite pentru branduri care vor să fie greu de ignorat.
          </p>

          <div className="mobile-hero-action mt-8 flex justify-center">
            <Link
              href="/contact"
              className="mobile-press inline-flex h-12 items-center justify-center rounded-full bg-[var(--button)] px-6 text-sm font-semibold text-[var(--button-text)]"
            >
              Începe un proiect
            </Link>
          </div>

          <div className="mobile-scroll-cue mt-16 flex flex-col items-center gap-2 text-[8px] font-semibold uppercase tracking-[0.17em] text-[var(--muted-2)]">
            <span>Scroll to explore</span>
            <span>↓</span>
          </div>
        </div>
      </section>

      <section
        id="intro"
        className="mobile-defer scroll-mt-24 border-t border-[var(--border)] mobile-shell-x py-22"
      >
        <div
          className="mx-auto max-w-[760px]"
          data-mobile-reveal
        >
          <ChapterLabel number="01" label="Digital presence, rethought." />

          <h2 className="mt-7 mobile-section-title-size font-semibold leading-[0.99] tracking-[-0.058em]">
            Construim experiențe digitale care fac afacerile mai greu de ignorat.
          </h2>

          <p className="mt-6 max-w-md text-sm leading-6 text-[var(--muted)]">
            Design curat. Tehnologie potrivită. Fără elemente puse doar ca să impresioneze.
          </p>
        </div>
      </section>

      <section
        id="work"
        className="mobile-defer scroll-mt-24 border-t border-[var(--border)] mobile-shell-x py-20"
      >
        <div className="mx-auto max-w-[760px]">
          <div
            className="orbyven-orbit-host"
            data-mobile-reveal
          >
            <OrbitalSystem variant="accent" className="top-[58%]" />
            <div className="orbyven-orbit-content">
              <ChapterLabel number="02" label="Selected work" />

              <h2 className="mt-6 mobile-section-title-size font-semibold leading-[0.98] tracking-[-0.058em]">
                Proiecte care spun o poveste.
              </h2>
            </div>
          </div>

          <div className="mt-10 space-y-5">
            <ProjectCard
              index="01"
              category="Wedding · Interactive"
              title="Diana & Florin"
              text="Invitație digitală premium cu RSVP, poveste și experiență completă pentru invitați."
              href="/demo/nunta/diana-florin"
              wedding
            />

            <ProjectCard
              index="02"
              category="Business · Website"
              title="Business presence"
              text="Website-uri curate și construite pentru o primă impresie puternică."
              href="/templates"
            />
          </div>

          <Link
            href="/templates"
            className="mobile-press mt-7 flex h-12 items-center justify-between rounded-full border border-[var(--border-strong)] px-5 text-sm font-medium"
          >
            <span>Vezi tot portofoliul</span>
            <span className="text-[#4b46ee]">↗</span>
          </Link>
        </div>
      </section>

      <section
        id="services"
        className="mobile-defer scroll-mt-24 border-y border-[var(--border)] bg-[var(--surface)] mobile-shell-x py-20"
      >
        <div className="mx-auto max-w-[760px]">
          <div data-mobile-reveal>
            <ChapterLabel number="03" label="Services" />

            <h2 className="mt-6 mobile-section-title-size font-semibold leading-[0.98] tracking-[-0.058em]">
              Ce construim.
            </h2>
          </div>

          <div className="mt-10 border-t border-[var(--border)]">
            {services.map((service) => (
              <article
                key={service.number}
                className="border-b border-[var(--border)] py-8"
                data-mobile-reveal
              >
                <div className="flex items-start gap-5">
                  <span className="pt-1 text-[9px] font-semibold text-[#4b46ee]">
                    {service.number}
                  </span>

                  <div>
                    <h3 className="text-[30px] font-semibold tracking-[-0.05em]">
                      {service.title}
                    </h3>

                    <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                      {service.text}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <Link
            href="/servicii"
            className="mobile-press mt-7 flex h-12 items-center justify-between rounded-full border border-[var(--border-strong)] bg-[var(--bg)] px-5 text-sm font-medium"
          >
            <span>Explorează serviciile</span>
            <span className="text-[#4b46ee]">↗</span>
          </Link>
        </div>
      </section>

      <section
        id="process"
        className="mobile-defer scroll-mt-24 mobile-shell-x py-20"
      >
        <div className="mx-auto max-w-[760px]">
          <div data-mobile-reveal>
            <ChapterLabel number="04" label="Cum lucrăm" />

            <h2 className="mt-6 mobile-section-title-size font-semibold leading-[0.98] tracking-[-0.058em]">
              De la idee la online.
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {process.map((item) => (
              <article
                key={item.number}
                className="mobile-card rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-5"
                data-mobile-reveal
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-[#4b46ee]">
                    {item.number}
                  </span>

                  <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
                    {item.label}
                  </span>
                </div>

                <h3 className="mt-7 text-[30px] font-semibold tracking-[-0.05em]">
                  {item.title}
                </h3>

                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="mobile-defer scroll-mt-24 border-y border-[var(--border)] bg-[var(--surface)] mobile-shell-x py-20"
      >
        <div className="mx-auto max-w-[760px]">
          <div data-mobile-reveal>
            <ChapterLabel number="05" label="Pricing" />

            <h2 className="mt-6 mobile-section-title-size font-semibold leading-[0.98] tracking-[-0.058em]">
              Începi simplu. Crești când ai nevoie.
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`mobile-card rounded-[24px] border bg-[var(--bg)] p-5 ${
                  plan.featured
                    ? "border-[#4b46ee]"
                    : "border-[var(--border)]"
                }`}
                data-mobile-reveal
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-semibold text-[#4b46ee]">
                        {plan.number}
                      </span>

                      {plan.featured && (
                        <span className="rounded-full bg-[#4b46ee] px-2 py-1 text-[7px] font-semibold uppercase tracking-[0.1em] text-white">
                          Popular
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 text-[24px] font-semibold tracking-[-0.045em]">
                      {plan.name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[48px] font-semibold leading-none tracking-[-0.07em]">
                      {plan.price}
                    </span>

                    <p className="mt-1 text-[8px] text-[var(--muted-2)]">
                      lei / lună
                    </p>
                  </div>
                </div>

                <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
                  {plan.text}
                </p>

                <Link
                  href="/contact"
                  className={`mobile-press mt-6 flex h-11 items-center justify-between rounded-full px-5 text-sm font-medium ${
                    plan.featured
                      ? "bg-[var(--button)] text-[var(--button-text)]"
                      : "border border-[var(--border-strong)]"
                  }`}
                >
                  <span>Alege {plan.name}</span>
                  <span className={plan.featured ? "" : "text-[#4b46ee]"}>
                    ↗
                  </span>
                </Link>
              </article>
            ))}
          </div>

          <p className="mt-6 text-xs leading-5 text-[var(--muted-2)]">
            Colaborările pe abonament sunt gândite pentru minimum 12 luni.
          </p>
        </div>
      </section>

      <section
        id="start"
        className="mobile-defer scroll-mt-24 px-4 pt-6"
      >
        <div
          className="orbyven-orbit-host mx-auto flex min-h-[70svh] max-w-[760px] flex-col justify-between overflow-hidden rounded-t-[30px] bg-[var(--button)] px-5 py-8 text-[var(--button-text)]"
          data-mobile-reveal
        >
          <OrbitalSystem variant="accent" className="left-[72%] top-[31%] opacity-25" />
          <div className="orbyven-orbit-content">
            <ChapterLabelLight number="06" label="Start a project" />

            <h2 className="mt-10 text-[47px] font-semibold leading-[0.91] tracking-[-0.065em]">
              Hai să-l facem
              <br />
              greu de ignorat.
            </h2>

            <Link
              href="/contact"
              className="mobile-press mt-9 flex h-14 items-center justify-between rounded-full bg-[var(--bg)] px-6 text-sm font-semibold text-[var(--text)]"
            >
              <span>Începe un proiect</span>
              <span className="text-[#4b46ee]">↗</span>
            </Link>
          </div>

          <div className="mt-20 border-t border-current/15 pt-6 text-[9px] uppercase tracking-[0.15em] opacity-40">
            © 2026 ORBYVEN CREATIVE
          </div>
        </div>
      </section>
    </main>
  );
}

function ChapterLabel({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-2)]">
        {label}
      </p>

      <span className="text-[9px] font-semibold text-[#4b46ee]">
        {number}
      </span>
    </div>
  );
}

function ChapterLabelLight({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] opacity-40">
        {label}
      </p>

      <span className="text-[9px] font-semibold opacity-35">
        {number}
      </span>
    </div>
  );
}

function ProjectCard({
  index,
  category,
  title,
  text,
  href,
  wedding = false,
}: {
  index: string;
  category: string;
  title: string;
  text: string;
  href: string;
  wedding?: boolean;
}) {
  return (
    <article
      className="mobile-card overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--surface)]"
      data-mobile-reveal
    >
      <div
        className={`relative flex min-h-[235px] items-center justify-center p-5 ${
          wedding
            ? "bg-[#f3efe6] text-[#312c24]"
            : "bg-[#111113] text-white"
        }`}
      >
        <span className="absolute left-5 top-5 text-[8px] uppercase tracking-[0.16em] opacity-40">
          {index}
        </span>

        {wedding ? (
          <div className="w-full rounded-[22px] border border-[#c8a85a]/25 bg-white p-6 text-center">
            <p className="text-[8px] uppercase tracking-[0.19em] text-[#9b8356]">
              10 · 10 · 2026
            </p>

            <p className="mt-7 text-[36px] font-light tracking-[-0.055em]">
              Diana & Florin
            </p>

            <p className="mt-3 text-[8px] uppercase tracking-[0.17em] text-[#8f8779]">
              Wedding experience
            </p>
          </div>
        ) : (
          <div className="w-full rounded-[22px] border border-white/10 bg-[#1c1c1e] p-6">
            <p className="text-[8px] uppercase tracking-[0.17em] text-white/40">
              ORBYVEN · BUSINESS
            </p>

            <p className="mt-10 text-[33px] font-semibold leading-[0.98] tracking-[-0.055em]">
              Built to look
              <br />
              established.
            </p>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
            {category}
          </p>

          <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
            {wedding ? "Live" : "Concept"}
          </span>
        </div>

        <h3 className="mt-5 text-[33px] font-semibold tracking-[-0.055em]">
          {title}
        </h3>

        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          {text}
        </p>

        <Link
          href={href}
          prefetch={!wedding}
          className="mobile-press mt-6 flex h-11 items-center justify-between rounded-full border border-[var(--border-strong)] px-5 text-sm font-medium"
        >
          <span>Vezi proiectul</span>
          <span className="text-[#4b46ee]">↗</span>
        </Link>
      </div>
    </article>
  );
}
