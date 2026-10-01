import iconUrl from "../../app/icon.svg?url";

export function OrbyvenBrand({
  subtitle = "CREATIVE",
}: {
  subtitle?: string;
}) {
  return (
    <div className="orbyven-brand">
      <img className="orbyven-brand__symbol" src={iconUrl} alt="" width={52} height={52} />
      <span className="orbyven-brand__text">
        <strong>ORBYVEN</strong>
        <small>{subtitle}</small>
      </span>
    </div>
  );
}
