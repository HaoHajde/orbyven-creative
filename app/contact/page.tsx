"use client";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

import { orbitaSupabase as orbyvenSupabase } from "@/lib/orbita-supabase";
import Link from "next/link";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

type FormState = {
  name: string;
  email: string;
  projectType: string;
  budget: string;
  message: string;
};

const initialForm: FormState = {
  name: "",
  email: "",
  projectType: "Website pentru business",
  budget: "Nu știu încă",
  message: "",
};

const easeOut = [0.16, 1, 0.3, 1] as [
  number,
  number,
  number,
  number,
];

const reveal = {
  initial: { opacity: 0, y: 42 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: {
    duration: 0.85,
    ease: easeOut,
  },
};

export default function ContactPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [compactNav, setCompactNav] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const { scrollY } = useScroll();

  const heroProgress = useTransform(
    scrollY,
    [0, 650],
    [0, 1]
  );

  const heroY = useTransform(
    heroProgress,
    [0, 1],
    [0, -95]
  );

  const heroOpacity = useTransform(
    heroProgress,
    [0, 0.78],
    [1, 0]
  );

  const heroScale = useTransform(
    heroProgress,
    [0, 1],
    [1, 0.975]
  );

  useMotionValueEvent(scrollY, "change", (latest) => {
    setCompactNav(latest > 90);
  });

  useEffect(() => {
    const saved = window.localStorage.getItem("studio-theme");

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const initialTheme: Theme =
      saved === "dark" || saved === "light"
        ? saved
        : prefersDark
          ? "dark"
          : "light";

    setTheme(initialTheme);
    document.documentElement.style.colorScheme = initialTheme;
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";

      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;

      return next;
    });
  };

  const vars = {
    "--bg": theme === "dark" ? "#000000" : "#ffffff",
    "--surface": theme === "dark" ? "#0c0c0e" : "#f5f5f7",
    "--surface-2": theme === "dark" ? "#151518" : "#fbfbfd",
    "--surface-3": theme === "dark" ? "#1d1d21" : "#efeff3",
    "--text": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--muted": theme === "dark" ? "#a1a1a6" : "#6e6e73",
    "--muted-2": theme === "dark" ? "#77777d" : "#86868b",
    "--border":
      theme === "dark"
        ? "rgba(255,255,255,0.09)"
        : "rgba(0,0,0,0.08)",
    "--border-strong":
      theme === "dark"
        ? "rgba(255,255,255,0.16)"
        : "rgba(0,0,0,0.14)",
    "--button": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--button-text": theme === "dark" ? "#000000" : "#ffffff",
    "--accent": "#4b46ee",
    "--accent-2": "#6f42ff",
    "--accent-soft":
      theme === "dark"
        ? "rgba(75,70,238,0.18)"
        : "rgba(75,70,238,0.08)",
    "--accent-soft-2":
      theme === "dark"
        ? "rgba(111,66,255,0.11)"
        : "rgba(111,66,255,0.05)",
  } as CSSProperties;

  const updateField = (
    field: keyof FormState,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (sent) setSent(false);
    if (submitError) setSubmitError("");
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const message = form.message.trim();

    if (!name || !email || !message) {
      setSent(false);
      setSubmitError("Completează câmpurile obligatorii.");
      return;
    }

    setSending(true);
    setSent(false);
    setSubmitError("");

    try {
      const { error } = await orbyvenSupabase
        .from("leads")
        .insert({
          name,
          email,
          project_type: form.projectType,
          budget: form.budget,
          message,
        });

      if (error) throw error;

      setSent(true);
      setForm(initialForm);
    } catch (error) {
      console.error("ORBYVEN lead insert error:", error);

      setSubmitError(
        "Cererea nu a putut fi trimisă. Încearcă din nou."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <main
      style={{
        ...vars,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
      className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)] antialiased transition-colors duration-500"
    >
      <SiteHeader
        theme={theme}
        compact={compactNav}
        activePage="contact"
        onToggleTheme={toggleTheme}
      />

      {/* HERO */}
      <section className="relative flex min-h-[88svh] items-center overflow-hidden bg-[var(--bg)] pt-24 md:min-h-screen">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-28%] h-[760px] w-[1100px] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] blur-[160px]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[8%] top-[22%] h-56 w-56 rounded-full bg-[var(--accent-soft-2)] blur-[120px]"
        />

        <motion.div
          style={{
            y: heroY,
            opacity: heroOpacity,
            scale: heroScale,
          }}
          className="relative mx-auto w-full max-w-[1500px] px-6 pb-16 pt-12 md:px-10"
        >
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.85,
              delay: 0.08,
              ease: easeOut,
            }}
            className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-2)]"
          >
            ORBYVEN CREATIVE · CONTACT
          </motion.p>

          <div className="mt-9 max-w-[1320px]">
            <div className="overflow-hidden pb-2">
              <motion.span
                initial={{ y: "112%" }}
                animate={{ y: "0%" }}
                transition={{
                  duration: 1.05,
                  delay: 0.16,
                  ease: easeOut,
                }}
                className="block text-[clamp(54px,7.2vw,118px)] font-semibold leading-[0.91] tracking-[-0.068em]"
              >
                Ai o idee?
              </motion.span>
            </div>

            <div className="overflow-hidden pb-4">
              <motion.span
                initial={{ y: "112%" }}
                animate={{ y: "0%" }}
                transition={{
                  duration: 1.12,
                  delay: 0.27,
                  ease: easeOut,
                }}
                className="block text-[clamp(54px,7.2vw,118px)] font-semibold leading-[0.91] tracking-[-0.068em]"
              >
                Hai s-o facem memorabilă.
              </motion.span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.9,
              delay: 0.55,
              ease: easeOut,
            }}
            className="mt-9 grid gap-8 md:grid-cols-[1fr_0.7fr] md:items-end"
          >
            <p className="max-w-2xl text-[16px] leading-7 text-[var(--muted)] md:text-[18px] md:leading-8">
              Spune-ne ce vrei să construim. Poate fi un website,
              un landing page, o invitație digitală sau ceva care
              încă nu are un nume clar.
            </p>

            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[var(--muted-2)] md:justify-self-end">
              <span className="h-px w-10 bg-[var(--border-strong)]" />
              Start a conversation
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* CONTACT CONTENT */}
      <section className="relative bg-[var(--bg)]">
        <div className="mx-auto max-w-[1500px] px-6 pb-28 pt-12 md:px-10 md:pb-40 md:pt-20">
          <div className="grid gap-14 xl:grid-cols-[0.72fr_1.28fr] xl:gap-20">
            {/* LEFT */}
            <div className="xl:sticky xl:top-28 xl:self-start">
              <motion.div {...reveal}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
                  Start here
                </p>

                <h2 className="mt-6 max-w-xl text-[44px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[56px] md:text-[66px]">
                  Nu ai nevoie de un brief perfect.
                </h2>

                <p className="mt-7 max-w-lg text-[15px] leading-7 text-[var(--muted)]">
                  E suficient să ne spui ce vrei să obții. Clarificăm
                  împreună direcția, structura și ce merită construit.
                </p>
              </motion.div>

              <motion.div
                {...reveal}
                className="mt-12 border-t border-[var(--border)]"
              >
                <InfoRow
                  label="Răspuns"
                  value="În cel mai scurt timp"
                />
                <InfoRow
                  label="Lucrăm"
                  value="Remote · România"
                />
                <InfoRow
                  label="Direcție"
                  value="Web · Digital · Creative"
                />
              </motion.div>

              <motion.div
                {...reveal}
                className="relative mt-10 overflow-hidden rounded-[30px] bg-[var(--button)] p-7 text-[var(--button-text)] md:p-8"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute right-[-70px] top-[-70px] h-56 w-56 rounded-full bg-[var(--accent)]/20 blur-[90px]"
                />

                <div className="relative">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-45">
                        ORBYVEN CREATIVE
                      </p>

                      <p className="mt-5 max-w-sm text-[32px] font-semibold leading-[1] tracking-[-0.05em]">
                        We build what gets remembered.
                      </p>
                    </div>

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-current/15">
                      <OrbitIcon />
                    </div>
                  </div>

                  <p className="mt-10 max-w-sm text-sm leading-6 opacity-50">
                    Design curat. Dezvoltare atentă. Experiențe
                    digitale construite cu intenție.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* FORM */}
            <motion.form
              id="project-form"
              {...reveal}
              onSubmit={handleSubmit}
              aria-busy={sending}
              className="relative scroll-mt-32 overflow-hidden rounded-[36px] border border-[var(--border)] bg-[var(--surface)] p-6 md:p-9 lg:p-11"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-[-12%] top-[-12%] h-[420px] w-[420px] rounded-full bg-[var(--accent-soft)] blur-[150px]"
              />

              <div className="relative">
                <div className="mb-10 flex flex-col gap-5 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-2)]">
                      Project inquiry
                    </p>

                    <h3 className="mt-3 text-[32px] font-semibold tracking-[-0.045em] sm:text-[38px]">
                      Spune-ne despre proiect.
                    </h3>
                  </div>

                  <p className="text-xs text-[var(--muted-2)]">
                    5 câmpuri · aproximativ 2 minute
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Nume">
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      required
                      value={form.name}
                      onChange={(e) =>
                        updateField("name", e.target.value)
                      }
                      placeholder="Numele tău"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Email">
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        updateField("email", e.target.value)
                      }
                      placeholder="email@exemplu.ro"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Tipul proiectului">
                    <select
                      name="projectType"
                      value={form.projectType}
                      onChange={(e) =>
                        updateField(
                          "projectType",
                          e.target.value
                        )
                      }
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option>Website pentru business</option>
                      <option>Landing page</option>
                      <option>Redesign website</option>
                      <option>
                        Invitație digitală de nuntă
                      </option>
                      <option>
                        Invitație digitală de botez
                      </option>
                      <option>Proiect custom</option>
                    </select>
                  </Field>

                  <Field label="Buget orientativ">
                    <select
                      name="budget"
                      value={form.budget}
                      onChange={(e) =>
                        updateField(
                          "budget",
                          e.target.value
                        )
                      }
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option>Nu știu încă</option>
                      <option>Sub 500 lei</option>
                      <option>500 – 1.000 lei</option>
                      <option>1.000 – 2.500 lei</option>
                      <option>2.500 – 5.000 lei</option>
                      <option>Peste 5.000 lei</option>
                    </select>
                  </Field>
                </div>

                <div className="mt-6">
                  <Field label="Despre proiect">
                    <textarea
                      name="message"
                      required
                      minLength={10}
                      value={form.message}
                      onChange={(e) =>
                        updateField(
                          "message",
                          e.target.value
                        )
                      }
                      placeholder="Ce vrei să construim? Ce ar trebui să facă proiectul pentru tine? Dacă ai exemple sau o direcție vizuală în minte, spune-ne aici."
                      rows={8}
                      className={`${inputClass} min-h-[210px] resize-y`}
                    />
                  </Field>
                </div>

                <div className="mt-8 flex flex-col gap-5 border-t border-[var(--border)] pt-7 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-md text-xs leading-5 text-[var(--muted-2)]">
                    Folosim informațiile doar pentru a putea discuta
                    despre proiectul tău.
                  </p>

                  <button
                    type="submit"
                    disabled={sending}
                    className="group inline-flex h-12 shrink-0 items-center justify-center gap-3 rounded-full bg-[var(--button)] px-6 py-3.5 text-sm font-medium text-[var(--button-text)] transition duration-300 hover:scale-[1.02] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending
                      ? "Se trimite..."
                      : "Trimite cererea"}

                    {!sending && (
                      <span className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                        <ArrowUpRightIcon />
                      </span>
                    )}
                  </button>
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="mt-6 rounded-[22px] border border-red-500/20 bg-red-500/[0.06] px-5 py-4"
                  >
                    <p className="text-sm font-semibold text-red-500">
                      {submitError}
                    </p>
                  </div>
                )}

                {sent && (
                  <motion.div
                    aria-live="polite"
                    initial={{
                      opacity: 0,
                      y: 12,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.45,
                      ease: easeOut,
                    }}
                    className="mt-6 rounded-[24px] border border-[var(--border)] bg-[var(--bg)] px-5 py-5"
                  >
                    <div className="flex items-start gap-4">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs text-white">
                        ✓
                      </span>

                      <div>
                        <p className="text-sm font-semibold">
                          Cererea a fost trimisă.
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                          Mulțumim. Revenim către tine cât mai curând.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.form>
          </div>
        </div>
      </section>

      {/* SECONDARY CTA */}
      <section className="px-6 pb-0 pt-8 md:px-10 md:pt-12">
        <motion.div
          {...reveal}
          className="relative mx-auto max-w-[1500px] overflow-hidden rounded-t-[42px] bg-[var(--button)] px-7 py-20 text-[var(--button-text)] md:px-14 md:py-28 lg:px-16"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-6%] top-[-45%] h-[460px] w-[460px] rounded-full bg-[var(--accent)]/15 blur-[140px]"
          />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-45">
                Not ready yet?
              </p>

              <h2 className="mt-5 max-w-4xl text-[44px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[58px] md:text-[72px]">
                Vezi mai întâi ce construim.
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-6 opacity-50">
                Explorează proiectele, stilul și felul în care transformăm
                ideile în experiențe digitale.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-self-end">
              <Link
                href="/templates"
                className="group inline-flex h-12 shrink-0 items-center justify-center gap-3 rounded-full bg-[var(--bg)] px-6 text-sm font-medium text-[var(--text)] transition duration-300 hover:scale-[1.03]"
              >
                Vezi portofoliul

                <span className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRightIcon />
                </span>
              </Link>

              <Link
                href="/servicii"
                className="group inline-flex h-12 shrink-0 items-center justify-center gap-3 rounded-full border border-current/20 px-6 text-sm font-medium transition duration-300 hover:bg-white/10"
              >
                Vezi serviciile

                <span className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRightIcon />
                </span>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <SiteFooter theme={theme} activePage="contact" />
    </main>
  );
}

