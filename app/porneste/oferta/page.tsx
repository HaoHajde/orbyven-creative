"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type CSSProperties, type ReactNode } from "react";

import SiteHeader from "@/components/SiteHeader";
import {
  PUBLIC_CHECKOUT_IS_DEMO,
  PUBLIC_OFFERS,
  isPublicOfferId,
  type PublicOfferId,
} from "@/lib/commerce/public-offers";

type Theme = "light" | "dark";

type VisualMeta = {
  eyebrow: string;
  titleTop: string;
  titleAccent: string;
  priceSuffix: string;
  priceDetail?: string;
  modules: string[];
};

const VISUAL_META: Record<PublicOfferId, VisualMeta> = {
  invitation: {
    eyebrow: "INVITAȚIE ONLINE",
    titleTop: "Invitație online",
    titleAccent: "personalizată",
    priceSuffix: "lei / plată unică",
    modules: ["RSVP", "Locații", "Countdown", "Poveste", "Galerie", "Maps"],
  },
  web: {
    eyebrow: "WEB DESIGN",
    titleTop: "Website-ul tău +",
    titleAccent: "30 zile Dashboard",
    priceSuffix: "lei acum",
    priceDetail: "apoi 499 lei / lună după 30 zile",
    modules: ["Website", "Responsive", "SEO", "Dashboard", "Clienți", "Task-uri"],
  },
  advanced: {
    eyebrow: "ADVANCED",
    titleTop: "Web Design + Dashboard +",
    titleAccent: "Module Personalizabile",
    priceSuffix: "lei / lună",
    modules: ["CRM", "Task-uri", "Calendar", "Devize", "Stoc", "Automatizări", "Custom"],
  },
};

function themeVars(theme: Theme) {
  return {
    "--bg": theme === "dark" ? "#08080c" : "#f8f8fb",
    "--surface": theme === "dark" ? "#101014" : "#ffffff",
    "--surface-2": theme === "dark" ? "#17171c" : "#f1f1f5",
    "--text": theme === "dark" ? "#f5f5f7" : "#17171b",
    "--muted": theme === "dark" ? "#aaaab2" : "#66666f",
    "--muted-2": theme === "dark" ? "#777781" : "#878790",
    "--border": theme === "dark" ? "rgba(255,255,255,.085)" : "rgba(18,18,24,.075)",
    "--border-strong": theme === "dark" ? "rgba(255,255,255,.15)" : "rgba(18,18,24,.14)",
    "--button": theme === "dark" ? "#f5f5f7" : "#17171b",
    "--button-text": theme === "dark" ? "#09090d" : "#ffffff",
    "--accent": "#7c5cff",
    "--home-violet": "#a58bff",
    "--accent-soft": theme === "dark" ? "rgba(126,93,255,.14)" : "rgba(112,78,255,.09)",
  } as CSSProperties;
}

function Glyph({ kind }: { kind: string }) {
  const common = "h-5 w-5";
  if (kind === "RSVP" || kind === "CRM" || kind === "Clienți") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common} aria-hidden="true">
        <circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.4" />
        <path d="M3.5 19c.7-4 3-6 5.5-6s4.8 2 5.5 6" /><path d="M14.2 14.5c2.8.2 4.7 1.7 5.3 4.5" />
      </svg>
    );
  }
  if (kind === "Locații" || kind === "Maps") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common} aria-hidden="true">
        <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" /><circle cx="12" cy="10" r="2" />
      </svg>
    );
  }
  if (kind === "Countdown" || kind === "Calendar") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common} aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4M17 3v4M3 10h18" />
      </svg>
    );
  }
  if (kind === "Poveste") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common} aria-hidden="true">
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
      </svg>
    );
  }
  if (kind === "Galerie") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common} aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="8.5" cy="9" r="1.5" /><path d="m5 17 4.5-4.5 3.5 3 2.5-2.5 3.5 4" />
      </svg>
    );
  }
  if (kind === "Website") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common} aria-hidden="true">
        <rect x="3" y="4" width="18" height="13" rx="2.5" /><path d="M8 21h8M12 17v4" />
      </svg>
    );
  }
  if (kind === "Responsive") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common} aria-hidden="true">
        <rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M10.5 18.5h3" />
      </svg>
    );
  }
  if (kind === "SEO") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common} aria-hidden="true">
        <path d="M4 19V9M10 19V5M16 19v-7M22 19V3" />
      </svg>
    );
  }
  if (kind === "Dashboard" || kind === "Custom") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common} aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (kind === "Task-uri") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common} aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="3" /><path d="m8 12 2.5 2.5L16 9" />
      </svg>
    );
  }
  if (kind === "Devize") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common} aria-hidden="true">
        <path d="M7 3h7l4 4v14H7z" /><path d="M14 3v5h5M10 13h5M10 17h5" />
      </svg>
    );
  }
  if (kind === "Stoc") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common} aria-hidden="true">
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.8 7.5 4.1 7.5-4.1M12 12v9" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={common} aria-hidden="true">
      <path d="m13 2-2 8h6l-8 12 2-9H5z" />
    </svg>
  );
}

function BrowserShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative rounded-[30px] border border-[#9d7aff]/40 bg-[#05060a] p-3 shadow-[0_38px_120px_rgba(0,0,0,.60),0_0_60px_rgba(112,76,255,.16)] ring-1 ring-white/[.025]">
      <div className="pointer-events-none absolute -inset-px rounded-[30px] bg-[linear-gradient(135deg,rgba(181,156,255,.22),transparent_28%,transparent_70%,rgba(104,69,255,.18))] opacity-70" />
      <div className="absolute left-1/2 top-1.5 z-20 h-2.5 w-20 -translate-x-1/2 rounded-b-xl bg-black/75" />
      <div className="relative overflow-hidden rounded-[21px] border border-white/10 bg-[#090a10]">{children}</div>
      <div className="mx-auto mt-2.5 h-1.5 w-[30%] rounded-full bg-[linear-gradient(90deg,transparent,rgba(167,141,255,.55),transparent)]" />
    </div>
  );
}

function InvitationVisual() {
  return (
    <div className="relative min-h-[590px] sm:min-h-[680px]">
      <div className="absolute inset-0 rounded-[42px] bg-[radial-gradient(circle_at_68%_16%,rgba(176,118,255,.40),transparent_28%),radial-gradient(circle_at_12%_58%,rgba(84,64,205,.21),transparent_36%),linear-gradient(180deg,rgba(81,52,160,.04),transparent)]" />
      <div className="absolute -inset-5 rounded-[48px] border border-[#8f6cff]/[.055] shadow-[0_0_100px_rgba(111,75,255,.08)]" />
      <div className="absolute inset-x-[8%] bottom-[7%] h-16 rounded-full bg-[#704cff]/20 blur-[36px]" />
      <div className="absolute left-[2%] right-[5%] top-[4%] scale-[1.015]">
        <BrowserShell>
          <div className="relative min-h-[390px] overflow-hidden bg-[radial-gradient(circle_at_20%_80%,rgba(255,230,211,.18),transparent_26%),radial-gradient(circle_at_78%_16%,rgba(255,255,255,.08),transparent_24%),linear-gradient(145deg,#17141d,#0f0d14_62%,#09090d)]">
            <div className="absolute -left-10 bottom-[-30px] h-44 w-44 rounded-full border-[24px] border-[#d2b9ff]/[.06]" />
            <div className="absolute -right-16 top-[-40px] h-52 w-52 rounded-full border-[28px] border-white/[.035]" />
            <div className="relative flex items-center justify-between px-6 py-5 text-white/60">
              <span className="font-serif text-[15px] tracking-[.22em]">A | M</span>
              <div className="hidden items-center gap-5 text-[8px] sm:flex"><span>Acasă</span><span>Poveste</span><span>Locație</span><span>Galerie</span><span className="rounded-full bg-[#f2e6d7] px-4 py-2 font-semibold text-[#352e37]">RSVP</span></div>
            </div>
            <div className="relative mx-auto mt-8 max-w-[600px] px-6 text-center text-white">
              <p className="text-[7px] font-semibold uppercase tracking-[.36em] text-white/48">SAVE THE DATE</p>
              <p className="mt-5 font-serif text-[clamp(34px,5vw,58px)] italic leading-none text-[#f4ede5]">A & M</p>
              <p className="mt-5 text-[8px] uppercase tracking-[.28em] text-white/55">14 SEPTEMBRIE · 18:00</p>
              <div className="mx-auto mt-7 grid max-w-[390px] grid-cols-4 gap-2">
                {[["102","Zile"],["14","Ore"],["37","Min"],["21","Sec"]].map(([n,l])=>(
                  <div key={l} className="rounded-[13px] border border-white/10 bg-white/[.045] px-2 py-3">
                    <p className="text-[18px] font-semibold">{n}</p><p className="mt-1 text-[6px] text-white/45">{l}</p>
                  </div>
                ))}
              </div>
              <div className="mx-auto mt-6 w-fit rounded-full bg-[#f2e6d7] px-5 py-2.5 text-[8px] font-semibold text-[#352e37]">Confirmă prezența →</div>
            </div>
          </div>
        </BrowserShell>
      </div>

      <div className="absolute bottom-[1%] right-[1%] hidden w-[190px] rounded-[34px] border border-[#a98dff]/32 bg-[#07080c] p-2 shadow-[0_30px_90px_rgba(0,0,0,.58),0_0_38px_rgba(126,93,255,.13)] sm:block">
        <div className="overflow-hidden rounded-[27px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,235,220,.10),transparent_24%),linear-gradient(180deg,#17141d,#0c0b10)] px-4 py-5 text-center text-white">
          <p className="font-serif text-[12px] tracking-[.2em]">A | M</p>
          <p className="mt-7 text-[6px] tracking-[.3em] text-white/42">SAVE THE DATE</p>
          <p className="mt-4 font-serif text-[24px] italic">A & M</p>
          <div className="mt-7 rounded-full bg-[#f2e6d7] px-4 py-2.5 text-[7px] font-semibold text-[#352e37]">RSVP →</div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {["Locație","Program","Poveste","Galerie"].map((x)=><div key={x} className="rounded-[12px] border border-white/8 bg-white/[.035] px-2 py-3 text-[6px] text-white/65">{x}</div>)}
          </div>
        </div>
      </div>

      <div className="absolute left-[-2%] top-[32%] hidden w-[158px] rounded-[20px] border border-[#b08fff]/42 bg-[#100c18]/96 p-4 text-white shadow-[0_28px_88px_rgba(0,0,0,.54),0_0_30px_rgba(151,111,255,.14)] backdrop-blur-xl md:block">
        <div className="text-[#c2b2ff]"><Glyph kind="RSVP" /></div>
        <p className="mt-3 text-[10px] font-semibold">RSVP live</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-[7px] text-white/42">confirmări instant</span>
        </div>
      </div>
    </div>
  );
}

