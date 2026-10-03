"use client";

import type { CSSProperties } from "react";

type GalaxyStar = {
  left: number;
  top: number;
  size: number;
  opacity: number;
  blur: number;
  delay: number;
  duration: number;
  tone: "white" | "violet" | "soft";
  twinkle: boolean;
};

function seededRandom(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function buildStars(count: number, seed: number): GalaxyStar[] {
  const random = seededRandom(seed);

  return Array.from({ length: count }, (_, index) => {
    const roll = random();
    const size = roll < 0.72 ? 0.65 + random() * 0.7 : roll < 0.95 ? 1.15 + random() * 0.9 : 2.05 + random() * 1.15;
    const toneRoll = random();

    return {
      left: 1.5 + random() * 97,
      top: 0.6 + random() * 98.8,
      size,
      opacity: 0.16 + random() * (size > 2 ? 0.62 : 0.48),
      blur: size > 2 ? 4 + random() * 9 : random() < 0.08 ? 2 + random() * 4 : 0,
      delay: -(random() * 10 + index * 0.037),
      duration: 3.8 + random() * 6.2,
      tone: toneRoll < 0.64 ? "white" : toneRoll < 0.88 ? "violet" : "soft",
      twinkle: random() < 0.16,
    };
  });
}

const STARS = buildStars(190, 20261003);

export default function GalaxyStars() {
  return (
    <div aria-hidden="true" className="orbyven-galaxy-stars">
      {STARS.map((star, index) => (
        <span
          key={index}
          className={`orbyven-galaxy-star orbyven-galaxy-star--${star.tone}${star.twinkle ? " is-twinkle" : ""}`}
          style={
            {
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              filter: star.blur ? `drop-shadow(0 0 ${star.blur}px currentColor)` : "none",
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
