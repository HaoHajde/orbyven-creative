"use client";

import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import type { PublicOfferId } from "@/lib/commerce/public-offers";
import { FeatureScene, Glyph } from "@/components/offer/OfferFeatureScene";

function InteractiveHeroStage({
  children,
  dimmed,
}: {
  children: ReactNode;
  dimmed: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dimmed || event.pointerType === "touch") return;

    const root = rootRef.current;
    const content = contentRef.current;
    if (!root || !content) return;

    const rect = root.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const normalizedX = x / rect.width - 0.5;
    const normalizedY = y / rect.height - 0.5;

    root.style.setProperty("--hero-x", `${x}px`);
    root.style.setProperty("--hero-y", `${y}px`);
    content.style.transform =
      `perspective(1400px) rotateX(${(-normalizedY * 2.4).toFixed(2)}deg) rotateY(${(normalizedX * 3.2).toFixed(2)}deg) scale(1.008)`;
  };

  const reset = () => {
    const content = contentRef.current;
    if (!content) return;
    content.style.transform =
      "perspective(1400px) rotateX(0deg) rotateY(0deg) scale(1)";
  };

  return (
    <div
      ref={rootRef}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      className="group/hero relative"
      style={
        {
          "--hero-x": "72%",
          "--hero-y": "28%",
        } as CSSProperties
      }
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[3%] z-30 rounded-[40px] opacity-0 transition-opacity duration-500 group-hover/hero:opacity-100"
        style={{
          background:
            "radial-gradient(240px circle at var(--hero-x) var(--hero-y), rgba(189,161,255,.16), rgba(126,93,255,.045) 42%, transparent 72%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[13%] bottom-[5%] z-0 h-14 rounded-full bg-[#734cff]/18 blur-[34px] transition duration-500 group-hover/hero:bg-[#875cff]/24"
      />
      <div
        ref={contentRef}
        className={`relative z-10 transform-gpu transition-[transform,filter,opacity] duration-300 ease-out will-change-transform ${dimmed ? "scale-[.985] opacity-45 blur-[1px]" : "opacity-100"}`}
      >
        {children}
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
              <div className="hidden items-center gap-4 text-[8px] sm:flex">
                <span className="text-white/28">Acasă</span>
                <button type="button" onClick={() => onSelect("Poveste")} className="transition hover:text-white">Poveste</button>
                <button type="button" onClick={() => onSelect("Locații")} className="transition hover:text-white">Locație</button>
                <button type="button" onClick={() => onSelect("Galerie")} className="transition hover:text-white">Galerie</button>
                <button type="button" onClick={() => onSelect("RSVP")} className="rounded-full bg-[#f2e6d7] px-4 py-2 font-semibold text-[#352e37] transition hover:scale-[1.03]">RSVP</button>
              </div>
            </div>
            <div className="relative mx-auto mt-8 max-w-[600px] px-6 text-center text-white">
              <p className="text-[7px] font-semibold uppercase tracking-[.36em] text-white/48">SAVE THE DATE</p>
              <p className="mt-5 font-serif text-[clamp(34px,5vw,58px)] italic leading-none text-[#f4ede5]">A & M</p>
              <p className="mt-5 text-[8px] uppercase tracking-[.28em] text-white/55">14 SEPTEMBRIE · 18:00</p>
              <div className="mx-auto mt-7 grid max-w-[390px] grid-cols-4 gap-2">
                {[["102","Zile"],["14","Ore"],["37","Min"],["21","Sec"]].map(([n,l])=>(
                  <button type="button" onClick={() => onSelect("Countdown")} key={l} className="rounded-[13px] border border-white/10 bg-white/[.045] px-2 py-3 transition hover:border-[#b49aff]/45 hover:bg-[#8f6cff]/10">
                    <p className="text-[18px] font-semibold">{n}</p><p className="mt-1 text-[6px] text-white/45">{l}</p>
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => onSelect("RSVP")} className="mx-auto mt-6 block w-fit rounded-full bg-[#f2e6d7] px-5 py-2.5 text-[8px] font-semibold text-[#352e37] transition hover:scale-[1.04]">Confirmă prezența →</button>
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
              <button type="button" onClick={() => onSelect("Website")} className="mt-7 inline-flex rounded-full bg-white px-5 py-2.5 text-[8px] font-semibold text-[#09090d] transition hover:scale-[1.04]">Vezi website-ul →</button>
            </div>
            <button type="button" onClick={() => onSelect("Responsive")} className="absolute bottom-8 right-7 top-20 w-[31%] rounded-[18px] border border-white/8 bg-[linear-gradient(155deg,rgba(255,255,255,.08),rgba(111,89,255,.12))] text-left transition hover:border-[#a98dff]/40 hover:bg-[linear-gradient(155deg,rgba(255,255,255,.10),rgba(111,89,255,.18))]">
              <div className="absolute inset-5 rounded-[15px] border border-white/[.06]" />
              <div className="absolute bottom-7 left-6 text-[7px] font-semibold tracking-[.28em] text-white/35">RESPONSIVE<br/>DESIGN</div>
            </button>
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
                  {[
                    ["Dashboard","Dashboard"],
                    ["CRM","CRM"],
                    ["Task-uri","Task-uri"],
                    ["Calendar","Calendar"],
                    ["Devize","Devize"],
                    ["Stoc","Stoc"],
                    ["Automatizări","Automatizări"],
                    ["Module","Custom"],
                  ].map(([label,feature],i)=>(
                    <button
                      type="button"
                      onClick={() => onSelect(feature)}
                      key={label}
                      className={`block w-full rounded-[9px] px-3 py-2 text-left text-[6px] transition ${activeFeature===feature || (i===0 && !activeFeature)?"bg-[#6d4cff] text-white shadow-[0_0_18px_rgba(109,76,255,.25)]":"text-white/38 hover:bg-white/[.04] hover:text-white/70"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between"><div><p className="text-[8px] text-white/35">Bun venit,</p><p className="mt-1 text-[15px] font-semibold">Dashboard</p></div><div className="h-7 w-28 rounded-full bg-white/[.045]" /></div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[
                    ["124","Clienți","CRM"],
                    ["18","Devize","Devize"],
                    ["7","Proiecte","Dashboard"],
                    ["12","Task-uri","Task-uri"],
                  ].map(([n,l,feature])=>(
                    <button type="button" onClick={() => onSelect(feature)} key={l} className="rounded-[12px] border border-white/7 bg-white/[.035] p-3 text-left transition hover:border-[#a98dff]/35 hover:bg-[#8f6cff]/10">
                      <p className="text-[17px] font-semibold">{n}</p><p className="mt-1 text-[6px] text-white/35">{l}</p>
                    </button>
                  ))}
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
                  <button type="button" onClick={() => onSelect("CRM")} className="rounded-[14px] border border-white/7 bg-white/[.035] p-3 text-left text-[7px] text-white/50 transition hover:border-[#a98dff]/35 hover:text-white/80">Activitate recentă</button>
                  <button type="button" onClick={() => onSelect("Automatizări")} className="rounded-[14px] border border-white/7 bg-white/[.035] p-3 text-left text-[7px] text-white/50 transition hover:border-[#a98dff]/35 hover:text-white/80">Automatizări · ON</button>
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
      <InteractiveHeroStage dimmed={Boolean(activeFeature)}>
        {offerId === "invitation"
          ? <InvitationVisual onSelect={onSelectFeature} activeFeature={activeFeature} />
          : offerId === "web"
            ? <WebVisual onSelect={onSelectFeature} activeFeature={activeFeature} />
            : <AdvancedVisual onSelect={onSelectFeature} activeFeature={activeFeature} />}
      </InteractiveHeroStage>

      {activeFeature ? (
        <FeatureScene
          key={`${offerId}-${activeFeature}`}
          offerId={offerId}
          feature={activeFeature}
          onClose={onCloseFeature}
          onSelect={onSelectFeature}
        />
      ) : null}
    </div>
  );
}

