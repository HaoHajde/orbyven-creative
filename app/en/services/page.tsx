"use client";

import OrbitalSystem from "@/components/OrbitalSystem";
import SiteFooter from "@/components/SiteFooterEn";
import SiteHeader from "@/components/SiteHeaderEn";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

type Theme = "light" | "dark";

type Service = {
  number: string;
  title: string;
  line: string;
  href: string;
  linkLabel: string;
  tags: string[];
  gradient: string;
};

type ModulePreview = {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  note: string;
  rows: string[];
};

const services: Service[] = [
  {
    number: "01",
    title: "Website",
    line: "A clear, fast presence built around your business.",
    href: "/contact?service=website",
    linkLabel: "Start a website project",
    tags: ["Responsive", "SEO", "Forms"],
    gradient: "radial-gradient(circle at 16% 18%, rgba(135,102,255,.34), transparent 31%), radial-gradient(circle at 82% 78%, rgba(67,46,130,.30), transparent 37%), linear-gradient(140deg,#0d0918,#17102a 58%,#08070d)",
  },
  {
    number: "02",
    title: "Landing page",
    line: "One offer, one direction and a simple path to conversion.",
    href: "/contact?service=landing-page",
    linkLabel: "Build a landing page",
    tags: ["Campaigns", "Conversion", "Analytics"],
    gradient: "radial-gradient(circle at 76% 18%, rgba(82,126,255,.31), transparent 31%), radial-gradient(circle at 16% 78%, rgba(89,61,176,.28), transparent 36%), linear-gradient(140deg,#090b18,#10162e 58%,#07080d)",
  },
  {
    number: "03",
    title: "Redesign",
    line: "We keep what works and rebuild the experience slowing you down.",
    href: "/contact?service=redesign",
    linkLabel: "Start a redesign",
    tags: ["UI", "UX", "Performance"],
    gradient: "radial-gradient(circle at 22% 24%, rgba(190,88,255,.25), transparent 31%), radial-gradient(circle at 82% 72%, rgba(92,49,147,.28), transparent 36%), linear-gradient(140deg,#110914,#201027 58%,#09070b)",
  },
  {
    number: "04",
    title: "Digital experience",
    line: "Invitations, microsites and interactions built for the right context.",
    href: "/templates#events-invitations",
    linkLabel: "Explore digital experiences",
    tags: ["RSVP", "Microsite", "Custom"],
    gradient: "radial-gradient(circle at 76% 24%, rgba(75,70,238,.36), transparent 34%), radial-gradient(circle at 22% 76%, rgba(161,91,255,.20), transparent 36%), linear-gradient(140deg,#0a0914,#171326 55%,#07070b)",
  },
];

const modulePreviews: ModulePreview[] = [
  {
    id: "overview",
    label: "Overview",
    eyebrow: "CONTROL",
    title: "What needs attention now.",
    note: "Signals and actions, not decorative charts.",
    rows: ["New requests", "Jobs nearing deadline", "Quotes to follow up"],
  },
  {
    id: "clients",
    label: "Clients",
    eyebrow: "CRM LIGHT",
    title: "History stays with the client.",
    note: "Request, contact, job and follow-up in one context.",
    rows: ["New lead · WhatsApp", "Visit scheduled", "Quote sent"],
  },
  {
    id: "work",
    label: "Jobs",
    eyebrow: "OPERATIONS",
    title: "From request to delivery.",
    note: "Owners, status and next steps without separate spreadsheets.",
    rows: ["Install · in progress", "Handover · scheduled", "Materials · checked"],
  },
  {
    id: "calendar",
    label: "Calendar",
    eyebrow: "SCHEDULE",
    title: "Appointments with context.",
    note: "Every visit knows the client, job and people involved.",
    rows: ["09:30 · assessment", "12:00 · install", "16:30 · handover"],
  },
  {
    id: "offers",
    label: "Quotes",
    eyebrow: "COMMERCIAL",
    title: "The quote continues the workflow.",
    note: "The estimate is no longer isolated from the client and the job.",
    rows: ["Draft ready", "Sent to client", "Accepted → job"],
  },
];

