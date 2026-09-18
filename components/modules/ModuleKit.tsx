import type { ReactNode } from "react";

export const moduleInputClass =
  "w-full rounded-[14px] border border-[var(--border)] bg-[color:var(--surface-2)]/72 px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted-2)] focus:border-[var(--accent)]/55 focus:bg-[var(--surface-2)] focus:ring-2 focus:ring-[var(--accent)]/10";

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
    <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div className="max-w-3xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]">
          {eyebrow}
        </p>
        <h1 className="mt-2.5 text-[34px] font-semibold leading-[0.99] tracking-[-0.05em] sm:text-[44px]">
          {title}
        </h1>
        <p className="mt-2.5 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function ModuleMetric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <article className="rounded-[18px] border border-[var(--border)] bg-[color:var(--surface)]/72 p-4 shadow-[0_10px_34px_rgba(0,0,0,0.025)]">
      <p className="text-[11px] font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.05em]">{value}</p>
      {note ? <p className="mt-1.5 text-[10px] text-[var(--muted-2)]">{note}</p> : null}
    </article>
  );
}

export function ModuleEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-[var(--border-strong)] bg-[color:var(--surface-2)]/58 px-5 py-8 text-center">
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
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)]">
        {label}
      </span>
      {children}
    </label>
  );
}
