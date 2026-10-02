"use client";

import type { ReactNode } from "react";
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

function FeatureScene({
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

function InvitationVisual({
  onSelect,
  activeFeature,
}: {
  onSelect: (feature: string) => void;
  activeFeature: string | null;
}) {
  return (
    <div className="relative min-h-[520px] sm:min-h-[570px] lg:min-h-[430px] xl:min-h-[455px]">
      <div className="absolute inset-0 rounded-[42px] bg-[radial-gradient(circle_at_68%_16%,rgba(176,118,255,.40),transparent_28%),radial-gradient(circle_at_12%_58%,rgba(84,64,205,.21),transparent_36%),linear-gradient(180deg,rgba(81,52,160,.04),transparent)]" />
      <div className="absolute -inset-5 rounded-[48px] border border-[#8f6cff]/[.055] shadow-[0_0_100px_rgba(111,75,255,.08)]" />
      <div className="absolute inset-x-[8%] bottom-[7%] h-16 rounded-full bg-[#704cff]/20 blur-[36px]" />
      <div className="absolute left-[1%] right-[3%] top-[3%] scale-[1.04] [transform:perspective(1400px)_rotateY(-2deg)_rotateX(.6deg)]">
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

      <button
        type="button"
        aria-pressed={activeFeature === "Galerie"}
        onClick={() => onSelect("Galerie")}
        className="absolute bottom-[1%] right-[1%] hidden w-[190px] rounded-[34px] border border-[#a98dff]/32 bg-[#07080c] p-2 text-left shadow-[0_30px_90px_rgba(0,0,0,.58),0_0_38px_rgba(126,93,255,.13)] transition duration-300 hover:-translate-y-1 hover:border-[#c1adff]/60 hover:shadow-[0_36px_100px_rgba(0,0,0,.64),0_0_46px_rgba(126,93,255,.22)] sm:block"
      >
        <div className="overflow-hidden rounded-[27px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,235,220,.10),transparent_24%),linear-gradient(180deg,#17141d,#0c0b10)] px-4 py-5 text-center text-white">
          <p className="font-serif text-[12px] tracking-[.2em]">A | M</p>
          <p className="mt-7 text-[6px] tracking-[.3em] text-white/42">SAVE THE DATE</p>
          <p className="mt-4 font-serif text-[24px] italic">A & M</p>
          <div className="mt-7 rounded-full bg-[#f2e6d7] px-4 py-2.5 text-[7px] font-semibold text-[#352e37]">RSVP →</div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {["Locație","Program","Poveste","Galerie"].map((x)=><div key={x} className="rounded-[12px] border border-white/8 bg-white/[.035] px-2 py-3 text-[6px] text-white/65">{x}</div>)}
          </div>
        </div>
      </button>

      <button
        type="button"
        aria-pressed={activeFeature === "RSVP"}
        onClick={() => onSelect("RSVP")}
        className="orbyven-float-a absolute left-[-2%] top-[32%] hidden w-[158px] rounded-[20px] border border-[#b08fff]/42 bg-[#100c18]/96 p-4 text-left text-white shadow-[0_28px_88px_rgba(0,0,0,.54),0_0_30px_rgba(151,111,255,.14)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#c1adff]/70 hover:bg-[#171022] md:block"
      >
        <div className="text-[#c2b2ff]"><Glyph kind="RSVP" /></div>
        <p className="mt-3 text-[10px] font-semibold">RSVP live</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-[7px] text-white/42">confirmări instant</span>
        </div>
      </button>
    </div>
  );
}

function WebVisual({
  onSelect,
  activeFeature,
}: {
  onSelect: (feature: string) => void;
  activeFeature: string | null;
}) {
  return (
    <div className="relative min-h-[520px] sm:min-h-[570px] lg:min-h-[430px] xl:min-h-[455px]">
      <div className="absolute inset-0 rounded-[42px] bg-[radial-gradient(circle_at_72%_16%,rgba(95,110,255,.40),transparent_28%),radial-gradient(circle_at_15%_60%,rgba(126,93,255,.21),transparent_36%),linear-gradient(180deg,rgba(81,52,160,.04),transparent)]" />
      <div className="absolute -inset-5 rounded-[48px] border border-[#8f6cff]/[.055] shadow-[0_0_100px_rgba(111,75,255,.08)]" />
      <div className="absolute inset-x-[7%] bottom-[7%] h-16 rounded-full bg-[#5b55ff]/20 blur-[38px]" />
      <div className="absolute left-[-1%] right-[6%] top-[3%] scale-[1.05] [transform:perspective(1400px)_rotateY(-2.5deg)_rotateX(.6deg)]">
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

      <button
        type="button"
        aria-pressed={activeFeature === "Dashboard"}
        onClick={() => onSelect("Dashboard")}
        className="absolute bottom-[1%] right-[1%] hidden w-[194px] rounded-[34px] border border-[#a98dff]/32 bg-[#07080c] p-2 text-left shadow-[0_30px_90px_rgba(0,0,0,.58),0_0_38px_rgba(126,93,255,.13)] transition duration-300 hover:-translate-y-1 hover:border-[#c1adff]/60 hover:shadow-[0_36px_100px_rgba(0,0,0,.64),0_0_46px_rgba(126,93,255,.22)] sm:block"
      >
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
      </button>

      <button
        type="button"
        aria-pressed={activeFeature === "Website"}
        onClick={() => onSelect("Website")}
        className="orbyven-float-a absolute left-[-2%] top-[30%] hidden w-[164px] rounded-[20px] border border-[#b08fff]/42 bg-[#100c18]/96 p-4 text-left text-white shadow-[0_28px_88px_rgba(0,0,0,.54),0_0_30px_rgba(151,111,255,.14)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#c1adff]/70 hover:bg-[#171022] md:block"
      >
        <div className="flex items-center justify-between">
          <span className="text-[#c2b2ff]"><Glyph kind="Website" /></span>
          <span className="rounded-full bg-[#8f6cff]/16 px-2 py-1 text-[6px] font-bold text-[#cdbfff]">LIVE</span>
        </div>
        <p className="mt-3 text-[10px] font-semibold">Website</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full w-[86%] rounded-full bg-[#8f6cff]" /></div>
      </button>
    </div>
  );
}

function AdvancedVisual({
  onSelect,
  activeFeature,
}: {
  onSelect: (feature: string) => void;
  activeFeature: string | null;
}) {
  return (
    <div className="relative min-h-[540px] sm:min-h-[590px] lg:min-h-[445px] xl:min-h-[470px]">
      <div className="absolute inset-0 rounded-[42px] bg-[radial-gradient(circle_at_74%_16%,rgba(155,103,255,.44),transparent_28%),radial-gradient(circle_at_15%_64%,rgba(83,68,190,.23),transparent_35%),linear-gradient(180deg,rgba(81,52,160,.05),transparent)]" />
      <div className="absolute -inset-5 rounded-[48px] border border-[#8f6cff]/[.06] shadow-[0_0_110px_rgba(111,75,255,.10)]" />
      <div className="absolute inset-x-[6%] bottom-[7%] h-16 rounded-full bg-[#704cff]/24 blur-[40px]" />
      <div className="absolute left-[0%] right-[0%] top-[2%] scale-[1.05] [transform:perspective(1500px)_rotateY(-2deg)_rotateX(.7deg)]">
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

      <button
        type="button"
        aria-pressed={activeFeature === "CRM"}
        onClick={() => onSelect("CRM")}
        className="orbyven-float-a absolute left-[-3%] top-[22%] hidden w-[154px] rounded-[20px] border border-[#b08fff]/42 bg-[#100c18]/96 p-4 text-left text-white shadow-[0_30px_92px_rgba(0,0,0,.56),0_0_34px_rgba(151,111,255,.15)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#c1adff]/70 hover:bg-[#171022] md:block"
      >
        <div className="text-[#bcaaff]"><Glyph kind="CRM"/></div><p className="mt-3 text-[10px] font-semibold">CRM</p><p className="mt-1 text-[6px] text-white/35">Clienți & lead-uri</p>
      </button>
      <button
        type="button"
        aria-pressed={activeFeature === "Task-uri"}
        onClick={() => onSelect("Task-uri")}
        className="orbyven-float-b absolute bottom-[7%] left-[0%] hidden w-[160px] rounded-[20px] border border-[#b08fff]/42 bg-[#100c18]/96 p-4 text-left text-white shadow-[0_30px_92px_rgba(0,0,0,.56),0_0_34px_rgba(151,111,255,.15)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#c1adff]/70 hover:bg-[#171022] md:block"
      >
        <div className="text-[#bcaaff]"><Glyph kind="Task-uri"/></div><p className="mt-3 text-[10px] font-semibold">Task-uri</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full w-[62%] rounded-full bg-[#8f6cff]" /></div>
      </button>
      <button
        type="button"
        aria-pressed={activeFeature === "Calendar"}
        onClick={() => onSelect("Calendar")}
        className="orbyven-float-b absolute right-[-3%] top-[20%] hidden w-[162px] rounded-[20px] border border-[#b08fff]/42 bg-[#100c18]/96 p-4 text-left text-white shadow-[0_30px_92px_rgba(0,0,0,.56),0_0_34px_rgba(151,111,255,.15)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#c1adff]/70 hover:bg-[#171022] md:block"
      >
        <div className="text-[#bcaaff]"><Glyph kind="Calendar"/></div><p className="mt-3 text-[10px] font-semibold">Calendar</p><p className="mt-1 text-[6px] text-white/35">Programări</p>
      </button>

      <button
        type="button"
        aria-pressed={activeFeature === "Custom"}
        onClick={() => onSelect("Custom")}
        className="orbyven-float-a absolute bottom-[8%] right-[2%] hidden w-[154px] rounded-[20px] border border-[#b08fff]/42 bg-[#100c18]/96 p-4 text-left text-white shadow-[0_30px_92px_rgba(0,0,0,.56),0_0_34px_rgba(151,111,255,.15)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#c1adff]/70 hover:bg-[#171022] lg:block"
      >
        <div className="flex items-center justify-between">
          <span className="text-[#bcaaff]"><Glyph kind="Custom" /></span>
          <span className="rounded-full border border-[#a98dff]/24 bg-[#8f6cff]/12 px-2 py-1 text-[6px] font-bold text-[#d3c8ff]">CUSTOM</span>
        </div>
        <p className="mt-3 text-[10px] font-semibold">Module custom</p>
        <p className="mt-1 text-[6px] text-white/35">adaptate business-ului</p>
      </button>
    </div>
  );
}

export function HeroVisual({
  offerId,
  activeFeature,
  onCloseFeature,
  onSelectFeature,
}: {
  offerId: PublicOfferId;
  activeFeature: string | null;
  onCloseFeature: () => void;
  onSelectFeature: (feature: string) => void;
}) {
  return (
    <div className="relative">
      {offerId === "invitation"
        ? <InvitationVisual onSelect={onSelectFeature} activeFeature={activeFeature} />
        : offerId === "web"
          ? <WebVisual onSelect={onSelectFeature} activeFeature={activeFeature} />
          : <AdvancedVisual onSelect={onSelectFeature} activeFeature={activeFeature} />}
      {activeFeature ? <FeatureScene offerId={offerId} feature={activeFeature} onClose={onCloseFeature} /> : null}
    </div>
  );
}

