"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import WebDesignPreview from "@/components/ai/WebDesignPreview";
import WebDesignSpecialist from "@/components/ai/WebDesignSpecialist";
import { SITE_PRESETS, type EditableSite } from "@/lib/ai/site-editor";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";

type Theme = "light" | "dark";
type EntryMode = "checking" | "public" | "tool";
type DemoMode = "website" | "wedding" | "baptism" | "event";

const WEBSITE_DEMO: EditableSite = {
  ...SITE_PRESETS.studio,
  brand: "ORBYVEN AI",
  eyebrow: "WEB DESIGN",
  headline: "Din idee, direct în design.",
  description: "Descrii ce vrei. ORBYVEN construiește o direcție clară și o rafinează cu tine.",
  cta: "Pornește proiectul",
  servicesTitle: "Structură care are sens",
  services: [
    { title: "Direcție", description: "Obiectiv, structură și ierarhie vizuală într-un singur flux." },
    { title: "Design", description: "Paletă, ritm și componente păstrate în aceeași identitate." },
    { title: "Rafinare", description: "Schimbi punctual fără să reconstruiești inutil tot proiectul." },
  ],
  benefitsTitle: "Simplu de controlat",
  benefits: [
    { title: "Preview live", description: "Vezi imediat direcția." },
    { title: "Alternative", description: "Primești variante realmente diferite." },
    { title: "Fără haos", description: "AI-ul lucrează în limite clare." },
  ],
  aboutTitle: "Design asistat, control păstrat",
  aboutDescription: "ORBYVEN lucrează cu date validate și păstrează faptele reale ale proiectului.",
  hiddenSections: ["gallery", "process", "faq"],
  accent: "#745cff",
  background: "#0b0b10",
  surface: "#14141c",
  textColor: "#f5f5f7",
  visualTone: "editorial",
  layout: "editorial",
  variants: {
    ...SITE_PRESETS.studio.variants,
    hero: "editorial",
    services: "spotlight",
    benefits: "strip",
    about: "story",
    contact: "compact",
  },
};

const WEDDING_DEMO: EditableSite = {
  ...SITE_PRESETS.studio,
  brand: "Elena & Matei",
  eyebrow: "INVITAȚIE DE NUNTĂ",
  headline: "Ne căsătorim.",
  description: "O zi importantă, alături de oamenii noștri preferați.",
  cta: "Confirmă prezența",
  servicesTitle: "Detaliile zilei",
  services: [
    { title: "Ceremonie", description: "Ora și locația ceremoniei, prezentate simplu." },
    { title: "Petrecere", description: "Locația și momentul începerii petrecerii." },
    { title: "RSVP", description: "Confirmarea prezenței direct din invitație." },
  ],
  benefitsTitle: "O singură pagină",
  benefits: [
    { title: "Poveste", description: "Un spațiu pentru voi." },
    { title: "Program", description: "Momentele importante ale zilei." },
    { title: "Locații", description: "Detalii ușor de găsit." },
  ],
  aboutTitle: "Povestea noastră",
  aboutDescription: "Câteva rânduri personale pot transforma invitația într-o experiență care vă reprezintă.",
  processTitle: "Program",
  process: [
    { title: "Ceremonie", description: "Primul moment al zilei." },
    { title: "Primire", description: "Întâlnirea cu invitații." },
    { title: "Petrecere", description: "Seara continuă împreună." },
  ],
  contactTitle: "Ne vedem acolo?",
  contactDescription: "Confirmă prezența în câteva secunde.",
  hiddenSections: ["gallery", "faq"],
  visualTone: "luxury",
  density: "airy",
  layout: "centered",
  headlineSize: "large",
  accent: "#b88b72",
  background: "#f7f2ed",
  surface: "#fffaf6",
  textColor: "#2e2521",
  variants: {
    ...SITE_PRESETS.studio.variants,
    hero: "centered",
    services: "cards",
    benefits: "strip",
    about: "story",
    process: "timeline",
    contact: "compact",
  },
};

const BAPTISM_DEMO: EditableSite = {
  ...WEDDING_DEMO,
  brand: "Sofia",
  eyebrow: "INVITAȚIE DE BOTEZ",
  headline: "O zi mică. O amintire mare.",
  description: "Vă invităm să fiți alături de noi la botezul Sofiei.",
  servicesTitle: "Detalii",
  services: [
    { title: "Biserică", description: "Ora și locul ceremoniei." },
    { title: "Petrecere", description: "Unde continuăm ziua împreună." },
    { title: "RSVP", description: "Confirmare rapidă pentru familie și prieteni." },
  ],
  aboutTitle: "Cu drag, pentru Sofia",
  aboutDescription: "O invitație caldă, delicată și ușor de folosit de pe telefon.",
  accent: "#8aa8c4",
  background: "#f4f8fb",
  surface: "#ffffff",
  textColor: "#24313d",
};

