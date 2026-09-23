import type { EditableSite } from "@/lib/ai/site-editor";

export default function SiteEditorPreview({site,view,onView}:{site:EditableSite;view:"desktop"|"mobile";onView:(view:"desktop"|"mobile")=>void}){
  return <section className="min-w-0 rounded-[26px] border border-black/[0.07] bg-white p-3 shadow-sm md:p-5" aria-label="Previzualizare site">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
      <div><h2 className="text-sm font-semibold">Preview live</h2><p className="mt-1 text-[11px] text-[#86868b]">Exemplu · nu modifică template-ul publicat</p></div>
      <div className="flex rounded-full bg-[#f2f2f6] p-1 text-xs">{(["desktop","mobile"] as const).map(mode=><button key={mode} type="button" aria-pressed={view===mode} onClick={()=>onView(mode)} className={view===mode?"rounded-full bg-white px-4 py-2 font-semibold shadow-sm":"px-4 py-2 text-[#777780]"}>{mode==="desktop"?"Desktop":"Mobil"}</button>)}</div>
    </div>
    <div className="grid min-h-[580px] place-items-start overflow-auto rounded-[20px] border border-black/[0.08] bg-[#eaeaf0] p-2 md:p-5 lg:h-[calc(100%-70px)]">
      <div className="mx-auto w-full overflow-hidden rounded-[14px] shadow-[0_20px_70px_rgba(0,0,0,0.12)]" style={{maxWidth:view==="mobile"?390:1120,background:site.background,color:site.textColor}}>
        <nav className="flex items-center justify-between gap-4 px-6 py-6 md:px-9"><strong className="truncate text-lg tracking-[-0.05em]">{site.brand}</strong><span className="rounded-full border px-4 py-2 text-[10px] font-semibold" style={{borderColor:site.accent}}>CONTACT</span></nav>
        <section className="px-6 pb-16 pt-16 md:px-12 md:pb-28 md:pt-24"><p className="text-[10px] font-bold tracking-[0.21em]" style={{color:site.accent}}>{site.eyebrow}</p><h3 className="mt-7 max-w-[850px] text-[clamp(36px,5vw,74px)] font-semibold leading-[1.01] tracking-[-0.065em]">{site.headline}</h3><p className="mt-7 max-w-xl text-sm leading-7 opacity-75">{site.description}</p><span className="mt-9 inline-block rounded-full px-6 py-3 text-xs font-semibold text-white" style={{backgroundColor:site.accent}}>{site.cta} ↗</span></section>
        <section className="px-6 pb-16 md:px-12"><p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] opacity-55">Ce oferim</p><div className="grid gap-3 sm:grid-cols-3">{["Servicii","Portofoliu","Contact"].map(label=><div key={label} className="min-h-[118px] rounded-[18px] border p-5" style={{background:site.surface,borderColor:site.accent+"33"}}><span className="text-xl" style={{color:site.accent}}>✳</span><p className="mt-5 text-sm font-semibold">{label}</p></div>)}</div></section>
      </div>
    </div>
  </section>;
}
