import ControlCenter from "@/components/ControlCenter";
import Link from "next/link";

const items = [
  { href: "/control-center/integrity", label: "Integrity", glyph: "◇", accent: "text-emerald-200" },
  { href: "/control-center/legal", label: "Legal & Trust", glyph: "⚖", accent: "text-indigo-200" },
  { href: "/control-center/platform", label: "Platform Core", glyph: "⌘", accent: "text-white" },
];

export default function ControlCenterPage() {
  return (
    <>
      <ControlCenter />
      <nav
        aria-label="Owner tools"
        className="fixed bottom-4 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/[0.1] bg-[#101013]/90 p-1.5 shadow-[0_18px_60px_rgba(0,0,0,.38)] backdrop-blur-2xl"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            title={item.label}
            className={`grid h-10 w-10 place-items-center rounded-full text-sm transition hover:bg-white/[0.07] ${item.accent}`}
          >
            <span aria-hidden="true">{item.glyph}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