const tableLayout = [
  { id: "01", x: "11%", y: "19%", guests: 8 },
  { id: "02", x: "42%", y: "13%", guests: 9 },
  { id: "03", x: "71%", y: "21%", guests: 8 },
  { id: "04", x: "18%", y: "58%", guests: 10 },
  { id: "05", x: "49%", y: "53%", guests: 9 },
  { id: "06", x: "76%", y: "61%", guests: 8 },
] as const;

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number];

function useHydrationSafeReducedMotion() {
  const prefersReducedMotion = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHydrated(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return hydrated ? Boolean(prefersReducedMotion) : false;
}

function Chapter({ children }: { children: ReactNode }) {
  return (
    <p className="orbyven-home-kicker">
      <span aria-hidden="true" className="orbyven-home-kicker-icon">✦</span>
      <span>{children}</span>
      <span aria-hidden="true" className="orbyven-home-kicker-line" />
    </p>
  );
}

function ModuleWorkspacePreview({
  activeId,
  onChange,
}: {
  activeId: string;
  onChange: (id: string) => void;
}) {
  const active = modulePreviews.find((item) => item.id === activeId) ?? modulePreviews[0];

  return (
    <div className="overflow-hidden rounded-[30px] border border-[var(--border-strong)] bg-[var(--panel)] shadow-[0_28px_100px_rgba(0,0,0,.12)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[.18em] text-[var(--muted-2)]">ORBYVEN / WORKSPACE</p>
          <p className="mt-1 text-[12px] font-semibold">Operational context</p>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[8px] font-semibold text-[var(--muted)]">DEMO UI</span>
      </div>

      <div className="grid min-h-[430px] md:grid-cols-[180px_1fr]">
        <div className="border-b border-[var(--border)] p-3 md:border-b-0 md:border-r">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
            {modulePreviews.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                className={`flex items-center justify-between rounded-[16px] border px-3 py-3 text-left text-[11px] font-semibold transition ${active.id === item.id ? "border-[rgba(165,139,255,.42)] bg-[var(--accent-soft)] text-[var(--text)]" : "border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[var(--surface)]"}`}
              >
                <span>{item.label}</span>
                <span className={`h-1.5 w-1.5 rounded-full ${active.id === item.id ? "bg-[#a58bff]" : "bg-[var(--border-strong)]"}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden p-5 sm:p-7">
          <div aria-hidden="true" className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--accent-soft)] blur-[90px]" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="text-[8px] font-bold uppercase tracking-[.18em] text-[#a58bff]">{active.eyebrow}</span>
              <span className="h-px w-8 bg-[var(--border-strong)]" />
              <span className="text-[8px] font-semibold text-[var(--muted-2)]">Active</span>
            </div>
            <h3 className="mt-5 max-w-xl text-[clamp(28px,4vw,46px)] font-semibold leading-[.96] tracking-[-.055em]">{active.title}</h3>
            <p className="mt-4 max-w-lg text-[12px] leading-6 text-[var(--muted)]">{active.note}</p>

            <div className="mt-8 grid gap-2">
              {active.rows.map((row, index) => (
                <motion.div
                  key={active.id + row}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: .35, delay: index * .045, ease: easeOut }}
                  className="flex items-center justify-between rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--accent-soft)] text-[9px] font-bold text-[#a58bff]">0{index + 1}</span>
                    <span className="text-[11px] font-medium">{row}</span>
                  </div>
                  <span className="text-[11px] text-[var(--muted-2)]">→</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {["Client", "Context", "Action"].map((item, index) => (
                <div key={item} className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3">
                  <p className="text-[7px] font-bold uppercase tracking-[.15em] text-[var(--muted-2)]">0{index + 1}</p>
                  <p className="mt-2 text-[10px] font-semibold">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeatingPreview() {
  return (
    <div className="overflow-hidden rounded-[30px] border border-[var(--border-strong)] bg-[var(--panel)] shadow-[0_28px_100px_rgba(0,0,0,.12)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[.18em] text-[var(--muted-2)]">EVENT / DASHBOARD</p>
          <p className="mt-1 text-[12px] font-semibold">Guest seating</p>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[8px] font-semibold text-[var(--muted)]">VISUAL EXAMPLE</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_235px]">
        <div className="relative min-h-[430px] overflow-hidden border-b border-[var(--border)] lg:border-b-0 lg:border-r">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="absolute left-[5%] top-[5%] rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[8px] font-semibold text-[var(--muted)]">ROOM A</div>
          <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 rounded-[15px] border border-[rgba(165,139,255,.35)] bg-[var(--accent-soft)] px-6 py-3 text-center">
            <p className="text-[7px] font-bold uppercase tracking-[.15em] text-[#a58bff]">Head table</p>
            <p className="mt-1 text-[10px] font-semibold">Diana & Florin</p>
          </div>

          {tableLayout.map((table, index) => (
            <motion.div
              key={table.id}
              aria-hidden="true"
              className="absolute grid h-[88px] w-[88px] place-items-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] shadow-[0_12px_35px_rgba(0,0,0,.08)]"
              style={{ left: table.x, top: table.y }}
              animate={{ y: [0, index % 2 === 0 ? -3 : 3, 0] }}
              transition={{ duration: 5 + index * .4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="text-center">
                <p className="text-[8px] font-bold uppercase tracking-[.12em] text-[#a58bff]">Table {table.id}</p>
                <p className="mt-1 text-[10px] font-semibold">{table.guests} guests</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-5">
          <p className="text-[8px] font-bold uppercase tracking-[.18em] text-[var(--muted-2)]">RSVP / DEMO</p>
          <div className="mt-5 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-[36px] font-semibold leading-none tracking-[-.06em]">84</p>
            <p className="mt-2 text-[10px] text-[var(--muted)]">confirmed out of 96</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div className="h-full w-[87%] rounded-full bg-[#a58bff]" />
            </div>
          </div>
          <div className="mt-3 grid gap-2">
            {[
              ["Unassigned", "7"],
              ["Children", "9"],
              ["Full tables", "4"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-[14px] border border-[var(--border)] px-4 py-3">
                <span className="text-[9px] text-[var(--muted)]">{label}</span>
                <span className="text-[10px] font-semibold">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-[16px] border border-[rgba(165,139,255,.28)] bg-[var(--accent-soft)] p-4">
            <p className="text-[8px] font-bold uppercase tracking-[.14em] text-[#a58bff]">Context</p>
            <p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">RSVP data can support event operations, not just fill a list.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AiPreview() {
  return (
    <div className="overflow-hidden rounded-[30px] border border-[var(--border-strong)] bg-[var(--panel)] shadow-[0_28px_100px_rgba(0,0,0,.12)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-[rgba(165,139,255,.35)] bg-[var(--accent-soft)] text-[12px] text-[#a58bff]">✦</span>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[.18em] text-[var(--muted-2)]">ORBYVEN AI</p>
            <p className="mt-1 text-[12px] font-semibold">Context engine</p>
          </div>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[8px] font-semibold text-[var(--muted)]">PREVIEW</span>
      </div>

      <div className="grid min-h-[430px] lg:grid-cols-[1.02fr_.98fr]">
        <div className="border-b border-[var(--border)] p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <div className="max-w-[88%] rounded-[20px] rounded-bl-[6px] bg-[var(--surface)] px-4 py-4 text-[11px] leading-5">
            I want the homepage to feel more premium without touching the dashboard.
          </div>
          <div className="ml-auto mt-4 max-w-[92%] rounded-[20px] rounded-br-[6px] border border-[rgba(165,139,255,.28)] bg-[var(--accent-soft)] px-4 py-4">
            <p className="text-[8px] font-bold uppercase tracking-[.16em] text-[#a58bff]">ORBYVEN AI</p>
            <p className="mt-2 text-[11px] leading-5 text-[var(--text)]">I separated the request into the public layer. Authentication, modules and operational logic stay unchanged.</p>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-2">
            {["Intent", "Context", "Plan", "Preview"].map((item, index) => (
              <motion.div
                key={item}
                className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-2 py-3 text-center"
                animate={{ borderColor: ["var(--border)", index === 2 ? "rgba(165,139,255,.38)" : "var(--border)", "var(--border)"] }}
                transition={{ duration: 5, repeat: Infinity, delay: index * .55 }}
              >
                <p className="text-[7px] font-bold uppercase tracking-[.1em] text-[var(--muted-2)]">0{index + 1}</p>
                <p className="mt-2 text-[9px] font-semibold">{item}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden p-5 sm:p-7">
          <div aria-hidden="true" className="absolute -right-24 top-10 h-64 w-64 rounded-full bg-[var(--accent-soft)] blur-[85px]" />
          <div className="relative">
            <p className="text-[8px] font-bold uppercase tracking-[.18em] text-[var(--muted-2)]">ACTION PLAN</p>
            <div className="mt-5 grid gap-2">
              {[
                ["Hero", "refine message + visual rhythm", "change"],
                ["Workspace", "keep authentication and modules", "protected"],
                ["Templates", "use the existing catalog", "context"],
                ["Publishing", "preview before change", "control"],
              ].map(([title, note, state], index) => (
                <div key={title} className="rounded-[17px] border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--surface-2)] text-[8px] font-bold text-[var(--muted)]">0{index + 1}</span>
                      <div>
                        <p className="text-[10px] font-semibold">{title}</p>
                        <p className="mt-1 text-[8px] text-[var(--muted)]">{note}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1.5 text-[7px] font-bold uppercase tracking-[.08em] ${state === "protected" ? "bg-emerald-500/10 text-emerald-500" : "bg-[var(--accent-soft)] text-[#a58bff]"}`}>{state}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-[16px] bg-[var(--button)] px-4 py-4 text-[var(--button-text)]">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[.12em] opacity-45">Next step</p>
                <p className="mt-1 text-[10px] font-semibold">Generate preview</p>
              </div>
              <span className="text-lg">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [activeModule, setActiveModule] = useState("overview");
  const reduceMotion = useHydrationSafeReducedMotion();

  useEffect(() => {
    const hydrate = () => {
      const saved = window.localStorage.getItem("studio-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const nextTheme: Theme = saved === "dark" || saved === "light" ? saved : prefersDark ? "dark" : "light";
      setTheme(nextTheme);
      document.documentElement.style.colorScheme = nextTheme;
      document.body.style.backgroundColor = nextTheme === "dark" ? "#09090d" : "#f8f8fb";
    };
    const frame = window.requestAnimationFrame(hydrate);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      document.body.style.backgroundColor = next === "dark" ? "#09090d" : "#f8f8fb";
      return next;
    });
  };

  const vars = {
    "--bg": theme === "dark" ? "#09090d" : "#f8f8fb",
    "--surface": theme === "dark" ? "#0f0f13" : "#ffffff",
    "--surface-2": theme === "dark" ? "#17171d" : "#f0f0f5",
    "--panel": theme === "dark" ? "rgba(14,14,19,.90)" : "rgba(255,255,255,.88)",
    "--text": theme === "dark" ? "#f5f5f7" : "#17171b",
    "--muted": theme === "dark" ? "#aaaab2" : "#66666f",
    "--muted-2": theme === "dark" ? "#73737d" : "#878790",
    "--border": theme === "dark" ? "rgba(255,255,255,.085)" : "rgba(18,18,24,.075)",
    "--border-strong": theme === "dark" ? "rgba(255,255,255,.15)" : "rgba(18,18,24,.14)",
    "--button": theme === "dark" ? "#f5f5f7" : "#17171b",
    "--button-text": theme === "dark" ? "#08080b" : "#ffffff",
    "--accent": "#4b46ee",
    "--home-violet": "#a58bff",
    "--accent-soft": theme === "dark" ? "rgba(126,93,255,.14)" : "rgba(112,78,255,.09)",
    "--grid-line": theme === "dark" ? "rgba(255,255,255,.045)" : "rgba(20,20,30,.045)",
  } as CSSProperties;

  const pageBackdrop = theme === "dark"
    ? "radial-gradient(circle at 78% 14%,rgba(99,73,220,.15),transparent 18%),radial-gradient(circle at 14% 34%,rgba(67,98,190,.08),transparent 18%),radial-gradient(circle at 84% 57%,rgba(143,70,213,.09),transparent 20%),radial-gradient(circle at 20% 78%,rgba(76,60,166,.10),transparent 20%),linear-gradient(180deg,#09090d,#0b0b10 42%,#09090d 100%)"
    : "radial-gradient(circle at 78% 14%,rgba(99,73,220,.10),transparent 18%),radial-gradient(circle at 14% 34%,rgba(67,98,190,.06),transparent 18%),radial-gradient(circle at 84% 57%,rgba(143,70,213,.055),transparent 20%),radial-gradient(circle at 20% 78%,rgba(76,60,166,.06),transparent 20%),linear-gradient(180deg,#f8f8fb,#f6f6fa 42%,#f8f8fb 100%)";

  return (
    <main
      lang="en"
      style={{ ...vars, fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif" }}
      className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)] antialiased"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0" style={{ backgroundImage: pageBackdrop }} />
        <div
          className="absolute inset-0 opacity-[.45]"
          style={{
            backgroundImage:
              "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "linear-gradient(to bottom,transparent 0%,black 17%,black 88%,transparent 100%)",
          }}
        />
      </div>

      <SiteHeader theme={theme} compact={false} activePage="services" onToggleTheme={toggleTheme} />

      <section className="relative z-10 flex min-h-[92svh] items-center overflow-hidden px-5 pb-16 pt-32 text-white sm:px-6 md:px-10 md:pb-20 md:pt-40">
        <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[#08070c]" />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(circle at 75% 26%,rgba(120,86,255,.34),transparent 25%),radial-gradient(circle at 30% 54%,rgba(73,52,147,.24),transparent 31%),linear-gradient(180deg,rgba(20,14,37,.98) 0%,rgba(11,9,20,.94) 62%,transparent 100%)",
          }}
        />
        {!reduceMotion ? (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-[8%] top-[20%] h-56 w-56 rounded-full bg-violet-500/10 blur-[90px]"
            animate={{ x: [0, 42, -12, 0], y: [0, 24, 46, 0], scale: [1, 1.16, .96, 1] }}
            transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : null}
        <OrbitalSystem variant="accent" className="left-[78%] top-[41%] opacity-55" />

        <div className="relative mx-auto grid w-full max-w-[1500px] gap-14 lg:grid-cols-[.92fr_1.08fr] lg:items-end">
          <div>
            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} transition={{ duration: .65 }}>
              <Chapter>ORBYVEN · Services</Chapter>
            </motion.div>
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 32 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: .95, delay: .06, ease: easeOut }}
              className="mt-7 max-w-[980px] text-[clamp(58px,8.2vw,128px)] font-semibold leading-[.82] tracking-[-.074em]"
            >
              We build.
              <br />
              We connect.
              <br />
              <span className="text-[#a58bff]">We automate.</span>
            </motion.h1>
            <p className="mt-7 max-w-lg text-[14px] leading-7 text-white/58 sm:text-[15px]">Website, workspace and digital experiences designed to grow together.</p>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 26, scale: .985 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: .9, delay: .16, ease: easeOut }}
            className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[.035] p-4 shadow-[0_35px_120px_rgba(0,0,0,.30)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between px-2 pb-4">
              <p className="text-[8px] font-bold uppercase tracking-[.19em] text-white/42">ORBYVEN / SYSTEM MAP</p>
              <span className="rounded-full border border-white/10 px-3 py-2 text-[8px] font-semibold text-white/45">CONNECTED</span>
            </div>
            <div className="relative min-h-[400px] overflow-hidden rounded-[24px] border border-white/8 bg-[#0c0b12]">
              <div aria-hidden="true" className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] [background-size:34px_34px]" />
              <div className="absolute left-[7%] top-[12%] w-[37%] rounded-[20px] border border-white/10 bg-white/[.055] p-5">
                <p className="text-[8px] font-bold uppercase tracking-[.16em] text-[#a58bff]">01 / PUBLIC</p>
                <p className="mt-4 text-[24px] font-semibold tracking-[-.05em]">Website</p>
                <p className="mt-2 text-[9px] leading-4 text-white/42">Attract. Explain. Convert.</p>
              </div>
              <div className="absolute right-[6%] top-[18%] w-[39%] rounded-[20px] border border-white/10 bg-white/[.055] p-5">
                <p className="text-[8px] font-bold uppercase tracking-[.16em] text-[#a58bff]">02 / OPERATIONS</p>
                <p className="mt-4 text-[24px] font-semibold tracking-[-.05em]">Workspace</p>
                <p className="mt-2 text-[9px] leading-4 text-white/42">Clients. Jobs. Calendar.</p>
              </div>
              <div className="absolute bottom-[10%] left-[16%] w-[35%] rounded-[20px] border border-white/10 bg-white/[.055] p-5">
                <p className="text-[8px] font-bold uppercase tracking-[.16em] text-[#a58bff]">03 / EXPERIENCE</p>
                <p className="mt-4 text-[24px] font-semibold tracking-[-.05em]">Custom</p>
                <p className="mt-2 text-[9px] leading-4 text-white/42">RSVP. Configurators. Workflows.</p>
              </div>
              <div className="absolute bottom-[12%] right-[8%] w-[35%] rounded-[20px] border border-[#a58bff]/30 bg-[#a58bff]/10 p-5">
                <p className="text-[8px] font-bold uppercase tracking-[.16em] text-[#cbbaff]">04 / CONTEXT</p>
                <p className="mt-4 text-[24px] font-semibold tracking-[-.05em]">ORBYVEN AI</p>
                <p className="mt-2 text-[9px] leading-4 text-white/46">Understands intent and context.</p>
              </div>
              <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-45" viewBox="0 0 700 400" preserveAspectRatio="none">
                <path d="M220 105 C330 80 330 80 438 115" fill="none" stroke="#a58bff" strokeWidth="1.3" strokeDasharray="5 7" />
                <path d="M210 160 C245 255 280 285 330 300" fill="none" stroke="#a58bff" strokeWidth="1.3" strokeDasharray="5 7" />
                <path d="M470 160 C455 235 470 268 500 295" fill="none" stroke="#a58bff" strokeWidth="1.3" strokeDasharray="5 7" />
                <path d="M335 310 C400 320 430 318 495 310" fill="none" stroke="#a58bff" strokeWidth="1.3" strokeDasharray="5 7" />
              </svg>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1500px] px-5 py-16 sm:px-6 md:px-10 md:py-24">
        <Chapter>What we build</Chapter>
        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="max-w-4xl text-[clamp(40px,5.5vw,72px)] font-semibold leading-[.92] tracking-[-.06em]">
            Four directions. <span className="text-[var(--home-violet)]">One connected ecosystem.</span>
          </h2>
          <p className="max-w-sm text-[12px] leading-6 text-[var(--muted)]">We start simple and add only what solves a real problem.</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {services.map((service, index) => (
            <motion.article
              key={service.number}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: .15 }}
              transition={{ duration: .65, delay: index * .045, ease: easeOut }}
              className="group relative min-h-[260px] overflow-hidden rounded-[30px] border border-white/10 p-6 text-white shadow-[0_20px_70px_rgba(0,0,0,.14)] sm:p-7"
              style={{ background: service.gradient }}
            >
              <div aria-hidden="true" className="absolute -right-6 -top-8 text-[120px] font-semibold leading-none tracking-[-.09em] text-white/[.035]">{service.number}</div>
              <div className="relative flex h-full min-h-[210px] flex-col justify-between">
                <div className="flex items-start justify-between gap-5">
                  <span className="text-[9px] font-semibold uppercase tracking-[.18em] text-white/42">{service.number}</span>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {service.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/12 bg-white/[.055] px-3 py-2 text-[8px] font-semibold text-white/52">{tag}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-[34px] font-semibold leading-[.95] tracking-[-.055em] sm:text-[42px]">{service.title}</h3>
                  <p className="mt-3 max-w-lg text-[11px] leading-5 text-white/54">{service.line}</p>
                  <Link href={service.href} className="mt-5 inline-flex items-center gap-2 text-[10px] font-semibold text-white/72 transition group-hover:text-white">
                    {service.linkLabel}<span>→</span>
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1500px] px-5 py-16 sm:px-6 md:px-10 md:py-24">
        <Chapter>Modular workspace</Chapter>
        <div className="mt-5 grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
          <div>
            <h2 className="text-[clamp(40px,5.2vw,68px)] font-semibold leading-[.93] tracking-[-.06em]">The website does not stop at <span className="text-[var(--home-violet)]">site.</span></h2>
            <p className="mt-5 max-w-md text-[12px] leading-6 text-[var(--muted)]">Clients, jobs, calendar and quotes can stay connected to the same context.</p>
          </div>
          <div className="flex justify-start lg:justify-end">
            <Link href="/contact?source=services-workspace" className="inline-flex h-11 items-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-5 text-[10px] font-semibold">Build your system →</Link>
          </div>
        </div>
        <div className="mt-9">
          <ModuleWorkspacePreview activeId={activeModule} onChange={setActiveModule} />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1500px] px-5 py-16 sm:px-6 md:px-10 md:py-24">
        <Chapter>Digital events</Chapter>
        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="max-w-4xl text-[clamp(40px,5.2vw,68px)] font-semibold leading-[.93] tracking-[-.06em]">The invitation can keep working after <span className="text-[var(--home-violet)]">RSVP.</span></h2>
            <p className="mt-5 max-w-lg text-[12px] leading-6 text-[var(--muted)]">An example of how RSVP responses can become event operations, not just rows in a table.</p>
          </div>
          <nav aria-label="Digital invitation services" className="flex flex-wrap gap-2">
            {[
              ["/templates#events-invitations", "Wedding"],
              ["/templates#events-invitations", "Celebration"],
              ["/templates#events-invitations", "Birthday"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[9px] font-semibold transition hover:border-[var(--border-strong)]">{label} ↗</Link>
            ))}
          </nav>
        </div>
        <div className="mt-9">
          <SeatingPreview />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1500px] px-5 py-16 sm:px-6 md:px-10 md:py-24">
        <Chapter>ORBYVEN AI</Chapter>
        <div className="mt-5 grid gap-8 lg:grid-cols-[.74fr_1.26fr] lg:items-end">
          <div>
            <h2 className="text-[clamp(40px,5.2vw,68px)] font-semibold leading-[.93] tracking-[-.06em]">Share the intent. The system keeps the <span className="text-[var(--home-violet)]">contextul.</span></h2>
            <p className="mt-5 max-w-md text-[12px] leading-6 text-[var(--muted)]">A product preview for the contextual engine we are building: request, constraints, plan and visual result.</p>
          </div>
          <div className="flex justify-start lg:justify-end">
            <span className="rounded-full border border-[rgba(165,139,255,.26)] bg-[var(--accent-soft)] px-4 py-3 text-[9px] font-semibold text-[#a58bff]">AI · CONTEXT · CONTROL</span>
          </div>
        </div>
        <div className="mt-9">
          <AiPreview />
        </div>
      </section>

      <section aria-labelledby="web-design-orbyven" className="relative z-10 mx-auto max-w-[1500px] px-5 py-16 sm:px-6 md:px-10 md:py-24">
        <Chapter>Web design · International</Chapter>
        <div className="mt-5 grid gap-8 rounded-[30px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_24px_80px_rgba(0,0,0,.07)] md:grid-cols-[.9fr_1.1fr] md:p-8">
          <div>
            <h2 id="web-design-orbyven" className="max-w-xl text-[34px] font-semibold leading-[.98] tracking-[-.055em] sm:text-[44px]">Clear on the surface. <span className="text-[var(--home-violet)]">Powerful underneath.</span></h2>
          </div>
          <div>
            <p className="max-w-2xl text-[12px] leading-6 text-[var(--muted)]">A project can start as a business website and later add landing pages, forms, operational modules or custom experiences. We add only what makes sense for the business.</p>
            <nav aria-label="Learn more about web design" className="mt-6 flex flex-wrap gap-2">
              {[
                { href: "/contact?service=website", label: "Website design" },
                { href: "/contact?service=landing-page", label: "Business website" },
                { href: "/contact?service=website", label: "Web design" },
                { href: "/contact?service=redesign", label: "Redesign" },
                { href: "/templates", label: "Case studies" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-[9px] font-semibold transition hover:border-[#a58bff]">{item.label} ↗</Link>
              ))}
            </nav>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-8 pt-6 sm:px-6 md:px-10">
        <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[34px] bg-[var(--button)] px-6 py-14 text-[var(--button-text)] sm:px-8 md:px-12">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[.18em] opacity-45">Make it yours from here</p>
              <h2 className="mt-4 max-w-4xl text-[clamp(38px,5vw,62px)] font-semibold leading-[.96] tracking-[-.055em]">Tell us what you want to solve.</h2>
            </div>
            <Link href="/contact?source=services" className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] px-6 text-[11px] font-semibold text-[var(--text)]">Get started →</Link>
          </div>
        </div>
      </section>

      <SiteFooter theme={theme} activePage="services" />
    </main>
  );
}
