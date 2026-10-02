import type { Metadata } from "next";
import InvitationServiceLanding from "@/components/InvitationServiceLanding";
import InvitationStructuredData from "@/components/InvitationStructuredData";

export const metadata: Metadata = {
  title: "Custom digital wedding invitations",
  description: "ORBYVEN digital wedding invitations with custom design, event details, RSVP and a mobile-first interactive experience.",
  alternates: { canonical: "https://www.orbyven.com/invitatii-nunta" },
  openGraph: {
    url: "https://www.orbyven.com/invitatii-nunta",
    title: "Digital wedding invitations | ORBYVEN CREATIVE",
    description: "Custom digital wedding invitations with RSVP and an elegant presentation of your event.",
  },
};

export default function WeddingInvitationsPageEn() {
  return (
    <>
      <InvitationStructuredData
        locale="en"
        path="/invitatii-nunta"
        name="Custom digital wedding invitations"
        description="Digital wedding invitations with custom design, locations, schedule and RSVP."
      />
      <InvitationServiceLanding
        locale="en"
        label="Wedding invitations"
        title="Digital wedding invitations built around your story."
        introduction="Bring the story, schedule, locations and RSVP together in one elegant link that works beautifully on mobile."
        highlights={[
          { title: "Custom design", description: "Start from a direction and adapt colors, copy, photography and important event details." },
          { title: "Guest RSVP", description: "Guests can confirm attendance directly inside the invitation through a simple form." },
          { title: "Everything in one link", description: "Schedule, locations and useful information stay easy to access without separate files or messages." },
        ]}
        previews={[
          { href: "/demo/nunta/elegant", title: "Elegant · Wedding", description: "Explore a digital invitation with event details and RSVP." },
          { href: "/templates", title: "ORBYVEN collection", description: "Browse more visual directions for events and digital experiences." },
        ]}
        relatedHref="/invitatii-botez"
        relatedLabel="See christening invitations"
        faq={[
          { question: "How do I send the digital invitation?", answer: "You receive a link you can share through WhatsApp, text or email. Guests can open it directly in a browser." },
          { question: "Can an existing design be customized?", answer: "Yes. Copy, colors, images, locations and event structure can be adapted to your event." },
          { question: "Can the invitation include RSVP?", answer: "Yes. An RSVP form can be included and tailored to the information you need from guests." },
          { question: "Do all wedding details need to be final first?", answer: "Not necessarily. We can start from the design and complete final schedule and location details before launch." },
        ]}
      />
    </>
  );
}
