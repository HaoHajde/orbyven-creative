"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { PUBLIC_CHECKOUT_IS_DEMO, PUBLIC_OFFERS } from "@/lib/commerce/public-offers";

type Theme = "light" | "dark";

function getThemeVars(theme: Theme) {
  return {
    "--bg": theme === "dark" ? "#09090d" : "#e7e8f3",
    "--surface": theme === "dark" ? "#101014" : "#f5f4fb",
    "--surface-2": theme === "dark" ? "#17171c" : "#ebe9f6",
    "--text": theme === "dark" ? "#f5f5f7" : "#181a2c",
    "--muted": theme === "dark" ? "#aaaab2" : "#62647a",
    "--muted-2": theme === "dark" ? "#777781" : "#797b91",
    "--border": theme === "dark" ? "rgba(255,255,255,.085)" : "rgba(96,76,168,.16)",
    "--border-strong": theme === "dark" ? "rgba(255,255,255,.15)" : "rgba(91,72,172,.28)",
    "--button": theme === "dark" ? "#f5f5f7" : "#5d55cf",
    "--button-text": theme === "dark" ? "#09090d" : "#ffffff",
    "--accent": "#4b46ee",
    "--home-violet": "#a58bff",
    "--accent-soft": theme === "dark" ? "rgba(126,93,255,.14)" : "rgba(116,88,215,.13)",
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
      document.body.style.backgroundColor = nextTheme === "dark" ? "#09090d" : "#e7e8f3";
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      document.body.style.backgroundColor = next === "dark" ? "#09090d" : "#e7e8f3";
      return next;
    });
  };

  const vars = getThemeVars(theme);

  return (
    <main
      data-orbyven-public-theme={theme}
      style={{
        ...vars,
        fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif",
        background:
          theme === "dark"
            ? "linear-gradient(180deg,#0b0912 0%,#0a0910 42%,#09090d 100%)"
            : "linear-gradient(180deg,#eeeaf7 0%,#e7e8f3 46%,#ece9f6 100%)",
      }}
      className="orbyven-public-shell relative min-h-screen overflow-x-hidden text-[var(--text)] antialiased"
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

          {PUBLIC_CHECKOUT_IS_DEMO ? (
            <div className="mt-8 flex flex-col gap-3 rounded-[22px] border border-amber-300/20 bg-amber-300/[.06] px-5 py-4 text-[11px] leading-5 text-amber-100/80 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold uppercase tracking-[.14em] text-amber-200">MOD TEST / DEMO</p>
                <p className="mt-1 text-white/58">Nu se încasează bani reali și nu se încheie o comandă comercială. Folosește doar datele de test Stripe.</p>
              </div>
              <span className="shrink-0 rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-[9px] font-bold text-amber-100">SANDBOX</span>
            </div>
          ) : null}

          <div className="orbyven-start-cards mt-6">
            <Link
              href="/porneste/oferta?offer=invitation"
              className="orbyven-start-card group relative overflow-hidden rounded-[34px] border border-white/12 bg-[#120d17] text-white shadow-[0_28px_100px_rgba(0,0,0,.24)]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_10%,rgba(234,201,255,.22),transparent_28%),radial-gradient(circle_at_86%_22%,rgba(137,93,255,.18),transparent_30%),linear-gradient(155deg,#201322_0%,#100c16_48%,#09090d_100%)]" />
              <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:38px_38px]" />
              <div className="absolute left-1/2 top-[18%] h-[58%] w-[62%] -translate-x-1/2 rotate-[-4deg] rounded-[30px] border border-white/12 bg-[#f5efe8]/95 shadow-[0_35px_80px_rgba(0,0,0,.32)] transition duration-700 group-hover:rotate-[-2deg] group-hover:scale-[1.03]">
                <div className="absolute inset-3 rounded-[23px] border border-[#3f2c48]/10" />
                <div className="absolute left-1/2 top-[18%] h-px w-20 -translate-x-1/2 bg-[#3f2c48]/18" />
                <div className="absolute left-1/2 top-[25%] -translate-x-1/2 text-center text-[#2c2031]">
                  <p className="text-[8px] font-semibold uppercase tracking-[.28em]">SAVE THE DATE</p>
                  <p className="mt-4 font-serif text-[26px] italic leading-none">A & M</p>
                  <p className="mt-4 text-[7px] uppercase tracking-[.22em] text-[#5b4a60]">RSVP · LOCATIONS · STORY</p>
                </div>
                <div className="absolute bottom-[18%] left-1/2 flex -translate-x-1/2 gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8c6c92]/35" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8c6c92]/65" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8c6c92]/35" />
                </div>
              </div>
              <div className="relative flex h-full min-h-[620px] flex-col justify-between p-6 sm:min-h-[680px] sm:p-7 lg:min-h-[780px]">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[9px] font-bold uppercase tracking-[.18em] text-white/60">01 · EVENIMENT</span>
                  <span className="rounded-full border border-white/16 bg-black/20 px-3 py-2 text-[8px] font-bold backdrop-blur-md">{PUBLIC_CHECKOUT_IS_DEMO ? "DEMO · TEST" : "PERSONALIZAT"}</span>
                </div>

                <div className="max-w-[420px]">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/18 px-3 py-2 text-[8px] font-semibold text-white/58 backdrop-blur-xl">
                    RSVP · LOCATIONS · STORY
                  </div>
                  <div className="mb-5 flex items-end gap-2">
                    <span className="text-[54px] font-semibold leading-none tracking-[-.075em]">{PUBLIC_OFFERS.invitation.priceLei}</span>
                    <span className="pb-1 text-[11px] font-semibold text-white/55">lei · o singură dată</span>
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
                    Vezi planul <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/porneste/oferta?offer=web"
              className="orbyven-start-card group relative overflow-hidden rounded-[34px] border border-white/12 bg-[#0b0d14] text-white shadow-[0_28px_100px_rgba(0,0,0,.24)]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_8%,rgba(70,112,255,.25),transparent_30%),radial-gradient(circle_at_15%_52%,rgba(71,70,238,.12),transparent_35%),linear-gradient(155deg,#0d1322_0%,#0a0c13_56%,#08090d_100%)]" />
              <div className="absolute left-[8%] right-[8%] top-[16%] h-[46%] overflow-hidden rounded-[28px] border border-white/12 bg-[#0d1018] shadow-[0_32px_90px_rgba(0,0,0,.38)] transition duration-700 group-hover:scale-[1.025]">
                <div className="flex h-10 items-center justify-between border-b border-white/8 px-4">
                  <div className="flex gap-1.5"><span className="h-2 w-2 rounded-full bg-white/16"/><span className="h-2 w-2 rounded-full bg-white/16"/><span className="h-2 w-2 rounded-full bg-white/16"/></div>
                  <span className="text-[7px] font-semibold tracking-[.18em] text-white/30">ORBYVEN WEB PREVIEW</span>
                </div>
                <div className="relative h-[calc(100%-40px)] p-5">
                  <div className="absolute right-[8%] top-[12%] h-40 w-40 rounded-full bg-[#7167ff]/18 blur-[45px]" />
                  <div className="relative max-w-[70%]">
                    <div className="h-3 w-20 rounded-full bg-[#a58bff]/70"/>
                    <div className="mt-5 h-8 w-[92%] rounded-[7px] bg-white/85"/>
                    <div className="mt-2 h-8 w-[70%] rounded-[7px] bg-white/85"/>
                    <div className="mt-5 h-2.5 w-[85%] rounded-full bg-white/14"/>
                    <div className="mt-2 h-2.5 w-[62%] rounded-full bg-white/10"/>
                    <div className="mt-6 h-10 w-32 rounded-full bg-white/88"/>
                  </div>
                </div>
              </div>
              <div className="relative flex h-full min-h-[620px] flex-col justify-between p-6 sm:min-h-[680px] sm:p-7 lg:min-h-[780px]">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[9px] font-bold uppercase tracking-[.18em] text-white/60">02 · WEB DESIGN</span>
                  <span className="rounded-full border border-[#a58bff]/35 bg-[#a58bff]/14 px-3 py-2 text-[8px] font-bold text-[#d3c8ff] backdrop-blur-md">{PUBLIC_CHECKOUT_IS_DEMO ? "DEMO · 30 ZILE" : "30 ZILE GRATUIT"}</span>
                </div>

                <div className="max-w-[470px]">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#a58bff]/20 bg-[#a58bff]/10 px-3 py-2 text-[8px] font-semibold text-[#d4caff] backdrop-blur-xl">
                    WEBSITE + 30 DAYS DASHBOARD
                  </div>
                  <div className="mb-5">
                    <div className="flex items-end gap-2">
                      <span className="text-[58px] font-semibold leading-none tracking-[-.08em]">{PUBLIC_OFFERS.web.priceLei}</span>
                      <span className="pb-1 text-[11px] font-semibold text-white/55">lei acum</span>
                    </div>
                    <p className="mt-2 text-[10px] font-semibold text-[#c9bbff]">apoi {PUBLIC_OFFERS.web.recurringLei} lei/lună după 30 zile</p>
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
                    Vezi planul <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/porneste/oferta?offer=advanced"
              className="orbyven-start-card group relative overflow-hidden rounded-[34px] border border-[#a58bff]/26 bg-[#0d0a17] text-white shadow-[0_30px_110px_rgba(71,48,160,.24)]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(145,102,255,.30),transparent_30%),radial-gradient(circle_at_20%_64%,rgba(75,70,238,.18),transparent_36%),linear-gradient(155deg,#17102b_0%,#0e0b18_54%,#09090d_100%)]" />
              <div className="absolute left-[8%] right-[8%] top-[13%] h-[50%] overflow-hidden rounded-[28px] border border-[#a58bff]/18 bg-[#0c0b13]/94 p-4 shadow-[0_34px_100px_rgba(0,0,0,.40)] transition duration-700 group-hover:scale-[1.025]">
                <div className="flex items-center justify-between">
                  <div><p className="text-[8px] font-bold uppercase tracking-[.18em] text-[#b9a6ff]">ORBYVEN WORKSPACE</p><p className="mt-1 text-[11px] font-semibold text-white/80">Business OS</p></div>
                  <span className="rounded-full border border-[#a58bff]/20 bg-[#a58bff]/10 px-2.5 py-1.5 text-[7px] font-bold text-[#cfc2ff]">ADVANCED</span>
                </div>
                <div className="mt-4 grid grid-cols-[.34fr_.66fr] gap-3">
                  <div className="grid gap-2">
                    {["Overview","Clienți","Lucrări","Oferte","Automatizări"].map((item,index)=>(
                      <div key={item} className={`rounded-[9px] border px-2.5 py-2 text-[7px] font-semibold ${index===0?"border-[#a58bff]/25 bg-[#a58bff]/12 text-white":"border-white/7 bg-white/[.025] text-white/45"}`}>{item}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {["Leads","Calendar","Devize","Stoc"].map((item,index)=>(
                      <div key={item} className="rounded-[12px] border border-white/8 bg-white/[.035] p-3">
                        <p className="text-[7px] uppercase tracking-[.12em] text-white/30">{item}</p>
                        <p className="mt-3 text-[18px] font-semibold tracking-[-.05em]">{[24,8,12,31][index]}</p>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-[#a58bff]/70" style={{width:[72,42,58,84][index]+"%"}}/></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative flex h-full min-h-[620px] flex-col justify-between p-6 sm:min-h-[680px] sm:p-7 lg:min-h-[780px]">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[9px] font-bold uppercase tracking-[.18em] text-white/60">03 · ECOSISTEM</span>
                  <span className="rounded-full border border-[#a58bff]/38 bg-[#a58bff]/16 px-3 py-2 text-[8px] font-bold text-[#d9ceff] backdrop-blur-md">{PUBLIC_CHECKOUT_IS_DEMO ? "DEMO · ADVANCED" : "ADVANCED"}</span>
                </div>

                <div className="max-w-[470px]">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#a58bff]/24 bg-[#a58bff]/12 px-3 py-2 text-[8px] font-semibold text-[#d8ceff] backdrop-blur-xl">
                    PERSONALIZAT MODULES · AUTOMATIONS · AI
                  </div>
                  <div className="mb-5 flex items-end gap-2">
                    <span className="text-[58px] font-semibold leading-none tracking-[-.08em]">{PUBLIC_OFFERS.advanced.priceLei}</span>
                    <span className="pb-1 text-[11px] font-semibold text-white/55">lei/lună</span>
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
                    Vezi planul <span className="transition-transform group-hover:translate-x-1">→</span>
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
