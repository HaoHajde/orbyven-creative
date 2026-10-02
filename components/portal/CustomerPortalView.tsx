"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { CustomerPortalEstimate, CustomerPortalSnapshot } from "@/lib/portal/types";

const OPERATION_STATUS: Record<string, string> = {
  planned: "Planificat",
  in_progress: "În lucru",
  blocked: "Blocat",
  done: "Finalizat",
  cancelled: "Anulat",
};

const ESTIMATE_STATUS: Record<string, string> = {
  sent: "Așteaptă răspuns",
  accepted: "Acceptată",
  rejected: "Refuzată",
  expired: "Expirată",
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

function date(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function CustomerPortalView({
  token,
  snapshot,
}: {
  token: string;
  snapshot: CustomerPortalSnapshot;
}) {
  const router = useRouter();
  const [actorName, setActorName] = useState(snapshot.client.name);
  const [confirmed, setConfirmed] = useState(false);
  const [busyEstimateId, setBusyEstimateId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const totalPaid = useMemo(() => {
    const byCurrency = new Map<string, number>();
    for (const payment of snapshot.payments) {
      byCurrency.set(payment.currency, (byCurrency.get(payment.currency) ?? 0) + payment.amountCents);
    }
    return [...byCurrency.entries()];
  }, [snapshot.payments]);

  const decide = async (estimate: CustomerPortalEstimate, decision: "accepted" | "rejected") => {
    if (!actorName.trim() || busyEstimateId) return;
    if (decision === "accepted" && !confirmed) {
      setMessage("Bifează confirmarea înainte de acceptare.");
      return;
    }

    setBusyEstimateId(estimate.id);
    setMessage("");
    try {
      const response = await fetch(`/api/customer-portal/${token}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateId: estimate.id,
          decision,
          actorName: actorName.trim(),
          confirmed: decision === "accepted" ? confirmed : true,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        const error = String(payload.error || "");
        if (/estimate_expired/.test(error)) throw new Error("Oferta a expirat și nu mai poate fi acceptată.");
        if (/estimate_not_actionable/.test(error)) throw new Error("Oferta a primit deja o decizie.");
        throw new Error("Decizia nu a putut fi înregistrată.");
      }
      setMessage(decision === "accepted" ? "Oferta a fost acceptată." : "Oferta a fost refuzată.");
      setConfirmed(false);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Decizia nu a putut fi înregistrată.");
    } finally {
      setBusyEstimateId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="rounded-[32px] border border-black/[0.05] bg-white p-6 shadow-sm sm:p-9">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/40">Portal client · ORBYVEN</p>
              <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.05em] sm:text-[42px]">
                {snapshot.client.company || snapshot.client.name}
              </h1>
              <p className="mt-2 text-sm text-black/50">
                {snapshot.organization.legalName || snapshot.organization.name}
              </p>
            </div>
            <div className="rounded-full bg-black/[0.04] px-4 py-2 text-xs text-black/50">
              Link activ până la {date(snapshot.link.expiresAt)}
            </div>
          </div>
        </header>

        {message ? (
          <div className="mt-4 rounded-[18px] border border-black/[0.06] bg-white px-4 py-3 text-sm shadow-sm">
            {message}
          </div>
        ) : null}

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="rounded-[28px] border border-black/[0.05] bg-white p-6 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40">Status lucrări</p>
            <div className="mt-4 space-y-3">
              {snapshot.operations.length ? snapshot.operations.map((operation) => (
                <div key={operation.id} className="rounded-[20px] bg-[#f5f5f7] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{operation.title}</p>
                      <p className="mt-1 text-xs text-black/45">
                        {operation.kind === "order" ? "Comandă" : "Lucrare"} · {OPERATION_STATUS[operation.status] || operation.status}
                      </p>
                    </div>
                    <span className="text-xs font-semibold">{operation.progress}%</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/[0.07]">
                    <div className="h-full rounded-full bg-black" style={{ width: `${operation.progress}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-black/40">
                    {operation.scheduledAt ? <span>Programat: {date(operation.scheduledAt)}</span> : null}
                    {operation.dueAt ? <span>Termen: {date(operation.dueAt)}</span> : null}
                    {operation.location ? <span>{operation.location}</span> : null}
                  </div>
                </div>
              )) : <p className="text-sm text-black/45">Nu există lucrări active afișate.</p>}
            </div>
          </article>

          <article className="rounded-[28px] border border-black/[0.05] bg-white p-6 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40">Plăți înregistrate</p>
            <div className="mt-4">
              {totalPaid.length ? (
                <div className="flex flex-wrap gap-2">
                  {totalPaid.map(([currency, amount]) => (
                    <span key={currency} className="rounded-full bg-[#f5f5f7] px-4 py-2 text-sm font-semibold">
                      {money(amount, currency)}
                    </span>
                  ))}
                </div>
              ) : <p className="text-sm text-black/45">Nu există plăți înregistrate în portal.</p>}
              {snapshot.payments.length ? (
                <div className="mt-4 space-y-2">
                  {snapshot.payments.slice(0, 6).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between gap-4 text-xs">
                      <span className="text-black/45">{date(payment.occurredOn)}{payment.reference ? ` · ${payment.reference}` : ""}</span>
                      <span className="font-semibold">{money(payment.amountCents, payment.currency)}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        </section>

        <section className="mt-5 rounded-[28px] border border-black/[0.05] bg-white p-6 shadow-sm sm:p-7">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40">Oferte</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Devize și decizii</h2>
          </div>
          <div className="mt-5 space-y-4">
            {snapshot.estimates.length ? snapshot.estimates.map((estimate) => (
              <article key={estimate.id} className="rounded-[24px] border border-black/[0.06] p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-[11px] font-semibold text-black/40">{estimate.reference}</p>
                    <h3 className="mt-1 text-lg font-semibold">{estimate.title}</h3>
                    <p className="mt-1 text-xs text-black/45">
                      {ESTIMATE_STATUS[estimate.status] || estimate.status}
                      {estimate.validUntil ? ` · valabilă până la ${date(estimate.validUntil)}` : ""}
                    </p>
                  </div>
                  <p className="text-xl font-semibold tracking-[-0.03em]">{money(estimate.totalCents, estimate.currency)}</p>
                </div>

                <div className="mt-4 overflow-hidden rounded-[18px] bg-[#f5f5f7]">
                  {estimate.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4 border-b border-black/[0.05] px-4 py-3 last:border-b-0">
                      <div>
                        <p className="text-sm font-medium">{item.description}</p>
                        <p className="mt-1 text-[11px] text-black/40">{item.quantity} × {money(item.unitPriceCents, estimate.currency)}</p>
                      </div>
                      <p className="text-sm font-semibold">{money(Math.round(item.quantity * item.unitPriceCents), estimate.currency)}</p>
                    </div>
                  ))}
                </div>

                {estimate.actionable ? (
                  <div className="mt-5 rounded-[20px] bg-[#f5f5f7] p-4">
                    <p className="text-xs font-semibold">Răspuns ofertă</p>
                    <input
                      value={actorName}
                      onChange={(event) => setActorName(event.target.value)}
                      placeholder="Numele persoanei care răspunde"
                      className="mt-3 h-11 w-full rounded-[14px] border border-black/10 bg-white px-4 text-base outline-none focus:border-black/30"
                    />
                    <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-black/55">
                      <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" />
                      <span>Confirm că am citit conținutul și, dacă aleg Acceptă, sunt de acord cu această ofertă.</span>
                    </label>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyEstimateId === estimate.id || !actorName.trim() || !confirmed}
                        onClick={() => void decide(estimate, "accepted")}
                        className="h-10 rounded-full bg-black px-5 text-xs font-semibold text-white disabled:opacity-35"
                      >
                        Acceptă oferta
                      </button>
                      <button
                        type="button"
                        disabled={busyEstimateId === estimate.id || !actorName.trim()}
                        onClick={() => void decide(estimate, "rejected")}
                        className="h-10 rounded-full border border-black/15 px-5 text-xs font-semibold disabled:opacity-35"
                      >
                        Refuză
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            )) : <p className="text-sm text-black/45">Nu există oferte publicate în acest portal.</p>}
          </div>
        </section>

        <section className="mt-5 rounded-[28px] border border-black/[0.05] bg-white p-6 shadow-sm sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40">Documente</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {snapshot.documents.length ? snapshot.documents.map((document) => (
              <a
                key={document.id}
                href={`/api/customer-portal/${token}/documents/${document.id}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-[18px] bg-[#f5f5f7] p-4 transition hover:bg-[#ececef]"
              >
                <p className="truncate text-sm font-semibold">{document.name}</p>
                <p className="mt-1 text-[11px] text-black/40">{document.category} · {date(document.createdAt)}</p>
              </a>
            )) : <p className="text-sm text-black/45">Nu există documente publicate.</p>}
          </div>
        </section>

        <footer className="px-2 py-8 text-center text-[11px] text-black/35">
          Acces securizat prin ORBYVEN · Datele afișate aparțin exclusiv relației tale cu {snapshot.organization.name}.
        </footer>
      </div>
    </main>
  );
}
