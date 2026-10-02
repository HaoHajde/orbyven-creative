"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type CSSProperties } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  BILLING_PLANS,
  LEGAL_DOCUMENT_VERSION,
  PUBLIC_PRICE_TAX_LABEL,
  isBillingPlanId,
  type BillingPlanId,
} from "@/lib/billing/public-config";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import {
  getCurrentWorkspace,
  getWorkspaceEntryPath,
  type OrbyvenWorkspace,
} from "@/lib/orbyven-workspace";

type Theme = "light" | "dark";
type AccountState = "checking" | "guest" | "onboarding" | "ready" | "restricted";
type EntryProduct = "invitation" | "website" | "website_dashboard";

const WEB_DESIGN_TRIAL_DAYS = 30;

const PLAN_META: Record<BillingPlanId, { eyebrow: string; note: string; badge?: string }> = {
  start: { eyebrow: "ESSENTIAL", note: "Fundația digitală și primele instrumente." },
  business: { eyebrow: "CONNECTED", note: "Site + workspace pentru activitatea de zi cu zi.", badge: "Recomandat" },
  pro: { eyebrow: "COMPLETE", note: "Ecosistem extins pentru echipe și procese." },
};


function getThemeVars(theme: Theme) {
  return {
    "--bg": theme === "dark" ? "#09090d" : "#f8f8fb",
    "--surface": theme === "dark" ? "#101014" : "#ffffff",
    "--surface-2": theme === "dark" ? "#17171c" : "#f1f1f5",
    "--text": theme === "dark" ? "#f5f5f7" : "#17171b",
    "--muted": theme === "dark" ? "#aaaab2" : "#66666f",
    "--muted-2": theme === "dark" ? "#777781" : "#878790",
    "--border": theme === "dark" ? "rgba(255,255,255,.085)" : "rgba(18,18,24,.075)",
    "--border-strong": theme === "dark" ? "rgba(255,255,255,.15)" : "rgba(18,18,24,.14)",
    "--button": theme === "dark" ? "#f5f5f7" : "#17171b",
    "--button-text": theme === "dark" ? "#09090d" : "#ffffff",
    "--accent": "#4b46ee",
    "--home-violet": "#a58bff",
    "--accent-soft": theme === "dark" ? "rgba(126,93,255,.14)" : "rgba(112,78,255,.09)",
    "--grid-line": theme === "dark" ? "rgba(255,255,255,.045)" : "rgba(20,20,30,.045)",
  } as CSSProperties;
}

function StripeCheckoutNote() {
  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-2)_52%,transparent)] p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border border-[var(--border)] bg-[var(--surface)] text-[11px] font-bold">
          Stripe
        </span>
        <div>
          <p className="text-[12px] font-semibold">Metodele reale apar în Stripe Checkout</p>
          <p className="mt-1 text-[10px] leading-5 text-[var(--muted)]">
            Apple Pay, Google Pay și cardurile compatibile sunt afișate de Stripe în formatul lor oficial, în funcție de dispozitiv și browser.
          </p>
        </div>
      </div>
    </div>
  );
}

