import {
  readableText, SITE_PRESET_LABELS, type EditableSite, type SitePresetId, type SiteLayout,
} from "@/lib/ai/site-editor";

type Props = {
  site: EditableSite;
  view: "desktop" | "mobile";
  onView: (view: "desktop" | "mobile") => void;
  onPatch: (patch: Partial<EditableSite>) => void;
  onSelectPreset: (preset: SitePresetId) => void;
};

const HERO_IMAGES: Partial<Record<SitePresetId, string>> = {
  instalatii: "/pilot-002/pardoseala.webp",
  detailing: "/hao-customs/hero.webp",
};

function textField(
  label: string,
  value: string,
  onChange: (value: string) => void,
  maxLength: number
) {
  return <label className="flex min-w-0 flex-col gap-1.5 text-[11px] font-medium text-[#65656e]">
    {label}
    <input value={value} maxLength={maxLength} onChange={event => onChange(event.target.value)}
      className="min-w-0 rounded-[12px] border border-black/10 bg-white px-3 py-2.5 text-[12px] text-[#1d1d1f] outline-none focus:border-[#6058e8]"/>
  </label>;
}

function colorField(label: string, value: string, onChange: (value: string) => void) {
  return <label className="flex min-w-0 items-center gap-2 rounded-[12px] border border-black/10 bg-white px-3 py-2 text-[11px] font-medium text-[#65656e]">
    <input type="color" value={value} onChange={event => onChange(event.target.value)}
      aria-label={label} className="h-7 w-7 cursor-pointer rounded-md border-none bg-transparent p-0"/>
    <span className="truncate">{label}</span>
    <span className="ml-auto font-mono text-[10px] opacity-65">{value}</span>
  </label>;
}

