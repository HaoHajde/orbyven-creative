import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Website Studio · ORBYVEN",
  description: "Spațiul privat de personalizare a website-ului.",
  robots: { index: false, follow: false, noarchive: true },
};

export default function WebsiteStudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
