import type { Metadata } from "next";
import InvitationServiceLanding from "@/components/InvitationServiceLanding";
import InvitationStructuredData from "@/components/InvitationStructuredData";

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
    <>
    <InvitationStructuredData path="/invitatii-botez" name="Invitații de botez digitale personalizate" description="Invitații online pentru botezul fetiței sau băiețelului, cu modele personalizabile și detaliile evenimentului." />
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
      faq={[{"question":"Aveți modele diferite pentru fetiță și băiețel?","answer":"Da. Poți porni de la două direcții vizuale distincte, apoi adaptăm paleta cromatică, fotografiile și textele la stilul familiei."},{"question":"Ce informații pot include în invitația de botez?","answer":"De obicei, numele copilului, data, biserica, restaurantul, programul și un mod simplu de a confirma prezența. Alegem numai informațiile utile invitaților."},{"question":"Invitații trebuie să instaleze o aplicație?","answer":"Nu. Invitația se deschide într-un browser folosind linkul primit, inclusiv pe telefon."},{"question":"Pot cere o variantă fără model prestabilit?","answer":"Da. Putem discuta o invitație personalizată pornind de la stilul și nevoile evenimentului."}]}
    />
    </>
  );
}
