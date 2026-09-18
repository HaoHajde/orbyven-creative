"use client";

import type { CSSProperties, ReactNode } from "react";
import HaoHeroVisual from "@/components/pilot005/HaoHeroVisual";

export type FeaturedPreviewKind = "obsidian" | "asphalt" | "florist" | "wedding" | "baptismGirl" | "hao";

function BrowserFrame({
  children,
  url,
  dark = false,
  className = "",
}: {
  children: ReactNode;
  url: string;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative h-full min-h-[330px] overflow-hidden rounded-[26px] border shadow-[0_24px_80px_rgba(0,0,0,.15)] sm:min-h-[370px] ${dark ? "border-white/10 bg-[#080808]" : "border-black/10 bg-white"} ${className}`}
    >
      <div className={`relative z-30 flex h-8 items-center gap-2 border-b px-3 ${dark ? "border-white/8 bg-black/70" : "border-black/8 bg-white/82"}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-[#ff6b61]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#f1bd3f]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#58c56d]" />
        <span className={`ml-2 truncate text-[6px] font-medium tracking-[.02em] ${dark ? "text-white/32" : "text-black/34"}`}>
          {url}
        </span>
      </div>
      <div className="relative min-h-[calc(100%-2rem)]">{children}</div>
    </div>
  );
}

function MiniNav({
  brand,
  action,
  dark = false,
  accent,
}: {
  brand: string;
  action: string;
  dark?: boolean;
  accent?: string;
}) {
  return (
    <div className={`relative z-20 flex items-center justify-between gap-3 border-b px-4 py-3 ${dark ? "border-white/10" : "border-black/8"}`}>
      <div className="flex items-center gap-2">
        <span
          className="grid h-7 w-7 place-items-center rounded-full text-[7px] font-black"
          style={{ background: accent ?? (dark ? "#d7b66b" : "#111"), color: dark ? "#111" : "#fff" }}
        >
          {brand.slice(0, 2).toUpperCase()}
        </span>
        <span className={`text-[8px] font-bold tracking-[-.02em] ${dark ? "text-white/90" : "text-black/78"}`}>{brand}</span>
      </div>
      <div className={`hidden items-center gap-3 text-[5px] font-semibold sm:flex ${dark ? "text-white/38" : "text-black/38"}`}>
        <span>Acasă</span><span>Servicii</span><span>Galerie</span>
      </div>
      <span
        className="rounded-full px-3 py-2 text-[6px] font-bold"
        style={{ background: accent ?? (dark ? "#d7b66b" : "#111"), color: dark ? "#111" : "#fff" }}
      >
        {action}
      </span>
    </div>
  );
}

export default function FeaturedTemplatePreview({ kind }: { kind: FeaturedPreviewKind }) {
  if (kind === "obsidian") {
    return (
      <BrowserFrame url="obsidian-moments.ro" dark>
        <div className="relative min-h-[338px] overflow-hidden bg-[#090909] px-5 pb-6 pt-4 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(216,180,56,.18),transparent_30%),radial-gradient(circle_at_18%_72%,rgba(216,180,56,.08),transparent_25%)]" />
          <div className="absolute inset-0 opacity-[.045] [background-image:radial-gradient(circle_at_center,#d8b438_0.6px,transparent_0.6px)] [background-size:9px_9px]" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[url('/obsidian/mark.svg')] bg-cover bg-center" />
              <div>
                <p className="text-[7px] font-semibold">Obsidian Moments 360</p>
                <p className="text-[4px] uppercase tracking-[.18em] text-[#d8b438]/58">premium event experience</p>
              </div>
            </div>
            <span className="rounded-full bg-[#d8b438] px-3 py-2 text-[5px] font-black text-black">Verifică data</span>
          </div>
          <div className="relative z-10 flex min-h-[270px] flex-col items-center justify-center text-center">
            <div className="relative h-24 w-24 rounded-full bg-[url('/obsidian/mark.svg')] bg-cover bg-center shadow-[0_0_70px_rgba(216,180,56,.16)] sm:h-28 sm:w-28" />
            <p className="mt-4 text-[5px] font-bold uppercase tracking-[.28em] text-[#d8b438]/78">Premium Event Experience</p>
            <h3 className="mt-2 text-[30px] font-semibold leading-[.84] tracking-[-.072em] sm:text-[38px]">
              Capturăm momente.<br /><span className="text-[#d8b438]">Creăm amintiri.</span>
            </h3>
          </div>
        </div>
      </BrowserFrame>
    );
  }

  if (kind === "asphalt") {
    const bg = {
      backgroundImage:
        "linear-gradient(90deg,rgba(12,14,15,.92),rgba(12,14,15,.58) 52%,rgba(12,14,15,.18)),url('https://images.pexels.com/photos/4390530/pexels-photo-4390530.jpeg?auto=compress&cs=tinysrgb&w=1200')",
    } as CSSProperties;

    return (
      <BrowserFrame url="viaforte.ro" dark>
        <div className="min-h-[338px] bg-[#111315] text-white">
          <MiniNav brand="VIAFORTE" action="Cere ofertă" dark accent="#f4a51c" />
          <div className="relative min-h-[285px] bg-cover bg-center px-5 py-7" style={bg}>
            <div className="relative z-10 flex min-h-[230px] max-w-[68%] flex-col justify-center">
              <p className="text-[5px] font-black uppercase tracking-[.16em] text-[#f4a51c]">București & împrejurimi</p>
              <h3 className="mt-3 text-[34px] font-black leading-[.82] tracking-[-.072em] sm:text-[44px]">Asfaltăm suprafețe care trebuie să țină.</h3>
              <div className="mt-4 flex gap-2">
                <span className="rounded-[7px] bg-[#f4a51c] px-3 py-2 text-[6px] font-black text-[#111315]">Solicită evaluare</span>
                <span className="rounded-[7px] border border-white/15 bg-black/20 px-3 py-2 text-[6px] font-bold">Vezi lucrările</span>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 rounded-[12px] border border-white/12 bg-black/55 px-3 py-2 backdrop-blur">
              <p className="text-[4px] uppercase tracking-[.12em] text-white/38">status</p>
              <p className="mt-1 text-[6px] font-bold text-[#75e29c]">● Operațional</p>
            </div>
          </div>
        </div>
      </BrowserFrame>
    );
  }

  if (kind === "florist") {
    const image = {
      backgroundImage:
        "linear-gradient(90deg,rgba(255,250,244,.10),rgba(255,250,244,0)),url('https://luxuryflowersmiami.com/cdn/shop/files/3602243250_2000x1616.jpg?v=1733661671')",
    } as CSSProperties;

    return (
      <BrowserFrame url="maison-fleur.ro">
        <div className="min-h-[338px] bg-[#fffaf4] text-[#251b1d]">
          <div className="bg-[#7b2431] py-1.5 text-center text-[4px] font-semibold uppercase tracking-[.12em] text-white">Livrare locală · Bragadiru</div>
          <div className="flex items-center justify-between border-b border-[#7b2431]/10 bg-white/55 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#7b2431] text-[10px] text-white">✿</span><span className="font-serif text-[12px]">Maison Fleur</span></div>
            <span className="rounded-full border border-[#7b2431]/25 px-3 py-2 text-[5px] font-semibold text-[#7b2431]">Coșul meu · 0</span>
          </div>
          <div className="grid min-h-[285px] grid-cols-[.9fr_1.1fr]">
            <div className="flex flex-col justify-center px-5 py-6">
              <p className="text-[5px] font-bold uppercase tracking-[.15em] text-[#7b2431]">Flori proaspete · Bragadiru</p>
              <h3 className="mt-3 font-serif text-[34px] leading-[.84] tracking-[-.05em] sm:text-[42px]">Gesturi care înfloresc.</h3>
              <p className="mt-3 max-w-xs text-[6px] leading-3 text-[#66565a]">Buchete și aranjamente făcute local, cu livrare rapidă.</p>
              <span className="mt-4 w-fit rounded-full bg-[#7b2431] px-3 py-2 text-[5px] font-semibold text-white">Alege un buchet</span>
            </div>
            <div className="relative min-h-[285px] bg-cover bg-center" style={image}>
              <div className="absolute bottom-4 left-4 rounded-[12px] bg-white/80 px-3 py-2 shadow-sm backdrop-blur">
                <p className="text-[5px] font-bold">Comandă până la 14:00</p>
                <p className="text-[4px] text-black/48">livrare în aceeași zi</p>
              </div>
            </div>
          </div>
        </div>
      </BrowserFrame>
    );
  }


  if (kind === "baptismGirl") {
    return (
      <BrowserFrame url="botezul-anastasiei.ro">
        <div className="relative min-h-[338px] overflow-hidden bg-[#fff8f5] text-[#5f2631]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,.96),transparent_28%),radial-gradient(circle_at_82%_24%,rgba(225,154,166,.22),transparent_28%),linear-gradient(135deg,#fffaf7,#f9e9e7)]" />
          <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full border border-[#c79b58]/18" />
          <div className="absolute -left-10 bottom-8 h-36 w-36 rounded-full bg-[#e9b7c0]/18 blur-3xl" />

          <div className="relative z-10 mx-4 mt-3 flex items-center justify-between rounded-[15px] border border-white/85 bg-white/68 px-4 py-2.5 shadow-sm backdrop-blur">
            <div>
              <p className="font-serif text-[10px] font-semibold tracking-[-.03em]">Anastasia ♡</p>
              <p className="text-[4px] uppercase tracking-[.17em] text-[#ae7a83]">un început frumos</p>
            </div>
            <div className="hidden gap-2 text-[4px] font-semibold text-[#6e4c52]/55 sm:flex"><span>Acasă</span><span>Poveste</span><span>Program</span><span>RSVP</span></div>
            <span className="rounded-full bg-[#d77486] px-3 py-1.5 text-[5px] font-bold text-white">Confirmă</span>
          </div>

          <div className="relative z-10 grid min-h-[286px] grid-cols-[1.02fr_.98fr] items-center gap-3 px-5 py-5">
            <div>
              <p className="text-[5px] font-bold uppercase tracking-[.22em] text-[#c69a58]">Cu iubire · 15 mai 2027</p>
              <h3 className="mt-3 font-serif text-[31px] font-semibold leading-[.84] tracking-[-.055em] sm:text-[39px]">
                Botezul micuței<br /><span className="italic text-[#d77486]">Anastasia</span>
              </h3>
              <p className="mt-3 max-w-[210px] text-[5px] leading-[10px] text-[#725b60]/72">
                O invitație luminoasă, delicată și simplu de urmărit.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {["15 Mai", "12:00", "București"].map((item) => (
                  <span key={item} className="rounded-full border border-[#d77486]/12 bg-white/70 px-2.5 py-1.5 text-[4px] font-bold text-[#7a4b54]">{item}</span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto grid h-40 w-40 place-items-center rounded-full border-[7px] border-white/75 bg-[radial-gradient(circle_at_35%_28%,#fff_0%,#fde5e4_42%,#efbcc3_100%)] shadow-[0_20px_55px_rgba(157,95,105,.18)] sm:h-48 sm:w-48">
              <div className="absolute inset-2 rounded-full border border-[#c79b58]/40" />
              <div className="absolute -left-4 bottom-8 text-[18px] text-[#d69aa4]">✿</div>
              <div className="absolute -right-3 top-8 text-[13px] text-[#c79b58]">✦</div>
              <div className="text-center">
                <p className="text-[7px] font-bold uppercase tracking-[.18em] text-[#b77883]">mica noastră</p>
                <p className="mt-1 font-serif text-[32px] italic leading-none text-[#73404a]">A</p>
                <p className="mt-1 text-[5px] text-[#9e737a]">suflet mic · iubire mare</p>
              </div>
            </div>
          </div>
        </div>
      </BrowserFrame>
    );
  }

  if (kind === "wedding") {
    return (
      <BrowserFrame url="invitatia-noastra.ro">
        <div className="relative min-h-[338px] overflow-hidden bg-[#f4eee4] text-[#1c1814]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_15%,rgba(255,255,255,.95),transparent_30%),radial-gradient(circle_at_85%_25%,rgba(201,160,80,.20),transparent_31%),linear-gradient(135deg,#f7f1e7,#eadfce)]" />
          <div className="relative z-10 mx-4 mt-3 flex items-center justify-between rounded-[15px] border border-white/75 bg-white/55 px-4 py-2.5 shadow-sm backdrop-blur">
            <span className="font-serif text-[11px] font-semibold">M <i className="text-[#a77b32]">&amp;</i> M</span>
            <div className="flex gap-2 text-[4px] font-semibold text-black/45"><span>Acasă</span><span>Noi</span><span>Detalii</span><span>RSVP</span></div>
            <span className="rounded-full bg-[#a77b32]/10 px-2 py-1 text-[4px] font-bold text-[#825f27]">DD.MM.YYYY</span>
          </div>
          <div className="relative z-10 flex min-h-[285px] items-center justify-center px-5 text-center">
            <div className="rounded-[28px] border border-white/70 bg-white/22 px-8 py-10 shadow-[0_24px_70px_rgba(69,49,20,.10)] backdrop-blur-sm">
              <p className="text-[5px] font-bold uppercase tracking-[.22em] text-[#8b6528]">Template invitație de nuntă</p>
              <h3 className="mt-5 font-serif text-[42px] font-medium leading-[.72] tracking-[-.07em] sm:text-[52px]">
                Mire <i className="text-[#a77b32]">&amp;</i> Mireasă
              </h3>
              <p className="mt-5 text-[6px] text-[#6c6358]">Cu bucurie vă invităm alături de noi</p>
              <span className="mt-5 inline-flex rounded-full bg-[#211b17] px-4 py-2 text-[5px] font-semibold text-white">Descoperă invitația ↓</span>
            </div>
          </div>
        </div>
      </BrowserFrame>
    );
  }

  return (
    <BrowserFrame url="haos-customs.ro" dark>
      <HaoHeroVisual compact />
    </BrowserFrame>
  );
}
