import type { Metadata } from "next";
import Link from "next/link";

import MobileHomeShell from "@/components/MobileHomeShell";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

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
    description: "Pentru o prezență online simplă, curată și profesionistă.",
    features: ["1 pagină", "Design responsive", "Hosting & SSL", "SEO de bază"],
  },
  {
    number: "02",
    name: "BUSINESS",
    price: "249",
    description: "Pentru firme care vor un website complet și administrat.",
    features: ["Până la 5 pagini", "Formular & WhatsApp", "Analytics", "SEO extins"],
    featured: true,
  },
  {
    number: "03",
    name: "PRO",
    price: "399",
    description: "Pentru proiecte mai ample, integrări și suport prioritar.",
    features: ["Până la 8–10 pagini", "Integrări", "Suport extins", "Mentenanță"],
  },
];

export default function MobileHomePage() {
  return (
    <MobileHomeShell>
      <section className="flex min-h-[100svh] items-center px-5 pb-20 pt-28">
        <div className="mx-auto w-full max-w-[760px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-2)]">
            ORBYVEN CREATIVE
          </p>

          <h1 className="mt-6 text-[clamp(48px,14vw,72px)] font-semibold leading-[0.9] tracking-[-0.065em]">
            We build
            <br />
            what gets
            <br />
            remembered.
          </h1>

          <p className="mt-8 max-w-sm text-[15px] leading-7 text-[var(--muted)]">
            Website-uri și experiențe digitale construite pentru branduri care vor să fie greu de ignorat.
          </p>

          <Link
            href="/contact"
            prefetch={false}
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--button)] px-6 text-sm font-medium text-[var(--button-text)]"
          >
            Începe un proiect
          </Link>
        </div>
      </section>

      <section
        id="intro"
        className="scroll-mt-24 border-t border-[var(--border)] px-5 py-24"
      >
        <div className="mx-auto max-w-[760px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-2)]">
            Digital presence, rethought.
          </p>

          <h2 className="mt-6 text-[40px] font-semibold leading-[1.01] tracking-[-0.055em]">
            Construim experiențe digitale care fac afacerile mai greu de ignorat.
          </h2>
        </div>
      </section>

      <section
        id="work"
        className="scroll-mt-24 border-t border-[var(--border)] px-5 py-20"
      >
        <div className="mx-auto max-w-[760px]">
          <SectionLabel
            eyebrow="Selected work"
            title="Proiecte care spun o poveste."
          />

          <div className="mt-10 space-y-5">
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
              href="/templates/business"
            />
          </div>

          <Link
            href="/templates"
            prefetch={false}
            className="mt-8 flex h-12 items-center justify-center rounded-full border border-[var(--border-strong)] text-sm font-medium"
          >
            Vezi tot portofoliul ↗
          </Link>
        </div>
      </section>

      <section
        id="services"
        className="scroll-mt-24 border-y border-[var(--border)] bg-[var(--surface)] px-5 py-20"
      >
        <div className="mx-auto max-w-[760px]">
          <SectionLabel
            eyebrow="Services"
            title="Ce construim."
          />

          <div className="mt-10 border-t border-[var(--border)]">
            {services.map((service) => (
              <article
                key={service.number}
                className="border-b border-[var(--border)] py-8"
              >
                <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--muted-2)]">
                  {service.number}
                </p>
                <h3 className="mt-4 text-[34px] font-semibold tracking-[-0.05em]">
                  {service.title}
                </h3>
                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                  {service.text}
                </p>
              </article>
            ))}
          </div>

          <Link
            href="/servicii"
            prefetch={false}
            className="mt-8 flex h-12 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg)] text-sm font-medium"
          >
            Explorează serviciile ↗
          </Link>
        </div>
      </section>

      <section
        id="process"
        className="scroll-mt-24 px-5 py-20"
      >
        <div className="mx-auto max-w-[760px]">
          <SectionLabel
            eyebrow="Cum lucrăm"
            title="De la idee la online."
          />

          <div className="mt-10 space-y-4">
            {process.map((item) => (
              <article
                key={item.number}
                className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[var(--muted-2)]">
                    {item.number}
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
                    {item.label}
                  </span>
                </div>

                <h3 className="mt-8 text-[30px] font-semibold leading-[1.02] tracking-[-0.045em]">
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
        className="scroll-mt-24 border-y border-[var(--border)] bg-[var(--surface)] px-5 py-20"
      >
        <div className="mx-auto max-w-[760px]">
          <SectionLabel
            eyebrow="Pricing"
            title="Începi simplu. Crești când ai nevoie."
          />

          <div className="mt-10 space-y-4">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-[26px] border p-6 ${
                  plan.featured
                    ? "border-[var(--accent)] bg-[var(--bg)]"
                    : "border-[var(--border)] bg-[var(--bg)]"
                }`}
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--muted-2)]">
                      {plan.number}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                      {plan.name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[50px] font-semibold leading-none tracking-[-0.065em]">
                      {plan.price}
                    </span>
                    <p className="mt-1 text-[10px] text-[var(--muted-2)]">
                      lei / lună
                    </p>
                  </div>
                </div>

                <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
                  {plan.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {plan.features.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--muted)]"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <Link
            href="/contact"
            prefetch={false}
            className="mt-8 flex h-12 items-center justify-center rounded-full bg-[var(--button)] text-sm font-medium text-[var(--button-text)]"
          >
            Cere o ofertă
          </Link>

          <p className="mt-5 text-xs leading-5 text-[var(--muted-2)]">
            Abonamentele sunt gândite pentru colaborări pe termen de minimum 12 luni.
          </p>
        </div>
      </section>

      <section
        id="start"
        className="scroll-mt-24 px-4 pt-6"
      >
        <div className="mx-auto flex min-h-[70svh] max-w-[760px] flex-col justify-between rounded-t-[30px] bg-[var(--button)] px-5 py-8 text-[var(--button-text)]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-45">
              Start a project
            </p>

            <h2 className="mt-8 text-[48px] font-semibold leading-[0.91] tracking-[-0.065em]">
              Hai să-l facem
              <br />
              greu de ignorat.
            </h2>

            <Link
              href="/contact"
              prefetch={false}
              className="mt-9 flex h-14 items-center justify-center rounded-full bg-[var(--bg)] px-6 text-sm font-semibold text-[var(--text)]"
            >
              Începe un proiect ↗
            </Link>
          </div>

          <div className="mt-20 border-t border-current/15 pt-7 text-[10px] uppercase tracking-[0.15em] opacity-40">
            © 2026 ORBYVEN CREATIVE
          </div>
        </div>
      </section>
    </MobileHomeShell>
  );
}

function SectionLabel({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-2)]">
        {eyebrow}
      </p>
      <h2 className="mt-5 text-[40px] font-semibold leading-[1.01] tracking-[-0.055em]">
        {title}
      </h2>
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
    <article className="overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--surface)]">
      <div
        className={`flex min-h-[240px] items-center justify-center p-6 ${
          wedding ? "bg-[#f3efe6]" : "bg-[#111113]"
        }`}
      >
        {wedding ? (
          <div className="w-full rounded-[22px] border border-[#d4af37]/25 bg-white p-6 text-center">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#9b8356]">
              10 · 10 · 2026
            </p>
            <p className="mt-6 text-[40px] font-light tracking-[-0.055em] text-[#312c24]">
              Diana & Florin
            </p>
            <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-[#8f8779]">
              Wedding experience
            </p>
          </div>
        ) : (
          <div className="w-full rounded-[22px] border border-white/10 bg-[#1c1c1e] p-6 text-white">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/40">
              ORBYVEN · BUSINESS
            </p>
            <p className="mt-8 text-[32px] font-semibold leading-[1.01] tracking-[-0.05em]">
              Built to look
              <br />
              established.
            </p>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-2)]">
          <span>{index}</span>
          <span>{category}</span>
        </div>

        <h3 className="mt-7 text-[34px] font-semibold tracking-[-0.05em]">
          {title}
        </h3>

        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          {text}
        </p>

        <Link
          href={href}
          prefetch={false}
          className="mt-6 inline-flex text-sm font-medium"
        >
          Vezi proiectul ↗
        </Link>
      </div>
    </article>
  );
}
