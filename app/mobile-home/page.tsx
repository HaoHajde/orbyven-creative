import type { CSSProperties } from "react";

import MobileControls from "@/components/MobileControls";

const services = [
  {
    number: "01",
    title: "Websites",
    text: "Site-uri de prezentare moderne pentru firme, servicii și branduri care vor să inspire încredere din prima secundă.",
  },
  {
    number: "02",
    title: "Landing Pages",
    text: "Pagini construite pentru campanii, produse sau servicii, unde fiecare element are un rol clar.",
  },
  {
    number: "03",
    title: "Redesign",
    text: "Refacem experiențe digitale care au rămas în urmă și le aducem la nivelul actual al brandului.",
  },
  {
    number: "04",
    title: "Digital Experiences",
    text: "Invitații digitale și proiecte interactive în care designul, povestea și tehnologia funcționează împreună.",
  },
];

const process = [
  {
    number: "01",
    label: "Discover",
    title: "Înțelegem ce trebuie construit.",
    text: "Pornim de la afacere, obiectiv și public. Stabilim ce trebuie să facă site-ul, nu doar cum trebuie să arate.",
  },
  {
    number: "02",
    label: "Design & Build",
    title: "Construim experiența.",
    text: "Design, structură, dezvoltare, responsive și detaliile care fac produsul să se simtă coerent.",
  },
  {
    number: "03",
    label: "Launch & Care",
    title: "Lansăm. Apoi rămânem aproape.",
    text: "Testăm, conectăm domeniul și publicăm. Cu abonament, hostingul, mentenanța și suportul rămân la noi.",
  },
];

