"use client";

import { usePathname } from "next/navigation";

type Locale = "ro" | "en";

const ORIGIN_BY_LOCALE: Record<Locale, string> = {
  ro: "https://orbyven.ro",
  en: "https://www.orbyven.com",
};

export default function LanguageSwitcher({
  locale,
  compact = false,
  tone = "public",
}: {
  locale: Locale;
  compact?: boolean;
  tone?: "public" | "seo";
}) {
  const pathname = usePathname() || "/";

  const goTo = (target: Locale) => {
    if (target === locale) return;

    const search = window.location.search;
    const hash = window.location.hash;
    const publicPath =
      pathname === "/en"
        ? "/"
        : pathname.startsWith("/en/")
          ? pathname.slice(3)
          : pathname;
    const next = new URL(publicPath, ORIGIN_BY_LOCALE[target]);
    next.search = search;
    next.hash = hash;
    window.location.assign(next.toString());
  };

  const shellClass =
    tone === "seo"
      ? "border-black/10 bg-[#f5f5f7]"
      : "border-[var(--border-strong)] bg-[var(--surface)]";

  return (
    <div
      className={`inline-flex shrink-0 items-center rounded-full border p-1 ${shellClass} ${compact ? "h-9" : "h-10"}`}
      aria-label={locale === "ro" ? "Schimbă limba" : "Change language"}
    >
      {(["ro", "en"] as const).map((item) => {
        const active = item === locale;
        return (
          <button
            key={item}
            type="button"
            onClick={() => goTo(item)}
            aria-pressed={active}
            title={item === "ro" ? "Română" : "English"}
            className={`flex h-full min-w-[34px] touch-manipulation items-center justify-center rounded-full px-2 text-[10px] font-bold tracking-[0.08em] transition ${
              active
                ? tone === "seo"
                  ? "bg-[#171719] text-white"
                  : "bg-[var(--button)] text-[var(--button-text)]"
                : tone === "seo"
                  ? "text-black/45 hover:text-black"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            {item.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
