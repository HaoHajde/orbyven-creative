import Link from "next/link";
import type { CSSProperties } from "react";

import MobilePageChrome from "@/components/MobilePageChrome";

const services = [
  {
    index: "01",
    title: "Websites",
    eyebrow: "Digital presence",
    description:
      "Site-uri de prezentare moderne pentru firme, servicii și branduri care vor să inspire încredere din prima secundă.",
    features: ["Design personalizat", "Responsive", "SEO", "Performanță"],
  },
  {
    index: "02",
    title: "Landing Pages",
    eyebrow: "Focused conversion",
    description:
      "Pagini construite în jurul unui singur obiectiv: campanii, produse, servicii sau lansări.",
    features: ["CTA-uri clare", "Analytics", "Formulare", "Lansare rapidă"],
  },
  {
    index: "03",
    title: "Redesign",
    eyebrow: "Rebuild & evolve",
    description:
      "Refacem experiențe digitale care au rămas în urmă și le aducem la nivelul actual al brandului.",
    features: ["Audit vizual", "UI modern", "UX", "Optimizare"],
  },
  {
    index: "04",
    title: "Digital Experiences",
    eyebrow: "Beyond websites",
    description:
      "Microsite-uri și proiecte interactive în care designul, povestea și tehnologia funcționează împreună.",
    features: ["RSVP", "Galerii", "Locații", "Interacțiuni custom"],
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

export default function MobileServicesPage() {
  return (
    <main
      id="mobile-page-root"
      style={vars}
      className="min-h-screen overflow-x-clip bg-[var(--bg)] text-[var(--text)]"
    >
      <MobilePageChrome activePage="services" />

      <section
        className="min-h-[72svh] px-5 pb-16 pt-32"
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 18%, rgba(75,70,238,0.08), transparent 28%)",
        }}
      >
        <div className="mx-auto max-w-[760px]">
          <p className="mobile-hero-kicker text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
            ORBYVEN CREATIVE · SERVICII
          </p>

          <h1 className="mobile-hero-title mt-9 text-[49px] font-semibold leading-[0.91] tracking-[-0.065em] orbyven-sparkle-text orbyven-sparkle-b">
            Construim digital.
            <br />
            Cu un motiv<span className="text-[#4b46ee]">.</span>
          </h1>

          <p className="mobile-hero-copy mt-7 max-w-md text-[15px] leading-7 text-[var(--muted)]">
            Nu vindem doar pagini. Construim produse digitale care au un rol clar.
          </p>
        </div>
      </section>

      <section className="mobile-defer border-t border-[var(--border)] px-5 py-12">
        <div className="mx-auto max-w-[760px]">
          {services.map((service) => (
            <article
              key={service.index}
              className="border-b border-[var(--border)] py-9"
              data-mobile-reveal
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-semibold text-[#4b46ee]">
                  {service.index}
                </span>

                <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
                  {service.eyebrow}
                </span>
              </div>

              <h2 className="mt-6 text-[36px] font-semibold tracking-[-0.055em]">
                {service.title}
              </h2>

              <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
                {service.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {service.features.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[10px] text-[var(--muted)]"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </article>
          ))}

          <Link
            href="/contact"
            className="mt-8 flex h-12 items-center justify-between rounded-full bg-[var(--button)] px-5 text-sm font-semibold text-[var(--button-text)]"
          >
            <span>Începe un proiect</span>
            <span>↗</span>
          </Link>
        </div>
      </section>

      <footer className="mobile-defer px-4 pt-5">
        <div
          className="rounded-t-[30px] bg-[var(--button)] px-5 py-8 text-[var(--button-text)]"
          data-mobile-reveal
        >
          <p className="text-[9px] uppercase tracking-[0.18em] opacity-40">
            ORBYVEN CREATIVE
          </p>

          <h2 className="mt-7 text-[43px] font-semibold leading-[0.93] tracking-[-0.06em] orbyven-sparkle-text orbyven-sparkle-c">
            Clar. Rapid.
            <br />
            Memorabil.
          </h2>

          <Link
            href="/contact"
            className="mt-9 flex h-14 items-center justify-between rounded-full bg-[var(--bg)] px-6 text-sm font-semibold text-[var(--text)]"
          >
            <span>Hai să construim</span>
            <span className="text-[#4b46ee]">↗</span>
          </Link>
        </div>
      </footer>
    </main>
  );
}
