"use client";

import BrandLogo from "@/components/BrandLogo";
import WorkspaceOrbitBackground from "@/components/WorkspaceOrbitBackground";
import Link from "next/link";
import styles from "./WorkspaceAuthShell.module.css";
import { useId, useState, type ReactNode } from "react";

/**
 * Shared workspace authentication presentation only.
 * All existing Supabase auth and redirect flows remain in their pages.
 */
export default function WorkspaceAuthShell({
  eyebrow,
  title,
  titleAccent,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  titleAccent?: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const accentStart = titleAccent && title.endsWith(titleAccent)
    ? title.length - titleAccent.length
    : -1;

  return (
    <main
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
      className="relative isolate min-h-[100svh] overflow-hidden bg-[#070b16] text-[#f3f6ff] antialiased [--text:#f3f6ff]"
    >
      <WorkspaceOrbitBackground />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1500px] flex-col px-5 py-5 sm:px-7 sm:py-6 md:px-10">
        <header className="flex items-center justify-between gap-4">
          <BrandLogo compact theme="dark" />
          <Link
            href="/"
            className="shrink-0 rounded-full border border-white/[0.17] bg-white/[0.025] px-4 py-2 text-[11px] font-medium text-[#adb9d2] transition hover:border-[#7991fd]/55 hover:text-white focus-visible:outline-[#8fa3ff]"
          >
            orbyven.ro
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <div className="w-full max-w-[492px]">
            <div className="mb-7 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a1abc4]">
                {eyebrow}
              </p>
              <h1 className="mt-4 text-[36px] font-semibold leading-[1.07] tracking-[-0.055em] sm:text-[49px]">
                {accentStart >= 0 ? (
                  <>
                    {title.slice(0, accentStart)}
                    <span className="bg-gradient-to-r from-[#83aaff] to-[#8b78ff] bg-clip-text text-transparent">
                      {titleAccent}
                    </span>
                  </>
                ) : title}
              </h1>
              <p className="mx-auto mt-3 max-w-[410px] text-[12px] leading-[1.8] text-[#acb7cd] sm:text-[13px]">
                {description}
              </p>
            </div>

            <div className="rounded-[27px] border border-[#8275f4]/45 bg-[#101525]/75 p-5 shadow-[0_25px_90px_rgba(0,0,0,0.36),0_0_60px_rgba(63,66,181,0.08)] backdrop-blur-xl sm:p-7">
              {children}
            </div>

            {footer ? (
              <div className="mt-6 text-center text-[12px] leading-5 text-[#a4afc5]">
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
  const [showPassword, setShowPassword] = useState(false);
  const fieldId = useId();
  const passwordField = type === "password";
  const emailField = type === "email";

  return (
    <div className="block">
      <label htmlFor={fieldId} className="mb-2.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a2abc2]">
        {label}
      </label>
      <div className="group flex h-[53px] items-center gap-3 rounded-[15px] border border-white/[0.15] bg-[#0c1221] px-4 transition focus-within:border-[#7089ff] focus-within:ring-[3px] focus-within:ring-[#5778ff]/20">
        {emailField ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px] shrink-0 text-[#a2abc2]">
            <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" />
          </svg>
        ) : passwordField ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px] shrink-0 text-[#a2abc2]">
            <rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        ) : null}
        <input
          id={fieldId}
          type={passwordField && showPassword ? "text" : type}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${styles.authInput} h-full w-full min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-[#8995af]`}
        />
        {passwordField && (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
            aria-pressed={showPassword}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#a2abc2] transition hover:bg-white/[0.07] hover:text-white"
          >
            {showPassword ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                <path d="M3 3l18 18M10.6 6.1A11.7 11.7 0 0 1 12 6c6.5 0 10 6 10 6a13.6 13.6 0 0 1-3.1 3.6M6 6.9C3.4 8.7 2 12 2 12s3.5 6 10 6c1.4 0 2.6-.3 3.8-.8" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="mt-5 rounded-[13px] border border-rose-400/30 bg-rose-400/[0.08] px-4 py-3 text-[12px] leading-5 text-rose-200">
      {message}
    </div>
  );
}

export function AuthSuccess({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="status" className="mt-5 rounded-[13px] border border-emerald-400/25 bg-emerald-400/[0.08] px-4 py-3 text-[12px] leading-5 text-emerald-200">
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
      className="mt-7 inline-flex h-[52px] w-full items-center justify-center gap-3 rounded-full bg-[#f9fbff] px-5 text-[13px] font-semibold text-[#0a1020] shadow-[0_8px_22px_rgba(255,255,255,0.07)] transition hover:bg-[#e8edff] disabled:cursor-wait disabled:opacity-60"
    >
      {loading ? loadingLabel : (
        <>
          {children}
          <span aria-hidden="true" className="text-lg font-normal leading-none">→</span>
        </>
      )}
    </button>
  );
}