const inputClass =
  "w-full rounded-[20px] border border-[var(--border)] bg-[var(--bg)] px-4 py-4 text-[14px] text-[var(--text)] outline-none transition duration-300 placeholder:text-[var(--muted-2)] hover:border-[var(--border-strong)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]";

function scrollToProjectForm() {
  const element = document.getElementById("project-form");

  if (!element) return;

  const navOffset = 96;
  const targetY =
    element.getBoundingClientRect().top +
    window.scrollY -
    navOffset;

  window.scrollTo({
    top: targetY,
    behavior: "smooth",
  });
}

/* HEADER */

/* FIELD */

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </span>

      {children}
    </label>
  );
}

/* INFO */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-[var(--border)] py-5 last:border-b-0">
      <span className="text-sm text-[var(--muted)]">
        {label}
      </span>

      <span className="text-right text-sm font-medium">
        {value}
      </span>
    </div>
  );
}

/* FOOTER */

/* ICONS */

function ArrowUpRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

function OrbitIcon() {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <circle
        cx="20"
        cy="20"
        r="8"
        stroke="currentColor"
        strokeWidth="3"
      />

      <ellipse
        cx="20"
        cy="20"
        rx="17"
        ry="7"
        transform="rotate(-20 20 20)"
        stroke="currentColor"
        strokeWidth="2"
      />

      <circle
        cx="34"
        cy="11"
        r="2.5"
        fill="currentColor"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-[17px] w-[17px]"
    >
      <path d="M20.2 15.7A8.5 8.5 0 0 1 8.3 3.8 8.5 8.5 0 1 0 20.2 15.7Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-[17px] w-[17px]"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.42 1.42" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}
