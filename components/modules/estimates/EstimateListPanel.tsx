"use client";

import { useMemo } from "react";
import type { Estimate, EstimateLink, EstimateStatus } from "@/lib/modules/estimates";
import { ModuleEmpty } from "@/components/modules/ModuleKit";

const statusLabels: Record<EstimateStatus, string> = {
  draft: "Draft",
  sent: "Trimisă",
  accepted: "Acceptată",
  rejected: "Respinsă",
  expired: "Expirată",
};

function formatMoney(cents: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "RON",
    maximumFractionDigits: 2,
  }).format((cents || 0) / 100);
}

type Props = {
  estimates: Estimate[];
  clients: EstimateLink[];
  selectedId: string | null;
  locale: string;
  onSelect: (estimateId: string) => void;
};

export default function EstimateListPanel({
  estimates,
  clients,
  selectedId,
  locale,
  onSelect,
}: Props) {
  const clientById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients]
  );

  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Toate ofertele</h2>
        <span className="text-xs text-[var(--muted)]">{estimates.length}</span>
      </div>
      {estimates.length ? (
        <div className="space-y-2">
          {estimates.map((estimate) => (
            <button
              key={estimate.id}
              type="button"
              onClick={() => onSelect(estimate.id)}
              className={`w-full rounded-[18px] border p-4 text-left ${
                selectedId === estimate.id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--border)] bg-[var(--bg)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{estimate.title}</p>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">
                    {estimate.reference} · {clientById.get(estimate.client_id || "")?.name || "Fără client"}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[10px] font-semibold">
                  {statusLabels[estimate.status]}
                </span>
              </div>
              <p className="mt-4 text-lg font-semibold">
                {formatMoney(estimate.total_cents, estimate.currency, locale)}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <ModuleEmpty
          title="Nicio ofertă încă"
          description="Prima ofertă poate porni direct de la un client și o lucrare existente."
        />
      )}
    </div>
  );
}
