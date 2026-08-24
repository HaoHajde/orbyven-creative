"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const chapters = [
  { id: "intro", number: "01", label: "Intro" },
  { id: "work", number: "02", label: "Portofoliu" },
  { id: "services", number: "03", label: "Servicii" },
  { id: "process", number: "04", label: "Cum lucrăm" },
  { id: "pricing", number: "05", label: "Prețuri" },
  { id: "start", number: "06", label: "Start" },
] as const;

type ChapterId = (typeof chapters)[number]["id"];

function applyTheme(theme: Theme) {
  const root = document.getElementById("mobile-home-root");

  if (!root) return;

  const dark = theme === "dark";

  root.style.setProperty("--bg", dark ? "#000000" : "#ffffff");
  root.style.setProperty("--surface", dark ? "#0b0b0d" : "#f5f5f7");
  root.style.setProperty("--surface-2", dark ? "#121216" : "#fbfbfd");
  root.style.setProperty("--text", dark ? "#f5f5f7" : "#1d1d1f");
  root.style.setProperty("--muted", dark ? "#a1a1a6" : "#6e6e73");
  root.style.setProperty("--muted-2", dark ? "#74747a" : "#86868b");
  root.style.setProperty(
    "--border",
    dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
  );
  root.style.setProperty(
    "--border-strong",
    dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.14)"
  );
  root.style.setProperty("--button", dark ? "#f5f5f7" : "#1d1d1f");
  root.style.setProperty("--button-text", dark ? "#000000" : "#ffffff");

  document.documentElement.style.colorScheme = theme;
}

export default function MobileControls() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [menuOpen, setMenuOpen] = useState(false);
  const [warpOpen, setWarpOpen] = useState(false);
  const [activeSection, setActiveSection] =
    useState<ChapterId | null>("intro");

  useEffect(() => {
    const saved = window.localStorage.getItem("studio-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const initialTheme: Theme =
      saved === "light" || saved === "dark"
        ? saved
        : prefersDark
          ? "dark"
          : "light";

    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  useEffect(() => {
    const elements = chapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (current) {
          setActiveSection(current.target.id as ChapterId);
        }
      },
      {
        rootMargin: "-24% 0px -62% 0px",
        threshold: [0, 0.1, 0.25],
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";

    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem("studio-theme", next);
  };

  const warpTo = (id: ChapterId) => {
    setWarpOpen(false);

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const activeChapter =
    chapters.find((chapter) => chapter.id === activeSection) ?? chapters[0];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3">
        <div className="mx-auto flex h-14 max-w-[760px] items-center justify-between rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg)] px-3 shadow-[0_10px_34px_rgba(0,0,0,0.16)]">
          <a
            href="/"
            aria-label="ORBYVEN CREATIVE — Acasă"
            className="flex h-10 items-center gap-2"
          >
            <img
              src={
                theme === "dark"
                  ? "/branding/orbyven-logo-light.png"
                  : "/branding/orbyven-logo-dark.png"
              }
              alt=""
              width="40"
              height="40"
              decoding="async"
              className="h-9 w-9 object-contain"
            />

            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)] min-[370px]:block">
              ORBYVEN
            </span>
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Schimbă tema"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)] text-sm"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Închide meniul" : "Deschide meniul"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)]"
            >
              <span className="text-[17px] leading-none">
                {menuOpen ? "×" : "≡"}
              </span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="mx-auto mt-2 max-w-[760px] overflow-hidden rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg)] p-2 shadow-[0_16px_44px_rgba(0,0,0,0.20)]">
            <div className="px-3 pb-2 pt-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
              Navigate
            </div>

            {[
              ["/", "Acasă"],
              ["/templates", "Templates"],
              ["/servicii", "Servicii"],
              ["/contact", "Contact"],
            ].map(([href, label], index) => {
              const active = index === 0;

              return (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex min-h-12 items-center justify-between rounded-[16px] px-4 text-sm ${
                    active
                      ? "bg-[var(--surface)] text-[var(--text)]"
                      : "text-[var(--muted)]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {active && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#4b46ee]" />
                    )}

                    {label}
                  </span>

                  <span className="text-[var(--muted-2)]">↗</span>
                </a>
              );
            })}

            <div className="mt-2 border-t border-[var(--border)] pt-2">
              <a
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className="flex h-12 items-center justify-center rounded-[16px] bg-[var(--button)] text-sm font-semibold text-[var(--button-text)]"
              >
                Începe un proiect
              </a>
            </div>
          </div>
        )}
      </header>

      <div className="pointer-events-none fixed left-1/2 top-[78px] z-40 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-[var(--muted)] shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
        <span className="text-[#4b46ee]">WARP</span>
        {" · "}
        {activeChapter.number}
        {" · "}
        {activeChapter.label}
      </div>

      <div className="fixed bottom-[calc(16px+env(safe-area-inset-bottom))] left-4 z-50">
        <div
          className={`overflow-hidden rounded-[20px] border border-[var(--border-strong)] bg-[var(--bg)] shadow-[0_16px_40px_rgba(0,0,0,0.18)] ${
            warpOpen ? "w-[236px]" : "w-[64px]"
          }`}
        >
          <button
            type="button"
            onClick={() => setWarpOpen((current) => !current)}
            className="flex h-[66px] w-full flex-col items-center justify-center gap-1"
          >
            <span className="relative h-7 w-7">
              <span className="absolute inset-0 rounded-full border border-[var(--border-strong)]" />
              <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#4b46ee]" />
              <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-[#4b46ee]" />
            </span>

            <span className="text-[8px] font-semibold tracking-[0.18em]">
              WARP
            </span>
          </button>

          {warpOpen && (
            <div className="max-h-[62svh] overflow-y-auto border-t border-[var(--border)] p-2">
              <div className="px-3 pb-2 pt-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-2)]">
                Chapters
              </div>

              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  type="button"
                  onClick={() => warpTo(chapter.id)}
                  className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left ${
                    activeSection === chapter.id
                      ? "bg-[var(--surface)]"
                      : ""
                  }`}
                >
                  <span
                    className={`w-5 text-[9px] font-semibold ${
                      activeSection === chapter.id
                        ? "text-[#4b46ee]"
                        : "text-[var(--muted-2)]"
                    }`}
                  >
                    {chapter.number}
                  </span>

                  <span
                    className={`text-sm ${
                      activeSection === chapter.id
                        ? "text-[var(--text)]"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    {chapter.label}
                  </span>
                </button>
              ))}

              <div className="mt-2 border-t border-[var(--border)] pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setWarpOpen(false);
                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                  className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm text-[var(--muted)]"
                >
                  <span className="text-[#4b46ee]">↑</span>
                  <span>Înapoi sus</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
