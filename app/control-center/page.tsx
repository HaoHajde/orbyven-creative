import ControlCenter from "@/components/ControlCenter";
import Link from "next/link";

export default function ControlCenterPage() {
  return (
    <>
      <ControlCenter />
      <nav className="fixed bottom-5 right-5 z-[70] flex flex-wrap items-center gap-2">
      <Link
        href="/control-center/legal"
        className="rounded-full border border-indigo-400/25 bg-[#151517]/95 px-4 py-3 text-xs font-semibold text-indigo-200 shadow-2xl backdrop-blur-xl"
      >
        Legal & Trust →
      </Link>
      <Link
        href="/control-center/platform"
        className="rounded-full border border-white/[0.14] bg-[#151517]/95 px-4 py-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl"
      >
        Platform Core v2 →
      </Link>
      </nav>
    </>
  );
}
