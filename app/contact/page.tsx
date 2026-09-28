"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

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

function PaymentBadges() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex h-9 items-center gap-2 rounded-[11px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[11px] font-semibold">
        <span className="text-[16px] leading-none"></span> Pay
      </span>
      <span className="inline-flex h-9 items-center gap-2 rounded-[11px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[11px] font-semibold">
        <span className="font-black tracking-[-.08em]"><span className="text-[#4285f4]">G</span></span> Pay
      </span>
      <span className="inline-flex h-9 items-center rounded-[11px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[11px] font-black italic tracking-[-.04em] text-[#1a1f71]">VISA</span>
      <span className="inline-flex h-9 items-center gap-1.5 rounded-[11px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[10px] font-semibold">
        <span className="relative inline-flex w-7 items-center">
          <span className="h-4 w-4 rounded-full bg-[#eb001b]" />
          <span className="-ml-1.5 h-4 w-4 rounded-full bg-[#f79e1b] opacity-90" />
        </span>
        Mastercard
      </span>
    </div>
  );
}

export default function ContactPage() {
  const searchParams = useSearchParams();
  const queryPlan = searchParams.get("plan");
  const initialPlan: BillingPlanId = isBillingPlanId(queryPlan) ? queryPlan : "business";

  const [theme, setTheme] = useState<Theme>("light");
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

  const checkoutQuery = `?plan=${planId}&checkout=1`;
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
      style={{ ...vars, fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif" }}
      className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)] antialiased"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_10%,rgba(110,79,255,.14),transparent_20%),radial-gradient(circle_at_12%_54%,rgba(74,107,201,.07),transparent_22%),radial-gradient(circle_at_83%_78%,rgba(156,77,221,.07),transparent_22%)]" />
        <div className="absolute inset-0 opacity-45" style={{
          backgroundImage: "linear-gradient(var(--grid-line) 1px,transparent 1px),linear-gradient(90deg,var(--grid-line) 1px,transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "linear-gradient(to bottom,transparent,black 14%,black 88%,transparent)",
        }} />
      </div>

      <SiteHeader theme={theme} compact={false} activePage="contact" onToggleTheme={toggleTheme} />

      <section className="relative z-10 px-5 pb-10 pt-28 sm:px-6 md:px-10 md:pb-14 md:pt-36">
        <div className="mx-auto max-w-[1450px]">
          <p className="orbyven-home-kicker">
            <span aria-hidden="true" className="orbyven-home-kicker-icon">✦</span>
            <span>ORBYVEN · FAST START</span>
            <span aria-hidden="true" className="orbyven-home-kicker-line" />
          </p>
          <h1 className="mt-6 max-w-5xl text-[clamp(52px,8vw,112px)] font-semibold leading-[.86] tracking-[-.07em]">
            Alegi. Creezi cont.
            <br />
            <span className="text-[var(--home-violet)]">Plătești.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[13px] leading-6 text-[var(--muted)] sm:text-[14px]">
            Fără brief lung aici. După activare, ORBYVEN AI te întreabă exact ce are nevoie pentru design și configurare.
          </p>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-20 sm:px-6 md:px-10 md:pb-28">
        <div className="mx-auto grid max-w-[1450px] gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface)]/90 p-5 shadow-[0_30px_100px_rgba(0,0,0,.08)] backdrop-blur-xl sm:p-7">
            <div className="grid grid-cols-3 gap-2">
              {(["start", "business", "pro"] as BillingPlanId[]).map((id) => {
                const plan = BILLING_PLANS[id];
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
                    className={`rounded-[20px] border p-4 text-left transition ${active ? "border-[rgba(165,139,255,.55)] bg-[var(--accent-soft)] shadow-[0_16px_50px_rgba(75,70,238,.09)]" : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]"}`}
                  >
                    <p className="text-[8px] font-bold uppercase tracking-[.16em] text-[var(--muted-2)]">{plan.name}</p>
                    <div className="mt-3 flex flex-wrap items-baseline gap-1">
                      <span className="text-[30px] font-semibold leading-none tracking-[-.06em]">{plan.priceLei}</span>
                      <span className="text-[9px] text-[var(--muted)]">lei/lună</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-[26px] border border-[var(--border)] bg-[var(--bg)] p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[.17em] text-[var(--muted-2)]">Plan selectat</p>
                  <h2 className="mt-2 text-[34px] font-semibold tracking-[-.055em]">{selectedPlan.name}</h2>
                  <p className="mt-2 max-w-md text-[11px] leading-5 text-[var(--muted)]">{selectedPlan.description}</p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-[44px] font-semibold leading-none tracking-[-.07em]">{selectedPlan.priceLei}</p>
                  <p className="mt-1 text-[9px] text-[var(--muted)]">lei / lună · {PUBLIC_PRICE_TAX_LABEL}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2">
                {[
                  ["01", "Plan"],
                  ["02", "Cont"],
                  ["03", "Plată"],
                ].map(([number, label], index) => (
                  <div key={label} className={`rounded-[15px] border px-3 py-3 ${index === 0 || accountState === "ready" ? "border-[rgba(165,139,255,.30)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--surface)]"}`}>
                    <p className="text-[7px] font-bold tracking-[.14em] text-[var(--muted-2)]">{number}</p>
                    <p className="mt-1 text-[10px] font-semibold">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-[26px] border border-[var(--border)] bg-[var(--surface-2)] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[.17em] text-[var(--muted-2)]">Plată securizată</p>
                  <p className="mt-2 text-[12px] font-semibold">Stripe Checkout</p>
                </div>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[8px] font-bold uppercase tracking-[.12em] text-emerald-500">SECURE</span>
              </div>
              <div className="mt-4">
                <PaymentBadges />
              </div>
              <p className="mt-4 max-w-xl text-[9px] leading-4 text-[var(--muted-2)]">
                Cardul este procesat în checkout-ul securizat Stripe. Apple Pay și Google Pay apar automat când sunt compatibile cu dispozitivul, browserul și configurația comerciantului.
              </p>
            </div>
          </div>

          <aside className="rounded-[32px] border border-[var(--border)] bg-[var(--surface)]/90 p-5 shadow-[0_30px_100px_rgba(0,0,0,.08)] backdrop-blur-xl sm:p-7 lg:sticky lg:top-24 lg:self-start">
            <p className="text-[8px] font-bold uppercase tracking-[.17em] text-[var(--muted-2)]">CONT + CHECKOUT</p>
            <h2 className="mt-4 text-[36px] font-semibold leading-[.98] tracking-[-.055em]">Mai puține întrebări. Mai repede în ORBYVEN.</h2>

            {accountState === "checking" ? (
              <div className="mt-8 rounded-[20px] border border-[var(--border)] bg-[var(--surface-2)] p-5 text-[11px] text-[var(--muted)]">Verificăm contul…</div>
            ) : null}

            {accountState === "guest" ? (
              <div className="mt-8">
                <Link href={registerHref} className="flex h-13 w-full items-center justify-between rounded-full bg-[var(--button)] px-5 text-[12px] font-semibold text-[var(--button-text)]">
                  <span>Creează cont și continuă</span><span>→</span>
                </Link>
                <Link href={loginHref} className="mt-3 flex h-12 w-full items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg)] px-5 text-[11px] font-semibold">
                  Am deja cont
                </Link>
                <p className="mt-4 text-[9px] leading-4 text-[var(--muted-2)]">Planul ales rămâne salvat în flux. După confirmarea contului ajungi direct înapoi la checkout.</p>
              </div>
            ) : null}

            {accountState === "onboarding" ? (
              <div className="mt-8">
                <p className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-2)] p-4 text-[10px] leading-5 text-[var(--muted)]">Contul este gata. Mai avem nevoie doar de numele companiei pentru workspace.</p>
                <Link href={onboardingHref} className="mt-3 flex h-13 w-full items-center justify-between rounded-full bg-[var(--button)] px-5 text-[12px] font-semibold text-[var(--button-text)]">
                  <span>Finalizează contul</span><span>→</span>
                </Link>
              </div>
            ) : null}

            {accountState === "restricted" ? (
              <div className="mt-8">
                <p className="rounded-[18px] border border-amber-500/20 bg-amber-500/10 p-4 text-[10px] leading-5 text-amber-600">Contul necesită verificare înainte de o plată nouă.</p>
                <Link href="/workspace/access" className="mt-3 flex h-12 w-full items-center justify-center rounded-full border border-[var(--border-strong)] text-[11px] font-semibold">Verifică accesul</Link>
              </div>
            ) : null}

            {accountState === "ready" ? (
              <div className="mt-8">
                <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <p className="text-[8px] font-bold uppercase tracking-[.14em] text-[var(--muted-2)]">Cont conectat</p>
                  <p className="mt-2 text-[12px] font-semibold">{workspace?.organization.name}</p>
                  <p className="mt-1 text-[9px] text-[var(--muted)]">{workspace?.user.email}</p>
                </div>

                <label className="mt-4 flex items-start gap-3 rounded-[18px] border border-[var(--border)] p-4 text-[10px] leading-5 text-[var(--muted)]">
                  <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-[#4b46ee]" />
                  <span>
                    Accept <Link href="/legal/terms" className="font-semibold text-[var(--text)] underline underline-offset-3">Termenii</Link> și <Link href="/legal/subscriptions" className="font-semibold text-[var(--text)] underline underline-offset-3">Termenii de abonament</Link>.
                  </span>
                </label>

                <button
                  type="button"
                  disabled={!accepted || paying}
                  onClick={startCheckout}
                  className="mt-4 flex h-14 w-full items-center justify-between rounded-full bg-[var(--button)] px-5 text-[12px] font-semibold text-[var(--button-text)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>{paying ? "Se deschide checkout-ul…" : `Plătește ${selectedPlan.priceLei} lei / lună`}</span>
                  <span>→</span>
                </button>
              </div>
            ) : null}

            {error ? <p className="mt-4 rounded-[16px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-[10px] leading-5 text-red-500">{error}</p> : null}

            <div className="mt-6 border-t border-[var(--border)] pt-5">
              <p className="text-[9px] leading-4 text-[var(--muted-2)]">Ai nevoie de ofertă custom, nu abonament?</p>
              <Link href="/cerere?payment=custom_quote&source=contact" className="mt-2 inline-flex text-[10px] font-semibold">Trimite o cerere →</Link>
              <a href="mailto:contact@orbyven.ro" className="ml-4 inline-flex text-[10px] font-semibold text-[var(--muted)]">Email →</a>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter theme={theme} activePage="contact" />
    </main>
  );
}
