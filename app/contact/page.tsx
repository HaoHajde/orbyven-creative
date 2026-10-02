"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

type Theme = "light" | "dark";

function getThemeVars(theme: Theme) {
  return {
    "--bg": theme === "dark" ? "#09090d" : "#f8f8fb",
    "--surface": theme === "dark" ? "#101014" : "#ffffff",
    "--surface-2": theme === "dark" ? "#17171c" : "#f1f1f5",
    "--text": theme === "dark" ? "#f5f5f7" : "#17171b",
    "--muted": theme === "dark" ? "#aaaab2" : "#66666f",
    "--muted-2": theme === "dark" ? "#777781" : "#878790",
    "--border": theme === "dark" ? "rgba(255,255,255,.085)" : "rgba(18,18,24,.075)",
    "--border-strong": theme === "dark" ? "rgba(255,255,255,.15)" : "rgba(18,18,24,.14)",
    "--button": theme === "dark" ? "#f5f5f7" : "#17171b",
    "--button-text": theme === "dark" ? "#09090d" : "#ffffff",
    "--accent": "#4b46ee",
    "--home-violet": "#a58bff",
    "--accent-soft": theme === "dark" ? "rgba(126,93,255,.14)" : "rgba(112,78,255,.09)",
  } as CSSProperties;
}

