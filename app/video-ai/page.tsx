import type { Metadata } from "next";

import VideoAiStudio from "@/components/VideoAiStudio";

export const metadata: Metadata = {
  title: "ORBYVEN Video AI | Producție video asistată de AI",
  description:
    "ORBYVEN Video AI transformă un brief creativ într-un storyboard comercial structurat, cu timing, cameră, tranziții și prompturi pregătite pentru randare.",
  alternates: {
    canonical: "/video-ai",
  },
};

export default function VideoAiPage() {
  return <VideoAiStudio locale="ro" />;
}
