"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";

import OrbitalSystem from "@/components/OrbitalSystem";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

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

function themeVars(theme: Theme) {
  return {
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
}

export default function ContactPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [compactNav, setCompactNav] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [requestNumber, setRequestNumber] = useState("");
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    const saved = window.localStorage.getItem("studio-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme: Theme =
      saved === "dark" || saved === "light"
        ? saved
        : prefersDark
          ? "dark"
          : "light";

    setTheme(nextTheme);
    document.documentElement.style.colorScheme = nextTheme;
  }, []);

  useEffect(() => {
    const onScroll = () => setCompactNav(window.scrollY > 90);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      return next;
    });
  };

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (submitError) setSubmitError("");
    if (requestNumber) setRequestNumber("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const message = form.message.trim();

    if (!name || !email || !message) {
      setSubmitError("Completează numele, emailul și câteva detalii despre proiect.");
      return;
    }

    if (!privacyAccepted) {
      setSubmitError("Acceptă Politica de Confidențialitate pentru a trimite cererea.");
      return;
    }

    setSending(true);
    setSubmitError("");
    setRequestNumber("");

    try {
      const response = await fetch("/api/project-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMode: "custom_quote",
          planId: null,
          companyName: "",
          contactName: name,
          email,
          phone: "",
          projectTitle: form.projectType,
          projectDetails: `Buget orientativ: ${form.budget}\n\n${message}`,
          source: "contact_page",
          privacyAccepted: true,
          marketingConsent: false,
          startedAt: startedAtRef.current,
          website: "",
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        requestNumber?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Cererea nu a putut fi trimisă.");
      }

      setRequestNumber(payload.requestNumber || "OR-RECEIVED");
      setForm(initialForm);
      setPrivacyAccepted(false);
      startedAtRef.current = Date.now();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Cererea nu a putut fi trimisă. Încearcă din nou."
      );
    } finally {
      setSending(false);
    }
  };

  const vars = themeVars(theme);

  return (
    <main
      style={{
        ...vars,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
      className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)] antialiased transition-colors duration-300"
    >
      <SiteHeader
        theme={theme}
        compact={compactNav}
        activePage="contact"
        onToggleTheme={toggleTheme}
      />

      <section className="relative overflow-hidden px-6 pb-16 pt-36 sm:px-8 sm:pt-40 md:flex md:min-h-[76svh] md:items-center md:px-10 md:pb-24 md:pt-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-18rem] h-[38rem] w-[58rem] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] blur-[150px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-4rem] top-32 h-52 w-52 rounded-full bg-[var(--accent-soft-2)] blur-[90px] md:h-72 md:w-72"
        />

        <OrbitalSystem
          variant="accent"
          className="left-[76%] top-[52%] hidden md:block"
        />

        <div className="relative mx-auto w-full max-w-[1500px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-2)]">
            ORBYVEN CREATIVE · CONTACT
          </p>

          <div className="mt-7 max-w-[1120px] md:mt-9">
            <h1 className="text-[clamp(48px,7vw,112px)] font-semibold leading-[0.92] tracking-[-0.065em]">
              Ai o idee?
              <span className="block">Hai s-o facem memorabilă.</span>
            </h1>
          </div>

          <div className="mt-8 grid max-w-[1100px] gap-5 md:mt-10 md:grid-cols-[1fr_0.55fr] md:items-end">
            <p className="max-w-2xl text-[16px] leading-7 text-[var(--muted)] md:text-[18px] md:leading-8">
              Spune-ne ce vrei să obții. Nu ai nevoie de un brief perfect —
              clarificăm împreună direcția, structura și ce merită construit.
            </p>

            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[var(--muted-2)] md:justify-self-end">
              <span className="h-px w-10 bg-[var(--border-strong)]" />
              Start a conversation
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-6 pb-24 sm:px-8 md:px-10 md:pb-36">
        <div className="mx-auto grid max-w-[1500px] gap-10 xl:grid-cols-[0.72fr_1.28fr] xl:gap-20">
          <aside className="xl:sticky xl:top-28 xl:self-start">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-2)]">
              Start here
            </p>
            <h2 className="mt-5 max-w-xl text-[40px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[54px] md:text-[62px]">
              Direct la ce contează.
            </h2>
            <p className="mt-6 max-w-lg text-[15px] leading-7 text-[var(--muted)]">
              Trimite-ne contextul proiectului. Cererea intră direct în fluxul
              ORBYVEN și primește un număr unic, fără formulare intermediare.
            </p>

            <div className="mt-9 divide-y divide-[var(--border)] border-y border-[var(--border)] text-sm">
              <InfoRow label="Răspuns" value="În cel mai scurt timp" />
              <InfoRow label="Lucrăm" value="Remote · România" />
              <InfoRow label="Flux" value="Cerere → ofertă → proiect" />
            </div>

            <Link
              href="/cerere"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--text)]"
            >
              Vrei toate opțiunile comerciale?
              <span aria-hidden="true">→</span>
            </Link>
          </aside>

          <form
            id="project-form"
            onSubmit={handleSubmit}
            aria-busy={sending}
            className="relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7 md:rounded-[36px] md:p-9 lg:p-11"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-[-12%] top-[-12%] h-[360px] w-[360px] rounded-full bg-[var(--accent-soft)] blur-[140px]"
            />

            <div className="relative">
              <div className="mb-8 border-b border-[var(--border)] pb-7 md:mb-10 md:pb-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-2)]">
                  Project inquiry
                </p>
                <h3 className="mt-3 text-[30px] font-semibold tracking-[-0.045em] sm:text-[38px]">
                  Spune-ne despre proiect.
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Câteva detalii sunt suficiente. Restul îl stabilim împreună.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nume *">
                  <input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    autoComplete="name"
                    className={inputClass}
                    placeholder="Numele tău"
                  />
                </Field>

                <Field label="Email *">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    autoComplete="email"
                    className={inputClass}
                    placeholder="nume@companie.ro"
                  />
                </Field>

                <Field label="Tip proiect">
                  <select
                    value={form.projectType}
                    onChange={(event) => updateField("projectType", event.target.value)}
                    className={inputClass}
                  >
                    <option>Website pentru business</option>
                    <option>Landing page</option>
                    <option>Dashboard / instrument intern</option>
                    <option>Experiență digitală</option>
                    <option>Alt proiect</option>
                  </select>
                </Field>

                <Field label="Buget orientativ">
                  <select
                    value={form.budget}
                    onChange={(event) => updateField("budget", event.target.value)}
                    className={inputClass}
                  >
                    <option>Nu știu încă</option>
                    <option>Sub 2.500 lei</option>
                    <option>2.500 – 5.000 lei</option>
                    <option>5.000 – 10.000 lei</option>
                    <option>Peste 10.000 lei</option>
                  </select>
                </Field>
              </div>

              <Field label="Ce vrei să construim? *" className="mt-5">
                <textarea
                  value={form.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  className={`${inputClass} min-h-40 resize-y`}
                  placeholder="Spune-ne pe scurt ce vrei să obții, ce problemă rezolvăm și orice detaliu relevant."
                />
              </Field>

              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-6 text-[var(--muted)]">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(event) => {
                    setPrivacyAccepted(event.target.checked);
                    if (submitError) setSubmitError("");
                  }}
                  className="mt-1 h-4 w-4 accent-[var(--accent)]"
                />
                <span>
                  Am citit și accept{" "}
                  <Link href="/legal/privacy" className="text-[var(--text)] underline underline-offset-4">
                    Politica de Confidențialitate
                  </Link>
                  {" "}pentru prelucrarea acestei cereri.
                </span>
              </label>

              {submitError && (
                <p className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-500" role="alert">
                  {submitError}
                </p>
              )}

              {requestNumber && (
                <div className="mt-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-4" role="status">
                  <p className="text-sm font-semibold text-[var(--text)]">Cererea a fost trimisă.</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Număr de referință: <strong className="text-[var(--text)]">{requestNumber}</strong>
                  </p>
                </div>
              )}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-[var(--muted-2)]">
                  Nu se efectuează nicio plată din acest formular.
                </p>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--button)] px-7 text-sm font-medium text-[var(--button-text)] transition hover:scale-[1.015] disabled:cursor-wait disabled:opacity-60"
                >
                  {sending ? "Se trimite…" : "Trimite cererea"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <SiteFooter theme={theme} activePage="contact" />
    </main>
  );
}

const inputClass =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3.5 text-[15px] text-[var(--text)] outline-none transition placeholder:text-[var(--muted-2)] focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--accent)]/10";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <span className="text-[var(--muted-2)]">{label}</span>
      <span className="text-right font-medium text-[var(--text)]">{value}</span>
    </div>
  );
}
