import type { Metadata } from "next";
import Link from "next/link";

import VideoAiStudio from "@/components/VideoAiStudio";

export const metadata: Metadata = {
  title: "ORBYVEN Video AI | AI-directed video production",
  description:
    "ORBYVEN Video AI turns a creative brief into a structured commercial storyboard with scene timing, camera direction, transitions and render-ready prompts.",
  alternates: {
    canonical: "https://www.orbyven.com/video-ai",
  },
};

export default function VideoAiPageEn() {
  return (
    <>
      <VideoAiStudio locale="en" />
      <Link
        href="/en/video-ai/product-film"
        className="fixed bottom-5 right-5 z-[120] rounded-full border border-white/10 bg-black/85 px-5 py-3 text-xs font-semibold text-white shadow-[0_18px_60px_rgba(0,0,0,.4)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#8174ff]/50"
      >
        Product Film Engine →
      </Link>
    </>
  );
}