export default function ContactPage() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem("studio-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const nextTheme: Theme = saved === "dark" || saved === "light" ? saved : prefersDark ? "dark" : "light";
      setTheme(nextTheme);
      document.documentElement.style.colorScheme = nextTheme;
      document.body.style.backgroundColor = nextTheme === "dark" ? "#09090d" : "#f8f8fb";
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      document.body.style.backgroundColor = next === "dark" ? "#09090d" : "#f8f8fb";
      return next;
    });
  };

  const vars = getThemeVars(theme);

  return (
    <main
      style={{
        ...vars,
        fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif",
        background:
          theme === "dark"
            ? "linear-gradient(180deg,#0b0912 0%,#0a0910 42%,#09090d 100%)"
            : "linear-gradient(180deg,#fbfaff 0%,#f8f8fb 46%,#f6f6fa 100%)",
      }}
      className="relative min-h-screen overflow-x-hidden text-[var(--text)] antialiased"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-24rem] h-[60rem] w-[78rem] max-w-[92vw] -translate-x-1/2 rounded-full bg-[rgba(126,93,255,.12)] blur-[175px]" />
        <div className="absolute right-[-18rem] top-[42rem] h-[44rem] w-[44rem] rounded-full bg-[rgba(91,70,185,.065)] blur-[190px]" />
      </div>

      <SiteHeader theme={theme} compact={false} activePage="contact" onToggleTheme={toggleTheme} />

      <section className="relative z-10 px-5 pb-24 pt-28 sm:px-6 md:px-10 md:pb-32 md:pt-36">
        <div className="mx-auto max-w-[1500px]">
          <p className="orbyven-home-kicker">
            <span aria-hidden="true" className="orbyven-home-kicker-icon">✦</span>
            <span>ORBYVEN · PORNEȘTE</span>
            <span aria-hidden="true" className="orbyven-home-kicker-line" />
          </p>

          <div className="mt-7 grid gap-8 lg:grid-cols-[.92fr_1.08fr] lg:items-end">
            <h1 className="max-w-[760px] text-[clamp(58px,6.6vw,104px)] font-semibold leading-[.87] tracking-[-.072em]">
              Alege cum
              <br />
              <span className="text-[var(--home-violet)]">vrei să pornim.</span>
            </h1>

            <div className="max-w-xl lg:justify-self-end lg:pb-3">
              <p className="text-[14px] leading-7 text-[var(--muted)] sm:text-[15px]">
                Trei direcții diferite, trei experiențe diferite. Apasă pe card și intri direct în fluxul dedicat.
              </p>
            </div>
          </div>

          <div className="orbyven-start-cards mt-12">
            <Link
              href="/porneste/invitatie"
              className="orbyven-start-card group relative overflow-hidden rounded-[34px] border border-white/12 text-white shadow-[0_28px_100px_rgba(0,0,0,.24)]"
              style={{
                backgroundImage:
                  "linear-gradient(180deg,rgba(8,7,12,.10) 0%,rgba(8,7,12,.34) 44%,rgba(8,7,12,.94) 100%),url('/demo/nunta/diana-florin/couple1.jpeg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(255,255,255,.10),transparent_26%)]" />
              <div className="relative flex h-full min-h-[500px] flex-col justify-between p-6 sm:p-7 lg:min-h-[560px]">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[9px] font-bold uppercase tracking-[.18em] text-white/60">01 · EVENIMENT</span>
                  <span className="rounded-full border border-white/16 bg-black/20 px-3 py-2 text-[8px] font-bold backdrop-blur-md">PERSONALIZAT</span>
                </div>

                <div className="max-w-[420px]">
                  <div className="mb-5 w-fit rounded-[18px] border border-white/14 bg-black/25 p-3 backdrop-blur-xl">
                    <div className="h-20 w-14 rounded-[10px] border border-white/15 bg-white/[.07] p-2">
                      <div className="h-2 w-8 rounded-full bg-white/45" />
                      <div className="mt-2 h-8 rounded-[5px] bg-white/10" />
                      <div className="mt-2 h-1.5 w-7 rounded-full bg-[#d6c3ff]/70" />
                    </div>
                  </div>
                  <h2 className="text-[34px] font-semibold leading-[.94] tracking-[-.06em] sm:text-[42px]">
                    Invitație online
                    <br />
                    personalizată.
                  </h2>
                  <p className="mt-4 max-w-sm text-[12px] leading-6 text-white/66">
                    Design, RSVP, locații și experiență construită în jurul evenimentului.
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold">
                    Explorează experiența <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/porneste/web-design?mode=web"
              className="orbyven-start-card group relative overflow-hidden rounded-[34px] border border-white/12 text-white shadow-[0_28px_100px_rgba(0,0,0,.24)]"
              style={{
                backgroundImage:
                  "linear-gradient(180deg,rgba(7,8,12,.12) 0%,rgba(7,8,12,.42) 42%,rgba(7,8,12,.96) 100%),url('/hao-customs/hero.webp')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_8%,rgba(80,120,255,.18),transparent_30%)]" />
              <div className="relative flex h-full min-h-[500px] flex-col justify-between p-6 sm:p-7 lg:min-h-[560px]">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[9px] font-bold uppercase tracking-[.18em] text-white/60">02 · WEB DESIGN</span>
                  <span className="rounded-full border border-[#a58bff]/35 bg-[#a58bff]/14 px-3 py-2 text-[8px] font-bold text-[#d3c8ff] backdrop-blur-md">30 ZILE GRATUIT</span>
                </div>

                <div className="max-w-[470px]">
                  <div className="mb-5 w-fit rounded-[16px] border border-white/14 bg-black/30 p-2.5 backdrop-blur-xl">
                    <div className="w-40 overflow-hidden rounded-[10px] border border-white/10 bg-[#0c0c12]">
                      <div className="flex h-5 items-center gap-1 border-b border-white/8 px-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                        <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                        <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                      </div>
                      <div className="p-3">
                        <div className="h-2.5 w-20 rounded-full bg-white/65" />
                        <div className="mt-2 h-1.5 w-28 rounded-full bg-white/18" />
                        <div className="mt-3 h-8 rounded-[7px] bg-white/[.07]" />
                      </div>
                    </div>
                  </div>
                  <h2 className="text-[34px] font-semibold leading-[.92] tracking-[-.062em] sm:text-[44px]">
                    Website-ul tău.
                    <br />
                    <span className="text-[#b9a6ff]">30 zile Dashboard gratuit.</span>
                  </h2>
                  <p className="mt-4 max-w-md text-[12px] leading-6 text-white/66">
                    La prima achiziție de web design, primul utilizator testează ORBYVEN Dashboard timp de 30 de zile.
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold">
                    Construiește website-ul <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/porneste/web-design?mode=ecosystem"
              className="orbyven-start-card group relative overflow-hidden rounded-[34px] border border-[#a58bff]/26 text-white shadow-[0_30px_110px_rgba(71,48,160,.24)]"
              style={{
                backgroundImage:
                  "linear-gradient(180deg,rgba(8,7,16,.08) 0%,rgba(9,7,20,.44) 40%,rgba(8,7,16,.97) 100%),url('/pilot-002/control-smart.webp')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(145,102,255,.26),transparent_30%)]" />
              <div className="relative flex h-full min-h-[500px] flex-col justify-between p-6 sm:p-7 lg:min-h-[560px]">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[9px] font-bold uppercase tracking-[.18em] text-white/60">03 · ECOSISTEM</span>
                  <span className="rounded-full border border-[#a58bff]/38 bg-[#a58bff]/16 px-3 py-2 text-[8px] font-bold text-[#d9ceff] backdrop-blur-md">ADVANCED</span>
                </div>

                <div className="max-w-[470px]">
                  <div className="mb-5 grid w-44 grid-cols-3 gap-1.5 rounded-[16px] border border-white/14 bg-black/30 p-2.5 backdrop-blur-xl">
                    {["CRM", "Lucrări", "Oferte", "Task-uri", "Stoc", "Custom"].map((item) => (
                      <span key={item} className="rounded-[7px] border border-white/8 bg-white/[.07] px-2 py-2 text-center text-[7px] font-semibold text-white/70">{item}</span>
                    ))}
                  </div>
                  <h2 className="text-[34px] font-semibold leading-[.92] tracking-[-.062em] sm:text-[44px]">
                    Web design +
                    <br />
                    <span className="text-[#b9a6ff]">Dashboard avansat.</span>
                  </h2>
                  <p className="mt-4 max-w-md text-[12px] leading-6 text-white/68">
                    Conectăm site-ul cu operațiunile firmei și personalizăm modulele în jurul fluxurilor tale.
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold">
                    Configurează ecosistemul <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 rounded-[20px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_55%,transparent)] px-5 py-4 text-[10px] text-[var(--muted)] backdrop-blur-xl">
            <span>Poți reveni oricând aici pentru a schimba direcția.</span>
            <span className="hidden font-semibold text-[var(--text)] sm:inline">Alege un card →</span>
          </div>
        </div>
      </section>

      <SiteFooter theme={theme} activePage="contact" />
    </main>
  );
}
