"use client";
import {
  SECTION_LABELS, type EditableSite, type SiteSectionId,
} from "@/lib/ai/site-editor";
import { moveSection, setSectionVisible } from "@/lib/ai/site-sections-controls";

type Props = {
  site: EditableSite;
  onPatch: (patch: Partial<EditableSite>) => void;
};

export default function SiteEditorSections({site, onPatch}: Props) {
  const updateVisibility = (section: SiteSectionId, visible: boolean) => {
    const draft = setSectionVisible(site, section, visible);
    onPatch({hiddenSections: draft.hiddenSections});
  };
  const move = (section: SiteSectionId, direction: "up" | "down") => {
    const draft = moveSection(site, section, direction);
    onPatch({sectionOrder: draft.sectionOrder});
  };
  return <details className="mb-4 rounded-[17px] border border-black/[0.08] bg-[#f8f8fb] p-3">
    <summary className="cursor-pointer px-1 text-xs font-semibold">Secțiuni · arată, ascunde, mută</summary>
    <p className="mt-3 px-1 text-[11px] leading-5 text-[#777780]">Secțiunile sunt parte din draft și pot fi recuperate cu Undo/Redo. Hero rămâne primul.</p>
    <ol className="mt-3 space-y-2">
      {site.sectionOrder.map((section, index) => {
        const isHero = section === "hero";
        const visible = !site.hiddenSections.includes(section);
        return <li key={section} className="flex flex-wrap items-center justify-between gap-2 rounded-[13px] border border-black/10 bg-white p-2.5">
          <label className="flex min-w-0 items-center gap-2 text-xs font-medium">
            <input type="checkbox" checked={visible} disabled={isHero}
              onChange={event => updateVisibility(section, event.target.checked)}
              className="accent-[#6058e8]"/>
            <span>{String(index + 1).padStart(2,"0")} · {SECTION_LABELS[section]}</span>
          </label>
          <div className="flex gap-1">
            <button type="button" onClick={() => move(section,"up")} disabled={isHero || index <= 1}
              aria-label={"Mută " + SECTION_LABELS[section] + " mai sus"}
              className="rounded-lg border border-black/10 px-2.5 py-1.5 text-xs disabled:opacity-30">↑</button>
            <button type="button" onClick={() => move(section,"down")} disabled={isHero || index === site.sectionOrder.length-1}
              aria-label={"Mută " + SECTION_LABELS[section] + " mai jos"}
              className="rounded-lg border border-black/10 px-2.5 py-1.5 text-xs disabled:opacity-30">↓</button>
          </div>
        </li>;
      })}
    </ol>
  </details>;
}
