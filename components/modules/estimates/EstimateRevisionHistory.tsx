"use client";

import type { Estimate } from "@/lib/modules/estimates";

export default function EstimateRevisionHistory({
  estimates,
  selected,
  onSelect,
}: {
  estimates: Estimate[];
  selected: Estimate;
  onSelect: (id: string) => void;
}) {
  const root = selected.source_estimate_id || selected.id;
  const versions = estimates
    .filter((item) => item.id === root || item.source_estimate_id === root)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <div className="mt-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)]/65 px-3 py-3">
      <p className="text-[11px] font-semibold">Istoric devize & revizii</p>
      <p className="mt-1 text-[10px] text-[var(--muted)]">
        Fiecare versiune păstrează separat ofertele și documentele sale.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {versions.map((item, index) => (
          <button
            type="button"
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={
              "rounded-[9px] border px-3 py-2 text-[11px] " +
              (selected.id === item.id
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--border)] bg-[var(--surface-2)]")
            }
          >
            {index === 0 ? "Original" : "Revizia " + index} · {item.reference}
          </button>
        ))}
      </div>
    </div>
  );
}
