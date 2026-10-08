"use client";

import { useEffect, type ReactNode } from "react";
import type { PublicOfferId } from "@/lib/commerce/public-offers";

export function Glyph({ kind }: { kind: string }) {
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

function SceneCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 rounded-[18px] border border-white/8 bg-white/[.035] shadow-[0_18px_46px_rgba(0,0,0,.18)] ${className}`}>
      {children}
    </div>
  );
}

const FEATURE_ORDER: Record<PublicOfferId, string[]> = {
  invitation: ["RSVP", "Locații", "Countdown", "Poveste", "Galerie", "Maps"],
  web: ["Website", "Responsive", "SEO", "Dashboard", "Clienți", "Task-uri"],
  advanced: ["CRM", "Task-uri", "Calendar", "Devize", "Stoc", "Automatizări", "Custom"],
};

function InvitationScene({ feature }: { feature: string }) {
  if (feature === "Galerie") {
    return (
      <div className="grid h-full grid-cols-12 grid-rows-6 gap-2">
        <div className="col-span-7 row-span-6 rounded-[18px] border border-white/8 bg-[radial-gradient(circle_at_25%_18%,rgba(255,235,220,.20),transparent_28%),linear-gradient(145deg,#28202d,#17131c)]" />
        <div className="col-span-5 row-span-3 rounded-[18px] border border-white/8 bg-[radial-gradient(circle_at_70%_20%,rgba(190,155,255,.22),transparent_32%),linear-gradient(145deg,#191522,#0d0c11)]" />
        <div className="col-span-3 row-span-3 rounded-[18px] border border-white/8 bg-[linear-gradient(145deg,#312936,#16131a)]" />
        <div className="col-span-2 row-span-3 rounded-[18px] border border-white/8 bg-[linear-gradient(145deg,#171722,#0b0b10)]" />
      </div>
    );
  }

  if (feature === "RSVP") {
    return (
      <div className="grid h-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-[1.1fr_.9fr] sm:gap-3">
        <SceneCard className="flex flex-col justify-between p-3 sm:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[36px] font-semibold leading-none tracking-[-.065em] sm:text-[44px]">38</p>
              <p className="mt-2 text-[8px] text-white/35">confirmări</p>
            </div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-[8px] font-bold text-emerald-300">LIVE</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[["28","DA"],["7","WAIT"],["3","NU"]].map(([n,l],i)=>(
              <div key={l} className="rounded-[14px] border border-white/8 bg-[#0b0c12] p-2 text-center sm:p-3">
                <p className={`text-[19px] font-semibold ${i===0?"text-emerald-300":i===1?"text-amber-300":"text-white"}`}>{n}</p>
                <p className="mt-1 text-[6px] text-white/28">{l}</p>
              </div>
            ))}
          </div>
        </SceneCard>
        <SceneCard className="hidden p-4 sm:block">
          <p className="text-[7px] font-bold uppercase tracking-[.16em] text-white/30">ULTIMELE RSVP</p>
          <div className="mt-4 space-y-2">
            {["Alex & Maria","Ioana","Mihai & Andreea","Paul"].map((name,i)=>(
              <div key={name} className="flex items-center justify-between rounded-[12px] bg-white/[.03] px-3 py-2.5">
                <div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#8f6cff]/14 text-[7px]">{i+1}</span><span className="min-w-0 truncate text-[8px]">{name}</span></div>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
            ))}
          </div>
        </SceneCard>
      </div>
    );
  }

  if (feature === "Countdown") {
    return (
      <div className="relative grid h-full place-items-center overflow-hidden rounded-[18px]">
        <div className="absolute h-[240px] w-[240px] rounded-full border border-[#b294ff]/10 shadow-[0_0_90px_rgba(126,93,255,.14)] sm:h-[340px] sm:w-[340px]" />
        <div className="relative grid w-full max-w-[420px] grid-cols-2 gap-2 px-4 sm:grid-cols-4 sm:gap-3 sm:px-0">
          {[["102","Zile"],["14","Ore"],["37","Min"],["21","Sec"]].map(([n,l])=>(
            <div key={l} className="grid h-20 min-w-0 place-items-center rounded-[18px] border border-[#a78bff]/28 bg-[#8f6cff]/10 shadow-[0_0_30px_rgba(126,93,255,.08)] sm:h-28 sm:rounded-[20px]">
              <div className="text-center"><p className="text-[24px] font-semibold tracking-[-.06em] sm:text-[31px]">{n}</p><p className="mt-1 text-[7px] text-white/35">{l}</p></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (feature === "Locații" || feature === "Maps") {
    return (
      <div className="relative h-full overflow-hidden rounded-[18px] border border-white/7 bg-[#0b0c11]">
        <div className="absolute inset-0 opacity-45" style={{backgroundImage:"linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)",backgroundSize:"28px 28px"}} />
        <svg viewBox="0 0 600 300" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path d="M80 235 C145 170,195 214,260 145 S390 80,520 118" fill="none" stroke="#8f6cff" strokeWidth="5" strokeLinecap="round" strokeDasharray="10 10" opacity=".75"/>
          <circle cx="80" cy="235" r="11" fill="#b69dff"/><circle cx="520" cy="118" r="11" fill="#b69dff"/>
          <circle cx="260" cy="145" r="7" fill="#ffffff" opacity=".7"/>
        </svg>
        <div className="absolute left-3 top-3 rounded-[14px] border border-white/10 bg-[#0b0c12]/90 p-3 backdrop-blur-xl sm:left-5 sm:top-5 sm:rounded-[16px] sm:p-4">
          <p className="text-[7px] text-white/30">CEREMONIE</p><p className="mt-2 text-[11px] font-semibold">18:00</p>
        </div>
        <div className="absolute bottom-3 right-3 rounded-[14px] border border-[#a98dff]/24 bg-[#151020]/90 p-3 backdrop-blur-xl sm:bottom-5 sm:right-5 sm:rounded-[16px] sm:p-4">
          <p className="text-[7px] text-[#baa8ff]/55">PETRECERE</p><p className="mt-2 text-[11px] font-semibold">20:00</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden rounded-[18px] border border-white/7 bg-[radial-gradient(circle_at_50%_0%,rgba(255,232,218,.10),transparent_28%),linear-gradient(145deg,#17131c,#0d0c11)]">
      <div className="absolute left-1/2 top-[14%] h-[72%] w-px -translate-x-1/2 bg-[linear-gradient(180deg,transparent,#bfa8ff,transparent)] opacity-50" />
      {[
        ["2019","Ne-am cunoscut","left-[9%] top-[18%]"],
        ["2023","Da!","right-[10%] top-[39%]"],
        ["2026","Ziua noastră","left-[12%] bottom-[15%]"],
      ].map(([year,label,pos],i)=>(
        <div key={year} className={`absolute ${pos} w-[40%] rounded-[16px] border border-white/9 bg-white/[.04] p-3 sm:w-[38%] sm:rounded-[18px] sm:p-4 ${i===1?"shadow-[0_0_34px_rgba(126,93,255,.12)]":""}`}>
          <p className="text-[8px] font-bold text-[#c9baff]">{year}</p><p className="mt-2 text-[9px] font-semibold sm:text-[11px]">{label}</p>
        </div>
      ))}
      <span className="absolute left-1/2 top-[19%] h-3 w-3 -translate-x-1/2 rounded-full bg-[#ad8fff] shadow-[0_0_20px_rgba(173,143,255,.6)]" />
      <span className="absolute left-1/2 top-[48%] h-3 w-3 -translate-x-1/2 rounded-full bg-[#ad8fff] shadow-[0_0_20px_rgba(173,143,255,.6)]" />
      <span className="absolute bottom-[20%] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-[#ad8fff] shadow-[0_0_20px_rgba(173,143,255,.6)]" />
    </div>
  );
}

function WebScene({ feature }: { feature: string }) {
  if (feature === "Dashboard") {
    return (
      <div className="grid h-full min-w-0 grid-cols-[.28fr_.72fr] gap-2 sm:grid-cols-[.22fr_.78fr] sm:gap-3">
        <SceneCard className="p-2 sm:p-3">
          {["Overview","Clienți","Task-uri","Calendar"].map((x,i)=><div key={x} className={`mb-2 truncate rounded-[9px] px-2 py-2 text-[6px] sm:px-3 sm:text-[7px] ${i===0?"bg-[#7655ff]":"text-white/38"}`}>{x}</div>)}
        </SceneCard>
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
          {[["124","Clienți"],["18","Task-uri"],["75%","Progres"],["+45%","Creștere"]].map(([n,l])=><SceneCard key={l} className="p-2 sm:p-4"><p className="text-[18px] font-semibold sm:text-[25px]">{n}</p><p className="mt-2 truncate text-[6px] text-white/35 sm:text-[7px]">{l}</p></SceneCard>)}
        </div>
      </div>
    );
  }

  if (feature === "Responsive") {
    return (
      <div className="flex h-full min-w-0 items-end justify-center gap-2 sm:gap-4">
        <div className="h-[78%] min-w-0 w-[66%] rounded-[20px] border border-white/10 bg-white/[.035] p-3 shadow-[0_24px_70px_rgba(0,0,0,.25)] sm:w-[63%] sm:rounded-[24px] sm:p-4">
          <div className="h-5 w-20 rounded-full bg-white/14"/><div className="mt-6 h-10 w-[70%] rounded-[8px] bg-white/80"/><div className="mt-3 h-3 w-[80%] rounded-full bg-white/10"/><div className="mt-2 h-3 w-[58%] rounded-full bg-white/8"/>
          <div className="mt-6 grid grid-cols-3 gap-2">{[1,2,3].map(i=><div key={i} className="h-16 rounded-[10px] bg-white/[.04]" />)}</div>
        </div>
        <div className="h-[66%] min-w-0 w-[26%] rounded-[22px] border border-[#a78bff]/28 bg-[#0c0d13] p-2 shadow-[0_0_38px_rgba(126,93,255,.13)] sm:w-[22%] sm:rounded-[28px] sm:p-3">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-white/12"/><div className="mt-7 h-8 rounded-[7px] bg-white/70"/><div className="mt-3 h-16 rounded-[10px] bg-white/[.045]"/><div className="mt-3 h-8 rounded-full bg-[#8f6cff]/35"/>
        </div>
      </div>
    );
  }

  if (feature === "SEO") {
    return (
      <div className="grid h-full min-w-0 grid-cols-[1.05fr_.95fr] gap-2 sm:grid-cols-[1.15fr_.85fr] sm:gap-3">
        <SceneCard className="flex flex-col justify-between p-3 sm:p-5">
          <div className="flex items-center justify-between"><span className="text-[8px] text-white/30">VIZIBILITATE</span><span className="text-[14px] font-semibold text-emerald-300">+45%</span></div>
          <div className="flex items-end gap-2">{[35,52,46,68,81,92].map((h,i)=><div key={i} className="flex-1 rounded-t-[8px] bg-[linear-gradient(180deg,#a987ff,#654bff)] shadow-[0_0_18px_rgba(126,93,255,.12)]" style={{height:`${h*1.35}px`}} />)}</div>
        </SceneCard>
        <div className="grid gap-3">
          {[["92","Score"],["8","Pagini"],["24","Keywords"]].map(([n,l])=><SceneCard key={l} className="flex min-w-0 items-center justify-between gap-2 px-2 py-3 sm:px-4"><span className="text-[8px] text-white/30">{l}</span><span className="text-[18px] font-semibold">{n}</span></SceneCard>)}
        </div>
      </div>
    );
  }

  if (feature === "Clienți") {
    return (
      <div className="grid h-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-[.95fr_1.05fr] sm:gap-3">
        <SceneCard className="min-w-0 p-3 sm:p-4">
          <div className="flex items-center justify-between"><span className="text-[8px] text-white/30">CLIENȚI</span><span className="rounded-full bg-[#8f6cff]/12 px-2 py-1 text-[7px] text-[#c9baff]">124</span></div>
          <div className="mt-4 space-y-2">
            {["Obsidian Events","Hao’s Customs","Neagu Costică SRL","Florărie"].map((name,i)=><div key={name} className="flex min-w-0 items-center justify-between gap-2 rounded-[12px] bg-white/[.03] px-3 py-2.5"><div className="flex min-w-0 items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#8f6cff]/12 text-[7px]">{name[0]}</span><span className="text-[8px]">{name}</span></div><span className={`h-2 w-2 rounded-full ${i<3?"bg-emerald-400":"bg-amber-300"}`} /></div>)}
          </div>
        </SceneCard>
        <SceneCard className="relative hidden overflow-hidden p-4 sm:block">
          <p className="text-[8px] text-white/30">PIPELINE</p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {["Lead","Ofertă","Client"].map((stage,i)=><div key={stage}><p className="mb-2 text-center text-[7px] text-white/35">{stage}</p>{Array.from({length:3-i}).map((_,j)=><div key={j} className={`mb-2 h-12 rounded-[10px] border ${i===2?"border-emerald-400/15 bg-emerald-400/[.05]":"border-white/7 bg-white/[.03]"}`} />)}</div>)}
          </div>
        </SceneCard>
      </div>
    );
  }

  if (feature === "Task-uri") {
    return (
      <div className="grid h-full min-w-0 grid-cols-3 gap-1.5 sm:gap-3">
        {[
          ["TO DO",["Website nou","Sună clientul","Pregătește oferta"]],
          ["LUCRU",["Homepage","SEO setup"]],
          ["GATA",["Brief client","Domeniu"]],
        ].map(([title,items],i)=>(
          <SceneCard key={title as string} className="min-w-0 p-2 sm:p-3">
            <div className="flex items-center justify-between"><span className="text-[7px] font-bold text-white/35">{title as string}</span><span className="text-[7px] text-white/20">{(items as string[]).length}</span></div>
            <div className="mt-3 space-y-2">{(items as string[]).map((x)=><div key={x} className={`break-words rounded-[11px] border p-2 text-[7px] sm:p-3 sm:text-[8px] ${i===2?"border-emerald-400/12 bg-emerald-400/[.05]":"border-white/7 bg-[#0b0c12]"}`}><div className="mb-3 h-1.5 w-[45%] rounded-full bg-[#8f6cff]/45"/>{x}</div>)}</div>
          </SceneCard>
        ))}
      </div>
    );
  }

  return (
    <div className="grid h-full place-items-center">
      <div className="w-full max-w-[620px] overflow-hidden rounded-[22px] border border-white/9 bg-[#0d1018] shadow-[0_28px_90px_rgba(0,0,0,.28)]">
        <div className="flex h-9 items-center gap-1.5 border-b border-white/8 px-4"><span className="h-2 w-2 rounded-full bg-white/14"/><span className="h-2 w-2 rounded-full bg-white/14"/><span className="h-2 w-2 rounded-full bg-white/14"/></div>
        <div className="grid grid-cols-[1.1fr_.9fr] gap-5 p-5">
          <div><div className="h-2.5 w-24 rounded-full bg-[#a58bff]/65"/><div className="mt-5 h-9 w-[82%] rounded-[8px] bg-white/80"/><div className="mt-2 h-9 w-[60%] rounded-[8px] bg-white/80"/><div className="mt-5 h-2.5 w-[88%] rounded-full bg-white/10"/><div className="mt-2 h-2.5 w-[66%] rounded-full bg-white/8"/><div className="mt-6 h-9 w-28 rounded-full bg-white/80"/></div>
          <div className="rounded-[16px] border border-white/7 bg-[linear-gradient(145deg,rgba(255,255,255,.05),rgba(126,93,255,.10))]" />
        </div>
      </div>
    </div>
  );
}

function AdvancedScene({ feature }: { feature: string }) {
  if (feature === "Calendar") {
    return (
      <div className="grid h-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-[1.15fr_.85fr] sm:gap-3">
        <SceneCard className="p-3 sm:p-4">
          <div className="flex items-center justify-between"><p className="text-[13px] font-semibold sm:text-[15px]">Octombrie</p><span className="text-[8px] text-white/35">2026</span></div>
          <div className="mt-3 grid grid-cols-7 gap-1 sm:mt-4 sm:gap-1.5">{Array.from({length:35}).map((_,i)=><div key={i} className={`grid h-7 min-w-0 place-items-center rounded-[8px] text-[6px] sm:h-8 sm:rounded-[9px] sm:text-[7px] ${[12,18,24].includes(i)?"bg-[#7d59ff] text-white shadow-[0_0_18px_rgba(125,89,255,.25)]":"bg-white/[.03] text-white/38"}`}>{i+1}</div>)}</div>
        </SceneCard>
        <div className="hidden gap-3 sm:grid">{[["09:30","Client"],["13:00","Lucrare"],["17:30","Follow-up"]].map(([t,l],i)=><SceneCard key={t} className="flex items-center gap-3 p-4"><span className={`h-9 w-1 rounded-full ${i===0?"bg-[#9b75ff]":i===1?"bg-blue-400":"bg-emerald-400"}`} /><div><p className="text-[11px] font-semibold">{t}</p><p className="mt-1 text-[7px] text-white/32">{l}</p></div></SceneCard>)}</div>
      </div>
    );
  }

  if (feature === "Task-uri") {
    return (
      <div className="grid h-full place-items-center">
        <div className="w-full max-w-[600px] space-y-2.5">{["Website nou","Trimite oferta","Contactează clientul","Pregătește deviz"].map((x,i)=><SceneCard key={x} className="flex items-center gap-3 p-4"><span className={`grid h-8 w-8 place-items-center rounded-full ${i<2?"bg-emerald-400/12 text-emerald-300":"bg-[#8f6cff]/12 text-[#c0afff]"}`}>{i<2?"✓":i+1}</span><div className="flex-1"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold">{x}</span><span className="text-[7px] text-white/25">{i<2?"GATA":"AZI"}</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5"><div className={`h-full rounded-full ${i<2?"w-full bg-emerald-400/50":"w-[55%] bg-[#8f6cff]/65"}`} /></div></div></SceneCard>)}</div>
      </div>
    );
  }

  if (feature === "Automatizări" || feature === "AI") {
    return (
      <div className="relative grid h-full place-items-center overflow-hidden">
        <div className="absolute h-[220px] w-[280px] rounded-full border border-[#9f7cff]/10 shadow-[0_0_90px_rgba(126,93,255,.12)] sm:h-[280px] sm:w-[520px]" />
        <div className="relative flex min-w-0 items-center gap-2 sm:gap-4">
          {["CRM","AI","Task-uri"].map((x,i)=><div key={x} className="flex min-w-0 items-center gap-1 sm:gap-4"><div className={`grid h-20 w-20 shrink-0 place-items-center rounded-[18px] border sm:h-28 sm:w-28 sm:rounded-[24px] ${x==="AI"?"border-[#a98dff]/65 bg-[#8f6cff]/20 shadow-[0_0_46px_rgba(126,93,255,.25)]":"border-white/10 bg-white/[.035]"}`}><div className="text-center text-[#c8b8ff]"><Glyph kind={x}/><p className="mt-3 text-[8px] font-semibold text-white/70">{x}</p></div></div>{i<2?<span className="text-[13px] text-[#9f7cff] sm:text-[18px]">→</span>:null}</div>)}
        </div>
      </div>
    );
  }

  if (feature === "CRM") {
    return (
      <div className="grid h-full min-w-0 grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2.5">
        {[
          ["LEAD",["Nova SRL","Casa Verde","Studio 21"]],
          ["CONTACTAT",["Obsidian","Hao’s"]],
          ["OFERTĂ",["Asfaltare"]],
          ["CLIENT",["Florărie","Neagu C."]],
        ].map(([stage,items],i)=>(
          <SceneCard key={stage as string} className="min-w-0 p-2 sm:p-3">
            <div className="flex items-center justify-between"><span className="text-[7px] font-bold text-white/32">{stage as string}</span><span className={`h-2 w-2 rounded-full ${i===3?"bg-emerald-400":"bg-[#8f6cff]"}`} /></div>
            <div className="mt-3 space-y-2">{(items as string[]).map(name=><div key={name} className="min-w-0 rounded-[10px] border border-white/7 bg-[#0b0c12] p-2 sm:p-2.5"><div className="h-1.5 w-[45%] rounded-full bg-[#8f6cff]/45"/><p className="mt-2 truncate text-[6px] text-white/60 sm:text-[7px]">{name}</p></div>)}</div>
          </SceneCard>
        ))}
      </div>
    );
  }

  if (feature === "Devize") {
    return (
      <div className="grid h-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-[1.2fr_.8fr] sm:gap-3">
        <SceneCard className="p-3 sm:p-4">
          <div className="flex items-center justify-between"><span className="text-[8px] font-bold text-white/35">DEVIZ #0248</span><span className="rounded-full bg-emerald-400/10 px-3 py-1.5 text-[7px] text-emerald-300">READY</span></div>
          <div className="mt-4 space-y-2">{[["Materiale","4.250"],["Manoperă","2.100"],["Transport","450"]].map(([l,n])=><div key={l} className="grid grid-cols-[1fr_auto] rounded-[11px] bg-white/[.03] px-3 py-2.5"><span className="text-[8px] text-white/40">{l}</span><span className="text-[9px] font-semibold">{n} lei</span></div>)}</div>
          <div className="mt-4 flex items-end justify-between border-t border-white/8 pt-4"><span className="text-[8px] text-white/32">TOTAL</span><span className="text-[24px] font-semibold tracking-[-.05em]">6.800 lei</span></div>
        </SceneCard>
        <div className="hidden gap-3 sm:grid">
          <SceneCard className="grid place-items-center p-4"><div className="text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#8f6cff]/14 text-[#c9baff]"><Glyph kind="Devize"/></span><p className="mt-3 text-[9px] font-semibold">PDF</p></div></SceneCard>
          <SceneCard className="grid place-items-center p-4"><div className="text-center"><p className="text-[24px] font-semibold text-emerald-300">✓</p><p className="mt-2 text-[8px] text-white/40">trimis clientului</p></div></SceneCard>
        </div>
      </div>
    );
  }

  if (feature === "Stoc") {
    return (
      <div className="grid h-full grid-cols-[1.2fr_.8fr] gap-3">
        <SceneCard className="p-4">
          <div className="flex items-center justify-between"><span className="text-[8px] font-bold text-white/35">STOC</span><span className="text-[8px] text-white/22">31 produse</span></div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[["Țeavă","42"],["Cot","18"],["Robinet","7"],["Cablu","63"],["Profil","12"],["Vopsea","4"]].map(([l,n],i)=><div key={l} className={`rounded-[12px] border p-3 ${i===5?"border-amber-300/20 bg-amber-300/[.05]":"border-white/7 bg-white/[.025]"}`}><p className="text-[16px] font-semibold">{n}</p><p className="mt-2 text-[7px] text-white/35">{l}</p></div>)}
          </div>
        </SceneCard>
        <SceneCard className="flex flex-col justify-between p-4">
          <div><p className="text-[8px] text-white/32">ALERTĂ STOC</p><p className="mt-3 text-[28px] font-semibold text-amber-300">4</p></div>
          <div className="rounded-[13px] border border-amber-300/12 bg-amber-300/[.04] p-3"><p className="text-[8px] font-semibold">Vopsea</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/6"><div className="h-full w-[18%] rounded-full bg-amber-300/70"/></div></div>
        </SceneCard>
      </div>
    );
  }

  if (feature === "Custom") {
    return (
      <div className="relative h-full overflow-hidden rounded-[18px] border border-white/7 bg-[#0a0b10] p-3">
        <div className="absolute inset-0 opacity-35" style={{backgroundImage:"radial-gradient(rgba(167,141,255,.35) 1px,transparent 1px)",backgroundSize:"22px 22px"}} />
        <div className="relative grid h-full grid-cols-4 grid-rows-3 gap-2">
          {[
            ["CRM","col-span-1 row-span-2"],["Dashboard","col-span-2 row-span-1"],["AI","col-span-1 row-span-1"],["Calendar","col-span-1 row-span-1"],["Custom +","col-span-2 row-span-2"],["Stoc","col-span-1 row-span-1"],["Devize","col-span-1 row-span-1"]
          ].map(([label,size])=><div key={label} className={`${size} grid place-items-center rounded-[14px] border ${label==="Custom +"?"border-[#a98dff]/45 bg-[#8f6cff]/16 shadow-[0_0_34px_rgba(126,93,255,.14)]":"border-white/8 bg-white/[.035]"}`}><div className="text-center text-[#c8b8ff]"><Glyph kind={label==="Custom +"?"Custom":label}/><p className="mt-2 text-[7px] text-white/55">{label}</p></div></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full min-w-0 grid-cols-[.28fr_.72fr] gap-2 sm:grid-cols-[.22fr_.78fr] sm:gap-3">
      <SceneCard className="p-2 sm:p-3">{["Dashboard","CRM","Task-uri","Calendar","Devize","Stoc","AI"].map((x)=><div key={x} className={`mb-2 truncate rounded-[9px] px-2 py-2 text-[6px] sm:px-3 sm:text-[7px] ${x===feature?"bg-[#7352ff] text-white":"text-white/35"}`}>{x}</div>)}</SceneCard>
      <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">{[["124","Clienți"],["18","Proiecte"],["12","Task-uri"],["75%","Progres"]].map(([n,l])=><SceneCard key={l} className="p-2 sm:p-4"><p className="text-[18px] font-semibold sm:text-[25px]">{n}</p><p className="mt-2 truncate text-[6px] text-white/35 sm:text-[7px]">{l}</p></SceneCard>)}</div>
    </div>
  );
}

export function FeatureScene({
  offerId,
  feature,
  onClose,
  onSelect,
}: {
  offerId: PublicOfferId;
  feature: string;
  onClose: () => void;
  onSelect: (feature: string) => void;
}) {
  const features = FEATURE_ORDER[offerId];
  const currentIndex = Math.max(0, features.indexOf(feature));
  const previousFeature = features[(currentIndex - 1 + features.length) % features.length];
  const nextFeature = features[(currentIndex + 1) % features.length];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onSelect(previousFeature);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onSelect(nextFeature);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nextFeature, onSelect, previousFeature]);
  const sceneTitle =
    feature === "RSVP" ? "RSVP live" :
    feature === "Locații" || feature === "Maps" ? "Locații & Maps" :
    feature === "Countdown" ? "Countdown" :
    feature === "Poveste" ? "Poveste" :
    feature === "Galerie" ? "Galerie" :
    feature === "Website" ? "Website" :
    feature === "Responsive" ? "Responsive" :
    feature === "SEO" ? "SEO" :
    feature === "Dashboard" ? "Dashboard" :
    feature;

  return (
    <div className="orbyven-feature-scene absolute inset-[2%] z-50 overflow-hidden rounded-[24px] border border-[#b396ff]/68 bg-[#06070c]/98 p-3 text-white shadow-[0_42px_140px_rgba(0,0,0,.78),0_0_76px_rgba(128,84,255,.24)] backdrop-blur-2xl sm:inset-[3%] sm:rounded-[28px] sm:p-5">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_8%,rgba(137,94,255,.17),transparent_28%)]" />
      <div className="relative flex min-w-0 items-center justify-between gap-2 sm:gap-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center sm:h-9 sm:w-9 rounded-[13px] border border-[#a78bff]/42 bg-[#8f6cff]/16 text-[#c8b8ff] shadow-[0_0_24px_rgba(126,93,255,.12)]">
            <Glyph kind={feature} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[6px] font-bold uppercase tracking-[.14em] text-white/28 sm:text-[7px] sm:tracking-[.18em]">{offerId === "invitation" ? "INVITAȚIE" : offerId === "web" ? "WEB DESIGN" : "ORBYVEN ADVANCED"}</p>
            <p className="mt-1 truncate text-[12px] font-semibold sm:text-[14px]">{sceneTitle}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <span className="hidden min-w-[34px] text-center text-[7px] font-semibold tracking-[.12em] text-white/25 sm:block">{currentIndex + 1}/{features.length}</span>
          <button
            type="button"
            onClick={() => onSelect(previousFeature)}
            aria-label="Preview anterior"
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[.035] text-[12px] sm:h-9 sm:w-9 sm:text-[13px] text-white/48 transition hover:-translate-x-0.5 hover:border-[#a98dff]/35 hover:bg-[#8f6cff]/10 hover:text-white"
          >←</button>
          <button
            type="button"
            onClick={() => onSelect(nextFeature)}
            aria-label="Preview următor"
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[.035] text-[12px] text-white/48 transition hover:translate-x-0.5 sm:h-9 sm:w-9 sm:text-[13px] hover:border-[#a98dff]/35 hover:bg-[#8f6cff]/10 hover:text-white"
          >→</button>
          <button onClick={onClose} type="button" aria-label="Închide preview" className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[.035] text-[15px] sm:h-9 sm:w-9 sm:text-[16px] text-white/55 transition hover:rotate-90 hover:bg-white/[.08] hover:text-white">×</button>
        </div>
      </div>

      <div className="relative mt-3 h-[calc(100%-52px)] overflow-hidden rounded-[18px] border border-white/8 bg-[radial-gradient(circle_at_75%_12%,rgba(126,93,255,.18),transparent_30%),linear-gradient(145deg,#10121a,#08090e)] p-2.5 sm:mt-4 sm:h-[calc(100%-58px)] sm:rounded-[22px] sm:p-4">
        <div className="h-full" key={feature}>
          {offerId === "invitation" ? <InvitationScene feature={feature} /> : offerId === "web" ? <WebScene feature={feature} /> : <AdvancedScene feature={feature} />}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/8 bg-[#05060a]/72 px-2.5 py-2 shadow-[0_10px_30px_rgba(0,0,0,.34)] backdrop-blur-xl">
            {features.map((item, index) => (
              <button
                key={item}
                type="button"
                onClick={() => onSelect(item)}
                title={item}
                aria-label={item}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex ? "w-7 bg-[#a98dff] shadow-[0_0_12px_rgba(169,141,255,.65)]" : "w-1.5 bg-white/18 hover:bg-white/45"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
