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

      <section className="relative overflow-hidden px-5 pb-20 pt-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-110px] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-[#4b46ee]/20 blur-[100px]"
        />

        <div className="relative mx-auto max-w-[760px]">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
              ORBYVEN CREATIVE
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
              02 / Services
            </p>
          </div>

          <h1 className="mt-10 text-[50px] font-semibold leading-[0.9] tracking-[-0.065em]">
            Construim
            <br />
            digital.
            <br />
            <span className="text-[#4b46ee]">Cu un motiv.</span>
          </h1>

          <p className="mt-8 max-w-md text-[15px] leading-7 text-[var(--muted)]">
            Nu vindem doar pagini. Construim experiențe digitale care au un rol clar în business.
          </p>

          <div className="mt-10 flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
            <span className="h-px w-10 bg-[var(--border-strong)]" />
            What we build
          </div>
        </div>
      </section>

      <section className="px-5 pb-14">
        <div className="mx-auto max-w-[760px] space-y-5">
          {services.map((service) => (
            <article
              key={service.index}
              className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 -top-7 select-none text-[118px] font-semibold tracking-[-0.09em] text-white/[0.025]"
              >
                {service.index}
              </span>

              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#4b46ee]">
                    {service.index}
                  </span>

                  <span className="text-[8px] font-semibold uppercase tracking-[0.17em] text-[var(--muted-2)]">
                    {service.eyebrow}
                  </span>
                </div>

                <h2 className="mt-10 text-[38px] font-semibold leading-[0.96] tracking-[-0.055em]">
                  {service.title}
                </h2>

                <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
                  {service.description}
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  {service.features.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-[10px] text-[var(--muted)]"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <a
                  href={service.href}
                  className="mt-8 flex h-11 items-center justify-between rounded-full border border-[var(--border-strong)] px-5 text-sm font-medium"
                >
                  <span>Explorează</span>
                  <span className="text-[#4b46ee]">↗</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-[760px]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-2)]">
            Why ORBYVEN
          </p>

          <h2 className="mt-6 text-[40px] font-semibold leading-[0.98] tracking-[-0.055em]">
            Designul arată bine.
            <br />
            Strategia îl face util.
          </h2>

          <div className="mt-10 grid gap-3">
            {[
              ["01", "Claritate înainte de efecte."],
              ["02", "Responsive din prima zi."],
              ["03", "Construit pentru viteză."],
              ["04", "Gândit să poată crește."],
            ].map(([number, text]) => (
              <div
                key={number}
                className="flex items-center gap-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-4"
              >
                <span className="text-[9px] font-semibold text-[#4b46ee]">
                  {number}
                </span>
                <span className="text-sm text-[var(--text)]">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Footer() {
  return (
    <footer className="px-4 pt-4">
      <div className="relative overflow-hidden rounded-t-[30px] bg-[var(--button)] px-5 py-8 text-[var(--button-text)]">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-current/10"
        />
        <div
          aria-hidden="true"
          className="absolute -right-6 -top-6 h-28 w-28 rounded-full border border-current/10"
        />

        <div className="relative">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] opacity-40">
            Start a project
          </p>

          <h2 className="mt-7 text-[44px] font-semibold leading-[0.92] tracking-[-0.06em]">
            Ai ceva
            <br />
            de construit?
          </h2>

          <a
            href="/contact"
            className="mt-9 flex h-13 items-center justify-center rounded-full bg-[var(--bg)] text-sm font-semibold text-[var(--text)]"
          >
            Începe un proiect ↗
          </a>

          <p className="mt-16 border-t border-current/15 pt-6 text-[9px] uppercase tracking-[0.15em] opacity-40">
            © 2026 ORBYVEN CREATIVE
          </p>
        </div>
      </div>
    </footer>
  );
}
