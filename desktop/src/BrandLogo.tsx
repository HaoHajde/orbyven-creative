import darkSymbol from "../../public/branding/orbyven-logo-dark.png";
import lightSymbol from "../../public/branding/orbyven-logo-light.png";
import darkFullLogo from "../../public/branding/orbyven-icon-dark.png";
import lightFullLogo from "../../public/branding/orbyven-icon-light.png";

type Theme = "light" | "dark";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  theme?: Theme;
};

export default function DesktopBrandLogo({
  compact = false,
  className = "",
  theme = "light",
}: BrandLogoProps) {
  const symbolSrc = theme === "dark" ? darkSymbol : lightSymbol;
  const fullLogoSrc = theme === "dark" ? darkFullLogo : lightFullLogo;

  const preventNavigation = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
  };

  if (compact) {
    return (
      <a
        href="/"
        onClick={preventNavigation}
        aria-label="ORBYVEN CREATIVE"
        className={"group inline-flex shrink-0 items-center gap-3.5 " + className}
      >
        <img
          src={symbolSrc}
          alt=""
          width={64}
          height={64}
          className="h-[52px] w-[52px] object-contain transition duration-300 group-hover:scale-[1.05] md:h-[56px] md:w-[56px]"
        />
        <span className="hidden leading-none sm:block">
          <span className="block text-[15px] font-semibold tracking-[0.18em] text-[var(--text)] md:text-[16px]">
            ORBYVEN
          </span>
          <span className="mt-1.5 block text-[9px] font-semibold tracking-[0.28em] text-[#4b46ee] md:text-[10px]">
            CREATIVE
          </span>
        </span>
      </a>
    );
  }

  return (
    <a href="/" onClick={preventNavigation} aria-label="ORBYVEN CREATIVE" className={"inline-block " + className}>
      <img
        src={fullLogoSrc}
        alt="ORBYVEN CREATIVE"
        width={340}
        height={220}
        className="h-auto w-[190px] object-contain transition-opacity duration-300 sm:w-[220px]"
      />
    </a>
  );
}
