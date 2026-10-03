import type { Metadata } from "next";

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
  return <VideoAiStudio locale="en" />;
}
