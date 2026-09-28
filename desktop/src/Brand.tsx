import iconUrl from "../../app/icon.svg?url";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

// The exact OC artwork and module line icons used by the public ORBYVEN brand/workspace.
export function OrbyvenBrand({ subtitle = "CREATIVE", compact = false }: { subtitle?: string; compact?: boolean }) {
  return (
    <div className={"orbyven-brand" + (compact ? " orbyven-brand--compact" : "")}>
      <img className="orbyven-brand__symbol" src={iconUrl} alt="" width={52} height={52} />
      <span className="orbyven-brand__text"><strong>ORBYVEN</strong><small>{subtitle}</small></span>
    </div>
  );
}

const modulePaths: Record<OrbyvenModuleId, string> = {
  overview: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  leads: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2z M9 10a4 4 0 1 0 0-8a4 4 0 0 0 0 8z M18 8a3 3 0 0 1 0 6 M18 16a4 4 0 0 1 4 4",
  tasks: "M8 3h8v3H8z M8 5H5v16h14V5h-3 M9 12l2 2 4-4 M9 18h6",
  calendar: "M3 5h18v16H3z M3 10h18 M7 2v6 M17 2v6 M8 15h3 M8 18h3",
  estimates: "M5 2h10l4 4v16H5z M15 2v5h4 M8 12h8 M8 16h8 M8 19h5",
  documents: "M5 3h10l4 4v14H5z M15 3v5h4 M8 12h8 M8 16h8",
  expenses: "M3 6h18v14H3z M3 10h18 M16 16h3 M6 3h12",
  thermal: "M3 7h18 M5 7v10h14V7 M8 11h8 M8 14h5 M4 21h16",
  team: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 1 0 0-8a4 4 0 0 0 0 8 M18 8a3 3 0 0 1 0 6 M18 16a4 4 0 0 1 4 4",
};

export function ModuleGlyph({ id }: { id: OrbyvenModuleId }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      width="17" height="17" className="module-glyph"><path d={modulePaths[id]} /></svg>
  );
}