export default function SiteEditorPreview({
  site, view, onView, onPatch, onSelectPreset,
}: Props) {
  const mobile = view === "mobile";
  const centered = site.layout === "centered";
  const image = HERO_IMAGES[site.preset];
  const buttonText = readableText(site.accent);
  const serviceLabels: Record<SitePresetId, string[]> = {
    studio: ["Servicii", "Proiecte", "Contact"],
    instalatii: ["Termice", "Sanitare", "Confort smart"],
    detailing: ["Interior", "Exterior", "Protecție"],
    florarie: ["Buchete", "Aranjamente", "Comenzi"],
  };

  return <section className="min-w-0 rounded-[26px] border border-black/[0.07] bg-white p-3 shadow-sm md:p-5" aria-label="Previzualizare site">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
      <div><h2 className="text-sm font-semibold">Preview live</h2><p className="mt-1 text-[11px] text-[#86868b]">Draft demonstrativ · nu schimbă site-ul publicat</p></div>
      <div className="flex rounded-full bg-[#f2f2f6] p-1 text-xs">
        {(["desktop", "mobile"] as const).map(mode =>
          <button key={mode} type="button" aria-pressed={view === mode} onClick={() => onView(mode)}
            className={view === mode ? "rounded-full bg-white px-4 py-2 font-semibold shadow-sm" : "px-4 py-2 text-[#777780]"}>
            {mode === "desktop" ? "Desktop" : "Mobil"}
          </button>
        )}
      </div>
    </div>

    <div className="mb-4 grid gap-3 sm:grid-cols-2">
      <label className="flex min-w-0 flex-col gap-1.5 text-[11px] font-semibold text-[#65656e]">
        Model de pornire
        <select value={site.preset} onChange={event => onSelectPreset(event.target.value as SitePresetId)}
          className="h-11 rounded-[13px] border border-black/10 bg-[#f8f8fb] px-3 text-xs text-[#1d1d1f]">
          {(Object.keys(SITE_PRESET_LABELS) as SitePresetId[]).map(id =>
            <option key={id} value={id}>{SITE_PRESET_LABELS[id]}</option>
          )}
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-1.5 text-[11px] font-semibold text-[#65656e]">
        Layout
        <select value={site.layout} onChange={event => onPatch({layout: event.target.value as SiteLayout})}
          className="h-11 rounded-[13px] border border-black/10 bg-[#f8f8fb] px-3 text-xs text-[#1d1d1f]">
          <option value="split">Împărțit</option>
          <option value="centered">Centrat</option>
          <option value="editorial">Editorial</option>
        </select>
      </label>
    </div>

    <details className="mb-4 rounded-[17px] border border-black/[0.08] bg-[#f8f8fb] p-3">
      <summary className="cursor-pointer px-1 text-xs font-semibold">Ajustări rapide · fără AI</summary>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {textField("Numele firmei", site.brand, text => onPatch({brand: text}), 70)}
        {textField("Text deasupra titlului", site.eyebrow, text => onPatch({eyebrow: text}), 90)}
        <div className="sm:col-span-2">{textField("Titlu principal", site.headline, text => onPatch({headline: text}), 140)}</div>
        <div className="sm:col-span-2">{textField("Descriere", site.description, text => onPatch({description: text}), 420)}</div>
        {textField("Buton principal", site.cta, text => onPatch({cta: text}), 45)}
        {colorField("Accent", site.accent, color => onPatch({accent: color}))}
        {colorField("Fundal", site.background, color => onPatch({background: color}))}
        {colorField("Carduri", site.surface, color => onPatch({surface: color}))}
      </div>
    </details>

    <div className="min-h-[540px] overflow-auto rounded-[20px] border border-black/[0.08] bg-[#eaeaf0] p-2 md:p-5 lg:max-h-[calc(100vh-350px)]">
      <div className="mx-auto w-full overflow-hidden rounded-[15px] shadow-[0_20px_70px_rgba(0,0,0,0.12)] transition-[max-width] duration-300"
        style={{maxWidth: mobile ? 390 : 1160, backgroundColor: site.background, color: site.textColor}}>
        <nav className="flex items-center justify-between gap-4 px-6 py-6 md:px-9">
          <strong className="truncate text-lg tracking-[-0.05em]">{site.brand}</strong>
          <span className="rounded-full border px-4 py-2 text-[10px] font-semibold" style={{borderColor: site.accent}}>CONTACT</span>
        </nav>

        <div className="grid items-center" style={{
          gridTemplateColumns: mobile || centered ? "minmax(0,1fr)" : "repeat(auto-fit,minmax(min(100%,340px),1fr))",
        }}>
          <section className={centered ? "px-6 pb-14 pt-14 text-center md:px-12 md:pb-20 md:pt-20" :
            "px-6 pb-12 pt-16 md:px-12 md:pb-24 md:pt-24"}>
            <p className="text-[10px] font-bold tracking-[0.20em]" style={{color: site.accent}}>{site.eyebrow}</p>
            <h3 className={centered ? "mx-auto mt-6 max-w-3xl text-[clamp(34px,4vw,70px)] font-semibold leading-[1.07] tracking-[-0.06em]" :
              "mt-7 max-w-3xl text-[clamp(34px,4vw,70px)] font-semibold leading-[1.06] tracking-[-0.06em]"}>
              {site.headline}
            </h3>
            <p className={centered ? "mx-auto mt-7 max-w-xl text-sm leading-7 opacity-80" :
              "mt-7 max-w-xl text-sm leading-7 opacity-80"}>{site.description}</p>
            <span className="mt-9 inline-block rounded-full px-6 py-3 text-xs font-semibold"
              style={{backgroundColor: site.accent, color: buttonText}}>{site.cta} ↗</span>
          </section>

          {!centered && <div className={mobile ? "min-h-[215px] p-4 pt-0" : "min-h-[390px] p-6"}>
            <div className="relative h-full min-h-[215px] overflow-hidden rounded-[22px]"
              style={image ? {
                backgroundImage: "url('" + image + "')",
                backgroundPosition: "center", backgroundSize: "cover",
                backgroundColor: site.surface,
              } : {
                background: "radial-gradient(circle at 65% 22%," + site.accent + "70,transparent 42%)," +
                  "linear-gradient(135deg," + site.surface + "," + site.background + ")",
              }}>
              {!image && <div className="absolute inset-0 grid place-items-center text-[min(16vw,110px)] font-semibold opacity-25" style={{color: site.accent}}>✳</div>}
              {site.layout === "editorial" && <span className="absolute bottom-4 left-4 rounded-full px-4 py-2 text-[10px] font-bold backdrop-blur-lg"
                style={{backgroundColor: site.surface, color: site.textColor}}>DETALIILE CONTEAZĂ</span>}
            </div>
          </div>}
        </div>

        <section className="px-6 pb-14 md:px-12">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] opacity-60">Ce oferim</p>
          <div className="grid gap-3" style={{gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fit,minmax(min(100%,155px),1fr))"}}>
            {serviceLabels[site.preset].map((label, index) =>
              <div key={label} className="min-h-[116px] rounded-[18px] border p-5" style={{backgroundColor: site.surface, borderColor: site.accent + "33"}}>
                <span className="text-xl" style={{color: site.accent}}>{String(index + 1).padStart(2, "0")}</span>
                <p className="mt-5 text-sm font-semibold">{label}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  </section>;
}
