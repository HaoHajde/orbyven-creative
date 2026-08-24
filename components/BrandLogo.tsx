"use client";

import Image from "next/image";
import Link from "next/link";

type Theme = "light" | "dark";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  theme?: Theme;
};

export default function BrandLogo({
  compact = false,
  className = "",
  theme = "light",
}: BrandLogoProps) {
  /*
    IMPORTANT:

    În folderul tău actual:
    - orbyven-logo-light.png = simbolul orbital simplu
    - orbyven-logo-dark.png = simbolul orbital simplu pentru dark

    - orbyven-icon-light.png = logo complet ORBYVEN CREATIVE
    - orbyven-icon-dark.png = logo complet ORBYVEN CREATIVE
  */

  const symbolSrc =
    theme === "dark"
      ? "/branding/orbyven-logo-dark.png"
      : "/branding/orbyven-logo-light.png";

  const fullLogoSrc =
    theme === "dark"
      ? "/branding/orbyven-icon-dark.png"
      : "/branding/orbyven-icon-light.png";

  /*
    COMPACT
    Folosit în navbar.

    Aici folosim simbolul orbital + text HTML,
    pentru ca textul să rămână clar și responsive.
  */
  if (compact) {
    return (
      <Link
        href="/"
        aria-label="ORBYVEN CREATIVE — Acasă"
        className={`group inline-flex shrink-0 items-center gap-3.5 ${className}`}
      >
        <Image
          src={symbolSrc}
          alt=""
          width={64}
          height={64}
          priority
          className="
            h-[52px]
            w-[52px]
            object-contain
            transition
            duration-300
            group-hover:scale-[1.05]
            md:h-[56px]
            md:w-[56px]
          "
        />

        <span className="hidden leading-none sm:block">
          <span
            className="
              block
              text-[15px]
              font-semibold
              tracking-[0.18em]
              text-[var(--text)]
              md:text-[16px]
            "
          >
            ORBYVEN
          </span>

          <span
            className="
              mt-1.5
              block
              text-[9px]
              font-semibold
              tracking-[0.28em]
              text-[#4b46ee]
              md:text-[10px]
            "
          >
            CREATIVE
          </span>
        </span>
      </Link>
    );
  }

  /*
    FULL LOGO
    Folosit în footer.
  */
  return (
    <Link
      href="/"
      aria-label="ORBYVEN CREATIVE — Acasă"
      className={`inline-block ${className}`}
    >
      <Image
        src={fullLogoSrc}
        alt="ORBYVEN CREATIVE"
        width={340}
        height={220}
        className="
          h-auto
          w-[190px]
          object-contain
          transition-opacity
          duration-300
          sm:w-[220px]
        "
      />
    </Link>
  );
}