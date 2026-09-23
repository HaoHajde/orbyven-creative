import type { Metadata } from "next";
import InvitationServiceLanding from "@/components/InvitationServiceLanding";

export const metadata: Metadata = {
  title: "Invitații de botez digitale pentru fetițe și băieței",
  description: "Invitații de botez digitale ORBYVEN CREATIVE, pentru fetiță sau băiețel: modele personalizabile, detalii de eveniment și confirmare RSVP. Vezi exemple.",
  alternates: { canonical: "/invitatii-botez" },
  openGraph: {
    url: "/invitatii-botez",
    title: "Invitații de botez digitale | ORBYVEN CREATIVE",
    description: "Modele de invitații digitale pentru botezul fetiței sau băiețelului, adaptate familiei și evenimentului.",
  },
};

export default function BaptismInvitationsPage() {
  return (
    <InvitationServiceLanding
      label="Invitații de botez"
      title="Invitații de botez digitale, create pentru ziua voastră specială."
      introduction="Invitații online pentru botezul fetiței sau băiețelului, cu un design cald, programul evenimentului, locația și confirmarea participării, într-un singur link."
      highlights={[
        { title: "Pentru fetiță sau băiețel", description: "Modele cu atmosferă și palete de culori diferite, adaptabile preferințelor familiei." },
        { title: "Detaliile evenimentului", description: "Biserică, restaurant, oră și indicații utile, accesibile direct de pe telefon." },
        { title: "Confirmare RSVP", description: "Invitații pot confirma prezența printr-un formular inclus în experiența digitală." },
      ]}
      previews={[
        { href: "/templates/botez-fetita", title: "Botez · Fetiță", description: "O direcție delicată, cu nuanțe pastel și o prezentare aerisită." },
        { href: "/templates/botez-baietel", title: "Botez · Băiețel", description: "Un model în tonuri luminoase, cu programul și detaliile botezului." },
      ]}
      relatedHref="/invitatii-nunta"
      relatedLabel="Vezi invitațiile de nuntă"
    />
  );
}
