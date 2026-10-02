"use client";

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

export function FeatureScene({
  offerId,
  feature,
  onClose,
}: {
  offerId: PublicOfferId;
  feature: string;
  onClose: () => void;
}) {
  const isInvite = offerId === "invitation";
  const isWeb = offerId === "web";

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
    <div className="orbyven-feature-scene absolute inset-[4%] z-50 overflow-hidden rounded-[28px] border border-[#b396ff]/62 bg-[#08090f]/98 p-4 text-white shadow-[0_42px_130px_rgba(0,0,0,.74),0_0_66px_rgba(128,84,255,.23)] backdrop-blur-2xl sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-[13px] border border-[#a78bff]/35 bg-[#8f6cff]/14 text-[#c8b8ff]">
            <Glyph kind={feature} />
          </span>
          <div>
            <p className="text-[7px] font-bold uppercase tracking-[.18em] text-white/32">{isInvite ? "INVITAȚIE" : isWeb ? "WEB DESIGN" : "ORBYVEN ADVANCED"}</p>
            <p className="mt-1 text-[14px] font-semibold">{sceneTitle}</p>
          </div>
        </div>
        <button onClick={onClose} type="button" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[.035] text-[16px] text-white/55 transition hover:bg-white/[.08] hover:text-white">×</button>
      </div>

      <div className="mt-4 h-[calc(100%-58px)] overflow-hidden rounded-[22px] border border-white/8 bg-[radial-gradient(circle_at_75%_12%,rgba(126,93,255,.20),transparent_30%),linear-gradient(145deg,#10121a,#08090e)] p-4">
        {isInvite ? (
          feature === "Galerie" ? (
            <div className="grid h-full grid-cols-3 grid-rows-2 gap-2">
              {[0,1,2,3,4,5].map((i)=><div key={i} className={`rounded-[14px] border border-white/8 bg-[linear-gradient(145deg,rgba(255,255,255,.06),rgba(170,130,255,.08))] ${i===0?"col-span-2 row-span-2":""}`} />)}
            </div>
          ) : feature === "RSVP" ? (
            <div className="grid h-full place-items-center">
              <div className="w-full max-w-[520px] rounded-[22px] border border-white/10 bg-white/[.035] p-5">
                <div className="flex items-end justify-between"><div><p className="text-[42px] font-semibold tracking-[-.06em]">38</p><p className="text-[8px] text-white/35">confirmări</p></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-[8px] font-bold text-emerald-300">LIVE</span></div>
                <div className="mt-5 grid grid-cols-3 gap-2">{[["28","Da"],["7","Așteptare"],["3","Nu"]].map(([n,l])=><div key={l} className="rounded-[14px] border border-white/8 bg-white/[.035] p-3 text-center"><p className="text-[18px] font-semibold">{n}</p><p className="mt-1 text-[6px] text-white/35">{l}</p></div>)}</div>
              </div>
            </div>
          ) : feature === "Countdown" ? (
            <div className="grid h-full place-items-center">
              <div className="grid grid-cols-4 gap-3">{[["102","Zile"],["14","Ore"],["37","Min"],["21","Sec"]].map(([n,l])=><div key={l} className="grid h-24 w-24 place-items-center rounded-[18px] border border-[#a78bff]/25 bg-[#8f6cff]/10"><div className="text-center"><p className="text-[28px] font-semibold">{n}</p><p className="mt-1 text-[7px] text-white/35">{l}</p></div></div>)}</div>
            </div>
          ) : (
            <div className="grid h-full place-items-center">
              <div className="relative h-[82%] w-[78%] rounded-[26px] border border-white/10 bg-[#f4eee8] p-5 text-[#33263a] shadow-[0_30px_90px_rgba(0,0,0,.30)]">
                <div className="absolute inset-4 rounded-[20px] border border-[#5a4562]/10" />
                <div className="relative mx-auto mt-8 max-w-[360px] text-center">
                  <p className="text-[7px] font-bold uppercase tracking-[.24em]">{sceneTitle}</p>
                  <p className="mt-5 font-serif text-[30px] italic">A & M</p>
                  <div className="mx-auto mt-7 h-20 rounded-[16px] border border-[#5a4562]/10 bg-[#5a4562]/[.035]" />
                </div>
              </div>
            </div>
          )
        ) : isWeb ? (
          feature === "Dashboard" ? (
            <div className="grid h-full grid-cols-[.23fr_.77fr] gap-3">
              <div className="rounded-[16px] border border-white/8 bg-white/[.03] p-3">{["Overview","Clienți","Task-uri","Calendar"].map((x,i)=><div key={x} className={`mb-2 rounded-[9px] px-3 py-2 text-[7px] ${i===0?"bg-[#7655ff]":"text-white/38"}`}>{x}</div>)}</div>
              <div className="grid grid-cols-2 gap-3">{[["124","Clienți"],["18","Task-uri"],["75%","Progres"],["+45%","Creștere"]].map(([n,l])=><div key={l} className="rounded-[16px] border border-white/8 bg-white/[.035] p-4"><p className="text-[25px] font-semibold">{n}</p><p className="mt-2 text-[7px] text-white/35">{l}</p></div>)}</div>
            </div>
          ) : feature === "Responsive" ? (
            <div className="flex h-full items-end justify-center gap-4">
              <div className="h-[76%] w-[62%] rounded-[24px] border border-white/10 bg-white/[.035] p-4"><div className="h-5 w-20 rounded-full bg-white/14"/><div className="mt-6 h-10 w-[70%] rounded-[8px] bg-white/80"/><div className="mt-3 h-3 w-[80%] rounded-full bg-white/10"/><div className="mt-2 h-3 w-[58%] rounded-full bg-white/8"/></div>
              <div className="h-[62%] w-[22%] rounded-[28px] border border-[#a78bff]/25 bg-[#0c0d13] p-3"><div className="h-4 w-12 rounded-full bg-white/14"/><div className="mt-7 h-8 rounded-[7px] bg-white/70"/><div className="mt-3 h-16 rounded-[10px] bg-white/[.045]"/></div>
            </div>
          ) : feature === "SEO" ? (
            <div className="grid h-full place-items-center">
              <div className="w-full max-w-[560px] rounded-[22px] border border-white/8 bg-white/[.03] p-5">
                <div className="flex items-end gap-2">{[35,52,46,68,81,92].map((h,i)=><div key={i} className="flex-1 rounded-t-[8px] bg-[linear-gradient(180deg,#a987ff,#654bff)]" style={{height:`${h*1.8}px`}} />)}</div>
                <div className="mt-4 flex justify-between text-[7px] text-white/30"><span>Vizibilitate</span><span className="text-emerald-300">+45%</span></div>
              </div>
            </div>
          ) : (
            <div className="grid h-full place-items-center">
              <div className="w-full max-w-[600px] overflow-hidden rounded-[22px] border border-white/9 bg-[#0d1018]">
                <div className="flex h-9 items-center gap-1.5 border-b border-white/8 px-4"><span className="h-2 w-2 rounded-full bg-white/14"/><span className="h-2 w-2 rounded-full bg-white/14"/><span className="h-2 w-2 rounded-full bg-white/14"/></div>
                <div className="p-5"><div className="h-2.5 w-24 rounded-full bg-[#a58bff]/65"/><div className="mt-5 h-9 w-[75%] rounded-[8px] bg-white/80"/><div className="mt-2 h-9 w-[55%] rounded-[8px] bg-white/80"/><div className="mt-5 h-2.5 w-[82%] rounded-full bg-white/10"/><div className="mt-2 h-2.5 w-[60%] rounded-full bg-white/8"/></div>
              </div>
            </div>
          )
        ) : (
          feature === "Calendar" ? (
            <div className="grid h-full place-items-center">
              <div className="w-full max-w-[540px] rounded-[22px] border border-white/8 bg-white/[.03] p-5"><div className="flex items-center justify-between"><p className="text-[15px] font-semibold">Octombrie</p><span className="text-[8px] text-white/35">2026</span></div><div className="mt-5 grid grid-cols-7 gap-2">{Array.from({length:35}).map((_,i)=><div key={i} className={`grid h-10 place-items-center rounded-[10px] text-[8px] ${[12,18,24].includes(i)?"bg-[#7d59ff] text-white":"bg-white/[.035] text-white/45"}`}>{i+1}</div>)}</div></div>
            </div>
          ) : feature === "Task-uri" ? (
            <div className="grid h-full place-items-center"><div className="w-full max-w-[560px] space-y-3">{["Website nou","Trimite oferta","Contactează clientul","Pregătește deviz"].map((x,i)=><div key={x} className="flex items-center gap-3 rounded-[16px] border border-white/8 bg-white/[.035] p-4"><span className={`grid h-8 w-8 place-items-center rounded-full ${i<2?"bg-emerald-400/12 text-emerald-300":"bg-[#8f6cff]/12 text-[#c0afff]"}`}>{i<2?"✓":i+1}</span><span className="text-[10px] font-semibold">{x}</span></div>)}</div></div>
          ) : feature === "AI" || feature === "Automatizări" ? (
            <div className="grid h-full place-items-center"><div className="flex items-center gap-5">{["CRM","AI","Task-uri"].map((x,i)=><div key={x} className="flex items-center gap-5"><div className={`grid h-24 w-24 place-items-center rounded-[22px] border ${x==="AI"?"border-[#a98dff]/60 bg-[#8f6cff]/18 shadow-[0_0_40px_rgba(126,93,255,.22)]":"border-white/10 bg-white/[.035]"}`}><div className="text-center text-[#c8b8ff]"><Glyph kind={x}/><p className="mt-2 text-[8px] font-semibold text-white/70">{x}</p></div></div>{i<2?<span className="text-[#9f7cff]">→</span>:null}</div>)}</div></div>
          ) : (
            <div className="grid h-full grid-cols-[.22fr_.78fr] gap-3">
              <div className="rounded-[16px] border border-white/8 bg-white/[.025] p-3">{["Dashboard","CRM","Task-uri","Calendar","Devize","Stoc","AI"].map((x)=><div key={x} className={`mb-2 rounded-[9px] px-3 py-2 text-[7px] ${x===feature?"bg-[#7352ff] text-white":"text-white/35"}`}>{x}</div>)}</div>
              <div className="grid grid-cols-2 gap-3">{[["124","Clienți"],["18","Proiecte"],["12","Task-uri"],["75%","Progres"]].map(([n,l])=><div key={l} className="rounded-[16px] border border-white/8 bg-white/[.035] p-4"><p className="text-[25px] font-semibold">{n}</p><p className="mt-2 text-[7px] text-white/35">{l}</p></div>)}</div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

