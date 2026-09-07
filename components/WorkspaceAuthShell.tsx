"use client";

import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import type { ReactNode } from "react";

export default function WorkspaceAuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] antialiased dark:bg-[#09090a] dark:text-[#f5f5f7]">
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-6 py-6 md:px-10">
        <header className="flex items-center justify-between">
          <BrandLogo compact />
          <Link
            href="/"
            className="rounded-full border border-black/[0.08] px-4 py-2 text-xs font-medium text-[#6e6e73] dark:border-white/[0.1] dark:text-[#a1a1a6]"
          >
            orbyven.ro
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center py-14 md:py-20">
          <div className="w-full max-w-[470px]">
            <div className="mb-8 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
                {eyebrow}
              </p>
              <h1 className="mt-5 text-[42px] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[52px]">
                {title}
              </h1>
              <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#6e6e73] dark:text-[#a1a1a6]">
                {description}
              </p>
            </div>

            <div className="rounded-[30px] border border-black/[0.07] bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.05)] dark:border-white/[0.1] dark:bg-[#111113] sm:p-8">
              {children}
            </div>

            {footer ? (
              <div className="mt-6 text-center text-xs leading-5 text-[#86868b]">
                {footer}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

export function AuthField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#86868b]">
        {label}
      </span>
      <input
        type={type}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[18px] border border-black/[0.08] bg-[#f5f5f7] px-4 py-4 text-sm outline-none transition focus:border-[#4b46ee] focus:ring-4 focus:ring-[#4b46ee]/10 dark:border-white/[0.1] dark:bg-black"
      />
    </label>
  );
}

export function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="mt-5 rounded-[18px] border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-500">
      {message}
    </div>
  );
}

export function AuthSuccess({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="mt-5 rounded-[18px] border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-600 dark:text-emerald-300">
      {message}
    </div>
  );
}

export function AuthPrimaryButton({
  loading,
  loadingLabel,
  children,
}: {
  loading: boolean;
  loadingLabel: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#1d1d1f] px-5 text-sm font-medium text-white disabled:opacity-60 dark:bg-[#f5f5f7] dark:text-black"
    >
      {loading ? loadingLabel : children}
    </button>
  );
}
