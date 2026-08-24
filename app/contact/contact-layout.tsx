import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Discută cu ORBYVEN CREATIVE despre website-ul, landing page-ul, redesign-ul sau experiența digitală pe care vrei să o construiești.",
  openGraph: {
    title: "Contact | ORBYVEN CREATIVE",
    description:
      "Ai un proiect în minte? Spune-ne ce vrei să construim și începem de acolo.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
