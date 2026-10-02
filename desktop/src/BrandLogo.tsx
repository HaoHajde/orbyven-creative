import iconUrl from "../../app/icon.svg?url";

type Theme = "light" | "dark";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  theme?: Theme;
};

export default function DesktopBrandLogo({
  compact = false,
  className = "",
}: BrandLogoProps) {
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
          src={iconUrl}
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
    <a
      href="/"
      onClick={preventNavigation}
      aria-label="ORBYVEN CREATIVE"
      className={"group inline-flex items-center gap-4 " + className}
    >
      <img
        src={iconUrl}
        alt=""
        width={72}
        height={72}
        className="h-[58px] w-[58px] object-contain transition duration-300 group-hover:scale-[1.03]"
      />
      <span className="leading-none">
        <span className="block text-[20px] font-semibold tracking-[0.16em] text-[var(--text)]">
          ORBYVEN
        </span>
        <span className="mt-2 block text-[10px] font-semibold tracking-[0.3em] text-[#4b46ee]">
          CREATIVE
        </span>
      </span>
    </a>
  );
}
