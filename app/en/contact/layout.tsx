import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Start with ORBYVEN | Web Design & Business Workspace",
  description:
    "Choose how you want to start with ORBYVEN: a digital experience, web design, or web design connected to the ORBYVEN business workspace.",
  alternates: {
    canonical: "https://www.orbyven.com/contact",
  },
  openGraph: {
    url: "https://www.orbyven.com/contact",
    title: "Start with ORBYVEN",
    description:
      "Choose between a digital experience, web design, or the connected ORBYVEN website and business workspace.",
  },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return (
    <div className="orbyven-start-scope">
      <style>{`
        .orbyven-start-cards {
          display: grid;
          gap: 14px;
        }

        .orbyven-start-card {
          min-width: 0;
          transition:
            flex-grow .72s cubic-bezier(.16,1,.3,1),
            transform .55s cubic-bezier(.16,1,.3,1),
            border-color .35s ease,
            box-shadow .45s ease;
        }

        @media (hover: hover) and (min-width: 1024px) {
          .orbyven-start-cards {
            display: flex;
            align-items: stretch;
          }

          .orbyven-start-card {
            flex: 1 1 0;
          }

          .orbyven-start-cards:has(.orbyven-start-card:hover) .orbyven-start-card {
            flex-grow: .56;
            filter: saturate(.72) brightness(.78);
          }

          .orbyven-start-cards:has(.orbyven-start-card:hover) .orbyven-start-card:hover {
            flex-grow: 2.15;
            transform: translateY(-8px);
            filter: saturate(1.08) brightness(1.04);
            box-shadow: 0 42px 140px rgba(65, 44, 145, .30);
          }
        }
      `}</style>
      {children}
    </div>
  );
}
