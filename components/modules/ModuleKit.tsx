import type { ReactNode } from "react";

export const moduleInputClass =
  "w-full rounded-[16px] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted-2)] focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--accent)]/10";

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
    <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
      <div className="max-w-3xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-[40px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[54px]">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-[15px] sm:leading-7">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function ModuleMetric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <article className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-[11px] font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-4 text-[30px] font-semibold leading-none tracking-[-0.05em]">{value}</p>
      {note ? <p className="mt-2 text-[11px] text-[var(--muted-2)]">{note}</p> : null}
    </article>
  );
}

export function ModuleEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[26px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] px-6 py-12 text-center">
      <p className="text-base font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--muted)]">{description}</p>
    </div>
  );
}

export function ModuleError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-[18px] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-500">
      {message}
    </p>
  );
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">
        {label}
      </span>
      {children}
    </label>
  );
}