const EVENT_DEMO: EditableSite = {
  ...WEDDING_DEMO,
  brand: "NOCTURNE 25",
  eyebrow: "INVITAȚIE EVENIMENT",
  headline: "O seară care merită trăită.",
  description: "Detaliile evenimentului, programul și confirmarea prezenței într-un singur loc.",
  cta: "Confirmă participarea",
  servicesTitle: "Eveniment",
  services: [
    { title: "Când", description: "Data și ora, fără informație în plus." },
    { title: "Unde", description: "Locația și indicațiile esențiale." },
    { title: "Acces", description: "Tot ce trebuie știut înainte de sosire." },
  ],
  benefitsTitle: "La esențial",
  benefits: [
    { title: "Program", description: "Momentele serii." },
    { title: "Dress code", description: "Doar dacă este necesar." },
    { title: "RSVP", description: "Confirmare directă." },
  ],
  aboutTitle: "Despre seară",
  aboutDescription: "Identitatea vizuală se adaptează evenimentului, fără să încarce experiența.",
  accent: "#e77b55",
  background: "#0d0c11",
  surface: "#17151d",
  textColor: "#f7f2ed",
  visualTone: "bold",
  layout: "editorial",
  variants: {
    ...WEDDING_DEMO.variants,
    hero: "editorial",
  },
};

const DEMO_DRAFTS: Record<DemoMode, EditableSite> = {
  website: WEBSITE_DEMO,
  wedding: WEDDING_DEMO,
  baptism: BAPTISM_DEMO,
  event: EVENT_DEMO,
};

const DEMO_LABELS: Array<{ id: DemoMode; label: string }> = [
  { id: "website", label: "Website" },
  { id: "wedding", label: "Nuntă" },
  { id: "baptism", label: "Botez" },
  { id: "event", label: "Eveniment" },
];

