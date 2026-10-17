import type {
  OperatorHealthItem,
  OperatorHealthSnapshot,
  OperatorHealthState,
} from "@/lib/operations/operator-health";

const STATE_COPY: Record<
  OperatorHealthState,
  { ro: string; en: string; dot: string }
> = {
  healthy: { ro: "Operațional", en: "Operational", dot: "bg-emerald-500" },
  attention: { ro: "Necesită atenție", en: "Needs attention", dot: "bg-amber-500" },
  degraded: { ro: "Degradat", en: "Degraded", dot: "bg-red-500" },
  unknown: { ro: "Necunoscut", en: "Unknown", dot: "bg-[var(--muted-2)]" },
};

const CATEGORY_COPY = {
  service: { ro: "Serviciu", en: "Service" },
  job: { ro: "Job", en: "Job" },
  integration: { ro: "Integrare", en: "Integration" },
  data: { ro: "Date", en: "Data" },
} as const;

function isEnglish(locale: string) {
  return locale.toLowerCase().startsWith("en");
}

function stateLabel(state: OperatorHealthState, locale: string) {
  return isEnglish(locale) ? STATE_COPY[state].en : STATE_COPY[state].ro;
}

function categoryLabel(item: OperatorHealthItem, locale: string) {
  const copy = CATEGORY_COPY[item.category];
  return isEnglish(locale) ? copy.en : copy.ro;
}

function checkedLabel(item: OperatorHealthItem, locale: string) {
  if (item.stale || !item.checkedAt) {
    return isEnglish(locale) ? "Check expired" : "Verificare expirată";
  }
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(item.checkedAt));
}

export default function OperatorHealthPanel({
  snapshot,
  locale = "ro-RO",
  compact = false,
}: {
  snapshot: OperatorHealthSnapshot;
  locale?: string;
  compact?: boolean;
}) {
  const english = isEnglish(locale);

  return (
    <section className="rounded-[24px] border border-[var(--border)] bg-[color:var(--surface)]/80 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
            {english ? "Operator health" : "Stare operațională"}
          </p>
          <div className="mt-2 flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full ${STATE_COPY[snapshot.state].dot}`}
            />
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[var(--text)]">
              {stateLabel(snapshot.state, locale)}
            </h2>
          </div>
        </div>
        <p className="text-xs text-[var(--muted-2)]">
          {english ? "Sanitized status only" : "Doar status sanitizat"}
        </p>
      </div>

      {snapshot.items.length === 0 ? (
        <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
          {english
            ? "No operational checks are available for this scope yet."
            : "Nu există încă verificări operaționale disponibile pentru acest scope."}
        </p>
      ) : (
        <div className={`mt-5 grid gap-2.5 ${compact ? "" : "sm:grid-cols-2"}`}>
          {snapshot.items.map((item) => (
            <article
              key={item.key}
              className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-2)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--text)]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-2)]">
                    {categoryLabel(item, locale)} · {checkedLabel(item, locale)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-[var(--muted)]">
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 rounded-full ${STATE_COPY[item.state].dot}`}
                  />
                  {stateLabel(item.state, locale)}
                </div>
              </div>

              {!compact && (item.latencyMs !== null || item.consecutiveFailures > 0) ? (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted-2)]">
                  {item.latencyMs !== null ? (
                    <span>{Math.round(item.latencyMs)} ms</span>
                  ) : null}
                  {item.consecutiveFailures > 0 ? (
                    <span>
                      {english ? "Consecutive failures" : "Eșecuri consecutive"}: {item.consecutiveFailures}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
