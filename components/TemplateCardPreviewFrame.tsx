import type { ReactNode } from "react";

/**
 * One stable preview aperture for every card in /templates.
 * The actual preview keeps its own layout; this frame only clips the first fold
 * to an identical size, so switching industries never changes card geometry.
 */
export default function TemplateCardPreviewFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[350px] shrink-0 overflow-hidden rounded-[24px] bg-[var(--surface-2)] sm:h-[370px]">
      <div className="h-full w-full [&>*]:h-full">{children}</div>
    </div>
  );
}
