"use client";

type Locale = "ro" | "en";

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
  const locale = initialLocale;

  const baseClass =
    variant === "light"
      ? "border-black/10 bg-black/[.035] text-black/55 dark:border-white/10 dark:bg-white/[.06] dark:text-white/55"
      : "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--muted)]";

  const activeClass =
    variant === "light"
      ? "bg-[#171719] text-white dark:bg-white dark:text-[#111113]"
      : "bg-[var(--button)] text-[var(--button-text)]";

  const inactiveHover =
    variant === "light"
      ? "hover:text-black dark:hover:text-white"
      : "hover:text-[var(--text)]";

  const changeLocale = (target: Locale) => {
    if (target === locale) return;
    const suffix = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.assign(`${targetOrigin(target)}${suffix || "/"}`);
  };

  return (
    <div
      className={`inline-flex shrink-0 items-center rounded-full border p-1 ${baseClass} ${compact ? "h-9" : "h-10"}`}
      aria-label={locale === "ro" ? "Schimbă limba" : "Switch language"}
    >
      {(["ro", "en"] as const).map((item) => {
        const active = item === locale;

        return (
          <button
            key={item}
            type="button"
            onClick={() => changeLocale(item)}
            aria-pressed={active}
            className={`flex h-full min-w-[38px] items-center justify-center rounded-full px-2.5 text-[11px] font-semibold tracking-[.04em] transition ${active ? activeClass : inactiveHover}`}
          >
            {item.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
