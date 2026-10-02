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

      <section className="relative z-10 px-5 pb-16 pt-28 sm:px-6 md:px-10 md:pb-20 md:pt-36">
        <div className="mx-auto max-w-[1320px]">
          <p className="orbyven-home-kicker">
            <span aria-hidden="true" className="orbyven-home-kicker-icon">✦</span>
            <span>ORBYVEN · FAST CHECKOUT</span>
            <span aria-hidden="true" className="orbyven-home-kicker-line" />
          </p>

          <div className="mt-7 grid gap-7 lg:grid-cols-[1.08fr_.92fr] lg:items-end">
            <h1 className="max-w-[880px] text-[clamp(48px,6.7vw,96px)] font-semibold leading-[.89] tracking-[-.072em]">
              Pornești în
              <br />
              <span className="text-[var(--home-violet)]">câteva minute.</span>
            </h1>
            <div className="lg:pb-2">
              <p className="max-w-md text-[13px] leading-6 text-[var(--muted)] sm:text-[14px]">
                Alegi abonamentul, creezi contul și finalizezi plata securizat. Detaliile de design le preia ORBYVEN AI după activare.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[9px] font-semibold text-[var(--muted-2)]">
                <span>01 · PLAN</span>
                <span>02 · CONT</span>
                <span>03 · PLATĂ</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-6 px-5 pb-20 sm:px-6 md:-mt-8 md:px-10 md:pb-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-24 h-56 opacity-80"
          style={{
            background: "linear-gradient(180deg, transparent 0%, rgba(121,91,255,.055) 48%, transparent 100%)",
            filter: "blur(28px)",
          }}
        />
        <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[34px] border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_94%,transparent)] shadow-[0_48px_140px_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.045)] backdrop-blur-2xl">
          <div className="flex flex-col gap-5 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-2)_42%,transparent)] px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[14px] shadow-[0_8px_24px_rgba(0,0,0,.08)]">⌁</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[var(--muted-2)]">Checkout securizat ORBYVEN</p>
                <p className="mt-1.5 text-[13px] font-medium text-[var(--muted)]">Planul ales rămâne salvat până la finalul fluxului.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[
                ["01", "Plan", true],
                ["02", "Cont", accountState === "ready" || accountState === "onboarding"],
                ["03", "Plată", accountState === "ready"],
              ].map(([number, label, active]) => (
                <div key={String(label)} className={`flex items-center gap-2 rounded-full px-3.5 py-2.5 text-[10px] font-semibold ${active ? "bg-[var(--accent-soft)] text-[var(--text)]" : "bg-[var(--surface-2)] text-[var(--muted-2)]"}`}>
                  <span>{number}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.08fr_.92fr]">
            <div className="p-6 sm:p-8 lg:border-r lg:border-[var(--border)] lg:p-9">
              <div className="grid grid-cols-3 gap-2.5">
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
                      className={`relative min-h-[148px] rounded-[22px] border p-5 text-left transition duration-300 sm:min-h-[158px] sm:p-6 ${active ? "border-[rgba(165,139,255,.52)] bg-[var(--accent-soft)] shadow-[0_18px_55px_rgba(75,70,238,.10)]" : "border-[var(--border)] bg-[var(--surface-2)] hover:-translate-y-0.5 hover:border-[var(--border-strong)]"}`}
                    >
                      {meta.badge ? (
                        <span className="absolute right-4 top-4 rounded-full bg-[var(--button)] px-3 py-1.5 text-[9px] font-bold text-[var(--button-text)] shadow-[0_8px_24px_rgba(0,0,0,.12)]">{meta.badge}</span>
                      ) : null}
                      <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--muted-2)]">{meta.eyebrow}</p>
                      <p className="mt-7 text-[15px] font-semibold">{plan.name}</p>
                      <div className="mt-2.5 flex items-baseline gap-1.5">
                        <span className="text-[36px] font-semibold leading-none tracking-[-.065em] sm:text-[40px]">{plan.priceLei}</span>
                        <span className="text-[10px] text-[var(--muted)]">lei/lună</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-7 flex flex-col gap-8 rounded-[26px] border border-[var(--border)] bg-[var(--surface-2)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,.035)] sm:flex-row sm:items-end sm:justify-between sm:p-7">
                <div className="max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[.16em] text-[#9b83ff]">{PLAN_META[planId].eyebrow}</span>
                    <span className="h-1 w-1 rounded-full bg-[var(--border-strong)]" />
                    <span className="text-[10px] font-semibold text-[var(--muted-2)]">{selectedPlan.entitlements.length} module incluse</span>
                  </div>
                  <h2 className="mt-3 text-[40px] font-semibold leading-none tracking-[-.06em] sm:text-[48px]">{selectedPlan.name}</h2>
                  <p className="mt-3 max-w-md text-[13px] leading-6 text-[var(--muted)]">{PLAN_META[planId].note}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {["Abonament lunar", "Stripe Checkout", "Acces ORBYVEN"].map((item) => (
                      <span key={item} className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-[10px] font-semibold text-[var(--muted)]">{item}</span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 sm:text-right">
                  <p className="text-[60px] font-semibold leading-none tracking-[-.075em]">{selectedPlan.priceLei}</p>
                  <p className="mt-2 text-[10px] text-[var(--muted-2)]">lei / lună · {PUBLIC_PRICE_TAX_LABEL}</p>
                </div>
              </div>
            </div>

            <aside className="p-6 sm:p-8 lg:p-9">
              <div className="flex h-full min-h-[500px] flex-col">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--muted-2)]">CONTINUĂ ÎN ORBYVEN</p>
                  <h2 className="mt-4 max-w-md text-[clamp(38px,4vw,56px)] font-semibold leading-[.96] tracking-[-.06em]">
                    Un singur pas până la <span className="text-[var(--home-violet)]">checkout.</span>
                  </h2>
                  <p className="mt-4 max-w-md text-[13px] leading-6 text-[var(--muted)]">
                    Creezi contul sau te autentifici. După aceea ajungi direct la plata securizată.
                  </p>

                  <div className="mt-6 flex items-center justify-between gap-5 rounded-[20px] border border-[var(--border)] bg-[var(--surface-2)] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,.035)]">
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[var(--muted-2)]">Rezumat comandă</p>
                      <p className="mt-1.5 truncate text-[13px] font-semibold">{selectedPlan.name} · abonament lunar</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[22px] font-semibold tracking-[-.045em]">{selectedPlan.priceLei} lei</p>
                      <p className="mt-1 text-[9px] text-[var(--muted-2)]">{PUBLIC_PRICE_TAX_LABEL}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-7 flex-1">
                  {accountState === "checking" ? (
                    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-2)] p-5 text-[13px] text-[var(--muted)]">Verificăm contul…</div>
                  ) : null}

                  {accountState === "guest" ? (
                    <div>
                      <Link href={registerHref} className="group flex h-14 w-full items-center justify-between rounded-full bg-[var(--button)] px-5 text-[14px] font-semibold text-[var(--button-text)] shadow-[0_12px_34px_rgba(0,0,0,.14)] transition hover:-translate-y-0.5 hover:opacity-95">
                        <span>Creează cont și continuă</span>
                        <span className="transition group-hover:translate-x-1">→</span>
                      </Link>
                      <Link href={loginHref} className="mt-3 flex h-13 w-full items-center justify-center rounded-full border border-[var(--border-strong)] bg-transparent px-5 text-[13px] font-semibold transition hover:bg-[var(--surface-2)]">
                        Am deja cont
                      </Link>
                      <div className="mt-5 flex items-start gap-3 rounded-[18px] bg-[var(--surface-2)] p-4">
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[9px] text-[#8f79ed]">✓</span>
                        <p className="text-[11px] leading-5 text-[var(--muted)]">Planul rămâne păstrat în timpul creării contului. Nu te întorci la început.</p>
                      </div>
                    </div>
                  ) : null}

                  {accountState === "onboarding" ? (
                    <div>
                      <div className="rounded-[20px] bg-[var(--surface-2)] p-5">
                        <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--muted-2)]">Cont creat</p>
                        <p className="mt-2 text-[13px] leading-6 text-[var(--muted)]">Mai avem nevoie doar de numele companiei pentru workspace.</p>
                      </div>
                      <Link href={onboardingHref} className="mt-3 flex h-14 w-full items-center justify-between rounded-full bg-[var(--button)] px-5 text-[14px] font-semibold text-[var(--button-text)] shadow-[0_12px_34px_rgba(0,0,0,.14)]">
                        <span>Finalizează contul</span><span>→</span>
                      </Link>
                    </div>
                  ) : null}

                  {accountState === "restricted" ? (
                    <div>
                      <div className="rounded-[20px] border border-amber-500/20 bg-amber-500/10 p-5 text-[12px] leading-6 text-amber-600">Contul necesită verificare înainte de o plată nouă.</div>
                      <Link href="/workspace/access" className="mt-3 flex h-13 w-full items-center justify-center rounded-full border border-[var(--border-strong)] text-[13px] font-semibold">Verifică accesul</Link>
                    </div>
                  ) : null}

                  {accountState === "ready" ? (
                    <div>
                      <div className="flex items-center justify-between rounded-[20px] bg-[var(--surface-2)] p-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--muted-2)]">Cont conectat</p>
                          <p className="mt-2 truncate text-[14px] font-semibold">{workspace?.organization.name}</p>
                          <p className="mt-1 truncate text-[11px] text-[var(--muted)]">{workspace?.user.email}</p>
                        </div>
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500/10 text-[11px] font-bold text-emerald-500">✓</span>
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
                        className="mt-4 flex h-14 w-full items-center justify-between rounded-full bg-[var(--button)] px-5 text-[14px] font-semibold text-[var(--button-text)] shadow-[0_12px_34px_rgba(0,0,0,.14)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                      >
                        <span>{paying ? "Se deschide checkout-ul…" : `Continuă la plată · ${selectedPlan.priceLei} lei`}</span>
                        <span>→</span>
                      </button>
                    </div>
                  ) : null}

                  {error ? <p className="mt-4 rounded-[16px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-[12px] leading-6 text-red-500">{error}</p> : null}
                </div>

                <div className="mt-7 border-t border-[var(--border)] pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[var(--muted-2)]">Plată securizată</p>
                      <p className="mt-1 text-[12px] font-semibold">Procesată prin Stripe</p>
                    </div>
                    <PaymentBadges />
                  </div>
                  <p className="mt-3 text-[10px] leading-5 text-[var(--muted-2)]">Apple Pay și Google Pay apar în Stripe Checkout când sunt disponibile pentru dispozitiv, browser și configurația comerciantului.</p>
                </div>
              </div>
            </aside>
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-2)_34%,transparent)] px-6 py-5 text-[11px] text-[var(--muted-2)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span>Ai nevoie de ofertă custom în loc de abonament?</span>
            <div className="flex items-center gap-4">
              <Link href="/cerere?payment=custom_quote&source=contact" className="font-semibold text-[var(--text)]">Trimite o cerere →</Link>
              <a href="mailto:contact@orbyven.ro" className="font-semibold text-[var(--muted)]">Email →</a>
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
