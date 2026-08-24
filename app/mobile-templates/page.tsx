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

      <section className="relative overflow-hidden px-5 pb-20 pt-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-120px] top-[20px] h-[300px] w-[300px] rounded-full bg-[#4b46ee]/16 blur-[100px]"
        />

        <div className="relative mx-auto max-w-[760px]">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
              ORBYVEN CREATIVE
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
              01 / Portfolio
            </p>
          </div>

          <h1 className="mt-10 text-[50px] font-semibold leading-[0.9] tracking-[-0.065em]">
            Alege o bază.
            <br />
            <span className="text-[#4b46ee]">Fă-o a ta.</span>
          </h1>

          <p className="mt-8 max-w-md text-[15px] leading-7 text-[var(--muted)]">
            Pornești de la o direcție existentă sau de la o pagină complet albă. Noi o facem să arate ca a ta.
          </p>
        </div>
      </section>

      <section className="px-5 pb-16">
        <div className="mx-auto max-w-[760px] space-y-6">
          {templates.map((item, index) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)]"
            >
              <TemplateVisual
                tone={item.tone}
                title={item.title}
                index={String(index + 1).padStart(2, "0")}
              />

              <div className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.17em] text-[var(--muted-2)]">
                    {item.category}
                  </p>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] ${
                      item.status === "Live"
                        ? "bg-[#4b46ee] text-white"
                        : "border border-[var(--border)] text-[var(--muted-2)]"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <h2 className="mt-6 text-[36px] font-semibold leading-[0.98] tracking-[-0.055em]">
                  {item.title}
                </h2>

                <p className="mt-3 text-sm text-[var(--muted)]">
                  {item.subtitle}
                </p>

                {item.href ? (
                  <a
                    href={item.href}
                    className="mt-7 flex h-11 items-center justify-between rounded-full border border-[var(--border-strong)] px-5 text-sm font-medium"
                  >
                    <span>Vezi proiectul</span>
                    <span className="text-[#4b46ee]">↗</span>
                  </a>
                ) : (
                  <div className="mt-7 flex h-11 items-center justify-between rounded-full border border-[var(--border)] px-5 text-sm text-[var(--muted-2)]">
                    <span>În curând</span>
                    <span>•</span>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-[760px] rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
            Custom by default
          </p>

          <h2 className="mt-6 text-[38px] font-semibold leading-[0.98] tracking-[-0.055em]">
            Un template nu trebuie
            <br />
            să arate ca un template.
          </h2>

          <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
            Schimbăm structura, culorile, imaginile, typography și detaliile până când proiectul se simte al brandului tău.
          </p>

          <a
            href="/contact"
            className="mt-7 flex h-12 items-center justify-center rounded-full bg-[var(--button)] text-sm font-semibold text-[var(--button-text)]"
          >
            Vorbește cu noi ↗
          </a>
        </div>
      </section>

      <footer className="px-4 pt-4">
        <div className="relative overflow-hidden rounded-t-[30px] bg-[var(--button)] px-5 py-8 text-[var(--button-text)]">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 h-52 w-52 rounded-full border border-current/10"
          />

          <div className="relative">
            <p className="text-[9px] uppercase tracking-[0.18em] opacity-40">
              Next project
            </p>

            <h2 className="mt-7 text-[44px] font-semibold leading-[0.92] tracking-[-0.06em]">
              Ai o direcție
              <br />
              în minte?
            </h2>

            <a
              href="/contact"
              className="mt-9 flex h-13 items-center justify-center rounded-full bg-[var(--bg)] text-sm font-semibold text-[var(--text)]"
            >
              Hai să o construim ↗
            </a>

            <p className="mt-16 border-t border-current/15 pt-6 text-[9px] uppercase tracking-[0.15em] opacity-40">
              © 2026 ORBYVEN CREATIVE
            </p>
          </div>
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
      <div className="relative flex min-h-[270px] items-center justify-center overflow-hidden bg-[#f3efe6] p-5 text-[#312c24]">
        <div className="absolute left-5 top-5 text-[9px] uppercase tracking-[0.18em] text-[#9a8c72]">
          {index}
        </div>

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
    <div className={`relative flex min-h-[270px] items-center justify-center overflow-hidden p-5 ${classes}`}>
      <span className="absolute left-5 top-5 text-[9px] uppercase tracking-[0.18em] opacity-40">
        {index}
      </span>

      <div className="w-full rounded-[24px] border border-current/10 bg-current/[0.03] p-6">
        <p className="text-[8px] uppercase tracking-[0.18em] opacity-45">
          ORBYVEN · CONCEPT
        </p>

        <p className="mt-12 text-[36px] font-semibold leading-[0.96] tracking-[-0.055em]">
          {title}
        </p>

        <div className="mt-10 flex gap-2">
          <span className="h-1.5 w-8 rounded-full bg-current/20" />
          <span className="h-1.5 w-16 rounded-full bg-current/10" />
        </div>
      </div>
    </div>
  );
}
