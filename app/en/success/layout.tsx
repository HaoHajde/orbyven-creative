import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Checkout Complete",
  robots: { index: false, follow: false },
};

export default function SuccessLayout({ children }: { children: ReactNode }) {
  return children;
}
