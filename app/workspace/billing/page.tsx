"use client";

import BrandLogo from "@/components/BrandLogo";
import {
  BILLING_PLANS,
  LEGAL_DOCUMENT_VERSION,
  PUBLIC_PRICE_TAX_LABEL,
  type BillingPlanId,
} from "@/lib/billing/public-config";
import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { getCurrentWorkspace, type OrbyvenWorkspace } from "@/lib/orbyven-workspace";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type BillingSummary = {
  configured: boolean;
  message?: string;
  billingAccount?: { hasStripeCustomer: boolean; billingEmail: string | null } | null;
  subscription?: {
    plan_id: BillingPlanId;
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    commitment_ends_at: string | null;
    grace_until: string | null;
  } | null;
  entitlements?: { module_id: string; enabled: boolean; ends_at: string | null }[];
};

async function authHeaders() {
  const { data } = await orbyvenSupabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sesiunea a expirat.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export default function WorkspaceBillingPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<OrbyvenWorkspace | null>(null);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<BillingPlanId | "portal" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const currentWorkspace = await getCurrentWorkspace();
        if (!currentWorkspace) {
          router.replace("/workspace/login");
          return;
        }
        if (
          currentWorkspace.membership.role !== "owner" &&
          currentWorkspace.membership.role !== "admin"
        ) {
          if (!cancelled) {
            setError("Doar Owner sau Admin poate administra abonamentul organizației.");
            setWorkspace(currentWorkspace);
            setLoading(false);
          }
          return;
        }

        const headers = await authHeaders();
        const response = await fetch(
          `/api/billing/summary?organizationId=${encodeURIComponent(currentWorkspace.organization.id)}`,
          { headers, cache: "no-store" }
        );
        const data = (await response.json()) as BillingSummary;
        if (!cancelled) {
          setWorkspace(currentWorkspace);
          setSummary(data);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Billing indisponibil.");
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const startCheckout = async (planId: BillingPlanId) => {
    if (!workspace || !accepted) return;
    setAction(planId);
    setError("");
    try {
      const headers = await authHeaders();
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({
          organizationId: workspace.organization.id,
          planId,
          acceptedLegalVersion: LEGAL_DOCUMENT_VERSION,
        }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "Checkout indisponibil.");
      window.location.assign(data.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout indisponibil.");
      setAction(null);
    }
  };

  const openPortal = async () => {
    if (!workspace) return;
    setAction("portal");
    setError("");
    try {
      const headers = await authHeaders();
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers,
        body: JSON.stringify({ organizationId: workspace.organization.id }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "Portal indisponibil.");
      window.location.assign(data.url);
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : "Portal indisponibil.");
      setAction(null);
    }
  };

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-white text-sm text-[#6e6e73]">Se încarcă facturarea...</main>;
  }

  return (
    <main className="min-h-screen bg-white text-[#1d1d1f]">
      <header className="border-b border-black/[0.08]">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 md:px-10">
          <BrandLogo compact theme="light" />
          <Link href="/workspace" className="text-sm font-medium text-[#6e6e73]">Înapoi în workspace</Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-6 py-12 md:px-10 md:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#86868b]">ORBYVEN · Billing</p>
        <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-[46px] font-semibold leading-none tracking-[-0.055em] sm:text-[60px]">Abonament.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6e6e73]">
              {workspace?.organization.name || "Organizația ta"} · plan, plăți și drepturi comerciale într-un singur loc.
            </p>
          </div>
          {summary?.billingAccount?.hasStripeCustomer && (
            <button
              type="button"
              onClick={openPortal}
              disabled={action !== null}
              className="h-11 rounded-full border border-black/[0.12] px-5 text-sm font-medium disabled:opacity-50"
            >
              {action === "portal" ? "Se deschide..." : "Metodă de plată și facturi"}
            </button>
          )}
        </div>

        {!summary?.configured && (
          <div className="mt-8 rounded-[24px] border border-amber-500/20 bg-amber-500/[0.08] p-5 text-sm leading-6">
            Billing-ul este implementat, dar rămâne blocat până la completarea datelor juridice, configurarea Stripe și validarea fiscală. Nu pot porni plăți reale accidental.
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-[20px] border border-red-500/20 bg-red-500/[0.06] p-4 text-sm text-red-600">{error}</div>
        )}

        {summary?.subscription && (
          <section className="mt-8 rounded-[28px] bg-[#f5f5f7] p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#86868b]">Abonament curent</p>
                <p className="mt-2 text-2xl font-semibold">{summary.subscription.plan_id.toUpperCase()}</p>
              </div>
              <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold">{summary.subscription.status}</span>
            </div>
            {summary.subscription.commitment_ends_at && (
              <p className="mt-5 text-sm text-[#6e6e73]">
                Angajament inițial până la {new Date(summary.subscription.commitment_ends_at).toLocaleDateString("ro-RO")}.
              </p>
            )}
          </section>
        )}

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {Object.values(BILLING_PLANS).map((plan) => {
            const current = summary?.subscription?.plan_id === plan.id;
            const hasSubscription = Boolean(summary?.subscription);
            return (
              <article key={plan.id} className={`rounded-[28px] border p-6 ${plan.id === "business" ? "border-[#4b46ee]" : "border-black/[0.08]"}`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#86868b]">{plan.name}</p>
                <div className="mt-5 flex items-end gap-2">
                  <span className="text-[54px] font-semibold leading-none tracking-[-0.07em]">{plan.priceLei}</span>
                  <span className="pb-1 text-xs text-[#6e6e73]">lei / lună</span>
                </div>
                <p className="mt-2 text-xs text-[#86868b]">{PUBLIC_PRICE_TAX_LABEL}</p>
                <p className="mt-5 min-h-12 text-sm leading-6 text-[#6e6e73]">{plan.description}</p>
                <p className="mt-5 text-xs leading-5 text-[#86868b]">Include: {plan.entitlements.join(", ")}</p>
                <button
                  type="button"
                  disabled={!summary?.configured || !accepted || hasSubscription || action !== null}
                  onClick={() => startCheckout(plan.id)}
                  className="mt-6 h-11 w-full rounded-full bg-[#1d1d1f] px-5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {current ? "Plan curent" : action === plan.id ? "Se deschide..." : `Alege ${plan.name}`}
                </button>
              </article>
            );
          })}
        </section>

        {!summary?.subscription && (
          <label className="mt-8 flex max-w-3xl items-start gap-3 rounded-[22px] border border-black/[0.08] p-5 text-sm leading-6">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>
              Confirm că reprezint organizația și accept{" "}
              <Link href="/legal/terms" className="underline underline-offset-4">Termenii și Condițiile</Link>
              {" "}și{" "}
              <Link href="/legal/subscriptions" className="underline underline-offset-4">Termenii de abonament B2B</Link>
              , inclusiv angajamentul inițial de 12 luni. Am consultat și{" "}
              <Link href="/legal/privacy" className="underline underline-offset-4">Politica de Confidențialitate</Link>.
            </span>
          </label>
        )}

        <p className="mt-8 max-w-3xl text-xs leading-5 text-[#86868b]">
          Schimbările de plan și anularea nu sunt expuse automat în portalul Stripe. Configurația ORBYVEN păstrează aceste operațiuni sub regulile contractuale ale abonamentului.
        </p>
      </div>
    </main>
  );
}
