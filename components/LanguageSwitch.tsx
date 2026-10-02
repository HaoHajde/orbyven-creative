"use client";

import { useEffect, useMemo, useState } from "react";

type Locale = "ro" | "en";

function currentLocaleFromHost(hostname: string): Locale {
  const host = hostname.toLowerCase();
  return host === "orbyven.com" || host === "www.orbyven.com" ? "en" : "ro";
}

function targetOrigin(locale: Locale) {
  return locale === "en" ? "https://www.orbyven.com" : "https://orbyven.ro";
}

export default function LanguageSwitch({
  variant = "public",
  compact = false,
  initialLocale = "ro",
}: {
  variant?: "public" | "light";
  compact?: boolean;
  initialLocale?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [suffix, setSuffix] = useState("/");

  useEffect(() => {
    setLocale(currentLocaleFromHost(window.location.hostname));
    setSuffix(`${window.location.pathname}${window.location.search}${window.location.hash}`);
  }, []);

  const baseClass = useMemo(
    () =>
      variant === "light"
        ? "border-black/10 bg-black/[.035] text-black/55"
        : "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--muted)]",
    [variant],
  );

  const activeClass =
    variant === "light"
      ? "bg-[#171719] text-white"
      : "bg-[var(--button)] text-[var(--button-text)]";

  const inactiveHover =
    variant === "light"
      ? "hover:text-black"
      : "hover:text-[var(--text)]";

  return (
    <div
      className={`inline-flex shrink-0 items-center rounded-full border p-1 ${baseClass} ${compact ? "h-9" : "h-10"}`}
      aria-label={locale === "ro" ? "Schimbă limba" : "Switch language"}
    >
      {(["ro", "en"] as const).map((item) => {
        const active = item === locale;
        const href = `${targetOrigin(item)}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;

        return (
          <a
            key={item}
            href={href}
            hrefLang={item}
            aria-current={active ? "page" : undefined}
            className={`flex h-full min-w-[38px] items-center justify-center rounded-full px-2.5 text-[11px] font-semibold tracking-[.04em] transition ${active ? activeClass : inactiveHover}`}
          >
            {item.toUpperCase()}
          </a>
        );
      })}
    </div>
  );
}
