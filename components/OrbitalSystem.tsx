type OrbitalSystemProps = {
  variant?: "hero" | "accent";
  className?: string;
};

export default function OrbitalSystem({
  variant = "accent",
  className = "",
}: OrbitalSystemProps) {
  const rings =
    variant === "hero"
      ? ["01", "02", "03", "04", "05", "06"]
      : ["02", "04", "06"];

  return (
    <div
      aria-hidden="true"
      className={`orbyven-orbit-system orbyven-orbit-system--${variant} ${className}`}
    >
      <div className="orbyven-orbit-core" />

      {rings.map((ring) => (
        <span
          key={ring}
          className={`orbyven-orbit-ring orbyven-orbit-ring--${ring}`}
        />
      ))}

      <span className="orbyven-orbit-track orbyven-orbit-track--one">
        <span className="orbyven-orbit-body orbyven-orbit-body--star">✦</span>
      </span>

      <span className="orbyven-orbit-track orbyven-orbit-track--two">
        <span className="orbyven-orbit-body orbyven-orbit-body--violet" />
      </span>

      {variant === "hero" && (
        <>
          <span className="orbyven-orbit-track orbyven-orbit-track--three">
            <span className="orbyven-orbit-body orbyven-orbit-body--small" />
          </span>

          <span className="orbyven-orbit-track orbyven-orbit-track--four">
            <span className="orbyven-orbit-body orbyven-orbit-body--ring">
              <span />
            </span>
          </span>
        </>
      )}
    </div>
  );
}
