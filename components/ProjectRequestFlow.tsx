"use client";

import BrandLogo from "@/components/BrandLogo";
import {
  BILLING_PLANS,
  PUBLIC_PRICE_TAX_LABEL,
  type BillingPlanId,
} from "@/lib/billing/public-config";
import {
  PROJECT_PAYMENT_OPTIONS,
  type ProjectPaymentMode,
} from "@/lib/project-requests";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";

type Theme = "light" | "dark";

type Props = {
  initialPlan: BillingPlanId | null;
  initialPaymentMode: ProjectPaymentMode;
  initialSource: string;
};

type RequestResult = {
  ok?: boolean;
  id?: string;
  requestNumber?: string;
  next?: string | null;
  error?: string;
};

export default function ProjectRequestFlow({
  initialPlan,
  initialPaymentMode,
  initialSource,
}: Props) {
  const [theme, setTheme] = useState<Theme>("light");
  const [planId, setPlanId] = useState<BillingPlanId | null>(
    initialPlan ?? (initialPaymentMode === "subscription" ? "business" : null)
  );
  const [paymentMode, setPaymentMode] =
    useState<ProjectPaymentMode>(initialPaymentMode);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDetails, setProjectDetails] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [startedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RequestResult | null>(null);

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

  const selectedPlan = useMemo(
    () => (planId ? BILLING_PLANS[planId] : null),
    [planId]
  );

  const paymentOption = PROJECT_PAYMENT_OPTIONS[paymentMode];

  const vars = {
    "--bg": theme === "dark" ? "#09090a" : "#ffffff",
    "--surface": theme === "dark" ? "#111113" : "#f5f5f7",
    "--surface-2": theme === "dark" ? "#18181b" : "#fbfbfd",
    "--text": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--muted": theme === "dark" ? "#a1a1a6" : "#6e6e73",
    "--muted-2": theme === "dark" ? "#77777d" : "#86868b",
    "--border":
      theme === "dark" ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)",
    "--border-strong":
      theme === "dark" ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.14)",
    "--button": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--button-text": theme === "dark" ? "#000000" : "#ffffff",
    "--accent": "#4b46ee",
    "--accent-soft":
      theme === "dark" ? "rgba(75,70,238,0.18)" : "rgba(75,70,238,0.08)",
  } as CSSProperties;

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      return next;
    });
  };

  const selectPaymentMode = (mode: ProjectPaymentMode) => {
    setPaymentMode(mode);
    setError("");
    setResult(null);
    if (mode === "subscription" && !planId) setPlanId("business");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setResult(null);

    if (paymentMode === "subscription" && !planId) {
      setError("Alege planul ORBYVEN pentru abonament.");
      return;
    }
    if (!contactName.trim() || !email.trim() || !projectTitle.trim() || !projectDetails.trim()) {
      setError("Completează numele, emailul și detaliile proiectului.");
      return;
    }
    if (!privacyAccepted) {
      setError("Acceptă Politica de Confidențialitate pentru a trimite cererea.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/project-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          paymentMode,
          companyName,
          contactName,
          email,
          phone,
          projectTitle,
          projectDetails,
          privacyAccepted,
          marketingConsent,
          source: initialSource,
          website,
          startedAt,
        }),
      });

      const data = (await response.json()) as RequestResult;
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Cererea nu a putut fi trimisă.");
      }

      setResult(data);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Cererea nu a putut fi trimisă."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (result?.ok) {
    return (
      <main
        style={vars}
        className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-5 py-12 text-[var(--text)] antialiased transition-colors duration-300"
      >
        <section className="w-full max-w-2xl rounded-[34px] border border-[var(--border)] bg-[var(--surface-2)] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.10)] sm:p-10">
          <div className="flex items-center justify-between gap-4">
            <BrandLogo compact theme={theme} />
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              Cerere primită
            </span>
          </div>

          <p className="mt-12 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
            {result.requestNumber}
          </p>
          <h1 className="mt-4 text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[56px]">
            De aici începe proiectul.
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-7 text-[var(--muted)]">
            Am salvat cererea și modul de colaborare ales. Nu se face nicio debitare din acest formular.
          </p>

          {paymentMode === "subscription" ? (
            <div className="mt-8 rounded-[24px] border border-[var(--border)] bg-[var(--bg)] p-5">
              <p className="text-sm font-semibold">Următorul pas: Dashboard + Billing</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Dacă ai deja cont ORBYVEN, intră în Dashboard și continuă către Stripe Checkout. Dacă ești client nou, creează mai întâi contul firmei.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/workspace"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--button)] px-6 text-sm font-semibold text-[var(--button-text)]"
                >
                  Continuă în Dashboard
                </Link>
                <Link
                  href="/workspace/register"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--border-strong)] px-6 text-sm font-semibold"
                >
                  Creează cont
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-[24px] border border-[var(--border)] bg-[var(--bg)] p-5">
              <p className="text-sm font-semibold">
                {paymentMode === "full_payment"
                  ? "Plata integrală urmează după confirmarea sumei."
                  : "Proiectul intră întâi în ofertare."}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                ORBYVEN poate atașa ulterior oferta și plata acestei cereri, fără să fie nevoie să completezi din nou datele proiectului.
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--border-strong)] px-5 text-sm font-medium"
            >
              Înapoi la site
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-[var(--muted)]"
            >
              Contact
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      style={vars}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased transition-colors duration-300"
    >
      <header className="border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-6 md:px-10">
          <BrandLogo compact theme={theme} />
          <div className="flex items-center gap-2">
            <Link
              href="/workspace"
              className="hidden h-10 items-center rounded-full border border-[var(--border-strong)] px-4 text-xs font-semibold sm:inline-flex"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Schimbă tema"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)] text-sm"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-full px-3 text-xs font-semibold text-[var(--muted)]"
            >
              Închide
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-10 sm:px-6 md:px-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start lg:gap-12">
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-2)]">
            ORBYVEN · Cerere proiect
          </p>
          <h1 className="mt-5 max-w-4xl text-[46px] font-semibold leading-[0.95] tracking-[-0.06em] sm:text-[64px] md:text-[78px]">
            Spune-ne ce trebuie construit.
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-[var(--muted)] sm:text-base">
            Alegi modul de colaborare, ne dai contextul proiectului, iar ORBYVEN păstrează cererea ca punct unic de pornire pentru ofertare, cont și plată.
          </p>

          <form onSubmit={submit} className="mt-10 space-y-8">
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
                1 · Cum vrei să colaborăm
              </legend>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {(Object.keys(PROJECT_PAYMENT_OPTIONS) as ProjectPaymentMode[]).map((mode) => {
                  const option = PROJECT_PAYMENT_OPTIONS[mode];
                  const active = paymentMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => selectPaymentMode(mode)}
                      className={`rounded-[24px] border p-5 text-left transition ${
                        active
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">{option.shortLabel}</span>
                        <span
                          className={`h-4 w-4 rounded-full border ${
                            active
                              ? "border-[5px] border-[var(--accent)]"
                              : "border-[var(--border-strong)]"
                          }`}
                        />
                      </div>
                      <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {paymentMode === "subscription" && (
              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
                  2 · Plan ORBYVEN
                </legend>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {(Object.keys(BILLING_PLANS) as BillingPlanId[]).map((id) => {
                    const plan = BILLING_PLANS[id];
                    const active = planId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPlanId(id)}
                        className={`rounded-[22px] border p-5 text-left transition ${
                          active
                            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                            : "border-[var(--border)] bg-[var(--surface-2)]"
                        }`}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
                          {plan.name}
                        </p>
                        <p className="mt-4 text-3xl font-semibold tracking-[-0.05em]">
                          {plan.priceLei}
                          <span className="ml-1 text-xs font-medium text-[var(--muted)]">
                            lei/lună
                          </span>
                        </p>
                        <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
                          {plan.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
                {paymentMode === "subscription" ? "3" : "2"} · Datele proiectului
              </legend>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Firmă / brand" value={companyName} onChange={setCompanyName} placeholder="Ex. Neagu Costică SRL" />
                <Field label="Nume contact *" value={contactName} onChange={setContactName} placeholder="Numele tău" required />
                <Field label="Email *" type="email" value={email} onChange={setEmail} placeholder="nume@firma.ro" required />
                <Field label="Telefon" type="tel" value={phone} onChange={setPhone} placeholder="07xx xxx xxx" />
              </div>

              <div className="mt-4">
                <Field
                  label="Ce vrei să construim? *"
                  value={projectTitle}
                  onChange={setProjectTitle}
                  placeholder="Ex. website + dashboard pentru firmă de instalații"
                  required
                />
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-medium text-[var(--muted)]">Detalii * </span>
                <textarea
                  required
                  value={projectDetails}
                  onChange={(event) => setProjectDetails(event.target.value)}
                  maxLength={5000}
                  rows={8}
                  placeholder="Ce problemă vrei să rezolvi, ce există deja, ce funcții sunt importante și orice alt context util."
                  className="mt-2 w-full resize-y rounded-[22px] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-4 text-sm outline-none transition placeholder:text-[var(--muted-2)] focus:border-[var(--accent)]"
                />
              </label>
            </fieldset>

            <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
              <label>
                Website
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </label>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-2)] p-5">
              <label className="flex items-start gap-3 text-sm leading-6">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(event) => setPrivacyAccepted(event.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  Am citit și accept{" "}
                  <Link href="/legal/privacy" className="font-medium underline underline-offset-4">
                    Politica de Confidențialitate
                  </Link>
                  {" "}pentru prelucrarea acestei cereri.
                </span>
              </label>

              <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-[var(--muted)]">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(event) => setMarketingConsent(event.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>Opțional: sunt de acord să primesc noutăți și oferte ORBYVEN.</span>
              </label>
            </div>

            {error && (
              <div className="rounded-[20px] border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-14 w-full items-center justify-center rounded-full bg-[var(--button)] px-7 text-sm font-semibold text-[var(--button-text)] transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {submitting
                ? "Se salvează cererea..."
                : paymentMode === "subscription"
                  ? "Trimite cererea și continuă"
                  : paymentMode === "full_payment"
                    ? "Trimite pentru plata integrală"
                    : "Trimite pentru ofertare"}
            </button>
          </form>
        </section>

        <aside className="lg:sticky lg:top-8">
          <div className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_26px_80px_rgba(0,0,0,0.08)] sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
                  Rezumat
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                  {paymentOption.label}
                </h2>
              </div>
              <span className="rounded-full bg-[var(--bg)] px-3 py-1.5 text-[10px] font-semibold text-[var(--muted)]">
                ORBYVEN
              </span>
            </div>

            {paymentMode === "subscription" && selectedPlan && (
              <div className="mt-7 rounded-[22px] bg-[var(--bg)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
                      Plan
                    </p>
                    <p className="mt-2 text-lg font-semibold">{selectedPlan.name}</p>
                  </div>
                  <p className="text-right text-2xl font-semibold tracking-[-0.04em]">
                    {selectedPlan.priceLei}
                    <span className="ml-1 text-xs font-medium text-[var(--muted)]">lei</span>
                  </p>
                </div>
                <p className="mt-3 text-xs text-[var(--muted-2)]">
                  pe lună · minimum 12 luni
                </p>
                <p className="mt-1 text-[10px] text-[var(--muted-2)]">
                  {PUBLIC_PRICE_TAX_LABEL}
                </p>
              </div>
            )}

            {(paymentMode === "full_payment" || paymentMode === "custom_quote") && (
              <div className="mt-7 rounded-[22px] bg-[var(--bg)] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
                  De plată acum
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-[-0.06em]">0 lei</p>
                <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
                  Suma apare numai după ce proiectul este clarificat și oferta este confirmată.
                </p>
              </div>
            )}

            <div className="mt-5 rounded-[22px] border border-[var(--border)] bg-[var(--surface-2)] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
                Modalitate de plată
              </p>
              <div className="mt-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]">
                  ✓
                </div>
                <div>
                  <p className="text-sm font-semibold">{paymentOption.paymentLabel}</p>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                    {paymentOption.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-[var(--border)] pt-5 text-xs leading-5 text-[var(--muted)]">
              <p>• Cererea este salvată înainte de orice plată.</p>
              <p>• Stripe LIVE rămâne blocat până la configurarea juridică și fiscală ORBYVEN.</p>
              <p>• Proiectele custom nu pot genera plăți înainte de ofertare.</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  type?: "text" | "email" | "tel";
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[var(--muted)]">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-13 w-full rounded-[20px] border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm outline-none transition placeholder:text-[var(--muted-2)] focus:border-[var(--accent)]"
      />
    </label>
  );
}
