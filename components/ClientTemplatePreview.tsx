"use client";

import Link from "next/link";

import type { ClientTemplateConfig } from "@/lib/client-template-catalog";

export default function ClientTemplatePreview({
  template,
  compact = false,
}: {
  template: ClientTemplateConfig;
  compact?: boolean;
}) {
  const preview =
    template.style === "technical" ? (
      <TechnicalPreview template={template} compact={compact} />
    ) : template.style === "editorial" ? (
      <EditorialPreview template={template} compact={compact} />
    ) : template.style === "airy" ? (
      <AiryPreview template={template} compact={compact} />
    ) : (
      <MedicalPreview template={template} compact={compact} />
    );

  return (
    <div className="relative">
      {preview}
      {!compact && (
        <Link
          href={`/templates/${template.slug}`}
          className="absolute inset-0 z-30"
          aria-label={`Deschide template-ul ${template.title}`}
        />
      )}
    </div>
  );
}

function TechnicalPreview({ template, compact }: { template: ClientTemplateConfig; compact: boolean }) {
  return (
    <div className={`overflow-hidden rounded-[28px] border border-black/10 bg-[#f4f6f8] text-[#121820] shadow-[0_28px_80px_rgba(18,24,32,0.12)] ${compact ? "min-h-[360px]" : "min-h-[520px]"}`}>
      <div className="flex items-center justify-between border-b border-black/10 bg-[#f7f8fa] px-5 py-4">
        <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-[8px] bg-[#315ee8] text-[8px] font-black text-white">NF</span><span className="text-xs font-black">NordFlow</span></div>
        <div className="hidden gap-4 text-[8px] font-bold text-black/40 sm:flex"><span>Servicii</span><span>Lucrări</span><span>Contact</span></div>
        <span className="rounded-[8px] bg-[#121820] px-3 py-2 text-[8px] font-bold text-white">Ofertă</span>
      </div>
      <div className="grid gap-6 p-5 md:grid-cols-[1.05fr_0.95fr] md:p-7">
        <div className="flex flex-col justify-center">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#315ee8]">clean · technical · trust-first</p>
          <h3 className={`${compact ? "mt-4 text-[32px]" : "mt-5 text-[48px] md:text-[56px]"} max-w-xl font-black leading-[0.91] tracking-[-0.06em]`}>{template.heroTitle}</h3>
          {!compact && <p className="mt-5 max-w-lg text-[11px] leading-5 text-black/50">{template.heroCopy}</p>}
          <div className="mt-5 flex gap-2"><span className="rounded-[8px] bg-[#315ee8] px-4 py-2.5 text-[9px] font-bold text-white">Evaluare</span><span className="rounded-[8px] border border-black/10 bg-white px-4 py-2.5 text-[9px] font-bold">Servicii</span></div>
        </div>
        <div className="rounded-[18px] bg-[#161c24] p-4 text-white">
          <div className="flex items-center justify-between"><span className="text-[7px] uppercase tracking-[0.13em] text-white/40">Evaluare rapidă</span><span className="h-2 w-2 rounded-full bg-[#61d18b]" /></div>
          <div className="mt-5 space-y-2">{["Tip lucrare", "Locație", "Programare"].map((item) => <div key={item} className="rounded-[8px] border border-white/10 bg-white/[0.04] px-3 py-3 text-[8px] text-white/50">{item}<span className="float-right">⌄</span></div>)}</div>
          <div className="mt-3 rounded-[8px] bg-[#315ee8] py-3 text-center text-[8px] font-bold">Trimite solicitarea</div>
        </div>
      </div>
      <div className="grid grid-cols-3 border-t border-black/10 bg-white/70">{template.stats.map((stat) => <div key={stat.label} className="border-r border-black/10 px-4 py-4 last:border-r-0"><p className="text-[18px] font-black tracking-[-0.04em]">{stat.value}</p><p className="mt-1 text-[7px] uppercase tracking-[0.1em] text-black/35">{stat.label}</p></div>)}</div>
    </div>
  );
}

function EditorialPreview({ template, compact }: { template: ClientTemplateConfig; compact: boolean }) {
  return (
    <div className={`overflow-hidden rounded-[28px] border border-[#2b211d]/10 bg-[#f7f1e9] text-[#2b211d] shadow-[0_30px_90px_rgba(74,47,37,0.12)] ${compact ? "min-h-[360px]" : "min-h-[520px]"}`}>
      <div className="flex items-center justify-between px-5 py-5"><span className="font-serif text-[18px] italic">Lumière</span><div className="hidden gap-4 text-[7px] uppercase tracking-[0.12em] text-[#2b211d]/45 sm:flex"><span>Experience</span><span>Stories</span><span>Contact</span></div><span className="border-b border-[#2b211d] pb-1 text-[7px] uppercase tracking-[0.11em]">Enquire</span></div>
      <div className="grid gap-4 px-5 pb-6 pt-3 md:grid-cols-[0.9fr_1.1fr] md:px-7">
        <div className="flex flex-col justify-center">
          <p className="text-[7px] uppercase tracking-[0.18em] text-[#9f5e4b]">warm · editorial · elegant</p>
          <h3 className={`${compact ? "mt-4 text-[34px]" : "mt-5 text-[50px] md:text-[58px]"} font-serif leading-[0.9] tracking-[-0.05em]`}>{template.heroTitle}</h3>
          {!compact && <p className="mt-5 max-w-md text-[11px] leading-5 text-[#2b211d]/50">{template.heroCopy}</p>}
          <span className="mt-5 w-fit rounded-full bg-[#2b211d] px-4 py-2.5 text-[8px] font-semibold text-[#fff9f3]">Tell us your story</span>
        </div>
        <div className="relative min-h-[245px] md:min-h-[320px]"><div className="absolute left-[3%] top-0 h-[75%] w-[68%] rounded-t-[90px] bg-[linear-gradient(145deg,#d5b6a5,#765348)]" /><div className="absolute bottom-0 right-0 h-[50%] w-[48%] border-[5px] border-[#f7f1e9] bg-[linear-gradient(145deg,#ead8c7,#9b715f)]" /><div className="absolute right-0 top-3 rotate-3 bg-white px-3 py-2 text-center"><p className="font-serif text-[18px] italic">120+</p><p className="text-[5px] uppercase tracking-[0.12em] text-black/35">stories</p></div></div>
      </div>
      <div className="grid grid-cols-3 border-t border-[#2b211d]/10 bg-[#fffaf5]">{template.stats.map((stat) => <div key={stat.label} className="border-r border-[#2b211d]/10 px-4 py-4 text-center last:border-r-0"><p className="font-serif text-[18px] italic">{stat.value}</p><p className="mt-1 text-[6px] uppercase tracking-[0.1em] text-[#2b211d]/35">{stat.label}</p></div>)}</div>
    </div>
  );
}

function AiryPreview({ template, compact }: { template: ClientTemplateConfig; compact: boolean }) {
  return (
    <div className={`overflow-hidden rounded-[28px] border border-[#30282c]/8 bg-[#fffdfc] text-[#30282c] shadow-[0_30px_90px_rgba(69,46,57,0.09)] ${compact ? "min-h-[360px]" : "min-h-[520px]"}`}>
      <div className="flex items-center justify-between px-5 py-5"><span className="text-[14px] font-medium tracking-[-0.04em]">atelier <em className="font-serif">élan</em></span><div className="hidden gap-4 text-[7px] text-black/38 sm:flex"><span>Ritualuri</span><span>Rezultate</span><span>Contact</span></div><span className="rounded-full bg-[#30282c] px-3 py-2 text-[7px] font-semibold text-white">Programare</span></div>
      <div className="px-5 pb-6 pt-3 text-center md:px-7">
        <p className="text-[7px] uppercase tracking-[0.19em] text-[#8b6a75]">soft · premium · airy</p>
        <h3 className={`${compact ? "mt-4 text-[31px]" : "mt-5 text-[45px] md:text-[54px]"} mx-auto max-w-3xl font-medium leading-[0.92] tracking-[-0.06em]`}>{template.heroTitle}</h3>
        {!compact && <p className="mx-auto mt-4 max-w-lg text-[10px] leading-5 text-[#30282c]/45">{template.heroCopy}</p>}
        <div className="mx-auto mt-6 grid max-w-[650px] grid-cols-[0.85fr_1.25fr_0.85fr] items-end gap-2"><div className="h-[130px] rounded-t-[55px] rounded-b-[12px] bg-[linear-gradient(145deg,#ead7d8,#9b7478)]" /><div className="relative h-[180px] rounded-[18px] bg-[linear-gradient(145deg,#f0e3dc,#b78d82)]"><div className="absolute inset-x-3 bottom-3 rounded-[10px] bg-white/75 p-2 text-left"><p className="text-[5px] uppercase tracking-[0.12em] text-[#8b6a75]">signature ritual</p><p className="mt-1 text-[9px] font-medium">Calm + Glow</p></div></div><div className="h-[130px] rounded-t-[55px] rounded-b-[12px] bg-[linear-gradient(145deg,#d8c5bd,#8f706a)]" /></div>
      </div>
      <div className="grid grid-cols-3 border-t border-[#30282c]/8 bg-[#faf6f4]">{template.stats.map((stat) => <div key={stat.label} className="px-3 py-4 text-center"><p className="text-[17px] font-medium">{stat.value}</p><p className="mt-1 text-[6px] uppercase tracking-[0.1em] text-[#30282c]/30">{stat.label}</p></div>)}</div>
    </div>
  );
}

function MedicalPreview({ template, compact }: { template: ClientTemplateConfig; compact: boolean }) {
  return (
    <div className={`overflow-hidden rounded-[28px] border border-[#172627]/8 bg-[#f2f7f6] text-[#172627] shadow-[0_30px_90px_rgba(30,77,79,0.10)] ${compact ? "min-h-[360px]" : "min-h-[520px]"}`}>
      <div className="bg-[#286d73] px-4 py-2 text-center text-[6px] font-semibold uppercase tracking-[0.12em] text-white/75">calm · modern medical · reassuring</div>
      <div className="flex items-center justify-between px-5 py-4"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#286d73] text-[10px] font-bold text-white">+</span><span className="text-xs font-bold">NovaSmile</span></div><div className="hidden gap-4 text-[7px] text-black/40 sm:flex"><span>Tratamente</span><span>Echipă</span><span>Recenzii</span></div><span className="rounded-full bg-[#286d73] px-3 py-2 text-[7px] font-semibold text-white">Programare</span></div>
      <div className="grid gap-5 px-5 pb-6 pt-2 md:grid-cols-[1.05fr_0.95fr] md:px-7">
        <div className="flex flex-col justify-center"><span className="w-fit rounded-full bg-[#dfeeee] px-3 py-2 text-[6px] font-bold uppercase tracking-[0.12em] text-[#286d73]">stomatologie explicată simplu</span><h3 className={`${compact ? "mt-4 text-[31px]" : "mt-5 text-[44px] md:text-[52px]"} max-w-xl font-semibold leading-[0.92] tracking-[-0.06em]`}>{template.heroTitle}</h3>{!compact && <p className="mt-4 max-w-lg text-[10px] leading-5 text-[#172627]/45">{template.heroCopy}</p>}<span className="mt-5 w-fit rounded-full bg-[#286d73] px-4 py-2.5 text-[8px] font-semibold text-white">Consultație</span></div>
        <div className="relative min-h-[235px] overflow-hidden rounded-[20px] bg-[linear-gradient(145deg,#d8e9e7,#7ea9a6)]"><div className="absolute left-[20%] top-[10%] h-[110px] w-[110px] rounded-full bg-white/60" /><div className="absolute bottom-0 left-1/2 h-[70%] w-[58%] -translate-x-1/2 rounded-t-[90px] bg-[#dcebea]" /><div className="absolute inset-x-3 bottom-3 rounded-[10px] bg-white/82 p-3"><p className="text-[5px] uppercase tracking-[0.12em] text-[#286d73]">medic coordonator</p><p className="mt-1 text-[9px] font-semibold">Dr. Ana Popescu</p></div></div>
      </div>
      <div className="grid grid-cols-3 border-t border-[#172627]/8 bg-white">{template.stats.map((stat) => <div key={stat.label} className="border-r border-[#172627]/8 px-3 py-4 text-center last:border-r-0"><p className="text-[17px] font-semibold">{stat.value}</p><p className="mt-1 text-[6px] uppercase tracking-[0.1em] text-[#172627]/30">{stat.label}</p></div>)}</div>
    </div>
  );
}
