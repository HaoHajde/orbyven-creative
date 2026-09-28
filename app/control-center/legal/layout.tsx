import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal & Trust | ORBYVEN Control Center",
  robots: { index: false, follow: false },
};

export default function LegalOperationsLayout({children}:{children:React.ReactNode}) {
  return children;
}
