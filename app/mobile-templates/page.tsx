import Link from "next/link";
import type { CSSProperties } from "react";

import MobilePageChrome from "@/components/MobilePageChrome";

const templates = [
  {
    id: "diana-florin",
    title: "Diana & Florin",
    category: "Wedding invitation",
    subtitle: "Elegant · Interactive · RSVP",
    href: "/demo/nunta/diana-florin",
    status: "Live",
    tone: "wedding",
  },
  {
    id: "wedding-minimal",
    title: "Minimal Vows",
    category: "Wedding invitation",
    subtitle: "Minimal · Editorial · Modern",
    status: "Concept",
    tone: "minimal",
  },
  {
    id: "baptism-soft",
    title: "Little Moments",
    category: "Baptism invitation",
    subtitle: "Soft · Warm · Delicate",
    status: "Concept",
    tone: "soft",
  },
  {
    id: "business-studio",
    title: "Studio Business",
    category: "Business website",
    subtitle: "Professional · Clean · Premium",
    status: "Concept",
    tone: "business",
  },
  {
    id: "landing-conversion",
    title: "Launch",
    category: "Landing page",
    subtitle: "Focused · Fast · Conversion",
    status: "Concept",
    tone: "landing",
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

export default function MobileTemplatesPage() {
  return (
    <main
      id="mobile-page-root"
      style={vars}
      className="min-h-screen overflow-x-clip bg-[var(--bg)] text-[var(--text)]"
    >
      <MobilePageChrome activePage="templates" />

      <section
        className="min-h-[72svh] px-5 pb-16 pt-32"
        style={{
          backgroundImage:
            "radial-gradient(circle at 78% 18%, rgba(75,70,238,0.08), transparent 28%)",
        }}
      >
        <div className="mx-auto max-w-[760px]">
          <p className="mobile-hero-kicker text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
            ORBYVEN CREATIVE · PORTOFOLIU
          </p>

          <h1 className="mobile-hero-title mt-9 text-[49px] font-semibold leading-[0.91] tracking-[-0.065em] orbyven-sparkle-text orbyven-sparkle-c">
            Alege o bază.
            <br />
            Fă-o a ta<span className="text-[#4b46ee]">.</span>
          </h1>

          <p className="mobile-hero-copy mt-7 max-w-md text-[15px] leading-7 text-[var(--muted)]">
            Direcții vizuale pe care le adaptăm până când proiectul nu mai arată ca un template.
          </p>
        </div>
      </section>

      <section className="mobile-defer border-t border-[var(--border)] px-5 py-12">
        <div className="mx-auto max-w-[760px] space-y-5">
          {templates.map((item, index) => (
            <article
              key={item.id}
              className="mobile-card overflow-hidden rounded-[25px] border border-[var(--border)] bg-[var(--surface)]"
              data-mobile-reveal
            >
              <TemplateVisual
                tone={item.tone}
                title={item.title}
                index={String(index + 1).padStart(2, "0")}
              />

              <div className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
                    {item.category}
                  </p>

                  <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
                    {item.status}
                  </span>
                </div>

                <h2 className="mt-5 text-[33px] font-semibold tracking-[-0.055em]">
                  {item.title}
                </h2>

                <p className="mt-3 text-sm text-[var(--muted)]">
                  {item.subtitle}
                </p>

                {item.href ? (
                  <Link
                    href={item.href}
                    className="mt-6 flex h-11 items-center justify-between rounded-full border border-[var(--border-strong)] px-5 text-sm font-medium"
                  >
                    <span>Vezi proiectul</span>
                    <span className="text-[#4b46ee]">↗</span>
                  </Link>
                ) : (
                  <div className="mt-6 flex h-11 items-center justify-between rounded-full border border-[var(--border)] px-5 text-sm text-[var(--muted-2)]">
                    <span>În curând</span>
                    <span>•</span>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="mobile-defer px-4 pt-5">
        <div
          className="rounded-t-[30px] bg-[var(--button)] px-5 py-8 text-[var(--button-text)]"
          data-mobile-reveal
        >
          <p className="text-[9px] uppercase tracking-[0.18em] opacity-40">
            Custom by default
          </p>

          <h2 className="mt-7 text-[43px] font-semibold leading-[0.93] tracking-[-0.06em] orbyven-sparkle-text orbyven-sparkle-a">
            Nu trebuie să
            <br />
            arate ca un template.
          </h2>

          <Link
            href="/contact"
            className="mt-9 flex h-14 items-center justify-between rounded-full bg-[var(--bg)] px-6 text-sm font-semibold text-[var(--text)]"
          >
            <span>Vorbește cu noi</span>
            <span className="text-[#4b46ee]">↗</span>
          </Link>
        </div>
      </footer>
    </main>
  );
}

function TemplateVisual({
  tone,
  title,
  index,
}: {
  tone: string;
  title: string;
  index: string;
}) {
  if (tone === "wedding") {
    return (
      <div className="relative flex min-h-[225px] items-center justify-center bg-[#f3efe6] p-5 text-[#312c24]">
        <span className="absolute left-5 top-5 text-[8px] uppercase tracking-[0.16em] opacity-45">
          {index}
        </span>

        <div className="w-full rounded-[21px] border border-[#c8a85a]/25 bg-white p-6 text-center">
          <p className="text-[8px] uppercase tracking-[0.18em] text-[#9b8356]">
            10 · 10 · 2026
          </p>

          <p className="mt-7 text-[34px] font-light tracking-[-0.055em]">
            Diana & Florin
          </p>
        </div>
      </div>
    );
  }

  const classes =
    tone === "soft"
      ? "bg-[#efe8ef] text-[#403644]"
      : tone === "business"
        ? "bg-[#111113] text-white"
        : tone === "landing"
          ? "bg-[#161621] text-white"
          : "bg-[#f2f2f2] text-[#262626]";

  return (
    <div className={`relative flex min-h-[225px] items-center p-5 ${classes}`}>
      <span className="absolute left-5 top-5 text-[8px] uppercase tracking-[0.16em] opacity-40">
        {index}
      </span>

      <div>
        <p className="text-[8px] uppercase tracking-[0.16em] opacity-40">
          ORBYVEN · CONCEPT
        </p>

        <p className="mt-9 text-[33px] font-semibold leading-[0.98] tracking-[-0.055em]">
          {title}
        </p>
      </div>
    </div>
  );
}
