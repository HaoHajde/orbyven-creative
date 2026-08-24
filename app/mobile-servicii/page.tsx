import type { CSSProperties } from "react";
import MobilePageChrome from "@/components/MobilePageChrome";

const services = [
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
    href: "/templates",
  },
];

const vars = {
  "--bg": "#000000",
  "--surface": "#0c0c0e",
  "--surface-2": "#151518",
  "--text": "#f5f5f7",
  "--muted": "#a1a1a6",
  "--muted-2": "#77777d",
  "--border": "rgba(255,255,255,0.09)",
  "--border-strong": "rgba(255,255,255,0.16)",
  "--button": "#f5f5f7",
  "--button-text": "#000000",
} as CSSProperties;

export default function MobileServicesPage() {
  return (
    <main
      id="mobile-page-root"
      style={vars}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
    >
      <MobilePageChrome activePage="services" />

      <section className="px-5 pb-16 pt-32">
        <div className="mx-auto max-w-[760px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
            ORBYVEN CREATIVE · SERVICII
          </p>

          <h1 className="mt-6 text-[48px] font-semibold leading-[0.92] tracking-[-0.06em]">
            Construim digital.
            <br />
            Cu un motiv.
          </h1>

          <p className="mt-7 max-w-md text-[15px] leading-7 text-[var(--muted)]">
            Nu vindem doar pagini. Construim experiențe digitale gândite pentru obiectivul real al proiectului.
          </p>
        </div>
      </section>

      <section className="border-t border-[var(--border)] px-5 py-10">
        <div className="mx-auto max-w-[760px]">
          {services.map((service) => (
            <article
              key={service.index}
              className="border-b border-[var(--border)] py-9"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[var(--muted-2)]">
                  {service.index}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
                  {service.eyebrow}
                </span>
              </div>

              <h2 className="mt-5 text-[38px] font-semibold tracking-[-0.055em]">
                {service.title}
              </h2>

              <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
                {service.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {service.features.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--muted)]"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              <a
                href={service.href}
                className="mt-7 inline-flex text-sm font-medium"
              >
                Explorează ↗
              </a>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Footer() {
  return (
    <footer className="px-4 pt-6">
      <div className="rounded-t-[30px] bg-[var(--button)] px-5 py-8 text-[var(--button-text)]">
        <h2 className="text-[42px] font-semibold leading-[0.94] tracking-[-0.06em]">
          Ai ceva
          <br />
          de construit?
        </h2>

        <a
          href="/contact"
          className="mt-8 flex h-13 items-center justify-center rounded-full bg-[var(--bg)] text-sm font-semibold text-[var(--text)]"
        >
          Începe un proiect ↗
        </a>

        <p className="mt-14 border-t border-current/15 pt-6 text-[10px] uppercase tracking-[0.15em] opacity-40">
          © 2026 ORBYVEN CREATIVE
        </p>
      </div>
    </footer>
  );
}
