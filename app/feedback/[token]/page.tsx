import type { Metadata } from "next";

import ClientFeedbackForm from "@/components/public/ClientFeedbackForm";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Formular privat de feedback post-serviciu.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      noimageindex: true,
      nosnippet: true,
    },
  },
  referrer: "no-referrer",
};

export default async function ClientFeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ClientFeedbackForm token={token} />;
}
