import ControlCenterNavigator from "@/components/ControlCenterNavigator";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Legal & Trust | ORBYVEN Control Center",
  robots: { index: false, follow: false },
};

export default function LegalOperationsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ControlCenterNavigator />
    </>
  );
}
