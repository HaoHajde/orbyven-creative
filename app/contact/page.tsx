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

function PaymentBadges() {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="inline-flex h-9 items-center gap-1.5 rounded-[11px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[11px] font-semibold text-[var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
        <span className="text-[17px] leading-none"></span> Pay
      </span>
      <span className="inline-flex h-9 items-center gap-1.5 rounded-[11px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[11px] font-semibold text-[var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
        <span className="font-black tracking-[-.08em] text-[#4285f4]">G</span> Pay
      </span>
      <span className="inline-flex h-9 items-center rounded-[11px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[11px] font-black italic tracking-[-.04em] text-[var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">VISA</span>
      <span className="inline-flex h-9 items-center gap-2 rounded-[11px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[10px] font-semibold text-[var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
        <span className="relative inline-flex w-6 items-center">
          <span className="h-3.5 w-3.5 rounded-full bg-[#eb001b]" />
          <span className="-ml-1.5 h-3.5 w-3.5 rounded-full bg-[#f79e1b] opacity-90" />
        </span>
        Mastercard
      </span>
    </div>
  );
}

function ContactPageContent() {
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
      style={{
        ...vars,
        fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif",
        background:
          theme === "dark"
            ? "radial-gradient(1100px 720px at 24% -8%, rgba(117,81,255,.20), transparent 72%), radial-gradient(900px 620px at 88% 30%, rgba(78,61,164,.14), transparent 72%), radial-gradient(760px 560px at 12% 72%, rgba(49,91,156,.07), transparent 74%), linear-gradient(180deg,#0c0916 0%,#0a0911 38%,#09090d 100%)"
            : "radial-gradient(1100px 720px at 24% -8%, rgba(117,81,255,.12), transparent 72%), radial-gradient(900px 620px at 88% 30%, rgba(78,61,164,.07), transparent 72%), linear-gradient(180deg,#fbfaff 0%,#f8f8fb 45%,#f6f6fa 100%)",
      }}
      className="relative min-h-screen overflow-x-hidden text-[var(--text)] antialiased"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-[78rem] opacity-[.42]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.024) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.024) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "linear-gradient(to bottom, black 0%, rgba(0,0,0,.72) 48%, transparent 100%)",
          }}
        />
        <div className="absolute left-[8%] top-[-18rem] h-[50rem] w-[50rem] rounded-full bg-[rgba(126,93,255,.13)] blur-[145px]" />
        <div className="absolute right-[-14rem] top-[18rem] h-[46rem] w-[46rem] rounded-full bg-[rgba(91,70,185,.11)] blur-[150px]" />
        <div className="absolute left-[18%] top-[42rem] h-[30rem] w-[60rem] rounded-full bg-[rgba(66,95,155,.055)] blur-[150px]" />
      </div>

      <SiteHeader theme={theme} compact={false} activePage="contact" onToggleTheme={toggleTheme} />

      <section className="relative z-10 px-5 pb-10 pt-28 sm:px-6 md:px-10 md:pb-14 md:pt-36">
        <div className="mx-auto max-w-[1540px]">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <p className="orbyven-home-kicker">
                <span aria-hidden="true" className="orbyven-home-kicker-icon">✦</span>
                <span>ORBYVEN · FAST CHECKOUT</span>
                <span aria-hidden="true" className="orbyven-home-kicker-line" />
              </p>

              <h1 className="mt-8 max-w-[960px] text-[clamp(58px,6.9vw,112px)] font-semibold leading-[.86] tracking-[-.075em]">
                Simplu de ales.
                <br />
                <span className="text-[var(--home-violet)]">Rapid de pornit.</span>
              </h1>
            </div>

            <div className="max-w-[520px] lg:justify-self-end lg:pb-3">
              <p className="text-[15px] leading-7 text-[var(--muted)] sm:text-[16px]">
                Alegi planul, intri în cont și continui direct către checkout-ul securizat. Fără formulare lungi și fără pași inutili.
              </p>

              <div className="mt-7 flex items-center gap-3">
                {[
                  ["01", "Plan"],
                  ["02", "Cont"],
                  ["03", "Plată"],
                ].map(([number, label], index) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_62%,transparent)] px-3.5 py-2.5 text-[10px] font-semibold backdrop-blur-xl">
                      <span className="text-[var(--home-violet)]">{number}</span>
                      <span>{label}</span>
                    </div>
                    {index < 2 ? <span className="h-px w-4 bg-[var(--border-strong)]" /> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-24 sm:px-6 md:px-10 md:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-10rem] h-[34rem] w-[82vw] max-w-[1600px] -translate-x-1/2 rounded-[50%] opacity-70 blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(126,93,255,.13) 0%, rgba(126,93,255,.035) 44%, transparent 72%)" }}
        />

        <div className="relative mx-auto grid max-w-[1540px] gap-5 lg:grid-cols-[1.08fr_.92fr]">
          <section className="rounded-[34px] border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] p-6 shadow-[0_34px_100px_rgba(0,0,0,.16),inset_0_1px_0_rgba(255,255,255,.045)] backdrop-blur-2xl sm:p-8 lg:p-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--muted-2)]">01 · ALEGE PLANUL</p>
                <h2 className="mt-3 text-[clamp(34px,3.4vw,52px)] font-semibold leading-[.95] tracking-[-.06em]">
                  Planul potrivit,
                  <br />
                  fără comparații inutile.
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
                    className={`group relative flex w-full items-center gap-5 rounded-[24px] border p-5 text-left transition duration-300 sm:p-6 ${active ? "border-[rgba(165,139,255,.58)] bg-[linear-gradient(120deg,rgba(126,93,255,.16),rgba(126,93,255,.055))] shadow-[0_20px_60px_rgba(75,70,238,.12),inset_0_1px_0_rgba(255,255,255,.05)]" : "border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-2)_72%,transparent)] hover:-translate-y-0.5 hover:border-[var(--border-strong)]"}`}
                  >
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition ${active ? "border-[rgba(165,139,255,.65)] bg-[var(--home-violet)] text-[#0b0912]" : "border-[var(--border-strong)] bg-transparent text-transparent"}`}>
                      <span className="text-[10px] font-black">✓</span>
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <p className="text-[15px] font-semibold sm:text-[17px]">{plan.name}</p>
                        {meta.badge ? (
                          <span className="rounded-full bg-[var(--button)] px-2.5 py-1 text-[8px] font-bold text-[var(--button-text)]">
                            {meta.badge}
                          </span>
                        ) : null}
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

            <div className="mt-7 rounded-[26px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-2)_58%,transparent)] p-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[.17em] text-[var(--home-violet)]">
                    {PLAN_META[planId].eyebrow}
                  </p>
                  <p className="mt-2 text-[22px] font-semibold tracking-[-.04em] sm:text-[26px]">
                    {selectedPlan.name} include {selectedPlan.entitlements.length} module
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Website", "ORBYVEN Workspace", "AI asistat", "Checkout Stripe"].map((item) => (
                      <span key={item} className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-[10px] font-semibold text-[var(--muted)]">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 sm:text-right">
                  <p className="text-[11px] font-semibold text-[var(--muted)]">Total lunar</p>
                  <p className="mt-1 text-[44px] font-semibold leading-none tracking-[-.07em]">{selectedPlan.priceLei} lei</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="relative overflow-hidden rounded-[34px] border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_95%,transparent)] p-6 shadow-[0_34px_100px_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.055)] backdrop-blur-2xl sm:p-8 lg:p-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[rgba(126,93,255,.12)] blur-[100px]"
            />

            <div className="relative flex min-h-[650px] flex-col">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] text-[14px]">✦</span>
                    <div>
                      <p className="text-[12px] font-semibold">ORBYVEN Checkout</p>
                      <p className="mt-0.5 text-[9px] text-[var(--muted-2)]">Plată securizată</p>
                    </div>
                  </div>
                </div>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[9px] font-semibold text-[var(--muted)]">02 · CONT</span>
              </div>

              <div className="mt-10">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--muted-2)]">Rezumat comandă</p>

                <div className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface-2)] p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-[18px] font-semibold">{selectedPlan.name}</p>
                      <p className="mt-1.5 text-[11px] leading-5 text-[var(--muted)]">Abonament ORBYVEN · facturare lunară</p>
                    </div>
                    <p className="text-[26px] font-semibold tracking-[-.055em]">{selectedPlan.priceLei} lei</p>
                  </div>

                  <div className="my-5 h-px bg-[var(--border)]" />

                  <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                    <span>Subtotal</span>
                    <span>{selectedPlan.priceLei} lei</span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-[var(--muted)]">
                    <span>Taxe</span>
                    <span>{PUBLIC_PRICE_TAX_LABEL}</span>
                  </div>

                  <div className="mt-5 flex items-end justify-between">
                    <span className="text-[12px] font-semibold">Total astăzi</span>
                    <div className="text-right">
                      <span className="text-[38px] font-semibold leading-none tracking-[-.07em]">{selectedPlan.priceLei}</span>
                      <span className="ml-1.5 text-[11px] text-[var(--muted)]">lei</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex-1">
                {accountState === "checking" ? (
                  <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-2)] p-5 text-[13px] text-[var(--muted)]">
                    Verificăm starea contului…
                  </div>
                ) : null}

                {accountState === "guest" ? (
                  <div>
                    <Link
                      href={registerHref}
                      className="group flex h-15 w-full items-center justify-between rounded-[18px] bg-[var(--button)] px-5 text-[14px] font-semibold text-[var(--button-text)] shadow-[0_18px_42px_rgba(0,0,0,.18)] transition hover:-translate-y-0.5 hover:opacity-95"
                    >
                      <span>Creează cont și continuă</span>
                      <span className="text-[18px] transition group-hover:translate-x-1">→</span>
                    </Link>
                    <Link
                      href={loginHref}
                      className="mt-3 flex h-14 w-full items-center justify-center rounded-[18px] border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface-2)_45%,transparent)] px-5 text-[13px] font-semibold transition hover:bg-[var(--surface-2)]"
                    >
                      Am deja cont
                    </Link>

                    <div className="mt-5 flex items-start gap-3 rounded-[18px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-2)_55%,transparent)] p-4">
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[10px] font-bold text-[var(--home-violet)]">✓</span>
                      <div>
                        <p className="text-[11px] font-semibold">Selecția ta rămâne salvată</p>
                        <p className="mt-1 text-[10px] leading-5 text-[var(--muted)]">După autentificare revii direct aici, cu planul păstrat.</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {accountState === "onboarding" ? (
                  <div>
                    <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                      <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[var(--muted-2)]">Cont creat</p>
                      <p className="mt-2 text-[14px] font-semibold">Finalizează workspace-ul</p>
                      <p className="mt-2 text-[12px] leading-6 text-[var(--muted)]">Mai avem nevoie doar de numele companiei.</p>
                    </div>
                    <Link href={onboardingHref} className="mt-3 flex h-15 w-full items-center justify-between rounded-[18px] bg-[var(--button)] px-5 text-[14px] font-semibold text-[var(--button-text)]">
                      <span>Finalizează contul</span><span>→</span>
                    </Link>
                  </div>
                ) : null}

                {accountState === "restricted" ? (
                  <div>
                    <div className="rounded-[22px] border border-amber-500/20 bg-amber-500/10 p-5 text-[12px] leading-6 text-amber-500">Contul necesită verificare înainte de o plată nouă.</div>
                    <Link href="/workspace/access" className="mt-3 flex h-14 w-full items-center justify-center rounded-[18px] border border-[var(--border-strong)] text-[13px] font-semibold">Verifică accesul</Link>
                  </div>
                ) : null}

                {accountState === "ready" ? (
                  <div>
                    <div className="flex items-center justify-between rounded-[22px] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--muted-2)]">Cont conectat</p>
                        <p className="mt-2 truncate text-[15px] font-semibold">{workspace?.organization.name}</p>
                        <p className="mt-1 truncate text-[11px] text-[var(--muted)]">{workspace?.user.email}</p>
                      </div>
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/10 text-[12px] font-bold text-emerald-500">✓</span>
                    </div>

                    <label className="mt-4 flex items-start gap-3 rounded-[18px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-2)_55%,transparent)] p-4 text-[12px] leading-6 text-[var(--muted)]">
                      <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-[#4b46ee]" />
                      <span>
                        Accept <Link href="/legal/terms" className="font-semibold text-[var(--text)] underline underline-offset-3">Termenii</Link> și <Link href="/legal/subscriptions" className="font-semibold text-[var(--text)] underline underline-offset-3">Termenii de abonament</Link>.
                      </span>
                    </label>

                    <button
                      type="button"
                      disabled={!accepted || paying}
                      onClick={startCheckout}
                      className="mt-4 flex h-15 w-full items-center justify-between rounded-[18px] bg-[var(--button)] px-5 text-[14px] font-semibold text-[var(--button-text)] shadow-[0_18px_42px_rgba(0,0,0,.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    >
                      <span>{paying ? "Se deschide checkout-ul…" : `Continuă la plată · ${selectedPlan.priceLei} lei`}</span>
                      <span>→</span>
                    </button>
                  </div>
                ) : null}

                {error ? <p className="mt-4 rounded-[16px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-[12px] leading-6 text-red-500">{error}</p> : null}
              </div>

              <div className="mt-8 border-t border-[var(--border)] pt-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[var(--muted-2)]">Plată securizată</p>
                    <p className="mt-1 text-[12px] font-semibold">Procesată prin Stripe</p>
                  </div>
                  <PaymentBadges />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-[var(--muted-2)]">
                  <span>SSL securizat</span>
                  <span>•</span>
                  <span>Datele cardului nu ajung la ORBYVEN</span>
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-2 flex flex-col gap-4 rounded-[26px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_60%,transparent)] px-5 py-4 text-[11px] text-[var(--muted)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>Ai nevoie de o ofertă personalizată în locul unui abonament?</span>
            <div className="flex items-center gap-5">
              <Link href="/cerere?payment=custom_quote&source=contact" className="font-semibold text-[var(--text)] transition hover:opacity-70">Trimite o cerere →</Link>
              <a href="mailto:contact@orbyven.ro" className="font-semibold text-[var(--muted)] transition hover:text-[var(--text)]">contact@orbyven.ro</a>
            </div>
          </div>
        </div>
      </section>

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