function WebVisual() {
  return (
    <div className="relative min-h-[590px] sm:min-h-[680px]">
      <div className="absolute inset-0 rounded-[42px] bg-[radial-gradient(circle_at_72%_16%,rgba(95,110,255,.40),transparent_28%),radial-gradient(circle_at_15%_60%,rgba(126,93,255,.21),transparent_36%),linear-gradient(180deg,rgba(81,52,160,.04),transparent)]" />
      <div className="absolute -inset-5 rounded-[48px] border border-[#8f6cff]/[.055] shadow-[0_0_100px_rgba(111,75,255,.08)]" />
      <div className="absolute inset-x-[7%] bottom-[7%] h-16 rounded-full bg-[#5b55ff]/20 blur-[38px]" />
      <div className="absolute left-[0%] right-[9%] top-[5%] scale-[1.025]">
        <BrowserShell>
          <div className="relative min-h-[390px] overflow-hidden bg-[radial-gradient(circle_at_78%_20%,rgba(112,95,255,.18),transparent_26%),linear-gradient(145deg,#111522,#0b0d14_62%,#09090d)] p-6 text-white">
            <div className="flex items-center justify-between text-[7px] text-white/45">
              <span className="font-semibold tracking-[.14em]">ORBYVEN</span>
              <div className="hidden gap-5 sm:flex"><span>Acasă</span><span>Servicii</span><span>Portofoliu</span><span>Contact</span></div>
            </div>
            <div className="mt-14 max-w-[62%]">
              <div className="h-2 w-20 rounded-full bg-[#a58bff]/65" />
              <p className="mt-5 text-[30px] font-semibold leading-[.95] tracking-[-.045em]">Website-uri care aduc rezultate.</p>
              <div className="mt-4 h-2 w-[92%] rounded-full bg-white/10" />
              <div className="mt-2 h-2 w-[68%] rounded-full bg-white/8" />
              <div className="mt-7 inline-flex rounded-full bg-white px-5 py-2.5 text-[8px] font-semibold text-[#09090d]">Începe acum →</div>
            </div>
            <div className="absolute bottom-8 right-7 top-20 w-[31%] rounded-[18px] border border-white/8 bg-[linear-gradient(155deg,rgba(255,255,255,.08),rgba(111,89,255,.12))]">
              <div className="absolute inset-5 rounded-[15px] border border-white/[.06]" />
              <div className="absolute bottom-7 left-6 text-[7px] font-semibold tracking-[.28em] text-white/35">BRAND<br/>IDEAS<br/>RESULTS</div>
            </div>
          </div>
        </BrowserShell>
      </div>

      <div className="absolute bottom-[1%] right-[1%] hidden w-[194px] rounded-[34px] border border-[#a98dff]/32 bg-[#07080c] p-2 shadow-[0_30px_90px_rgba(0,0,0,.58),0_0_38px_rgba(126,93,255,.13)] sm:block">
        <div className="overflow-hidden rounded-[27px] bg-[#0d0e14] p-4 text-white">
          <div className="flex items-center justify-between"><span className="text-[8px] font-semibold">Dashboard</span><span className="h-5 w-5 rounded-full bg-[#a58bff]/35" /></div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {[["124","Clienți"],["18","Task-uri"]].map(([n,l])=><div key={l} className="rounded-[12px] bg-white/[.045] p-3"><p className="text-[16px] font-semibold">{n}</p><p className="mt-1 text-[6px] text-white/40">{l}</p></div>)}
          </div>
          <div className="mt-3 rounded-[14px] bg-white/[.045] p-3">
            <div className="flex items-center justify-between"><span className="text-[7px] text-white/50">Progres</span><span className="text-[14px] font-semibold text-[#b9a6ff]">75%</span></div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full w-3/4 rounded-full bg-[#a58bff]" /></div>
          </div>
          <div className="mt-3 space-y-2">{["Website nou","Client contactat","Task finalizat"].map(x=><div key={x} className="rounded-[10px] bg-white/[.035] px-3 py-2 text-[6px] text-white/55">{x}</div>)}</div>
        </div>
      </div>

      <div className="absolute left-[-2%] top-[30%] hidden w-[164px] rounded-[20px] border border-[#b08fff]/42 bg-[#100c18]/96 p-4 text-white shadow-[0_28px_88px_rgba(0,0,0,.54),0_0_30px_rgba(151,111,255,.14)] backdrop-blur-xl md:block">
        <div className="flex items-center justify-between">
          <span className="text-[#c2b2ff]"><Glyph kind="Website" /></span>
          <span className="rounded-full bg-[#8f6cff]/16 px-2 py-1 text-[6px] font-bold text-[#cdbfff]">LIVE</span>
        </div>
        <p className="mt-3 text-[10px] font-semibold">Website</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full w-[86%] rounded-full bg-[#8f6cff]" /></div>
      </div>
    </div>
  );
}

function AdvancedVisual() {
  return (
    <div className="relative min-h-[610px] sm:min-h-[700px]">
      <div className="absolute inset-0 rounded-[42px] bg-[radial-gradient(circle_at_74%_16%,rgba(155,103,255,.44),transparent_28%),radial-gradient(circle_at_15%_64%,rgba(83,68,190,.23),transparent_35%),linear-gradient(180deg,rgba(81,52,160,.05),transparent)]" />
      <div className="absolute -inset-5 rounded-[48px] border border-[#8f6cff]/[.06] shadow-[0_0_110px_rgba(111,75,255,.10)]" />
      <div className="absolute inset-x-[6%] bottom-[7%] h-16 rounded-full bg-[#704cff]/24 blur-[40px]" />
      <div className="absolute left-[2%] right-[2%] top-[3%] scale-[1.025]">
        <BrowserShell>
          <div className="min-h-[400px] bg-[#0c0d13] p-4 text-white">
            <div className="grid h-full grid-cols-[.23fr_.77fr] gap-3">
              <div className="rounded-[15px] border border-white/7 bg-white/[.025] p-3">
                <p className="text-[8px] font-semibold tracking-[.14em] text-white/65">ORBYVEN</p>
                <div className="mt-6 space-y-2">
                  {["Dashboard","CRM","Task-uri","Calendar","Devize","Stoc","Automatizări","Module"].map((x,i)=><div key={x} className={`rounded-[9px] px-3 py-2 text-[6px] ${i===0?"bg-[#6d4cff] text-white":"text-white/38"}`}>{x}</div>)}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between"><div><p className="text-[8px] text-white/35">Bun venit,</p><p className="mt-1 text-[15px] font-semibold">Dashboard</p></div><div className="h-7 w-28 rounded-full bg-white/[.045]" /></div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[["124","Clienți"],["18","Devize"],["7","Proiecte"],["12","Task-uri"]].map(([n,l])=><div key={l} className="rounded-[12px] border border-white/7 bg-white/[.035] p-3"><p className="text-[17px] font-semibold">{n}</p><p className="mt-1 text-[6px] text-white/35">{l}</p></div>)}
                </div>
                <div className="mt-3 grid grid-cols-[1.25fr_.75fr] gap-2">
                  <div className="rounded-[14px] border border-white/7 bg-white/[.035] p-3">
                    <div className="flex justify-between"><span className="text-[7px] text-white/40">Creștere</span><span className="text-[12px] font-semibold text-emerald-300">+45%</span></div>
                    <svg viewBox="0 0 220 80" className="mt-3 h-[92px] w-full" aria-hidden="true"><path d="M4 62 C32 58,42 32,65 42 S95 52,112 28 S145 38,164 19 S193 32,216 10" fill="none" stroke="#9f7cff" strokeWidth="3"/><path d="M4 62 C32 58,42 32,65 42 S95 52,112 28 S145 38,164 19 S193 32,216 10 L216 80 L4 80Z" fill="url(#g)" opacity=".15"/><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#9f7cff"/><stop offset="1" stopColor="#9f7cff" stopOpacity="0"/></linearGradient></defs></svg>
                  </div>
                  <div className="rounded-[14px] border border-white/7 bg-white/[.035] p-3">
                    <p className="text-[7px] text-white/40">Proiecte</p>
                    <div className="mx-auto mt-4 grid h-20 w-20 place-items-center rounded-full border-[8px] border-[#815cff]/30 text-[17px] font-semibold">75%</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-[14px] border border-white/7 bg-white/[.035] p-3 text-[7px] text-white/50">Activitate recentă</div>
                  <div className="rounded-[14px] border border-white/7 bg-white/[.035] p-3 text-[7px] text-white/50">Automatizări · ON</div>
                </div>
              </div>
            </div>
          </div>
        </BrowserShell>
      </div>

      <div className="absolute left-[-3%] top-[22%] hidden w-[154px] rounded-[20px] border border-[#b08fff]/42 bg-[#100c18]/96 p-4 text-white shadow-[0_30px_92px_rgba(0,0,0,.56),0_0_34px_rgba(151,111,255,.15)] backdrop-blur-xl md:block">
        <div className="text-[#bcaaff]"><Glyph kind="CRM"/></div><p className="mt-3 text-[10px] font-semibold">CRM</p><p className="mt-1 text-[6px] text-white/35">Clienți & lead-uri</p>
      </div>
      <div className="absolute bottom-[7%] left-[0%] hidden w-[160px] rounded-[20px] border border-[#b08fff]/42 bg-[#100c18]/96 p-4 text-white shadow-[0_30px_92px_rgba(0,0,0,.56),0_0_34px_rgba(151,111,255,.15)] backdrop-blur-xl md:block">
        <div className="text-[#bcaaff]"><Glyph kind="Task-uri"/></div><p className="mt-3 text-[10px] font-semibold">Task-uri</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full w-[62%] rounded-full bg-[#8f6cff]" /></div>
      </div>
      <div className="absolute right-[-3%] top-[20%] hidden w-[162px] rounded-[20px] border border-[#b08fff]/42 bg-[#100c18]/96 p-4 text-white shadow-[0_30px_92px_rgba(0,0,0,.56),0_0_34px_rgba(151,111,255,.15)] backdrop-blur-xl md:block">
        <div className="text-[#bcaaff]"><Glyph kind="Calendar"/></div><p className="mt-3 text-[10px] font-semibold">Calendar</p><p className="mt-1 text-[6px] text-white/35">Programări</p>
      </div>
    </div>
  );
}

function HeroVisual({ offerId }: { offerId: PublicOfferId }) {
  if (offerId === "invitation") return <InvitationVisual />;
  if (offerId === "web") return <WebVisual />;
  return <AdvancedVisual />;
}

function QuickModules({ offerId }: { offerId: PublicOfferId }) {
  const items =
    offerId === "invitation"
      ? ["RSVP", "Locații", "Countdown", "Galerie"]
      : offerId === "web"
        ? ["Website", "Responsive", "SEO", "Dashboard"]
        : ["CRM", "Task-uri", "Calendar", "AI", "Custom"];

  return (
    <div className="mt-8 flex flex-wrap gap-2.5">
      {items.map((item) => (
        <div
          key={item}
          className="group flex h-12 items-center gap-2.5 rounded-[15px] border border-[#9c78ff]/24 bg-[#0e0c16]/92 px-3.5 text-white shadow-[0_10px_28px_rgba(0,0,0,.20)] transition hover:-translate-y-0.5 hover:border-[#a98dff]/55 hover:bg-[#151024]"
        >
          <span className="text-[#b9a6ff] transition group-hover:text-white"><Glyph kind={item} /></span>
          <span className="text-[9px] font-semibold text-white/68">{item}</span>
        </div>
      ))}
    </div>
  );
}

function ModulesStrip({ offerId }: { offerId: PublicOfferId }) {
  const modules = VISUAL_META[offerId].modules;
  return (
    <div className="relative overflow-x-auto rounded-[28px] border border-[#9d7aff]/22 bg-[#090a10]/96 p-3 text-white shadow-[0_26px_80px_rgba(0,0,0,.34),0_0_34px_rgba(126,93,255,.055)] ring-1 ring-white/[.018] [scrollbar-width:none]">
      <div className="relative flex min-w-max items-center gap-2">
        <div className="flex h-[74px] w-[210px] shrink-0 items-center gap-3 px-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#8d68ff]/12 text-[#b9a6ff]"><Glyph kind={offerId === "invitation" ? "RSVP" : offerId === "web" ? "Website" : "Dashboard"} /></span>
          <span className="text-[13px] font-semibold">Module incluse</span>
        </div>
        {modules.map((module, index) => (
          <div key={module} className="flex items-center">
            <span className="mx-1 h-px w-5 bg-[linear-gradient(90deg,transparent,#8f6cff,transparent)]" />
            <div className={`flex h-[74px] min-w-[136px] items-center justify-center gap-3 rounded-[20px] border px-5 transition ${offerId === "web" && module === "Dashboard" ? "border-[#9e7aff]/78 bg-[#8f6cff]/17 shadow-[0_0_38px_rgba(128,89,255,.24)]" : "border-white/10 bg-[#11121a] hover:border-[#9d7aff]/36 hover:bg-[#151221]"}`}>
              <span className="text-[#a78dff]"><Glyph kind={module} /></span>
              <span className="text-[11px] font-medium">{module}</span>
            </div>
            {index === modules.length - 1 ? <span className="w-2" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckoutPanel({
  offerId,
  confirmed,
  onToggle,
}: {
  offerId: PublicOfferId;
  confirmed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-[30px] border border-[#9d7aff]/24 bg-[#090a10]/96 p-4 text-white shadow-[0_30px_90px_rgba(0,0,0,.38),0_0_38px_rgba(126,93,255,.06)] ring-1 ring-white/[.018] lg:grid-cols-[1.05fr_.95fr]">
      <div className="flex min-w-0 items-center gap-2 overflow-x-auto [scrollbar-width:none]">
        {[
          ["1", "Alegi", "Devize"],
          ["2", "Confirmi", "Task-uri"],
          ["3", "Stripe Checkout", "Website"],
        ].map(([step, label, icon], index) => (
          <div key={step} className="flex shrink-0 items-center">
            <div className="relative flex h-[104px] w-[180px] items-center gap-3 rounded-[20px] border border-white/10 bg-[#11121a] px-5 shadow-[0_14px_34px_rgba(0,0,0,.18)]">
              <span className={`absolute -top-3 left-1/2 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full border text-[11px] font-bold ${index === 0 ? "border-[#8f6cff] bg-[#8f6cff] text-white shadow-[0_0_24px_rgba(143,108,255,.5)]" : "border-[#8f6cff]/50 bg-[#16101f] text-[#bdaaff]"}`}>{step}</span>
              <span className="mt-2 text-[#b39aff]"><Glyph kind={icon} /></span>
              <span className="mt-2 text-[11px] font-medium">{label}</span>
            </div>
            {index < 2 ? <span className="mx-3 text-[#8f6cff]">→</span> : null}
          </div>
        ))}
      </div>

      <div className="border-t border-white/8 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
        <button
          type="button"
          onClick={onToggle}
          className={`flex w-full items-center justify-between rounded-[18px] border px-4 py-3.5 text-left transition ${confirmed ? "border-[#9d7aff]/45 bg-[#8f6cff]/12" : "border-white/8 bg-white/[.025] hover:bg-white/[.04]"}`}
        >
          <div className="flex items-center gap-3">
            <span className={`grid h-9 w-9 place-items-center rounded-full border text-[13px] font-bold ${confirmed ? "border-[#9d7aff] bg-[#8f6cff] text-white shadow-[0_0_24px_rgba(143,108,255,.45)]" : "border-white/12 text-transparent"}`}>✓</span>
            <span className="text-[13px] font-semibold">Confirmă selecția</span>
          </div>
          {PUBLIC_CHECKOUT_IS_DEMO ? <span className="rounded-full border border-white/8 bg-white/[.025] px-3 py-2 text-[7px] font-bold text-white/45">MOD TEST / DEMO</span> : null}
        </button>

        <Link
          href={confirmed ? `/porneste/plata?offer=${offerId}` : "#"}
          aria-disabled={!confirmed}
          onClick={(event) => {
            if (!confirmed) event.preventDefault();
          }}
          className={`mt-3 flex h-14 w-full items-center justify-center gap-4 rounded-[17px] text-[14px] font-semibold transition ${confirmed ? "bg-[linear-gradient(90deg,#aa6dff,#6f52ff_52%,#5987ff)] text-white shadow-[0_0_44px_rgba(122,76,255,.42)] hover:brightness-110" : "cursor-not-allowed bg-white/[.045] text-white/25"}`}
        >
          <span>Confirmă și continuă</span><span>→</span>
        </Link>
        <div className="mt-3 flex items-center justify-center gap-2 text-[8px] text-white/30">
          <span>▣</span><span>Stripe Checkout</span>
        </div>
      </div>
    </div>
  );
}

function OfferPageContent() {
  const searchParams = useSearchParams();
  const rawOffer = searchParams.get("offer");
  const offerId: PublicOfferId | null = isPublicOfferId(rawOffer) ? rawOffer : null;
  const [theme, setTheme] = useState<Theme>("dark");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const saved = localStorage.getItem("studio-theme");
      const next: Theme =
        saved === "dark" || saved === "light"
          ? saved
          : matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
      setTheme(next);
      document.documentElement.style.colorScheme = next;
      document.body.style.backgroundColor = next === "dark" ? "#08080c" : "#f8f8fb";
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      localStorage.setItem("studio-theme", next);
      document.documentElement.style.colorScheme = next;
      document.body.style.backgroundColor = next === "dark" ? "#08080c" : "#f8f8fb";
      return next;
    });
  };

  useEffect(() => {
    setConfirmed(false);
  }, [offerId]);

  if (!offerId) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#08080c] px-5 text-white">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#a58bff]">ORBYVEN</p>
          <h1 className="mt-4 text-[40px] font-semibold tracking-[-.055em]">Oferta nu a fost găsită.</h1>
          <Link href="/contact" className="mt-7 inline-flex h-12 items-center rounded-full bg-white px-5 text-[12px] font-semibold text-[#09090d]">Înapoi la planuri</Link>
        </div>
      </main>
    );
  }

  const offer = PUBLIC_OFFERS[offerId];
  const meta = VISUAL_META[offerId];

  return (
    <main
      style={{
        ...themeVars(theme),
        fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif",
        background:
          theme === "dark"
            ? "radial-gradient(circle at 74% 8%,rgba(102,65,235,.18),transparent 28%),radial-gradient(circle at 20% 24%,rgba(71,48,160,.10),transparent 24%),linear-gradient(180deg,#05060a 0%,#07070b 48%,#05060a 100%)"
            : "radial-gradient(circle at 78% 12%,rgba(112,78,255,.10),transparent 28%),linear-gradient(180deg,#fbfaff 0%,#f5f5f8 100%)",
      }}
      className="relative min-h-screen overflow-x-hidden text-[var(--text)] antialiased"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[940px] overflow-hidden">
        <div className="absolute left-[-14rem] top-[-14rem] h-[44rem] w-[44rem] rounded-full border-[72px] border-[#7c5cff]/[.085] shadow-[0_0_80px_rgba(126,93,255,.08)]" />
        <div className="absolute right-[-3%] top-[2rem] h-[39rem] w-[39rem] rounded-full bg-[#704cff]/[.12] blur-[125px]" />
        <div className="absolute left-[41%] top-[7rem] h-[34rem] w-[34rem] rounded-full border border-[#8f6cff]/[.08] shadow-[0_0_90px_rgba(126,93,255,.08)]" />
        <div className="absolute left-[43%] top-[10rem] h-px w-[48%] bg-[linear-gradient(90deg,transparent,rgba(170,133,255,.60),transparent)] shadow-[0_0_30px_rgba(126,93,255,.34)]" />
      </div>

      <SiteHeader theme={theme} compact={false} activePage="contact" onToggleTheme={toggleTheme} />

      <section className="relative z-10 px-5 pb-16 pt-28 sm:px-6 md:px-10 md:pb-20 md:pt-34">
        <div className="mx-auto max-w-[1500px]">
          <Link href="/contact" className="inline-flex items-center gap-2 text-[9px] font-semibold text-[var(--muted)] transition hover:text-[var(--text)]">← Planuri</Link>

          <div className="mt-6 grid items-center gap-8 lg:grid-cols-[.66fr_1.34fr] xl:gap-12">
            <div className="min-w-0">
              <span className="inline-flex rounded-full border border-[#8f6cff]/45 bg-[#8f6cff]/10 px-5 py-2.5 text-[9px] font-bold tracking-[.18em] text-[#b9a6ff] shadow-[0_0_28px_rgba(126,93,255,.12)]">{meta.eyebrow}</span>

              <h1 className="mt-7 max-w-[720px] text-[clamp(52px,5.8vw,94px)] font-semibold leading-[.88] tracking-[-.075em] drop-shadow-[0_8px_28px_rgba(0,0,0,.22)]">
                {meta.titleTop}
                <br />
                <span className="bg-[linear-gradient(90deg,#9b73ff,#c084ff)] bg-clip-text text-transparent">{meta.titleAccent}</span>
              </h1>

              <div className="mt-8">
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  <span className="text-[clamp(46px,4.8vw,74px)] font-semibold leading-none tracking-[-.075em] text-white drop-shadow-[0_6px_20px_rgba(0,0,0,.28)]">{offer.priceLei}</span>
                  <span className="pb-1.5 text-[clamp(17px,1.7vw,28px)] font-medium text-[var(--home-violet)]">{meta.priceSuffix}</span>
                </div>
                {meta.priceDetail ? <p className="mt-3 text-[14px] font-medium text-[var(--muted)]">{meta.priceDetail}</p> : null}
              </div>

              <QuickModules offerId={offerId} />
            </div>

            <div className="min-w-0">
              <HeroVisual offerId={offerId} />
            </div>
          </div>

          <div className="mt-7">
            <ModulesStrip offerId={offerId} />
          </div>

          <div className="mt-5">
            <CheckoutPanel offerId={offerId} confirmed={confirmed} onToggle={() => setConfirmed((current) => !current)} />
          </div>
        </div>
      </section>
    </main>
  );
}

export default function OfferPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#08080c]" />}>
      <OfferPageContent />
    </Suspense>
  );
}
