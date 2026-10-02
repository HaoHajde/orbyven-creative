import type { Metadata } from "next";
import InvitationServiceLanding from "@/components/InvitationServiceLanding";
import InvitationStructuredData from "@/components/InvitationStructuredData";

export const metadata: Metadata = {
  title: "Custom digital 18th birthday invitations",
  description: "ORBYVEN interactive 18th birthday invitations with date, location, schedule, dress code and RSVP.",
  alternates: { canonical: "https://www.orbyven.com/invitatii-majorat" },
};

export default function BirthdayInvitationsPageEn() {
  return (
    <>
      <InvitationStructuredData
        locale="en"
        path="/invitatii-majorat"
        name="Custom digital 18th birthday invitations"
        description="Interactive digital invitations for an 18th birthday with schedule, location, dress code and RSVP."
      />
      <InvitationServiceLanding
        locale="en"
        label="18th birthday invitations"
        title="Digital 18th birthday invitations with a personality of their own."
        introduction="Turn the date and location into a complete event experience with a strong visual concept, schedule, dress code and useful guest information."
        highlights={[
          { title: "Atmosphere-first design", description: "Start from a dark luxury direction or shape a concept around the theme of the party." },
          { title: "Schedule in one place", description: "Date, time, location and access details stay easy to find from the invitation link." },
          { title: "Customization and RSVP", description: "Copy, colors, images and RSVP can be adapted to the event." },
        ]}
        previews={[
          { href: "/templates/majorat", title: "MIDNIGHT 18", description: "Explore the interactive 18th birthday concept with countdown, schedule and demo RSVP." },
          { href: "/templates", title: "All ORBYVEN templates", description: "Browse more visual directions and event experiences." },
        ]}
        relatedHref="/invitatii-nunta"
        relatedLabel="See digital wedding invitations"
        faq={[
          { question: "Can I change the visual style?", answer: "Yes. We can customize copy, photography, colors and structure around the party." },
          { question: "Can I include dress code and location?", answer: "Yes. Date, time, location, schedule, dress code and contact details can all be included." },
          { question: "Can I send it through WhatsApp?", answer: "Yes. The invitation is shared as a link and opens directly in the browser." },
          { question: "Are the demo details final?", answer: "No. Demo content is illustrative and is replaced with your actual event details before publication." },
        ]}
      />
    </>
  );
}