function ContactPageContent() {
  const searchParams = useSearchParams();
  const queryPlan = searchParams.get("plan");
  const queryProduct = searchParams.get("product") || searchParams.get("service");
  const initialPlan: BillingPlanId = isBillingPlanId(queryPlan) ? queryPlan : "business";
  const initialProduct: EntryProduct | null =
    isBillingPlanId(queryPlan) || searchParams.get("checkout") === "1"
      ? "website_dashboard"
      : queryProduct === "invitation"
        ? "invitation"
        : queryProduct === "web-design"
          ? "website"
          : queryProduct === "web-design-dashboard"
            ? "website_dashboard"
            : null;

  const [theme, setTheme] = useState<Theme>("light");
  const [entryProduct, setEntryProduct] = useState<EntryProduct | null>(initialProduct);
  const [planId, setPlanId] = useState<BillingPlanId>(initialPlan);
  const [accountState, setAccountState] = useState<AccountState>("checking");
  const [workspace, setWorkspace] = useState<OrbyvenWorkspace | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const selectedPlan = useMemo(() => BILLING_PLANS[planId], [planId]);

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

  useEffect(() => {
    let cancelled = false;
    const loadAccount = async () => {
      try {
        const { data } = await orbyvenSupabase.auth.getSession();
        if (cancelled) return;
        if (!data.session) {
          setAccountState("guest");
          return;
        }

        const destination = await getWorkspaceEntryPath();
        if (cancelled) return;

        if (destination === "/workspace/onboarding") {
          setAccountState("onboarding");
          return;
        }
        if (destination !== "/workspace") {
          setAccountState("restricted");
          return;
        }

        const currentWorkspace = await getCurrentWorkspace();
        if (cancelled) return;
        if (!currentWorkspace) {
          setAccountState("onboarding");
          return;
        }

        setWorkspace(currentWorkspace);
        setAccountState("ready");
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) {
          setError("Nu am putut verifica starea contului. Reîncearcă.");
          setAccountState("guest");
        }
      }
    };
    void loadAccount();
    return () => {
      cancelled = true;
    };
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

  const checkoutQuery = `?plan=${planId}&checkout=1&product=web-design-dashboard`;
  const registerHref = `/workspace/register${checkoutQuery}`;
  const loginHref = `/workspace/login${checkoutQuery}`;
  const onboardingHref = `/workspace/onboarding${checkoutQuery}`;

  const startCheckout = async () => {
    if (!workspace || !accepted || paying) return;
    setPaying(true);
    setError("");

    try {
      const { data } = await orbyvenSupabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setAccountState("guest");
        throw new Error("Sesiunea a expirat. Autentifică-te din nou.");
      }

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: workspace.organization.id,
          planId,
          acceptedLegalVersion: LEGAL_DOCUMENT_VERSION,
        }),
      });

      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Checkout-ul nu este disponibil momentan.");
      }
      window.location.assign(payload.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout-ul nu este disponibil momentan.");
      setPaying(false);
    }
  };

  const vars = getThemeVars(theme);

  return (
    <main
      style={{
        ...vars,
        fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif",
        background:
          theme === "dark"
            ? "linear-gradient(180deg,#0b0912 0%,#0a0910 34%,#09090d 68%,#09090d 100%)"
            : "linear-gradient(180deg,#fbfaff 0%,#f8f8fb 38%,#f7f7fa 72%,#f6f6fa 100%)",
      }}
      className="relative min-h-screen overflow-x-hidden text-[var(--text)] antialiased"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[.34]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "linear-gradient(to bottom, black 0%, rgba(0,0,0,.72) 62%, transparent 100%)",
          }}
        />
        <div className="absolute left-1/2 top-[-24rem] h-[58rem] w-[72rem] max-w-[86vw] -translate-x-1/2 rounded-full bg-[rgba(126,93,255,.11)] blur-[170px]" />
        <div className="absolute right-[-18rem] top-[34rem] h-[46rem] w-[46rem] rounded-full bg-[rgba(91,70,185,.07)] blur-[180px]" />
        <div className="absolute left-[-20rem] top-[70rem] h-[44rem] w-[44rem] rounded-full bg-[rgba(58,88,148,.045)] blur-[190px]" />
      </div>

      <SiteHeader theme={theme} compact={false} activePage="contact" onToggleTheme={toggleTheme} />

      <section className="relative z-10 px-5 pb-10 pt-28 sm:px-6 md:px-10 md:pb-14 md:pt-36">
        <div className="mx-auto max-w-[1500px]">
          <p className="orbyven-home-kicker">
            <span aria-hidden="true" className="orbyven-home-kicker-icon">✦</span>
            <span>ORBYVEN · PORNEȘTE</span>
            <span aria-hidden="true" className="orbyven-home-kicker-line" />
          </p>

          <div className="mt-7 grid gap-7 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
            <div>
              <h1 className="max-w-[760px] text-[clamp(54px,6.2vw,96px)] font-semibold leading-[.89] tracking-[-.07em]">
                Cu ce
                <br />
                <span className="text-[var(--home-violet)]">începem?</span>
              </h1>
            </div>
            <div className="max-w-xl lg:justify-self-end lg:pb-2">
              <p className="text-[14px] leading-7 text-[var(--muted)] sm:text-[15px]">
                Alege direcția. Îți arătăm doar pașii relevanți pentru ce vrei să cumperi, fără să amestecăm invitațiile, web design-ul și dashboard-ul.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-3 lg:grid-cols-3">
            {[
              {
                id: "invitation" as EntryProduct,
                eyebrow: "EVENIMENT",
                title: "Invitație online personalizată",
                note: "Nuntă, botez sau majorat. Design, RSVP și experiență adaptată evenimentului.",
                badge: "ONE-TIME",
              },
              {
                id: "website" as EntryProduct,
                eyebrow: "WEB DESIGN",
                title: "Web design",
                note: "Website, landing page sau redesign construit pentru business-ul tău.",
                badge: "30 ZILE DASHBOARD",
              },
              {
                id: "website_dashboard" as EntryProduct,
                eyebrow: "ECOSISTEM",
                title: "Web design + Dashboard",
                note: "Website-ul public conectat cu workspace-ul modular ORBYVEN.",
                badge: "SITE + WORKSPACE",
              },
            ].map((item) => {
              const active = entryProduct === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setEntryProduct(item.id);
                    setAccepted(false);
                    setError("");
                  }}
                  className={
                    active
                      ? "group relative min-h-[210px] overflow-hidden rounded-[28px] border border-[rgba(165,139,255,.58)] bg-[linear-gradient(135deg,rgba(126,93,255,.18),rgba(126,93,255,.055))] p-6 text-left shadow-[0_24px_70px_rgba(75,70,238,.13)] transition sm:p-7"
                      : "group relative min-h-[210px] overflow-hidden rounded-[28px] border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_76%,transparent)] p-6 text-left transition hover:-translate-y-1 hover:border-[rgba(165,139,255,.36)] sm:p-7"
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[var(--muted-2)]">{item.eyebrow}</p>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[8px] font-bold text-[var(--muted)]">{item.badge}</span>
                  </div>
                  <div className="mt-10">
                    <h2 className="max-w-[360px] text-[28px] font-semibold leading-[.96] tracking-[-.055em] sm:text-[32px]">{item.title}</h2>
                    <p className="mt-4 max-w-[390px] text-[11px] leading-5 text-[var(--muted)] sm:text-[12px]">{item.note}</p>
                  </div>
                  <div className="absolute bottom-6 right-6 grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[14px] transition group-hover:translate-x-1">→</div>
                </button>
              );
            })}
          </div>

          {!entryProduct ? (
            <div className="mt-4 flex items-center justify-center rounded-[20px] border border-dashed border-[var(--border-strong)] px-5 py-4 text-[11px] text-[var(--muted)]">
              Alege una dintre cele trei direcții pentru a continua.
            </div>
          ) : null}
        </div>
      </section>

      {entryProduct === "invitation" ? (
        <section id="start-flow" className="relative z-10 px-5 pb-24 sm:px-6 md:px-10 md:pb-32">
          <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[.92fr_1.08fr]">
            <div className="rounded-[32px] border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] p-6 shadow-[0_28px_90px_rgba(0,0,0,.12)] backdrop-blur-2xl sm:p-8 lg:p-10">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--home-violet)]">INVITAȚIE ONLINE</p>
              <h2 className="mt-4 max-w-xl text-[clamp(38px,4.8vw,66px)] font-semibold leading-[.92] tracking-[-.065em]">
                Personalizată pentru evenimentul tău.
              </h2>
              <p className="mt-5 max-w-lg text-[13px] leading-6 text-[var(--muted)]">
                Alegem stilul, structura și interacțiunile potrivite. RSVP-ul, locațiile și detaliile evenimentului pot rămâne într-o singură experiență.
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                <Link href="/invitatii-nunta" className="rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-[10px] font-semibold">Nuntă ↗</Link>
                <Link href="/invitatii-botez" className="rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-[10px] font-semibold">Botez ↗</Link>
                <Link href="/invitatii-majorat" className="rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-[10px] font-semibold">Majorat ↗</Link>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[32px] border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_86%,transparent)] p-6 shadow-[0_28px_90px_rgba(0,0,0,.14)] backdrop-blur-2xl sm:p-8 lg:p-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--muted-2)]">URMĂTORUL PAS</p>
                <h3 className="mt-4 text-[34px] font-semibold leading-[.96] tracking-[-.055em] sm:text-[42px]">Spune-ne evenimentul și stilul.</h3>
                <p className="mt-4 max-w-xl text-[12px] leading-6 text-[var(--muted)]">Pornim de la câteva informații esențiale, apoi personalizăm experiența.</p>
              </div>
              <div className="mt-8">
                <Link href="/cerere?service=invitation&source=start" className="flex h-14 w-full items-center justify-between rounded-[18px] bg-[var(--button)] px-5 text-[14px] font-semibold text-[var(--button-text)]">
                  <span>Pornește personalizarea</span>
                  <span>→</span>
                </Link>
                <Link href="/templates" className="mt-3 flex h-13 w-full items-center justify-center rounded-[18px] border border-[var(--border-strong)] text-[12px] font-semibold">
                  Vezi template-urile
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {entryProduct === "website" ? (
        <section id="start-flow" className="relative z-10 px-5 pb-24 sm:px-6 md:px-10 md:pb-32">
          <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[1.05fr_.95fr]">
            <div className="rounded-[32px] border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] p-6 shadow-[0_28px_90px_rgba(0,0,0,.12)] backdrop-blur-2xl sm:p-8 lg:p-10">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--home-violet)]">WEB DESIGN</p>
              <h2 className="mt-4 max-w-2xl text-[clamp(38px,4.8vw,66px)] font-semibold leading-[.92] tracking-[-.065em]">
                Website-ul primul. Dashboard-ul îl testezi gratuit.
              </h2>
              <p className="mt-5 max-w-2xl text-[13px] leading-6 text-[var(--muted)]">
                La prima achiziție de web design includem {WEB_DESIGN_TRIAL_DAYS} de zile de ORBYVEN Dashboard pentru primul utilizator. Îl folosești în context real și păstrezi ulterior doar ce îți este util.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ["01", "Website", "Design + structură adaptată business-ului."],
                  ["02", "Lansare", "Responsive, SEO tehnic și fluxuri esențiale."],
                  ["03", "30 zile", "Dashboard inclus pentru 1 utilizator la prima achiziție."],
                ].map(([number, title, note]) => (
                  <div key={number} className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <p className="text-[9px] font-bold text-[var(--home-violet)]">{number}</p>
                    <p className="mt-3 text-[13px] font-semibold">{title}</p>
                    <p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">{note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[32px] border border-[rgba(165,139,255,.34)] bg-[linear-gradient(145deg,rgba(126,93,255,.13),rgba(126,93,255,.035))] p-6 shadow-[0_28px_90px_rgba(75,70,238,.11)] sm:p-8 lg:p-10">
              <div>
                <span className="inline-flex rounded-full border border-[rgba(165,139,255,.32)] bg-[var(--accent-soft)] px-4 py-2.5 text-[9px] font-bold text-[var(--home-violet)]">BONUS DE LANSARE</span>
                <p className="mt-6 text-[52px] font-semibold leading-none tracking-[-.075em]">{WEB_DESIGN_TRIAL_DAYS} zile</p>
                <p className="mt-3 text-[14px] font-semibold">ORBYVEN Dashboard · 1 utilizator</p>
                <p className="mt-3 max-w-md text-[11px] leading-5 text-[var(--muted)]">Valabil la prima achiziție eligibilă de web design. Nu pornește automat un abonament plătit.</p>
              </div>

              <div className="mt-9">
                <Link href="/cerere?service=web-design&dashboard_trial=30&trial_users=1&first_purchase=1&source=start" className="flex h-14 w-full items-center justify-between rounded-[18px] bg-[var(--button)] px-5 text-[14px] font-semibold text-[var(--button-text)]">
                  <span>Cere propunerea de web design</span>
                  <span>→</span>
                </Link>
                <Link href="/servicii" className="mt-3 flex h-13 w-full items-center justify-center rounded-[18px] border border-[var(--border-strong)] text-[12px] font-semibold">
                  Vezi serviciile
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {entryProduct === "website_dashboard" ? (
        <section id="start-flow" className="relative z-10 px-5 pb-24 sm:px-6 md:px-10 md:pb-32">
          <div className="relative mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[1.08fr_.92fr]">
            <section className="rounded-[32px] border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_82%,transparent)] p-6 shadow-[0_28px_90px_rgba(0,0,0,.13)] backdrop-blur-2xl sm:p-8 lg:p-10">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--muted-2)]">01 · ALEGE PLANUL</p>
                  <h2 className="mt-3 text-[clamp(34px,3.4vw,52px)] font-semibold leading-[.95] tracking-[-.06em]">
                    Site + workspace,
                    <br />
                    într-un singur sistem.
                  </h2>
                </div>
                <div className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-[10px] font-semibold text-[var(--muted)]">
                  Lunar · poți schimba ulterior
                </div>
              </div>

              <div className="mt-9 space-y-3">
                {(["start", "business", "pro"] as BillingPlanId[]).map((id) => {
                  const plan = BILLING_PLANS[id];
                  const meta = PLAN_META[id];
                  const active = planId === id;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setPlanId(id);
                        setAccepted(false);
                        setError("");
                      }}
                      className={
                        active
                          ? "group relative flex w-full items-center gap-5 rounded-[24px] border border-[rgba(165,139,255,.58)] bg-[linear-gradient(120deg,rgba(126,93,255,.16),rgba(126,93,255,.055))] p-5 text-left shadow-[0_20px_60px_rgba(75,70,238,.12)] transition sm:p-6"
                          : "group relative flex w-full items-center gap-5 rounded-[24px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-2)_72%,transparent)] p-5 text-left transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] sm:p-6"
                      }
                    >
                      <span className={active ? "grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[rgba(165,139,255,.65)] bg-[var(--home-violet)] text-[#0b0912]" : "grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--border-strong)] bg-transparent text-transparent"}>
                        <span className="text-[10px] font-black">✓</span>
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <p className="text-[15px] font-semibold sm:text-[17px]">{plan.name}</p>
                          {meta.badge ? <span className="rounded-full bg-[var(--button)] px-2.5 py-1 text-[8px] font-bold text-[var(--button-text)]">{meta.badge}</span> : null}
                        </div>
                        <p className="mt-1.5 text-[12px] leading-5 text-[var(--muted)] sm:text-[13px]">{meta.note}</p>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="flex items-baseline justify-end gap-1.5">
                          <span className="text-[34px] font-semibold leading-none tracking-[-.065em] sm:text-[40px]">{plan.priceLei}</span>
                          <span className="text-[10px] text-[var(--muted)]">lei</span>
                        </div>
                        <p className="mt-1 text-[9px] text-[var(--muted-2)]">pe lună</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-7 rounded-[24px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-2)_58%,transparent)] p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[.17em] text-[var(--home-violet)]">{PLAN_META[planId].eyebrow}</p>
                    <p className="mt-2 text-[22px] font-semibold tracking-[-.04em]">{selectedPlan.name} · {selectedPlan.entitlements.length} module incluse</p>
                  </div>
                  <div className="shrink-0 sm:text-right">
                    <p className="text-[10px] text-[var(--muted)]">Total lunar</p>
                    <p className="mt-1 text-[38px] font-semibold leading-none tracking-[-.065em]">{selectedPlan.priceLei} lei</p>
                  </div>
                </div>
              </div>
            </section>

            <aside className="rounded-[32px] border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_86%,transparent)] p-6 shadow-[0_28px_90px_rgba(0,0,0,.15)] backdrop-blur-2xl sm:p-8 lg:p-10">
              <div className="flex min-h-[620px] flex-col">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--muted-2)]">02 · CONT & CHECKOUT</p>
                    <h3 className="mt-3 text-[34px] font-semibold leading-[.96] tracking-[-.055em] sm:text-[42px]">Continuă fără să pierzi selecția.</h3>
                  </div>
                </div>

                <div className="mt-7 rounded-[22px] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                  <div className="flex items-center justify-between gap-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[var(--muted-2)]">Rezumat</p>
                      <p className="mt-2 text-[16px] font-semibold">{selectedPlan.name}</p>
                    </div>
                    <p className="text-[28px] font-semibold tracking-[-.055em]">{selectedPlan.priceLei} lei</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4 text-[10px] text-[var(--muted)]">
                    <span>Facturare lunară</span>
                    <span>{PUBLIC_PRICE_TAX_LABEL}</span>
                  </div>
                </div>

                <div className="mt-6 flex-1">
                  {accountState === "checking" ? (
                    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-2)] p-5 text-[13px] text-[var(--muted)]">Verificăm starea contului…</div>
                  ) : null}

                  {accountState === "guest" ? (
                    <div>
                      <Link href={registerHref} className="group flex h-14 w-full items-center justify-between rounded-[18px] bg-[var(--button)] px-5 text-[14px] font-semibold text-[var(--button-text)]">
                        <span>Creează cont și continuă</span>
                        <span>→</span>
                      </Link>
                      <Link href={loginHref} className="mt-3 flex h-13 w-full items-center justify-center rounded-[18px] border border-[var(--border-strong)] text-[12px] font-semibold">
                        Am deja cont
                      </Link>
                    </div>
                  ) : null}

                  {accountState === "onboarding" ? (
                    <div>
                      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                        <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[var(--muted-2)]">Cont creat</p>
                        <p className="mt-2 text-[13px] text-[var(--muted)]">Mai avem nevoie doar de numele companiei.</p>
                      </div>
                      <Link href={onboardingHref} className="mt-3 flex h-14 w-full items-center justify-between rounded-[18px] bg-[var(--button)] px-5 text-[14px] font-semibold text-[var(--button-text)]">
                        <span>Finalizează contul</span><span>→</span>
                      </Link>
                    </div>
                  ) : null}

                  {accountState === "restricted" ? (
                    <div>
                      <div className="rounded-[20px] border border-amber-500/20 bg-amber-500/10 p-5 text-[12px] leading-6 text-amber-500">Contul necesită verificare înainte de o plată nouă.</div>
                      <Link href="/workspace/access" className="mt-3 flex h-13 w-full items-center justify-center rounded-[18px] border border-[var(--border-strong)] text-[12px] font-semibold">Verifică accesul</Link>
                    </div>
                  ) : null}

                  {accountState === "ready" ? (
                    <div>
                      <div className="flex items-center justify-between rounded-[20px] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--muted-2)]">Cont conectat</p>
                          <p className="mt-2 truncate text-[14px] font-semibold">{workspace?.organization.name}</p>
                          <p className="mt-1 truncate text-[11px] text-[var(--muted)]">{workspace?.user.email}</p>
                        </div>
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500/10 text-[11px] font-bold text-emerald-500">✓</span>
                      </div>

                      <label className="mt-4 flex items-start gap-3 rounded-[18px] border border-[var(--border)] p-4 text-[12px] leading-6 text-[var(--muted)]">
                        <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-[#4b46ee]" />
                        <span>
                          Accept <Link href="/legal/terms" className="font-semibold text-[var(--text)] underline underline-offset-3">Termenii</Link> și <Link href="/legal/subscriptions" className="font-semibold text-[var(--text)] underline underline-offset-3">Termenii de abonament</Link>.
                        </span>
                      </label>

                      <button
                        type="button"
                        disabled={!accepted || paying}
                        onClick={startCheckout}
                        className="mt-4 flex h-14 w-full items-center justify-between rounded-[18px] bg-[var(--button)] px-5 text-[14px] font-semibold text-[var(--button-text)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span>{paying ? "Se deschide checkout-ul…" : "Continuă la plată · " + selectedPlan.priceLei + " lei"}</span>
                        <span>→</span>
                      </button>
                    </div>
                  ) : null}

                  {error ? <p className="mt-4 rounded-[16px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-[12px] leading-6 text-red-500">{error}</p> : null}
                </div>

                <div className="mt-7 border-t border-[var(--border)] pt-5">
                  <StripeCheckoutNote />
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] text-[var(--muted-2)]">
                    <span>SSL securizat</span>
                    <span>•</span>
                    <span>Datele cardului nu ajung la ORBYVEN</span>
                  </div>
                </div>
              </div>
            </aside>

            <div className="lg:col-span-2 flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_60%,transparent)] px-5 py-4 text-[11px] text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
              <span>Ai nevoie de o configurație diferită?</span>
              <Link href="/cerere?payment=custom_quote&source=start" className="font-semibold text-[var(--text)]">Cere o ofertă personalizată →</Link>
            </div>
          </div>
        </section>
      ) : null}

      <SiteFooter theme={theme} activePage="contact" />
    </main>
  );
}


export default function ContactPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f8f8fb]" />}>
      <ContactPageContent />
    </Suspense>
  );
}
