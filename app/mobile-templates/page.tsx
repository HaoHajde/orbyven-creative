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

export default function MobileTemplatesPage() {
  return (
    <main
      id="mobile-page-root"
      style={vars}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
    >
      <MobilePageChrome activePage="templates" />

      <section className="px-5 pb-14 pt-32">
        <div className="mx-auto max-w-[760px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
            ORBYVEN CREATIVE · TEMPLATES
          </p>

          <h1 className="mt-6 text-[48px] font-semibold leading-[0.92] tracking-[-0.06em]">
            Alege o bază.
            <br />
            Fă-o a ta.
          </h1>

          <p className="mt-7 max-w-md text-[15px] leading-7 text-[var(--muted)]">
            Explorează proiecte, direcții și concepte pe care le putem adapta pentru brandul sau evenimentul tău.
          </p>
        </div>
      </section>

      <section className="border-t border-[var(--border)] px-5 py-10">
        <div className="mx-auto max-w-[760px] space-y-5">
          {templates.map((item, index) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--surface)]"
            >
              <TemplateVisual tone={item.tone} title={item.title} />

              <div className="p-6">
                <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{item.status}</span>
                </div>

                <p className="mt-6 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
                  {item.category}
                </p>

                <h2 className="mt-3 text-[34px] font-semibold tracking-[-0.05em]">
                  {item.title}
                </h2>

                <p className="mt-3 text-sm text-[var(--muted)]">
                  {item.subtitle}
                </p>

                {item.href ? (
                  <a
                    href={item.href}
                    className="mt-6 inline-flex text-sm font-medium"
                  >
                    Vezi proiectul ↗
                  </a>
                ) : (
                  <span className="mt-6 inline-flex text-sm text-[var(--muted-2)]">
                    În curând
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="px-4 pt-6">
        <div className="rounded-t-[30px] bg-[var(--button)] px-5 py-8 text-[var(--button-text)]">
          <h2 className="text-[42px] font-semibold leading-[0.94] tracking-[-0.06em]">
            Ai o direcție
            <br />
            în minte?
          </h2>

          <a
            href="/contact"
            className="mt-8 flex h-13 items-center justify-center rounded-full bg-[var(--bg)] text-sm font-semibold text-[var(--text)]"
          >
            Hai să o construim ↗
          </a>

          <p className="mt-14 border-t border-current/15 pt-6 text-[10px] uppercase tracking-[0.15em] opacity-40">
            © 2026 ORBYVEN CREATIVE
          </p>
        </div>
      </footer>
    </main>
  );
}

function TemplateVisual({
  tone,
  title,
}: {
  tone: string;
  title: string;
}) {
  const classes =
    tone === "wedding"
      ? "bg-[#f3efe6] text-[#312c24]"
      : tone === "soft"
        ? "bg-[#efe8ef] text-[#403644]"
        : tone === "business"
          ? "bg-[#111113] text-white"
          : tone === "landing"
            ? "bg-[#1a1a27] text-white"
            : "bg-[#f2f2f2] text-[#262626]";

  return (
    <div className={`flex min-h-[230px] items-center justify-center p-6 ${classes}`}>
      <div className="w-full rounded-[22px] border border-current/10 bg-current/[0.03] p-6">
        <p className="text-[9px] uppercase tracking-[0.18em] opacity-50">
          ORBYVEN · CONCEPT
        </p>

        <p className="mt-8 text-[34px] font-semibold leading-[1] tracking-[-0.05em]">
          {title}
        </p>
      </div>
    </div>
  );
}
