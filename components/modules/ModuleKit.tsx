import type { ReactNode } from "react";

export const moduleInputClass =
  "w-full rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted-2)] focus:border-[var(--accent)]/55 focus:ring-2 focus:ring-[var(--accent)]/10";

export function ModuleHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
      <div className="max-w-3xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">
          {eyebrow}
        </p>
        <h1 className="mt-1.5 text-[30px] font-semibold leading-[1.03] tracking-[-0.045em] sm:text-[36px]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[var(--muted)]">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function ModuleMetric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-3.5">
      <p className="break-words text-[11px] font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-2 break-words text-[clamp(20px,2vw,26px)] font-semibold leading-[1.05] tracking-[-0.045em] [overflow-wrap:anywhere]">{value}</p>
      {note ? <p className="mt-1.5 break-words text-[11px] leading-4 text-[var(--muted-2)]">{note}</p> : null}
    </article>
  );
}

export function ModuleProgressiveMetrics({
  primary,
  secondary,
  className = "",
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{primary}</div>
      {secondary ? (
        <details className="group mt-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)]/45">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 text-[11px] font-semibold text-[var(--muted)] [&::-webkit-details-marker]:hidden">
            <span>Mai multe informații</span>
            <span aria-hidden="true" className="transition group-open:rotate-45">+</span>
          </summary>
          <div className="grid gap-3 border-t border-[var(--border)] p-3 sm:grid-cols-2 xl:grid-cols-3">
            {secondary}
          </div>
        </details>
      ) : null}
    </section>
  );
}

export function ModuleAdvancedFields({
  children,
  label = "Mai multe detalii",
  className = "",
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <details className={`group mt-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface-2)]/45 ${className}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 text-[11px] font-semibold text-[var(--muted)] [&::-webkit-details-marker]:hidden">
        <span>{label}</span>
        <span aria-hidden="true" className="transition group-open:rotate-45">+</span>
      </summary>
      <div className="border-t border-[var(--border)] p-3.5">{children}</div>
    </details>
  );
}

export function ModuleNextAction({
  eyebrow = "Următorul pas",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 overflow-hidden rounded-[14px] border border-[var(--border-strong)] bg-[var(--accent-soft)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="break-words text-[9px] font-semibold uppercase tracking-[0.13em] text-[var(--accent)]">{eyebrow}</p>
        <p className="mt-1 break-words text-[13px] font-semibold leading-5 text-[var(--text)] [overflow-wrap:anywhere]">{title}</p>
        {description ? <p className="mt-0.5 break-words text-[11px] leading-4 text-[var(--muted)] [overflow-wrap:anywhere]">{description}</p> : null}
      </div>
      {action ? <div className="max-w-full shrink-0 [&>button]:max-w-full [&>button]:whitespace-normal [&>button]:text-center">{action}</div> : null}
    </div>
  );
}

export function ModuleEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[16px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] px-5 py-6 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-1.5 max-w-lg text-[13px] leading-5 text-[var(--muted)]">{description}</p>
    </div>
  );
}

export function ModuleError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-[14px] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-500">
      {message}
    </p>
  );
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">
        {label}
      </span>
      {children}
    </label>
  );
}
