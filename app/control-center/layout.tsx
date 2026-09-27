import type { Metadata } from "next";
import type { ReactNode } from "react";

// Account and internal pages must not compete with public landing pages.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function ControlCenterLayout({ children }: { children: ReactNode }) {
  return children;
}
