import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Discută cu ORBYVEN CREATIVE despre website-ul, landing page-ul, redesign-ul sau experiența digitală pe care vrei să o construiești.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    url: "/contact",
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
  return (
    <div className="orbyven-contact-scope">
      <style>{`
        .orbyven-contact-scope > main > section:first-of-type {
          min-height: 72svh;
          display: flex;
          align-items: flex-end;
          color: #ffffff !important;
          background:
            radial-gradient(circle at 76% 20%, rgba(111, 80, 255, .34), transparent 31%),
            radial-gradient(circle at 24% 42%, rgba(78, 49, 151, .25), transparent 36%),
            linear-gradient(180deg, rgba(30, 19, 54, .99) 0%, rgba(18, 10, 34, .98) 46%, rgba(7, 5, 13, .98) 78%, var(--bg) 100%) !important;
        }

        .orbyven-contact-scope > main > section:first-of-type::before {
          content: "";
          position: absolute;
          width: 22rem;
          height: 22rem;
          right: 8%;
          top: 24%;
          border-radius: 999px;
          background: rgba(122, 92, 255, .10);
          filter: blur(80px);
          pointer-events: none;
          animation: orbyven-contact-glow 14s ease-in-out infinite;
        }

        .orbyven-contact-scope > main > section:first-of-type p {
          color: rgba(255, 255, 255, .58) !important;
        }

        .orbyven-contact-scope > main > section:first-of-type p:first-of-type {
          color: rgba(255, 255, 255, .44) !important;
        }

        @keyframes orbyven-contact-glow {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          45% { transform: translate3d(-42px, 28px, 0) scale(1.12); }
          72% { transform: translate3d(16px, 54px, 0) scale(.96); }
        }

        @media (prefers-reduced-motion: reduce) {
          .orbyven-contact-scope > main > section:first-of-type::before {
            animation: none;
          }
        }
      `}</style>
      {children}
    </div>
  );
}