const plans = [
  {
    number: "01",
    name: "START",
    price: "149",
    description:
      "Pentru o prezență online simplă, curată și profesionistă.",
    features: [
      "1 pagină",
      "Design responsive",
      "Hosting & SSL",
      "SEO de bază",
    ],
  },
  {
    number: "02",
    name: "BUSINESS",
    price: "249",
    description:
      "Pentru firme care vor un website complet și administrat.",
    features: [
      "Până la 5 pagini",
      "Formular & WhatsApp",
      "Analytics",
      "SEO extins",
    ],
    featured: true,
  },
  {
    number: "03",
    name: "PRO",
    price: "399",
    description:
      "Pentru proiecte mai ample, integrări și suport prioritar.",
    features: [
      "Până la 8–10 pagini",
      "Integrări",
      "Suport extins",
      "Mentenanță",
    ],
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

      <section className="relative flex min-h-[100svh] items-center overflow-hidden px-5 pb-20 pt-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-120px] top-[120px] h-[320px] w-[320px] rounded-full bg-[#4b46ee]/18 blur-[100px]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 bottom-24 h-48 w-48 rounded-full border border-[var(--border)]"
        />

        <div className="relative mx-auto w-full max-w-[760px]">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
              ORBYVEN CREATIVE
            </p>

            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
              Digital studio
            </p>
          </div>

          <h1 className="mt-12 text-[clamp(52px,15vw,76px)] font-semibold leading-[0.87] tracking-[-0.07em]">
            We build
            <br />
            what gets
            <br />
            <span className="text-[#4b46ee]">remembered.</span>
          </h1>

          <p className="mt-9 max-w-sm text-[15px] leading-7 text-[var(--muted)]">
            Website-uri și experiențe digitale construite pentru branduri care vor să fie greu de ignorat.
          </p>

          <div className="mt-9 flex items-center gap-3">
            <a
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--button)] px-6 text-sm font-semibold text-[var(--button-text)]"
            >
              Începe un proiect
            </a>

            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-strong)] text-[#4b46ee]">
              ↗
            </span>
          </div>

          <div className="mt-16 flex items-center gap-3 text-[8px] font-semibold uppercase tracking-[0.17em] text-[var(--muted-2)]">
            <span className="h-px w-10 bg-[var(--border-strong)]" />
            Scroll to explore
          </div>
        </div>
      </section>

      <section
        id="intro"
        className="scroll-mt-24 border-t border-[var(--border)] px-5 py-24"
      >
        <div className="mx-auto max-w-[760px]">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-2)]">
              Digital presence, rethought.
            </p>

            <span className="text-[9px] font-semibold text-[#4b46ee]">
              01
            </span>
          </div>

          <h2 className="mt-8 text-[42px] font-semibold leading-[0.97] tracking-[-0.06em]">
            Construim experiențe digitale care fac afacerile
            <span className="text-[#4b46ee]"> mai greu de ignorat.</span>
          </h2>

          <div className="mt-10 grid grid-cols-2 gap-3">
            <Stat label="Focus" value="Brand" />
            <Stat label="Built for" value="Growth" />
          </div>
        </div>
      </section>

      <section
        id="work"
        className="scroll-mt-24 border-t border-[var(--border)] px-5 py-20"
      >
        <div className="mx-auto max-w-[760px]">
          <SectionHeading
            number="02"
            eyebrow="Selected work"
            title="Proiecte care spun o poveste."
          />

          <div className="mt-10 space-y-6">
            <ProjectCard
              index="01"
              category="Wedding · Interactive"
              title="Diana & Florin"
              text="Invitație digitală premium, cu RSVP, poveste, locații și experiență completă pentru invitați."
              href="/demo/nunta/diana-florin"
              wedding
            />

            <ProjectCard
              index="02"
              category="Business · Website"
              title="Business presence"
              text="Website-uri curate, rapide și construite pentru o primă impresie puternică."
              href="/templates"
            />
          </div>

          <a
            href="/templates"
            className="mt-8 flex h-12 items-center justify-between rounded-full border border-[var(--border-strong)] px-5 text-sm font-medium"
          >
            <span>Vezi tot portofoliul</span>
            <span className="text-[#4b46ee]">↗</span>
          </a>
        </div>
      </section>

      <section
        id="services"
        className="scroll-mt-24 border-y border-[var(--border)] bg-[var(--surface)] px-5 py-20"
      >
        <div className="mx-auto max-w-[760px]">
          <SectionHeading
            number="03"
            eyebrow="Services"
            title="Ce construim."
          />

          <div className="mt-10 space-y-4">
            {services.map((service) => (
              <article
                key={service.number}
                className="relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg)] p-5"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-1 -top-8 select-none text-[104px] font-semibold tracking-[-0.09em] text-white/[0.025]"
                >
                  {service.number}
                </span>

                <div className="relative">
                  <span className="text-[9px] font-semibold text-[#4b46ee]">
                    {service.number}
                  </span>

                  <h3 className="mt-7 text-[32px] font-semibold tracking-[-0.05em]">
                    {service.title}
                  </h3>

                  <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                    {service.text}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <a
            href="/servicii"
            className="mt-8 flex h-12 items-center justify-between rounded-full border border-[var(--border-strong)] bg-[var(--bg)] px-5 text-sm font-medium"
          >
            <span>Explorează serviciile</span>
            <span className="text-[#4b46ee]">↗</span>
          </a>
        </div>
      </section>

      <section
        id="process"
        className="scroll-mt-24 px-5 py-20"
      >
        <div className="mx-auto max-w-[760px]">
          <SectionHeading
            number="04"
            eyebrow="Cum lucrăm"
            title="De la idee la online."
          />

          <div className="mt-10 space-y-4">
            {process.map((item) => (
              <article
                key={item.number}
                className="rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#4b46ee]">
                    {item.number}
                  </span>

                  <span className="text-[8px] font-semibold uppercase tracking-[0.17em] text-[var(--muted-2)]">
                    {item.label}
                  </span>
                </div>

                <h3 className="mt-9 text-[31px] font-semibold leading-[1.01] tracking-[-0.05em]">
                  {item.title}
                </h3>

                <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="scroll-mt-24 border-y border-[var(--border)] bg-[var(--surface)] px-5 py-20"
      >
        <div className="mx-auto max-w-[760px]">
          <SectionHeading
            number="05"
            eyebrow="Pricing"
            title="Începi simplu. Crești când ai nevoie."
          />

          <div className="mt-10 space-y-4">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative overflow-hidden rounded-[28px] border bg-[var(--bg)] p-6 ${
                  plan.featured
                    ? "border-[#4b46ee]"
                    : "border-[var(--border)]"
                }`}
              >
                {plan.featured && (
                  <div className="absolute right-4 top-4 rounded-full bg-[#4b46ee] px-3 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-white">
                    Popular
                  </div>
                )}

                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-[9px] font-semibold text-[#4b46ee]">
                      {plan.number}
                    </p>

                    <h3 className="mt-4 text-[26px] font-semibold tracking-[-0.045em]">
                      {plan.name}
                    </h3>
                  </div>

                  <div className="pt-7 text-right">
                    <span className="text-[52px] font-semibold leading-none tracking-[-0.07em]">
                      {plan.price}
                    </span>

                    <p className="mt-1 text-[9px] text-[var(--muted-2)]">
                      lei / lună
                    </p>
                  </div>
                </div>

                <p className="mt-7 text-sm leading-6 text-[var(--muted)]">
                  {plan.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {plan.features.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-[10px] text-[var(--muted)]"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <a
                  href="/contact"
                  className={`mt-7 flex h-11 items-center justify-between rounded-full px-5 text-sm font-medium ${
                    plan.featured
                      ? "bg-[var(--button)] text-[var(--button-text)]"
                      : "border border-[var(--border-strong)]"
                  }`}
                >
                  <span>Alege {plan.name}</span>
                  <span className={plan.featured ? "" : "text-[#4b46ee]"}>
                    ↗
                  </span>
                </a>
              </article>
            ))}
          </div>

          <p className="mt-6 text-xs leading-5 text-[var(--muted-2)]">
            Abonamentele sunt gândite pentru colaborări pe termen de minimum 12 luni.
          </p>
        </div>
      </section>

      <section
        id="start"
        className="scroll-mt-24 px-4 pt-6"
      >
        <div className="relative mx-auto min-h-[72svh] max-w-[760px] overflow-hidden rounded-t-[30px] bg-[var(--button)] px-5 py-8 text-[var(--button-text)]">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 h-52 w-52 rounded-full border border-current/10"
          />
          <div
            aria-hidden="true"
            className="absolute -right-3 top-5 h-28 w-28 rounded-full border border-current/10"
          />

          <div className="relative flex min-h-[calc(72svh-64px)] flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] opacity-40">
                  Start a project
                </p>

                <span className="text-[9px] font-semibold opacity-35">
                  06
                </span>
              </div>

              <h2 className="mt-10 text-[48px] font-semibold leading-[0.9] tracking-[-0.065em]">
                Hai să-l facem
                <br />
                greu de
                <br />
                <span className="opacity-45">ignorat.</span>
              </h2>

              <a
                href="/contact"
                className="mt-10 flex h-14 items-center justify-between rounded-full bg-[var(--bg)] px-6 text-sm font-semibold text-[var(--text)]"
              >
                <span>Începe un proiect</span>
                <span className="text-[#4b46ee]">↗</span>
              </a>
            </div>

            <div className="mt-20">
              <div className="border-t border-current/15 pt-6">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.15em] opacity-40">
                  <span>© 2026 ORBYVEN CREATIVE</span>
                  <span>RO</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionHeading({
  number,
  eyebrow,
  title,
}: {
  number: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-2)]">
          {eyebrow}
        </p>

        <span className="text-[9px] font-semibold text-[#4b46ee]">
          {number}
        </span>
      </div>

      <h2 className="mt-6 text-[40px] font-semibold leading-[0.98] tracking-[-0.058em]">
        {title}
      </h2>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-[8px] uppercase tracking-[0.16em] text-[var(--muted-2)]">
        {label}
      </p>

      <p className="mt-3 text-[22px] font-semibold tracking-[-0.04em]">
        {value}
      </p>
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
    <article className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)]">
      <div
        className={`relative flex min-h-[270px] items-center justify-center overflow-hidden p-5 ${
          wedding
            ? "bg-[#f3efe6] text-[#312c24]"
            : "bg-[#111113] text-white"
        }`}
      >
        <span className="absolute left-5 top-5 text-[9px] uppercase tracking-[0.18em] opacity-40">
          {index}
        </span>

        {wedding ? (
          <div className="w-full rounded-[24px] border border-[#c8a85a]/25 bg-white/85 p-7 text-center shadow-[0_18px_50px_rgba(100,80,30,0.10)]">
            <p className="text-[8px] uppercase tracking-[0.2em] text-[#9b8356]">
              10 · 10 · 2026
            </p>

            <p className="mt-8 text-[38px] font-light tracking-[-0.055em]">
              Diana & Florin
            </p>

            <p className="mt-4 text-[8px] uppercase tracking-[0.18em] text-[#8f8779]">
              Wedding experience
            </p>
          </div>
        ) : (
          <div className="w-full rounded-[24px] border border-white/10 bg-[#1c1c1e] p-6">
            <p className="text-[8px] uppercase tracking-[0.18em] text-white/40">
              ORBYVEN · BUSINESS
            </p>

            <p className="mt-12 text-[36px] font-semibold leading-[0.96] tracking-[-0.055em]">
              Built to look
              <br />
              established.
            </p>

            <div className="mt-10 flex gap-2">
              <span className="h-1.5 w-8 rounded-full bg-white/20" />
              <span className="h-1.5 w-16 rounded-full bg-white/10" />
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-[8px] font-semibold uppercase tracking-[0.17em] text-[var(--muted-2)]">
            {category}
          </p>

          <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
            {wedding ? "Live" : "Concept"}
          </span>
        </div>

        <h3 className="mt-6 text-[36px] font-semibold leading-[0.98] tracking-[-0.055em]">
          {title}
        </h3>

        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          {text}
        </p>

        <a
          href={href}
          className="mt-7 flex h-11 items-center justify-between rounded-full border border-[var(--border-strong)] px-5 text-sm font-medium"
        >
          <span>Vezi proiectul</span>
          <span className="text-[#4b46ee]">↗</span>
        </a>
      </div>
    </article>
  );
}
