import type { Metadata } from "next";
import InvitationServiceLanding from "@/components/InvitationServiceLanding";
import InvitationStructuredData from "@/components/InvitationStructuredData";

export const metadata: Metadata = {
  title: "Custom digital christening invitations",
  description: "ORBYVEN digital christening invitations with customizable design, event details and RSVP in one mobile-friendly link.",
  alternates: { canonical: "https://www.orbyven.com/invitatii-botez" },
};

export default function ChristeningInvitationsPageEn() {
  return (
    <>
      <InvitationStructuredData
        locale="en"
        path="/invitatii-botez"
        name="Custom digital christening invitations"
        description="Online christening invitations with customizable design, event details and RSVP."
      />
      <InvitationServiceLanding
        locale="en"
        label="Christening invitations"
        title="Digital christening invitations made for your special day."
        introduction="A warm, mobile-first invitation with the ceremony, venue, schedule and RSVP gathered in one easy-to-share link."
        highlights={[
          { title: "Designed for your family", description: "Choose a visual direction and adapt the palette, photography and copy to the atmosphere you want." },
          { title: "Event details", description: "Church, venue, time and useful directions stay accessible directly from a phone." },
          { title: "RSVP included", description: "Guests can confirm attendance through a form integrated into the invitation experience." },
        ]}
        previews={[
          { href: "/templates/botez-fetita", title: "Christening · Soft pastel", description: "A delicate direction with airy spacing and warm pastel tones." },
          { href: "/templates/botez-baietel", title: "Christening · Light blue", description: "A bright concept with schedule and event details." },
        ]}
        relatedHref="/invitatii-nunta"
        relatedLabel="See wedding invitations"
        faq={[
          { question: "Can the visual style be customized?", answer: "Yes. We can adjust colors, photography, copy and details to your family's preferred direction." },
          { question: "What information can be included?", answer: "Usually the child's name, date, ceremony, venue, schedule and a simple RSVP flow." },
          { question: "Do guests need an app?", answer: "No. The invitation opens directly in a browser from the link they receive." },
          { question: "Can you create something beyond the existing templates?", answer: "Yes. We can discuss a more customized direction based on your event." },
        ]}
      />
    </>
  );
}
