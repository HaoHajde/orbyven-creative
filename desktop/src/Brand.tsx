import iconUrl from "../../app/icon.svg?url";

// Desktop brand adapter: the OC artwork stays local while shared workspace glyphs come from components/WorkspaceModuleGlyph.
export function OrbyvenBrand({ subtitle = "CREATIVE", compact = false }: { subtitle?: string; compact?: boolean }) {
  return (
    <div className={"orbyven-brand" + (compact ? " orbyven-brand--compact" : "")}>
      <img className="orbyven-brand__symbol" src={iconUrl} alt="" width={52} height={52} />
      <span className="orbyven-brand__text"><strong>ORBYVEN</strong><small>{subtitle}</small></span>
    </div>
  );
}