export default function AiWebDesignEntry() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mode, setMode] = useState<EntryMode>("checking");
  const [demoMode, setDemoMode] = useState<DemoMode>("website");

  useEffect(() => {
    let active = true;

    const saved = window.localStorage.getItem("studio-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme: Theme =
      saved === "dark" || saved === "light" ? saved : prefersDark ? "dark" : "light";

    const themeFrame = window.requestAnimationFrame(() => {
      setTheme(nextTheme);
      document.documentElement.style.colorScheme = nextTheme;
      document.body.style.backgroundColor = nextTheme === "dark" ? "#09090d" : "#e7e8f3";
    });

    void orbyvenSupabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setMode(data.session ? "tool" : "public");
    }).catch((error) => {
      console.warn("ORBYVEN AI Web Design session check unavailable", error);
      if (active) setMode("public");
    });

    return () => {
      active = false;
      window.cancelAnimationFrame(themeFrame);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      document.body.style.backgroundColor = next === "dark" ? "#09090d" : "#e7e8f3";
      return next;
    });
  };

  if (mode === "tool") {
    return <WebDesignSpecialist />;
  }

  const vars = {
    "--bg": theme === "dark" ? "#09090d" : "#e9eaf3",
    "--surface": theme === "dark" ? "#111116" : "#f7f6fb",
    "--surface-2": theme === "dark" ? "#17171d" : "#efedf7",
    "--text": theme === "dark" ? "#f5f5f7" : "#181a2c",
    "--muted": theme === "dark" ? "#aaaab2" : "#62647a",
    "--muted-2": theme === "dark" ? "#74747e" : "#797b91",
    "--border": theme === "dark" ? "rgba(255,255,255,.085)" : "rgba(96,76,168,.16)",
    "--border-strong": theme === "dark" ? "rgba(255,255,255,.15)" : "rgba(91,72,172,.28)",
    "--button": theme === "dark" ? "#f5f5f7" : "#5d55cf",
    "--button-text": theme === "dark" ? "#09090d" : "#ffffff",
    "--accent": theme === "dark" ? "#8f7cff" : "#6859d6",
    "--accent-soft": theme === "dark" ? "rgba(143,124,255,.15)" : "rgba(116,88,215,.12)",
  } as CSSProperties;

  if (mode === "checking") {
    return (
      <main
        data-orbyven-public-theme={theme}
        style={vars}
        className="orbyven-public-shell grid min-h-screen place-items-center bg-[var(--bg)] text-[var(--text)]"
      >
        <p className="text-[11px] text-[var(--muted)]">Se pregătește AI Web Design…</p>
      </main>
    );
  }

  return (
    <main
      data-orbyven-public-theme={theme}
      style={{
        ...vars,
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif",
      }}
      className="orbyven-public-shell relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)] antialiased"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[12%] top-[-24rem] h-[58rem] w-[58rem] rounded-full bg-[var(--accent-soft)] blur-[170px]" />
        <div className="absolute right-[-18rem] top-[38rem] h-[42rem] w-[42rem] rounded-full bg-[rgba(81,111,255,.08)] blur-[170px]" />
      </div>

      <SiteHeader
        theme={theme}
        compact={false}
        activePage="webDesignAi"
        onToggleTheme={toggleTheme}
      />

      <section className="relative z-10 px-5 pb-14 pt-28 sm:px-6 md:px-10 md:pb-20 md:pt-36">
        <div className="mx-auto grid max-w-[1480px] gap-10 xl:grid-cols-[.72fr_1.28fr] xl:items-center">
          <div className="max-w-[690px]">
            <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[var(--accent)]">
              ORBYVEN · AI DESIGN
            </p>
            <h1 className="mt-5 text-[clamp(46px,6vw,82px)] font-semibold leading-[.9] tracking-[-.065em]">
              Spui ce vrei. <span className="text-[var(--accent)]">AI-ul îl construiește.</span>
            </h1>
            <p className="mt-6 max-w-lg text-[14px] leading-7 text-[var(--muted)]">
              Website-uri și invitații online, în același sistem. Generezi, vezi live și rafinezi prin conversație.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {DEMO_LABELS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDemoMode(item.id)}
                  className={`rounded-full border px-4 py-2.5 text-[10px] font-semibold transition ${
                    demoMode === item.id
                      ? "border-transparent bg-[var(--button)] text-[var(--button-text)]"
                      : "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/workspace/login?next=ai-web-design"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--button)] px-6 text-[11px] font-semibold text-[var(--button-text)] transition hover:-translate-y-0.5"
              >
                Deschide AI Design →
              </Link>
              <Link
                href="/templates"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-6 text-[11px] font-semibold"
              >
                Templates
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-[var(--muted-2)]">
              <span>Preview live</span>
              <span>Design responsive</span>
              <span>Rafinare AI</span>
              <span>RSVP pentru invitații</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-[var(--border-strong)] bg-[#0d0f16] p-2 shadow-[0_40px_120px_rgba(0,0,0,.30)] sm:p-3">
            <div className="flex items-center justify-between gap-4 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#8f7cff] shadow-[0_0_20px_rgba(143,124,255,.8)]" />
                <p className="truncate text-[9px] font-semibold text-white/65">
                  {demoMode === "website" ? "Website" : demoMode === "wedding" ? "Invitație · Nuntă" : demoMode === "baptism" ? "Invitație · Botez" : "Invitație · Eveniment"}
                </p>
              </div>
              <span className="text-[8px] font-bold uppercase tracking-[.16em] text-white/30">LIVE</span>
            </div>
            <div className="max-h-[680px] overflow-hidden rounded-[23px]">
              <WebDesignPreview draft={DEMO_DRAFTS[demoMode]} device="desktop" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-12 pt-4 sm:px-6 md:px-10 md:pb-18">
        <div className="mx-auto grid max-w-[1480px] gap-3 md:grid-cols-3">
          {[
            ["01", "Descrie", "Business sau eveniment. Câteva informații sunt suficiente pentru început."],
            ["02", "Generează", "ORBYVEN alege structură, copy și direcție vizuală coerentă."],
            ["03", "Rafinează", "Ceri schimbări în limbaj natural și păstrezi ce funcționează."],
          ].map(([number, title, copy]) => (
            <article
              key={number}
              className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)]/85 p-5 backdrop-blur-sm"
            >
              <p className="text-[8px] font-bold text-[var(--accent)]">{number}</p>
              <h2 className="mt-5 text-[20px] font-semibold tracking-[-.04em]">{title}</h2>
              <p className="mt-2 max-w-sm text-[11px] leading-5 text-[var(--muted)]">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-5 pb-10 pt-6 sm:px-6 md:px-10">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-7 rounded-[30px] bg-[var(--button)] px-6 py-10 text-[var(--button-text)] sm:px-8 md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[.18em] opacity-45">ORBYVEN AI DESIGN</p>
            <h2 className="mt-3 text-[clamp(30px,4vw,48px)] font-semibold leading-[.95] tracking-[-.05em]">
              Un singur AI. Mai multe tipuri de pagini.
            </h2>
          </div>
          <Link
            href="/workspace/login?next=ai-web-design"
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] px-6 text-[11px] font-semibold text-[var(--text)]"
          >
            Începe →
          </Link>
        </div>
      </section>

      <SiteFooter theme={theme} activePage="services" />
    </main>
  );
}
