import ControlCenter from "@/components/ControlCenter";
import Link from "next/link";

export default function ControlCenterPage() {
  return (
    <>
      <ControlCenter />
      <Link
        href="/control-center/platform"
        className="fixed bottom-5 right-5 z-[70] rounded-full border border-white/[0.14] bg-[#151517]/95 px-4 py-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl"
      >
        Platform Core v2 →
      </Link>
    </>
  );
}
