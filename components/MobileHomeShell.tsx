"use client";

import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

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

export default function MobileHomeShell({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [warpOpen, setWarpOpen] = useState(false);
  const [activeSection, setActiveSection] =
    useState<ChapterId | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("studio-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const initialTheme: Theme =
      saved === "dark" || saved === "light"
        ? saved
        : prefersDark
          ? "dark"
          : "light";

    setTheme(initialTheme);
    document.documentElement.style.colorScheme = initialTheme;
  }, []);

  useEffect(() => {
    const elements = chapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          setActiveSection(visible[0].target.id as ChapterId);
        }
      },
      {
        rootMargin: "-25% 0px -58% 0px",
        threshold: [0, 0.08, 0.2, 0.4],
      }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const vars = {
    "--bg": theme === "dark" ? "#000000" : "#ffffff",
    "--surface": theme === "dark" ? "#0c0c0e" : "#f5f5f7",
    "--surface-2": theme === "dark" ? "#151518" : "#fbfbfd",
    "--text": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--muted": theme === "dark" ? "#a1a1a6" : "#6e6e73",
    "--muted-2": theme === "dark" ? "#77777d" : "#86868b",
    "--border":
      theme === "dark"
        ? "rgba(255,255,255,0.09)"
        : "rgba(0,0,0,0.08)",
    "--border-strong":
      theme === "dark"
        ? "rgba(255,255,255,0.16)"
        : "rgba(0,0,0,0.14)",
    "--button": theme === "dark" ? "#f5f5f7" : "#1d1d1f",
    "--button-text": theme === "dark" ? "#000000" : "#ffffff",
    "--accent": "#4b46ee",
  } as CSSProperties;

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      return next;
    });
  };

  const warpTo = (id: ChapterId) => {
    setWarpOpen(false);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const activeChapter = chapters.find(
    (chapter) => chapter.id === activeSection
  );

  return (
    <main
      id="top"
      style={vars}
      className="min-h-screen overflow-x-clip bg-[var(--bg)] text-[var(--text)] transition-colors duration-300"
    >
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3">
        <div className="mx-auto flex h-14 max-w-[760px] items-center justify-between rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg)] px-3 shadow-[0_10px_35px_rgba(0,0,0,0.10)]">
          <BrandLogo compact theme={theme} />

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
              aria-label="Meniu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)]"
            >
              <span className="text-[17px] leading-none">
                {menuOpen ? "×" : "≡"}
              </span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="mx-auto mt-2 max-w-[760px] rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg)] p-2 shadow-[0_16px_50px_rgba(0,0,0,0.12)]">
            {[
              ["/", "Acasă"],
              ["/templates", "Templates"],
              ["/servicii", "Servicii"],
              ["/contact", "Contact"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                prefetch={false}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center justify-between rounded-[16px] px-4 text-sm text-[var(--muted)]"
              >
                <span>{label}</span>
                <span>↗</span>
              </Link>
            ))}

            <Link
              href="/contact"
              prefetch={false}
              onClick={() => setMenuOpen(false)}
              className="mt-2 flex h-12 items-center justify-center rounded-[16px] bg-[var(--button)] text-sm font-medium text-[var(--button-text)]"
            >
              Începe un proiect
            </Link>
          </div>
        )}
      </header>

      {activeChapter && (
        <div className="pointer-events-none fixed left-1/2 top-[78px] z-40 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-[var(--muted)]">
          WARP · {activeChapter.number} · {activeChapter.label}
        </div>
      )}

      <div className="fixed bottom-[calc(16px+env(safe-area-inset-bottom))] left-4 z-50">
        <div
          className={`overflow-hidden rounded-[20px] border border-[var(--border-strong)] bg-[var(--bg)] shadow-[0_18px_45px_rgba(0,0,0,0.14)] ${
            warpOpen ? "w-[230px]" : "w-[62px]"
          }`}
        >
          <button
            type="button"
            onClick={() => setWarpOpen((value) => !value)}
            className="flex h-[66px] w-full flex-col items-center justify-center gap-1"
          >
            <span className="relative h-7 w-7">
              <span className="absolute inset-0 rounded-full border border-[var(--border-strong)]" />
              <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--accent)]" />
              <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            </span>
            <span className="text-[8px] font-semibold tracking-[0.18em]">
              WARP
            </span>
          </button>

          {warpOpen && (
            <div className="max-h-[62svh] overflow-y-auto border-t border-[var(--border)] p-2">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  type="button"
                  onClick={() => warpTo(chapter.id)}
                  className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left"
                >
                  <span className="w-5 text-[9px] text-[var(--muted-2)]">
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
                  <span>↑</span>
                  <span>Înapoi sus</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {children}
    </main>
  );
}
